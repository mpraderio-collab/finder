import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { PageTransition } from "@/components/d/PageTransition";
import { Reveal } from "@/components/d/Reveal";
import { getSetOffer, SetPanel } from "@/components/d/SetOffer";
import { getActiveProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Catálogo — Finder",
  description: "Descubrí toda la iluminación moderna que importa Finder.",
};

export default async function CatalogoPage() {
  const products = await getActiveProducts();
  const [lead, ...rest] = products;
  const side = rest.slice(0, 2);
  const more = rest.slice(2);
  const setOffer = getSetOffer(products);

  // Fotos "en uso": las de ambiente que el admin marca para el carrusel (las
  // infografías con texto quedan afuera).
  const secondaryPhotos = products.flatMap((p) =>
    p.images
      .filter((img) => img.type !== "video" && img.showInCarousel)
      .slice(0, 2)
      .map((img) => ({ url: img.url, name: p.name, id: img.id })),
  );
  const bannerPhoto = secondaryPhotos[0]?.url;
  const inUse = secondaryPhotos.slice(1, 5);

  return (
    <>
      <Header />
      <PageTransition>
        <main className="d-store flex-1">
          <Reveal as="header" className="grid gap-6 px-5 pb-10 pt-14 md:grid-cols-[800px_1fr] md:px-10 md:pt-20">
            <h1 className="t-stagger-line font-d-serif text-[48px] leading-none md:text-[64px]">
              Catálogo<sup className="ml-1 align-super font-d-sans text-base">{products.length}</sup>
            </h1>
            <p className="t-stagger-line t-stagger-line--2 max-w-[520px] self-end text-[18px] leading-[1.35]">
              Iluminación moderna para leer, trabajar y ambientar tu casa. Llevando tres, el descuento se
              aplica solo en el carrito.
            </p>
          </Reveal>

          <div className="flex flex-wrap justify-between gap-2 border-y border-d-ink px-5 py-3 text-sm md:px-10">
            <span>
              Todas las luces<sup className="ml-0.5 text-[10px]">{products.length}</sup>
            </span>
            <span className="text-d-muted">Envío a todo el país · Cuotas con Mercado Pago</span>
          </div>

          {products.length === 0 ? (
            <p className="px-5 py-16 text-sm text-d-muted md:px-10">Todavía no hay productos publicados.</p>
          ) : (
            <section id="productos" className="scroll-mt-24 px-5 pb-24 pt-10 md:px-10">
              <div className="grid gap-12 md:grid-cols-[820fr_516fr] md:gap-6">
                {lead && (
                  <ProductCard product={lead} priority sizes="(min-width: 768px) 57vw, 100vw" />
                )}
                <div className="flex flex-col gap-12 md:pt-48">
                  {side.map((p) => (
                    <ProductCard key={p.slug} product={p} aspect="aspect-[5/4]" sizes="(min-width: 768px) 36vw, 100vw" />
                  ))}
                </div>
              </div>
              {more.length > 0 && (
                <div className="mt-16 grid gap-12 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
                  {more.map((p) => (
                    <ProductCard key={p.slug} product={p} />
                  ))}
                </div>
              )}
            </section>
          )}

          {setOffer && (
            <section className="relative isolate min-h-[680px] overflow-hidden bg-d-surface">
              {bannerPhoto && (
                <Image
                  src={bannerPhoto}
                  alt="Las luces de Finder en uso"
                  fill
                  className="-z-10 object-cover"
                  sizes="100vw"
                />
              )}
              <div className="flex min-h-[680px] items-end justify-end p-5 md:p-10">
                <SetPanel offer={setOffer} className="w-full max-w-[420px] bg-d-bg p-6" />
              </div>
            </section>
          )}

          {inUse.length > 1 && (
            <section className="pb-24 pt-0">
              <Reveal
                as="header"
                className="grid gap-4 border-t border-d-ink px-5 pt-3 md:grid-cols-[330px_1fr] md:px-10"
              >
                <p className="t-stagger-line text-sm">En uso</p>
                <p className="t-stagger-line t-stagger-line--2 max-w-[820px] text-[22px] leading-[1.25] md:text-[26px]">
                  Así se ven en casas de clientes: sobre la mesa de luz, bajo la repisa, en el pasillo.
                </p>
              </Reveal>
              <div className={`mt-14 grid grid-cols-2 items-end gap-5 px-5 md:px-10 ${inUseColumns(inUse.length)}`}>
                {inUse.map((photo, i) => (
                  <figure key={photo.id}>
                    <div
                      className={`relative overflow-hidden bg-d-surface ${
                        i % 2 === 0 ? "aspect-[3/4]" : "aspect-square"
                      }`}
                    >
                      <Image src={photo.url} alt={photo.name} fill className="object-cover" sizes="25vw" />
                    </div>
                    <figcaption className="mt-2 text-sm text-d-muted">{photo.name}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}

// With fewer than four photos the row sits under the section text (same
// column as the header copy) instead of leaving the right side empty.
function inUseColumns(count: number) {
  if (count >= 4) return "md:grid-cols-4";
  return count === 3 ? "md:grid-cols-3 md:pl-[386px]" : "md:grid-cols-2 md:pl-[386px]";
}
