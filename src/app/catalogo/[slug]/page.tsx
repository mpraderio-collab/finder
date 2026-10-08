import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Stars } from "@/components/Stars";
import { ProductPurchase } from "@/components/ProductPurchase";
import { ProductPhotoWall } from "@/components/ProductPhotoWall";
import { Accordion } from "@/components/store/Accordion";
import { PageTransition } from "@/components/store/PageTransition";
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

  const shipping = [
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
  ];

  // Banda de "tecnologías" (maap.cc): las primeras specs del producto en
  // grande, sobre sus propias fotos.
  const techSpecs = product.specs.slice(0, 4);
  // Fotos de ambiente (marcadas para el carrusel en el admin) para que el
  // texto encima no choque con una infografía; si no hay, se usa un fondo liso.
  const techPhotos = orderedImages.filter((img) => img.type !== "video" && img.showInCarousel);

  return (
    <>
      <Header />
      <PageTransition>
        <main className="flex-1 bg-e-bg text-e-ink">
          <p className="e-mono px-4 pt-6 text-e-muted md:px-8">
            <Link href="/catalogo" transitionTypes={["nav-back"]} className="hover:text-e-ink">
              Catálogo
            </Link>{" "}
            / <span className="text-e-ink">{product.name}</span>
          </p>

          <section className="px-4 pb-16 pt-6 md:px-8">
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
                  <h1 className="text-[32px] font-medium leading-[1.1] tracking-[-0.02em]">
                    {product.name}
                  </h1>
                  <p className="text-[15px]/[1.5] text-e-muted">{product.tagline}</p>
                  {product.reviews.length > 0 && (
                    <a href="#resenas" className="flex items-center gap-2 text-[13px]">
                      <Stars rating={avgRating} tone="ink" />
                      <span className="text-e-muted underline underline-offset-4">
                        {avgRating.toFixed(1).replace(".", ",")} · {product.reviews.length} reseñas
                      </span>
                    </a>
                  )}
                </div>
              }
              belowActions={
                <div className="border-t border-e-line">
                  <Accordion title="Detalles" defaultOpen>
                    <p className="whitespace-pre-line">{product.description}</p>
                  </Accordion>
                  {product.features.length > 0 && (
                    <Accordion title="Características">
                      <ul className="flex flex-col gap-2">
                        {product.features.map((feature) => (
                          <li key={feature.id} className="flex gap-3">
                            <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-e-ink" />
                            {feature.text}
                          </li>
                        ))}
                      </ul>
                    </Accordion>
                  )}
                  {product.specs.length > 0 && (
                    <Accordion title="Especificaciones técnicas">
                      <dl className="flex flex-col">
                        {product.specs.map((spec) => (
                          <div
                            key={spec.id}
                            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 border-t border-e-line py-2.5 first:border-t-0 first:pt-0"
                          >
                            <dt className="text-e-muted">{spec.label}</dt>
                            <dd>{spec.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </Accordion>
                  )}
                  <Accordion title="Envío, pagos y cambios">
                    <div className="flex flex-col gap-3">
                      {shipping.map((item) => (
                        <div key={item.title}>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-e-muted">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </Accordion>
                </div>
              }
            />
          </section>

          {techSpecs.length > 0 && (
            <section className="flex flex-col gap-5 px-4 pb-16 md:px-8">
              <h2 className="e-mono">Lo que tiene adentro</h2>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                {techSpecs.map((spec, i) => {
                  const photo = techPhotos[i];
                  return (
                    <div
                      key={spec.id}
                      className="relative flex aspect-[338/480] flex-col justify-between overflow-hidden bg-e-ink p-5 text-white"
                    >
                      {photo && (
                        <Image
                          src={photo.url}
                          alt=""
                          fill
                          className="object-cover opacity-50"
                          sizes="(min-width: 1024px) 25vw, 50vw"
                        />
                      )}
                      <span className="e-mono relative">{spec.label}</span>
                      <span className="relative text-[28px] font-medium leading-[1.05] tracking-[-0.02em] md:text-[40px]">
                        {spec.value}
                      </span>
                    </div>
                  );
                })}
              </div>
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

          <section id="resenas" className="grid gap-10 border-t border-e-line px-4 py-16 md:grid-cols-[360px_1fr] md:px-8">
            <div className="flex flex-col gap-3">
              <span className="e-mono">Reseñas</span>
              {product.reviews.length > 0 ? (
                <>
                  <span className="text-[64px] font-medium leading-none tracking-[-0.03em]">
                    {avgRating.toFixed(1).replace(".", ",")}
                  </span>
                  <span className="flex items-center gap-2 text-[13px] text-e-muted">
                    <Stars rating={avgRating} tone="ink" /> {product.reviews.length} reseñas
                  </span>
                </>
              ) : (
                <p className="text-[14px] text-e-muted">Todavía no hay reseñas. ¡Dejá la primera!</p>
              )}
              <div className="mt-4">
                <ReviewForm productId={product.id} />
              </div>
            </div>
            {product.reviews.length > 0 && (
              <ul className="grid items-start gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {product.reviews.map((review) => (
                  <li key={review.id} className="flex min-h-[260px] flex-col gap-4 bg-e-tile p-6">
                    <Stars rating={review.rating} tone="ink" />
                    <p className="text-[16px]/[1.5]">&ldquo;{review.text}&rdquo;</p>
                    {review.photoUrl && (
                      <div className="relative h-48 w-full overflow-hidden">
                        <Image
                          src={review.photoUrl}
                          alt={`Foto de ${review.author}`}
                          fill
                          className="object-cover"
                          sizes="(min-width: 640px) 33vw, 100vw"
                        />
                      </div>
                    )}
                    <p className="e-mono mt-auto text-e-muted">{review.author}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="px-4 pb-16 md:px-8">
            <Link href="/catalogo" transitionTypes={["nav-back"]} className="e-pill e-pill--outline">
              Volver al catálogo
            </Link>
          </div>
        </main>
        <Footer />
      </PageTransition>
    </>
  );
}
