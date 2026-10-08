import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductPurchase } from "@/components/ProductPurchase";
import { StoreMain } from "@/components/store/StoreMain";
import { Reveal } from "@/components/store/Reveal";
import { StarRating } from "@/components/store/StarRating";
import { ReviewToggle } from "@/components/store/ReviewToggle";
import {
  ArrowLeft,
  CardIcon,
  CheckIcon,
  ChevronRight,
  ReturnIcon,
  TruckIcon,
} from "@/components/store/Icons";
import { sceneFor } from "@/components/store/scenes";
import { averageRating, formatPrice, getActiveProducts, getProductBySlug } from "@/lib/products";
import { getSiteSettings } from "@/lib/settings";
import { activePromotion, tierLabel } from "@/lib/promotions";
import { db } from "@/lib/db";
import { MOCK_DATA, mockProducts } from "@/lib/mock-data";

export async function generateStaticParams() {
  if (MOCK_DATA) return mockProducts.map((p) => ({ slug: p.slug }));
  const products = await db.product.findMany({
    where: { status: "active" },
    select: { slug: true },
  });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/catalogo/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name} — Finder`,
    description: product.tagline,
  };
}

export default async function ProductPage(
  props: PageProps<"/catalogo/[slug]">,
) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product || product.status !== "active") notFound();

  const orderedImages = [...product.images].sort(
    (a, b) => Number(b.isHero) - Number(a.isHero),
  );
  const avgRating = averageRating(product.reviews);
  const scene = sceneFor(product);

  const [settings, allProducts] = await Promise.all([getSiteSettings(), getActiveProducts()]);
  const promotion = activePromotion(product);
  // Los otros productos de la promo, con su precio, para el aviso del pack.
  const packPartners = (promotion?.products ?? [])
    .filter((p) => p.id !== product.id)
    .map((p) => allProducts.find((ap) => ap.id === p.id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const [storyLead, ...storyRest] = product.description.split(/(?<=\.)\s+/);

  return (
    <>
      <Header />
      <StoreMain>
        <nav
          aria-label="Ruta"
          className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-2 px-6 py-6 text-sm text-taupe md:px-16"
        >
          <Link href="/catalogo" transitionTypes={["nav-back"]} className="b-link">
            Catálogo
          </Link>
          {scene && (
            <>
              <ChevronRight size={14} />
              <Link href={`/catalogo#${scene.id}`} transitionTypes={["nav-back"]} className="b-link">
                {scene.name}
              </Link>
            </>
          )}
          <ChevronRight size={14} />
          <span className="text-espresso">{product.name}</span>
        </nav>

        <section className="mx-auto max-w-[1440px] px-6 pb-20 md:px-16 md:pb-24">
          <ProductPurchase
            productId={product.id}
            slug={product.slug}
            name={product.name}
            price={product.price}
            stock={product.stock}
            variants={product.variants}
            images={orderedImages}
            installments={settings.installments}
            promotion={promotion}
            aboveActions={
              <div className="flex flex-col gap-3.5">
                {scene && (
                  <p className="flex items-center gap-2.5 text-clay-ink">
                    <span className="font-serif text-[15px]">{scene.number}</span>
                    <span className="h-px w-6 bg-clay" />
                    <span className="text-[13px] font-semibold uppercase tracking-[0.16em]">
                      {scene.name}
                    </span>
                  </p>
                )}
                <h1 className="font-serif text-[36px]/[1.08] font-medium tracking-[-0.02em] md:text-[44px]/[1.08]">
                  {product.name}
                </h1>
                <p className="text-[17px]/[1.55] text-taupe">{product.tagline}</p>
                {product.reviews.length > 0 && (
                  <a href="#resenas" className="flex w-fit items-center gap-2 text-sm text-taupe">
                    <StarRating rating={avgRating} />
                    <span className="b-link">
                      {avgRating.toFixed(1).replace(".", ",")} · {product.reviews.length} reseñas
                    </span>
                  </a>
                )}
              </div>
            }
            belowActions={
              <>
                {promotion && promotion.tiers.length > 0 && (
                  <div className="flex flex-col gap-3 bg-sand p-5">
                    {promotion.tiers.map((tier) => (
                      <p key={tier.threshold} className="text-[15px] font-semibold">
                        {tierLabel(promotion, tier)} — combinalo como quieras
                      </p>
                    ))}
                    {packPartners.map((p) => (
                      <Link
                        key={p.id}
                        href={`/catalogo/${p.slug}`}
                        transitionTypes={["nav-forward"]}
                        className="group flex items-center justify-between gap-4 text-sm"
                      >
                        <span className="b-link text-espresso">+ {p.name}</span>
                        <span className="shrink-0 tabular-nums text-taupe">{formatPrice(p.price)}</span>
                      </Link>
                    ))}
                  </div>
                )}
                <ul className="flex flex-col gap-3 border-t border-linen pt-5 text-sm text-espresso">
                  <li className="flex items-center gap-3">
                    <TruckIcon size={18} className="text-taupe" />
                    Envío a todo el país con Correo Argentino · 3 a 5 días hábiles
                  </li>
                  <li className="flex items-center gap-3">
                    <CardIcon size={18} className="text-taupe" />
                    {settings.installments > 1
                      ? `Mercado Pago: tarjeta, dinero en cuenta y hasta ${settings.installments} cuotas sin interés`
                      : "Mercado Pago: tarjeta o dinero en cuenta"}
                  </li>
                  <li className="flex items-center gap-3">
                    <ReturnIcon size={18} className="text-taupe" />
                    Cambios en 30 días
                  </li>
                </ul>
              </>
            }
          />
        </section>

        <section className="bg-night text-cream">
          <Reveal className="mx-auto grid max-w-[1440px] gap-10 px-6 py-20 md:px-16 md:py-[120px] lg:grid-cols-[520px_1fr] lg:gap-24">
            <div className="t-stagger-line t-stagger-line--1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay-soft">
                La historia
              </p>
              <h2 className="mt-5 font-serif text-[34px]/[1.12] font-medium tracking-[-0.01em] md:text-[48px]/[1.1]">
                {storyLead}
              </h2>
            </div>
            <div className="t-stagger-line t-stagger-line--2 flex flex-col gap-6 lg:pt-10">
              {storyRest.length > 0 ? (
                <p className="whitespace-pre-line text-lg/[1.65] text-cream/85">{storyRest.join(" ")}</p>
              ) : (
                <p className="text-lg/[1.65] text-cream/85">{product.tagline}</p>
              )}
            </div>
          </Reveal>
        </section>

        {(product.features.length > 0 || product.specs.length > 0) && (
          <section className="mx-auto grid max-w-[1440px] gap-10 px-6 py-20 md:px-16 md:py-[120px] lg:grid-cols-[520px_1fr] lg:gap-24">
            <Reveal>
              <h2 className="t-stagger-line t-stagger-line--1 font-serif text-[36px] font-medium md:text-[44px]">
                Lo que trae
              </h2>
              <p className="t-stagger-line t-stagger-line--2 mt-4 max-w-[520px] text-base/[1.6] text-taupe">
                Todo lo que necesitás saber antes de elegirla.
              </p>
            </Reveal>
            <dl className="border-t border-linen">
              {product.features.map((feature) => (
                <div key={feature.id} className="flex gap-3 border-b border-linen py-5 text-[15px]/[1.5]">
                  <dt className="sr-only">Característica</dt>
                  <CheckIcon size={18} className="mt-0.5 shrink-0 text-clay" />
                  <dd>{feature.text}</dd>
                </div>
              ))}
              {product.specs.map((spec) => (
                <div
                  key={spec.id}
                  className="grid grid-cols-1 gap-1 border-b border-linen py-5 text-[15px] sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-6"
                >
                  <dt className="font-medium">{spec.label}</dt>
                  <dd className="text-taupe">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section id="resenas" className="scroll-mt-28 bg-sand">
          <div className="mx-auto max-w-[1440px] px-6 py-20 md:px-16 md:pb-[120px] md:pt-24">
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              {product.reviews.length > 0 ? (
                <div className="flex items-end gap-5">
                  <p className="font-serif text-[80px] leading-[0.85] md:text-[96px]">
                    {avgRating.toFixed(1).replace(".", ",")}
                  </p>
                  <div className="flex flex-col gap-1.5 pb-1">
                    <StarRating rating={avgRating} />
                    <p className="text-sm text-taupe">
                      {product.reviews.length} {product.reviews.length === 1 ? "reseña" : "reseñas"}
                    </p>
                  </div>
                </div>
              ) : (
                <h2 className="font-serif text-[36px] font-medium">Todavía no hay reseñas</h2>
              )}
            </div>

            {product.reviews.length > 0 && (
              <Reveal className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
                {product.reviews.map((review, i) => (
                  <figure
                    key={review.id}
                    className={`t-stagger-line t-stagger-line--${Math.min(i + 1, 4)} flex flex-col gap-4 border-t border-espresso pt-6`}
                  >
                    <StarRating rating={review.rating} size={13} />
                    <blockquote className="font-serif text-[22px]/[1.35]">&ldquo;{review.text}&rdquo;</blockquote>
                    {review.photoUrl && (
                      <div className="relative h-48 w-full overflow-hidden">
                        <Image
                          src={review.photoUrl}
                          alt={`Foto de ${review.author}`}
                          fill
                          className="object-cover"
                          sizes="(min-width: 768px) 33vw, 100vw"
                        />
                      </div>
                    )}
                    <figcaption className="text-sm">
                      <span className="font-semibold">{review.author}</span>
                      <span className="text-taupe"> · Compra verificada</span>
                    </figcaption>
                  </figure>
                ))}
              </Reveal>
            )}

            <div className="mt-14">
              <ReviewToggle productId={product.id} />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-16">
          <Link
            href="/catalogo"
            transitionTypes={["nav-back"]}
            className="group inline-flex items-center gap-2 text-sm font-semibold"
          >
            <ArrowLeft size={16} className="transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-1" />
            <span className="b-link">Volver al catálogo</span>
          </Link>
        </div>
      </StoreMain>
      <Footer />
    </>
  );
}
