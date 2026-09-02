import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Stars } from "@/components/Stars";
import { ProductPurchase } from "@/components/ProductPurchase";
import { ProductCard } from "@/components/ProductCard";
import { averageRating, getActiveProducts, getProductBySlug } from "@/lib/products";
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

  const allProducts = await getActiveProducts();
  const otherProducts = allProducts.filter((p) => p.slug !== product.slug);

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
            belowActions={
              <>
                <p className="text-[15px]/[1.7] text-ink-soft">
                  {product.description}
                </p>

                <ul className="space-y-2">
                  {product.features.map((feature) => (
                    <li
                      key={feature.id}
                      className="flex gap-2 text-sm text-ink-soft"
                    >
                      <span className="text-amber-ink">✓</span>
                      {feature.text}
                    </li>
                  ))}
                </ul>
              </>
            }
          />
        </section>

        {product.reviews.length > 0 && (
          <section className="border-t border-line bg-surface">
            <div className="mx-auto max-w-6xl px-6 py-11">
              <h2 className="font-heading text-[26px] font-extrabold text-navy">
                Lo que dicen nuestros clientes
              </h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {product.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-xl border border-line bg-bg p-5"
                  >
                    <Stars rating={review.rating} />
                    <p className="mt-3 text-sm/[1.6] text-ink-soft">
                      &ldquo;{review.text}&rdquo;
                    </p>
                    <p className="mt-3 font-heading text-sm font-bold text-navy">
                      {review.author}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {otherProducts.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 py-11">
            <h2 className="font-heading text-[26px] font-extrabold text-navy">
              También te puede interesar
            </h2>
            <div className="mt-6 grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
              {otherProducts.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
