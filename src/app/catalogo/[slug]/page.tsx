import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Stars } from "@/components/Stars";
import { formatPrice, getProduct, products } from "@/lib/products";
import { mockReviews } from "@/lib/reviews";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(
  props: PageProps<"/catalogo/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProduct(slug);
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
  const product = getProduct(slug);
  if (!product) notFound();

  const reviews = mockReviews[product.slug] ?? [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-cream-soft">
              <Image
                src={product.images.hero}
                alt={product.name}
                fill
                priority
                className="object-cover"
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            </div>
            {product.images.gallery.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {product.images.gallery.map((src) => (
                  <div
                    key={src}
                    className="relative aspect-square overflow-hidden rounded-xl bg-cream-soft"
                  >
                    <Image
                      src={src}
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

            {reviews.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Stars rating={avgRating} />
                <span className="text-ink-soft">
                  {avgRating.toFixed(1)} · {reviews.length} reseñas
                </span>
              </div>
            )}

            <p className="font-heading text-3xl font-extrabold text-ink">
              {formatPrice(product.price)}
            </p>

            {product.variants && (
              <div>
                <p className="text-sm font-semibold text-ink">Color</p>
                <div className="mt-2 flex gap-3">
                  {product.variants.map((variant) => (
                    <span
                      key={variant.name}
                      title={variant.name}
                      className="h-8 w-8 rounded-full border border-line"
                      style={{ backgroundColor: variant.swatch }}
                    />
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              className="mt-2 w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-amber-dark sm:w-auto"
            >
              Comprar con Mercado Pago
            </button>

            <p className="border-t border-line pt-5 text-ink-soft">
              {product.description}
            </p>

            <ul className="space-y-2">
              {product.features.map((feature) => (
                <li
                  key={feature}
                  className="flex gap-2 text-sm text-ink-soft"
                >
                  <span className="text-amber-dark">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {reviews.length > 0 && (
          <section className="border-t border-line bg-card">
            <div className="mx-auto max-w-6xl px-6 py-14">
              <h2 className="font-heading text-2xl font-extrabold text-ink">
                Lo que dicen nuestros clientes
              </h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {reviews.map((review) => (
                  <div
                    key={review.author}
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
