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
import { PageTransition } from "@/components/d/PageTransition";
import { AccordionItem } from "@/components/d/Accordion";
import { Reveal } from "@/components/d/Reveal";
import { CtaLink } from "@/components/d/CtaLink";
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
      <PageTransition>
        <main className="d-store flex-1">
          <section>
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
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-d-muted">
                    <Link href="/catalogo" className="d-fade">
                      Catálogo
                    </Link>{" "}
                    / {product.name}
                  </p>
                  <h1 className="font-d-serif text-[32px] leading-[1.15] md:text-[40px]">{product.name}</h1>
                  <p className="text-[18px] leading-[1.35]">{product.tagline}</p>
                  {product.reviews.length > 0 && (
                    <a href="#resenas" className="d-fade flex w-fit items-center gap-2 text-sm">
                      <Stars rating={avgRating} tone="ink" />
                      <span className="text-d-muted">
                        {avgRating.toFixed(1).replace(".", ",")} · {product.reviews.length} reseñas
                      </span>
                    </a>
                  )}
                </div>
              }
              belowActions={
                <div className="border-b border-d-ink">
                  <AccordionItem title="Descripción" defaultOpen>
                    <p className="whitespace-pre-line">{product.description}</p>
                  </AccordionItem>
                  {product.features.length > 0 && (
                    <AccordionItem title="Características">
                      <ul className="flex flex-col gap-1.5">
                        {product.features.map((feature) => (
                          <li key={feature.id}>— {feature.text}</li>
                        ))}
                      </ul>
                    </AccordionItem>
                  )}
                  {product.specs.length > 0 && (
                    <AccordionItem title="Especificaciones">
                      <dl>
                        {product.specs.map((spec) => (
                          <div key={spec.id} className="flex justify-between gap-4 border-t border-d-line py-2 first:border-t-0">
                            <dt>{spec.label}</dt>
                            <dd className="text-right text-d-ink">{spec.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </AccordionItem>
                  )}
                  <AccordionItem title="Envío, pagos y cambios">
                    <p>
                      Despachamos con Correo Argentino y llega en 3 a 5 días hábiles. El costo se calcula en el
                      pago según tu provincia.
                    </p>
                    <p className="mt-2">
                      {settings.installments > 1
                        ? `Con Mercado Pago: tarjeta, dinero en cuenta y hasta ${settings.installments} cuotas sin interés.`
                        : "Con Mercado Pago: tarjeta o dinero en cuenta."}
                    </p>
                    <p className="mt-2">Si el producto no es lo que esperabas, escribinos y lo resolvemos.</p>
                  </AccordionItem>
                </div>
              }
            />
          </section>

          {media.length > 1 && (
            <ProductPhotoWall
              name={product.name}
              media={media}
              photoCount={photoCount}
              videoCount={videoCount}
            />
          )}

          <section id="resenas" className="scroll-mt-24 border-t border-d-ink px-5 pb-20 pt-3 md:px-10">
            <div className="grid gap-8 md:grid-cols-[330px_1fr]">
              <div className="text-sm">
                <p>Reseñas</p>
                {product.reviews.length > 0 && (
                  <p className="mt-1 text-d-muted">
                    {avgRating.toFixed(1).replace(".", ",")} de 5 · {product.reviews.length}
                  </p>
                )}
              </div>
              <div>
                {product.reviews.length > 0 && (
                  <ul>
                    {product.reviews.map((review) => (
                      <li key={review.id} className="border-b border-d-line py-6 first:pt-0">
                        <Reveal>
                          <p className="t-stagger-line font-d-serif text-[22px] leading-[1.35] md:text-[24px]">
                            &ldquo;{review.text}&rdquo;
                          </p>
                          <p className="t-stagger-line t-stagger-line--2 mt-3 flex items-center gap-3 text-sm text-d-muted">
                            <Stars rating={review.rating} tone="ink" />
                            {review.author}
                          </p>
                        </Reveal>
                        {review.photoUrl && (
                          <div className="relative mt-4 h-48 w-48 overflow-hidden bg-d-surface">
                            <Image
                              src={review.photoUrl}
                              alt={`Foto de ${review.author}`}
                              fill
                              className="object-cover"
                              sizes="192px"
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-10">
                  <ReviewForm productId={product.id} />
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-d-line px-5 py-6 md:px-10">
            <CtaLink href="/catalogo">Volver al catálogo</CtaLink>
          </div>
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
