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
        <section className="mx-auto max-w-6xl px-6 py-14">
          <h1 className="font-heading text-4xl font-extrabold text-ink">
            Catálogo
          </h1>
          <p className="mt-2 max-w-lg text-ink-soft">
            Iluminación moderna para leer, trabajar y ambientar tu casa.
          </p>
          {products.length === 0 ? (
            <p className="mt-10 text-ink-soft">
              Todavía no hay productos publicados.
            </p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
