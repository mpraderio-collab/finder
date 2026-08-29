import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { getActiveProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Catálogo — Finder",
  description: "Descubrí toda la iluminación moderna que importa Finder.",
};

export default async function CatalogoPage() {
  const products = await getActiveProducts();

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 pb-6 pt-10">
          <h1 className="font-heading text-[40px] font-extrabold tracking-[-0.025em] text-navy">
            Catálogo
          </h1>
          <p className="mt-2 max-w-[520px] text-base/[1.6] text-ink-soft">
            Iluminación moderna para leer, trabajar y ambientar tu casa.
          </p>
        </section>
        <section className="mx-auto max-w-6xl px-6 py-7">
          {products.length === 0 ? (
            <p className="text-ink-soft">
              Todavía no hay productos publicados.
            </p>
          ) : (
            <div className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
