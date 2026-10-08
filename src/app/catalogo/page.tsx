import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { PageTransition } from "@/components/store/PageTransition";
import { formatPrice, getActiveProducts } from "@/lib/products";
import { activePromotion, calculateLineTotals, tierLabel } from "@/lib/promotions";

export const metadata: Metadata = {
  title: "Catálogo — Finder",
  description: "Descubrí toda la iluminación moderna que importa Finder.",
};

export default async function CatalogoPage() {
  const products = await getActiveProducts();

  const promoOwner = products.find((p) => activePromotion(p));
  const promo = promoOwner ? activePromotion(promoOwner) : null;
  const promoProducts = promo
    ? products.filter((p) => promo.products?.some((pp) => pp.id === p.id) ?? p.id === promoOwner?.id)
    : [];
  const topTier = promo ? [...promo.tiers].sort((a, b) => b.threshold - a.threshold)[0] : null;
  const bundleFull = promoProducts.reduce((sum, p) => sum + p.price, 0);
  const bundleTotal = promo
    ? Array.from(
        calculateLineTotals(
          promoProducts.map((p) => ({ key: p.id, unitPrice: p.price, quantity: 1, promotion: promo })),
        ).values(),
      ).reduce((sum, v) => sum + v, 0)
    : 0;
  // Foto de ambiente (marcada para el carrusel en el admin), nunca una
  // infografía con texto debajo del texto del tile.
  const promoImage = promoProducts
    .flatMap((p) => p.images)
    .find((img) => img.type !== "video" && img.showInCarousel)?.url;

  // El tile de la promo cierra la grilla ocupando las columnas libres de la
  // última fila (toda la fila si está completa).
  const freeColumns = 4 - (products.length % 4);
  const promoSpan = { 1: "lg:col-span-1", 2: "lg:col-span-2", 3: "lg:col-span-3", 4: "lg:col-span-4" }[freeColumns];

  return (
    <>
      <Header />
      <PageTransition>
        <main className="flex-1 bg-e-bg text-e-ink">
          <section className="flex flex-col gap-6 px-4 pb-8 pt-10 md:flex-row md:items-end md:justify-between md:px-8 md:pt-14">
            <div className="flex flex-col gap-3">
              <p className="e-mono text-e-muted">
                <Link href="/" transitionTypes={["nav-back"]} className="hover:text-e-ink">
                  Inicio
                </Link>{" "}
                / Catálogo
              </p>
              <h1 className="text-[44px] font-medium leading-none tracking-[-0.03em] md:text-[64px]">
                Todas las luces
                <sup className="e-mono ml-2 align-super text-e-muted">({products.length})</sup>
              </h1>
            </div>
            <p className="max-w-[420px] text-[14px] text-e-muted">
              Iluminación moderna para leer, trabajar y ambientar tu casa.
              {promo && topTier && ` ${tierLabel(promo, topTier)}, se aplica sola en el carrito.`}
            </p>
          </section>

          <div className="border-y border-e-line px-4 py-3 md:px-8">
            <span className="e-mono">
              {products.length} {products.length === 1 ? "producto" : "productos"}
            </span>
          </div>

          {products.length === 0 ? (
            <p className="px-4 py-16 text-e-muted md:px-8">Todavía no hay productos publicados.</p>
          ) : (
            <section className="grid grid-cols-2 gap-x-2 gap-y-8 px-4 py-8 md:px-8 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}

              {promo && topTier && promoProducts.length > 1 && (
                <Link
                  href={`/catalogo/${promoProducts[0].slug}`}
                  transitionTypes={["nav-forward"]}
                  className={`e-tile relative col-span-2 flex min-h-[420px] flex-col justify-between overflow-hidden bg-e-ink p-6 text-white md:p-8 ${promoSpan}`}
                >
                  {promoImage && (
                    <span className="e-tile-media absolute inset-0">
                      <Image
                        src={promoImage}
                        alt=""
                        fill
                        className="e-tile-primary object-cover opacity-50"
                        sizes="(min-width: 1024px) 50vw, 100vw"
                      />
                    </span>
                  )}
                  <span className="e-mono relative">{tierLabel(promo, topTier)}</span>
                  <span className="relative flex flex-col gap-4">
                    <span className="text-[28px] font-medium leading-[1.05] tracking-[-0.02em] md:text-[32px]">
                      {promoProducts.length} luces,{" "}
                      {bundleTotal < bundleFull ? formatPrice(bundleTotal) : formatPrice(bundleFull)}
                    </span>
                    {bundleTotal < bundleFull && (
                      <span className="e-mono text-white/70">Antes {formatPrice(bundleFull)}</span>
                    )}
                    <span className="e-pill e-pill--light w-fit">Combinalas</span>
                  </span>
                </Link>
              )}

            </section>
          )}
        </main>
        <Footer />
      </PageTransition>
    </>
  );
}
