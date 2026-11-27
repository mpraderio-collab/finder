import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { CustomerStories } from "@/components/home/CustomerStories";
import { PremiumCarousel, type CarouselSlide } from "@/components/home/PremiumCarousel";
import { PageTransition } from "@/components/store/PageTransition";
import {
  averageRating,
  formatPrice,
  getActiveProducts,
  type ProductWithRelations,
} from "@/lib/products";
import { getSiteSettings } from "@/lib/settings";
import { getPublishedStories } from "@/lib/stories";

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
  const [products, settings, stories] = await Promise.all([
    getActiveProducts(),
    getSiteSettings(),
    getPublishedStories(),
  ]);

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
            <section className="flex flex-col gap-5 px-4 py-12 md:px-8 md:py-16">
              <div className="flex items-center justify-between gap-4">
                <h2 className="e-mono">Todos los productos · {products.length}</h2>
                <Link href="/catalogo" className="e-mono shrink-0 underline underline-offset-4">
                  Ir al catálogo
                </Link>
              </div>
              {/* Grilla vertical: se ve todo bajando, sin deslizar de costado. */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-10 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.slug}
                    product={product}
                    sizes="(min-width: 1024px) 33vw, 50vw"
                  />
                ))}
              </div>
            </section>
          )}

          {stories.length > 0 && <CustomerStories stories={stories} />}

          {editorialProduct && editorialImage && (
            <section className="relative isolate flex min-h-[560px] flex-col justify-between overflow-hidden bg-black px-4 pb-12 pt-10 text-white md:h-[760px] md:px-8">
              <Image src={editorialImage} alt="" fill className="-z-10 object-cover opacity-45" sizes="100vw" />
              <span className="e-mono">Historias Finder · 01</span>
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
            <section className="flex flex-col gap-10 px-4 py-16 md:px-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
                <div className="flex max-w-[640px] flex-col gap-4">
                  <span className="e-mono">Lo que dicen</span>
                  <h2 className="text-[40px] font-medium leading-[1.05] tracking-[-0.02em]">
                    Las luces que eligen nuestros clientes
                  </h2>
                  <p className="text-[14px] text-e-muted">
                    {overallRating.toFixed(1).replace(".", ",")} de 5 en {allReviews.length} reseñas ·{" "}
                    {settings.installments} {settings.installments === 1 ? "cuota" : "cuotas"} sin interés
                  </p>
                </div>
                <Link href="/catalogo" className="e-pill e-pill--dark w-fit shrink-0">
                  Ver el catálogo
                </Link>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {topReviews.map(({ review, product }) => (
                  <Link
                    key={review.id}
                    href={`/catalogo/${product.slug}`}
                    transitionTypes={["nav-forward"]}
                    className="flex min-h-[280px] flex-col justify-between gap-8 bg-e-tile p-6 transition-colors hover:bg-e-line"
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
