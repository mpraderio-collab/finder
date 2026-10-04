import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Stars } from "@/components/Stars";
import { ProductPurchase } from "@/components/ProductPurchase";
import { ProductPhotoWall } from "@/components/ProductPhotoWall";
import { ReviewForm } from "@/components/ReviewForm";
import { averageRating, getProductBySlug } from "@/lib/products";
import { getSiteSettings } from "@/lib/settings";
import { activePromotion } from "@/lib/promotions";
import { db } from "@/lib/db";

export async function generateStaticParams() {
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

  const settings = await getSiteSettings();
  const media = orderedImages.map(({ id, url, type }) => ({ id, url, type }));
  const photoCount = media.filter((m) => m.type !== "video").length;
  const videoCount = media.length - photoCount;

  return (
    <>
      <Header />
      <main className="flex-1">
        <p className="mx-auto max-w-6xl px-6 pt-[18px] text-[13px] text-ink-faint">
          <Link href="/catalogo" className="hover:text-navy">
            Catálogo
          </Link>{" "}
          / <span className="font-semibold text-navy">{product.name}</span>
        </p>

        <section className="mx-auto max-w-6xl px-6 pb-[52px] pt-[22px]">
          <ProductPurchase
            productId={product.id}
            slug={product.slug}
            name={product.name}
            price={product.price}
            stock={product.stock}
            variants={product.variants}
            images={orderedImages}
            installments={settings.installments}
            promotion={activePromotion(product)}
            aboveActions={
              <>
                <h1 className="font-heading text-[38px] font-extrabold leading-[1.1] tracking-[-0.025em] text-navy">
                  {product.name}
                </h1>
                <p className="text-[17px]/[1.6] text-ink-soft">
                  {product.tagline}
                </p>

                {product.reviews.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Stars rating={avgRating} />
                    <span className="text-ink-soft">
                      {avgRating.toFixed(1).replace(".", ",")} ·{" "}
                      {product.reviews.length} reseñas
                    </span>
                  </div>
                )}
              </>
            }
          />
        </section>

        <section className="border-t border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="font-heading text-[28px] font-extrabold tracking-[-0.02em] text-navy">
                Conocé {product.name}
              </h2>
              <span className="mt-3 block h-1 w-14 rounded-full bg-amber" />
              <p className="mt-6 whitespace-pre-line text-[16px]/[1.8] text-ink-soft">
                {product.description}
              </p>
            </div>
            {product.features.length > 0 && (
              <div>
                <h3 className="font-heading text-lg font-bold text-navy">Características</h3>
                <ul className="mt-4 grid gap-3">
                  {product.features.map((feature) => (
                    <li
                      key={feature.id}
                      className="flex gap-3 rounded-xl border border-line bg-bg px-4 py-3.5 text-[15px]/[1.5] text-ink"
                    >
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-soft text-[11px] font-bold text-amber-ink">
                        ✓
                      </span>
                      {feature.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {product.specs.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 py-14">
            <h2 className="font-heading text-[28px] font-extrabold tracking-[-0.02em] text-navy">
              Especificaciones
            </h2>
            <dl className="mt-8 overflow-hidden rounded-xl border border-line bg-bg">
              {product.specs.map((spec, i) => (
                <div
                  key={spec.id}
                  className={`grid gap-1 px-5 py-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-6 ${
                    i % 2 === 0 ? "bg-surface" : "bg-bg"
                  }`}
                >
                  <dt className="text-sm font-semibold text-navy">{spec.label}</dt>
                  <dd className="text-sm text-ink-soft">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {media.length > 1 && (
          <ProductPhotoWall
            name={product.name}
            media={media}
            photoCount={photoCount}
            videoCount={videoCount}
          />
        )}

        <section className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <h2 className="font-heading text-[22px] font-extrabold text-navy">
              Envío, pagos y cambios
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Envío a todo el país",
                  text: "Despachamos con Correo Argentino y llega en 3 a 5 días hábiles. El costo se calcula en el pago según tu provincia.",
                },
                {
                  title: "Pagá como quieras",
                  text:
                    settings.installments > 1
                      ? `Con Mercado Pago: tarjeta, dinero en cuenta y hasta ${settings.installments} cuotas sin interés.`
                      : "Con Mercado Pago: tarjeta o dinero en cuenta.",
                },
                {
                  title: "Cambios en 30 días",
                  text: "Si el producto no es lo que esperabas, escribinos y lo resolvemos.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-line bg-bg p-5">
                  <p className="font-heading text-[15px] font-bold text-navy">{item.title}</p>
                  <p className="mt-2 text-sm/[1.6] text-ink-soft">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-6 py-11">
            <h2 className="font-heading text-[26px] font-extrabold text-navy">
              Lo que dicen nuestros clientes
            </h2>
            {product.reviews.length > 0 && (
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {product.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex flex-col gap-3 rounded-xl border border-line bg-bg p-5"
                  >
                    <Stars rating={review.rating} />
                    <p className="text-sm/[1.6] text-ink-soft">
                      &ldquo;{review.text}&rdquo;
                    </p>
                    {review.photoUrl && (
                      <div className="relative h-48 w-full overflow-hidden rounded-lg">
                        <Image
                          src={review.photoUrl}
                          alt={`Foto de ${review.author}`}
                          fill
                          className="object-cover"
                          sizes="(min-width: 640px) 33vw, 100vw"
                        />
                      </div>
                    )}
                    <p className="font-heading text-sm font-bold text-navy">
                      {review.author}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-8">
              <ReviewForm productId={product.id} />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6 pb-12">
          <Link href="/catalogo" className="font-heading text-sm font-bold text-blue hover:text-navy">
            ← Volver al catálogo
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
