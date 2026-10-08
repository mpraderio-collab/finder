import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { PremiumCarousel, type CarouselSlide } from "@/components/home/PremiumCarousel";
import { PageTransition } from "@/components/store/PageTransition";
import { TileCarousel } from "@/components/store/TileCarousel";
import {
  averageRating,
  formatPrice,
  getActiveProducts,
  getHeroImageUrl,
  type ProductWithRelations,
} from "@/lib/products";
import { activePromotion, calculateLineTotals, tierLabel } from "@/lib/promotions";
import { getSiteSettings } from "@/lib/settings";

const PHOTOS_PER_PRODUCT = 4;
const PRODUCTS_IN_CAROUSEL = 4;

// Frase corta sobre el uso de cada producto, por slug. Si se suma un producto
// nuevo sin frase propia, usa la genérica en vez de heredar la de otro.
const EYEBROWS: Record<string, string> = {
  "lampara-lectura-led": "Para leer sin cansar la vista",
  "luz-gradiente-rgb-sensor-movimiento": "Para ambientar tu habitación",
  "luz-escritorio-magnetica": "Para trabajar con foco",
};
const DEFAULT_EYEBROW = "Luz para cada momento";

// Momento de uso de cada producto para los tiles "Preparate para cada momento".
const MOMENTS: Record<string, string> = {
  "lampara-lectura-led": "Leer",
  "luz-gradiente-rgb-sensor-movimiento": "Ambientar",
  "luz-rgb-sensor-movimiento": "Ambientar",
  "luz-escritorio-magnetica": "Trabajar",
};

// El nombre completo del producto no entra en un título de 64px: se corta
// antes de "con"/"carga" (el nombre completo sigue en la ficha).
function shortTitle(name: string) {
  return name.split(/ con | carga /)[0];
}

// Foto para los tiles grandes con texto encima: las marcadas "Mostrar en el
// carrusel" desde el admin son las de ambiente (sin infografía); si no hay
// ninguna, la principal.
function lifestyleImage(p: ProductWithRelations) {
  const photos = p.images.filter((img) => img.type !== "video");
  return (photos.find((img) => img.showInCarousel) ?? photos.find((img) => img.isHero) ?? photos[0])?.url;
}

export default async function Home() {
  const [products, settings] = await Promise.all([getActiveProducts(), getSiteSettings()]);

  // Hasta PHOTOS_PER_PRODUCT fotos por producto (la principal primero) en los
  // primeros PRODUCTS_IN_CAROUSEL productos que tengan fotos.
  const slides: CarouselSlide[] = products
    .map((p) => ({
      p,
      // Solo las fotos marcadas "Mostrar en el carrusel" desde el admin; si
      // un producto no tiene ninguna, entra con su foto principal.
      photos: (() => {
        const photos = p.images.filter((img) => img.type !== "video");
        const marked = photos.filter((img) => img.showInCarousel);
        const chosen = marked.length > 0 ? marked : [photos.find((img) => img.isHero) ?? photos[0]].filter(Boolean);
        return chosen
          .sort((x, y) => Number(y.isHero) - Number(x.isHero) || x.position - y.position)
          .slice(0, PHOTOS_PER_PRODUCT);
      })(),
    }))
    .filter((x) => x.photos.length > 0)
    .slice(0, PRODUCTS_IN_CAROUSEL)
    .flatMap(({ p, photos }) =>
      photos.map((photo) => ({
        slug: p.slug,
        eyebrow: EYEBROWS[p.slug] ?? DEFAULT_EYEBROW,
        title: shortTitle(p.name),
        text: p.tagline,
        imageUrl: photo.url,
        focusX: photo.focusX,
        focusY: photo.focusY,
        price: formatPrice(p.price),
      })),
    );

  const allReviews = products.flatMap((p) => p.reviews);
  const overallRating = averageRating(allReviews);

  // Promo combinable (mix and match) — la de cualquier producto que tenga una.
  const promoOwner = products.find((p) => activePromotion(p));
  const promo = promoOwner ? activePromotion(promoOwner) : null;
  const promoProducts = promo
    ? products.filter((p) => promo.products?.some((pp) => pp.id === p.id) ?? p.id === promoOwner?.id)
    : [];
  const topTier = promo ? [...promo.tiers].sort((a, b) => b.threshold - a.threshold)[0] : null;
  // Precio de llevar uno de cada producto de la promo, con el mismo cálculo
  // que aplica el carrito.
  const bundleFull = promoProducts.reduce((sum, p) => sum + p.price, 0);
  const bundleTotal = promo
    ? Array.from(
        calculateLineTotals(
          promoProducts.map((p) => ({ key: p.id, unitPrice: p.price, quantity: 1, promotion: promo })),
        ).values(),
      ).reduce((sum, v) => sum + v, 0)
    : 0;

  // Foto de ambiente de un producto distinto al de la banda editorial.
  const promoImage = promoProducts
    .filter((p) => p.slug !== "lampara-lectura-led")
    .map(lifestyleImage)
    .find(Boolean) ?? (promoProducts[0] ? lifestyleImage(promoProducts[0]) : undefined);

  const topReviews = products
    .flatMap((product) => product.reviews.map((review) => ({ review, product })))
    .sort((a, b) => b.review.rating - a.review.rating)
    .slice(0, 6);
  const editorialProduct = products.find((p) => p.slug === "lampara-lectura-led") ?? products[0];
  const editorialImage = editorialProduct ? lifestyleImage(editorialProduct) : undefined;

  return (
    <>
      <Header />
      <PageTransition>
        <main className="flex-1 bg-e-bg text-e-ink">
          {slides.length > 0 ? (
            <PremiumCarousel slides={slides} />
          ) : (
            <section className="flex h-[560px] items-end bg-black px-4 pb-12 text-white md:px-8">
              <h1 className="max-w-[720px] text-[44px] font-medium leading-[1.02] tracking-[-0.03em] md:text-[64px]">
                La luz que hace que tu casa se sienta mejor
              </h1>
            </section>
          )}

          {products.length === 0 ? (
            <p className="px-4 py-16 text-e-muted md:px-8">Estamos cargando el catálogo, volvé pronto.</p>
          ) : (
            <TileCarousel
              title="Nuevo en Finder"
              aside={
                <Link href="/catalogo" className="e-mono hidden underline underline-offset-4 sm:inline">
                  Ver todo
                </Link>
              }
            >
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} sizes="(min-width: 1024px) 340px, 72vw" />
              ))}
            </TileCarousel>
          )}

          {promo && topTier && promoProducts.length > 0 && (
            <section className="flex flex-col gap-5 px-4 pb-16 md:px-8">
              <div className="flex items-center justify-between gap-4">
                <h2 className="e-mono">
                  Combinalas · {tierLabel(promo, topTier)}
                </h2>
                <Link href="/catalogo" className="e-mono shrink-0 whitespace-nowrap underline underline-offset-4">
                  Ver catálogo
                </Link>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <Link
                  href="/catalogo"
                  className="e-tile relative flex aspect-[684/720] max-h-[720px] flex-col justify-between overflow-hidden p-5 text-white md:p-8"
                >
                  {promoImage && (
                    <span className="e-tile-media absolute inset-0">
                      <Image
                        src={promoImage}
                        alt=""
                        fill
                        className="e-tile-primary object-cover"
                        sizes="(min-width: 768px) 50vw, 100vw"
                      />
                    </span>
                  )}
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,.6),rgba(0,0,0,0)_45%,rgba(0,0,0,.35))]"
                  />
                  <span className="e-mono relative">{tierLabel(promo, topTier)}</span>
                  <span className="relative flex items-end justify-between gap-4">
                    <span className="text-[32px] font-medium leading-none tracking-[-0.02em] md:text-[40px]">
                      Armá tu combo
                    </span>
                    <span className="e-pill e-pill--light shrink-0">Elegir</span>
                  </span>
                </Link>
                <Link
                  href="/catalogo"
                  className="e-tile flex aspect-[684/720] max-h-[720px] flex-col justify-between gap-6 bg-e-ink p-5 text-white md:p-8"
                >
                  <span className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <span className="e-mono">{promoProducts.map((p) => shortTitle(p.name)).join(" · ")}</span>
                    <span className="e-mono shrink-0">
                      {bundleTotal < bundleFull
                        ? `${formatPrice(bundleTotal)} · antes ${formatPrice(bundleFull)}`
                        : formatPrice(bundleFull)}
                    </span>
                  </span>
                  <span className="grid grid-cols-3 gap-2">
                    {promoProducts.slice(0, 3).map((p) => {
                      const hero = getHeroImageUrl(p);
                      return (
                        <span key={p.slug} className="relative aspect-[3/4] overflow-hidden bg-e-tile">
                          {hero && (
                            <Image src={hero} alt="" fill className="object-contain" sizes="(min-width: 768px) 15vw, 30vw" />
                          )}
                        </span>
                      );
                    })}
                  </span>
                  <span className="flex items-end justify-between gap-4">
                    <span className="text-[32px] font-medium leading-none tracking-[-0.02em] md:text-[40px]">
                      {promoProducts.length > 1 ? `Las ${promoProducts.length} luces` : promoProducts[0].name}
                    </span>
                    <span className="e-pill e-pill--light shrink-0">Comprar</span>
                  </span>
                </Link>
              </div>
            </section>
          )}

          {products.length > 0 && (
            <section className="flex flex-col gap-5 px-4 pb-16 md:px-8">
              <h2 className="e-mono">Preparate para cada momento</h2>
              <div className="grid gap-2 md:grid-cols-3">
                {products.slice(0, 3).map((p, i, list) => {
                  const image = lifestyleImage(p);
                  return (
                    <Link
                      key={p.slug}
                      href={`/catalogo/${p.slug}`}
                      transitionTypes={["nav-forward"]}
                      className="e-tile relative flex aspect-[4/5] flex-col md:aspect-[453/620] items-center justify-between overflow-hidden bg-e-tile px-6 pb-7 pt-6 text-center text-white"
                    >
                      {image && (
                        <span className="e-tile-media absolute inset-0">
                          <Image
                            src={image}
                            alt=""
                            fill
                            className="e-tile-primary object-cover"
                            sizes="(min-width: 768px) 33vw, 100vw"
                          />
                        </span>
                      )}
                      <span aria-hidden className="absolute inset-0 bg-black/45" />
                      <span className="e-mono relative">
                        {String(i + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
                      </span>
                      <span className="relative flex flex-col items-center gap-1.5">
                        <span className="e-mono">{MOMENTS[p.slug] ?? "Iluminar"}</span>
                        <span className="text-[24px] font-medium uppercase leading-tight md:text-[28px]">
                          {shortTitle(p.name)}
                        </span>
                      </span>
                      <span className="e-pill e-pill--light relative">Ver</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {editorialProduct && editorialImage && (
            <section className="relative isolate flex min-h-[560px] flex-col justify-between overflow-hidden bg-black px-4 pb-12 pt-10 text-white md:h-[760px] md:px-8">
              <Image src={editorialImage} alt="" fill className="-z-10 object-cover opacity-45" sizes="100vw" />
              <span className="e-mono">Historias Finder · 01</span>
              <p className="text-[clamp(44px,13vw,200px)] font-semibold leading-[0.9] tracking-[-0.04em] [overflow-wrap:anywhere]">
                NOCHE:Libre
              </p>
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <p className="max-w-[460px] text-[16px]/[1.4]">
                  {editorialProduct.description.split(". ")[0]}.
                </p>
                <Link
                  href={`/catalogo/${editorialProduct.slug}`}
                  transitionTypes={["nav-forward"]}
                  className="e-pill e-pill--light w-fit"
                >
                  Ver {shortTitle(editorialProduct.name)}
                </Link>
              </div>
            </section>
          )}

          {topReviews.length > 0 && (
            <section className="grid gap-8 py-16 pl-4 md:grid-cols-[360px_1fr] md:pl-8">
              <div className="flex flex-col gap-4 pr-4 md:pr-0">
                <span className="e-mono">Lo que dicen</span>
                <h2 className="text-[40px] font-medium leading-[1.05] tracking-[-0.02em]">
                  Las luces que eligen nuestros clientes
                </h2>
                <p className="text-[14px] text-e-muted">
                  {overallRating.toFixed(1).replace(".", ",")} de 5 en {allReviews.length} reseñas ·{" "}
                  {settings.installments} {settings.installments === 1 ? "cuota" : "cuotas"} sin interés
                </p>
                <Link href="/catalogo" className="e-pill e-pill--dark w-fit">
                  Ver el catálogo
                </Link>
              </div>
              <div className="flex snap-x gap-2 overflow-x-auto pr-4 [scrollbar-width:none] md:pr-8 [&::-webkit-scrollbar]:hidden">
                {topReviews.map(({ review, product }) => (
                  <Link
                    key={review.id}
                    href={`/catalogo/${product.slug}`}
                    transitionTypes={["nav-forward"]}
                    className="flex aspect-[340/420] w-[72vw] shrink-0 snap-start flex-col justify-between bg-e-tile p-6 transition-colors hover:bg-e-line sm:w-[42vw] lg:w-[340px]"
                  >
                    <span className="e-mono">{"★".repeat(review.rating)}</span>
                    <span className="text-[20px] font-medium leading-snug tracking-[-0.01em]">
                      &ldquo;{review.text}&rdquo;
                    </span>
                    <span className="flex flex-col gap-1">
                      <span className="text-[13px]">{review.author}</span>
                      <span className="e-mono text-e-muted">{shortTitle(product.name)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
        <Footer />
      </PageTransition>
    </>
  );
}
