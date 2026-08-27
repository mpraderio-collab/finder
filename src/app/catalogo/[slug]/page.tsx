import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Stars } from "@/components/Stars";
import { AddToCartButton } from "@/components/AddToCartButton";
import {
  averageRating,
  formatPrice,
  getHeroImageUrl,
  getProductBySlug,
} from "@/lib/products";
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

  const heroUrl = getHeroImageUrl(product);
  const galleryImages = product.images.filter((img) => img.url !== heroUrl);
  const avgRating = averageRating(product.reviews);
  const outOfStock =
    product.variants.length > 0
      ? product.variants.every((v) => v.stock <= 0)
      : product.stock <= 0;

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-cream-soft">
              {heroUrl && (
                <Image
                  src={heroUrl}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              )}
            </div>
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {galleryImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square overflow-hidden rounded-xl bg-cream-soft"
                  >
                    <Image
                      src={img.url}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <h1 className="font-heading text-3xl font-extrabold text-ink sm:text-4xl">
              {product.name}
            </h1>
            <p className="text-lg text-ink-soft">{product.tagline}</p>

            {product.reviews.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Stars rating={avgRating} />
                <span className="text-ink-soft">
                  {avgRating.toFixed(1)} · {product.reviews.length} reseñas
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <p className="font-heading text-3xl font-extrabold text-ink">
                {formatPrice(product.price)}
              </p>
              {outOfStock && (
                <span className="rounded-full bg-coral-soft px-3 py-1 text-xs font-semibold text-coral">
                  Sin stock
                </span>
              )}
            </div>

            <AddToCartButton
              productId={product.id}
              slug={product.slug}
              name={product.name}
              price={product.price}
              image={heroUrl}
              stock={product.stock}
              variants={product.variants}
            />

            <p className="border-t border-line pt-5 text-ink-soft">
              {product.description}
            </p>

            <ul className="space-y-2">
              {product.features.map((feature) => (
                <li key={feature.id} className="flex gap-2 text-sm text-ink-soft">
                  <span className="text-amber-dark">✓</span>
                  {feature.text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {product.reviews.length > 0 && (
          <section className="border-t border-line bg-card">
            <div className="mx-auto max-w-6xl px-6 py-14">
              <h2 className="font-heading text-2xl font-extrabold text-ink">
                Lo que dicen nuestros clientes
              </h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {product.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-line p-5"
                  >
                    <Stars rating={review.rating} />
                    <p className="mt-3 text-sm text-ink-soft">
                      &ldquo;{review.text}&rdquo;
                    </p>
                    <p className="mt-3 text-sm font-semibold text-ink">
                      {review.author}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
