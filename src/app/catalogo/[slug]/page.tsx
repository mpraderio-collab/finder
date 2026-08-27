import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Stars } from "@/components/Stars";
import { ProductPurchase } from "@/components/ProductPurchase";
import {
  averageRating,
  formatPrice,
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

  const orderedImages = [...product.images].sort(
    (a, b) => Number(b.isHero) - Number(a.isHero),
  );
  const avgRating = averageRating(product.reviews);
  const outOfStock =
    product.variants.length > 0
      ? product.variants.every((v) => v.stock <= 0)
      : product.stock <= 0;

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-14">
          <ProductPurchase
            productId={product.id}
            slug={product.slug}
            name={product.name}
            price={product.price}
            stock={product.stock}
            variants={product.variants}
            images={orderedImages}
            aboveActions={
              <>
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
              </>
            }
            belowActions={
              <>
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
              </>
            }
          />
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
