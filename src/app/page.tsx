import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Stars } from "@/components/Stars";
import { PremiumCarousel, type CarouselSlide } from "@/components/home/PremiumCarousel";
import { averageRating, formatPrice, getActiveProducts } from "@/lib/products";
import { getSiteSettings } from "@/lib/settings";

const valueProps = [
  {
    title: "Envío a todo el país",
    text: "Despachamos con Correo Argentino a donde estés.",
  },
  {
    title: "Pagá con Mercado Pago",
    text: "Tarjeta, cuotas o dinero en cuenta, como más te guste.",
  },
  {
    title: "Diseño que dura",
    text: "Materiales pensados para el uso diario, no para la primera semana.",
  },
];

const PHOTOS_PER_PRODUCT = 4;
const PRODUCTS_IN_CAROUSEL = 4;

const EYEBROWS = [
  "Para leer sin cansar la vista",
  "Para trabajar con foco",
  "Para ambientar cada rincón",
  "Para tu mesa de luz",
];

// El nombre completo del producto no entra en un título de 68px: se corta
// antes de "con"/"carga" (el nombre completo sigue en la ficha).
function shortTitle(name: string) {
  return name.split(/ con | carga /)[0];
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
    .flatMap(({ p, photos }, i) =>
      photos.map((photo) => ({
        slug: p.slug,
        eyebrow: EYEBROWS[i % EYEBROWS.length],
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

  return (
    <>
      <Header />
      <main className="flex-1">
        {slides.length > 0 ? (
          <PremiumCarousel slides={slides} />
        ) : (
          <section className="bg-[#061f33] px-6 py-24 text-[#fff4dc]">
            <div className="mx-auto max-w-[1400px] md:px-12 lg:px-20">
              <h1 className="font-heading text-[44px] font-extrabold leading-[1.05] tracking-[-0.035em] md:text-[68px]">
                La luz que hace que tu casa se sienta mejor
              </h1>
            </div>
          </section>
        )}

        <section className="bg-[#061f33] text-[#fff4dc]">
          <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-14 sm:grid-cols-3 md:px-12 lg:px-20">
            {valueProps.map((item) => (
              <div key={item.title} className="border-t border-amber/70 pt-5">
                <p className="font-heading text-base font-bold">{item.title}</p>
                <p className="mt-2 text-sm/[1.6] text-[#fff4dc]/60">{item.text}</p>
              </div>
            ))}
          </div>
          {allReviews.length > 0 && (
            <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-8 gap-y-2 border-t border-white/10 px-6 py-5 text-[13px] text-[#fff4dc]/70 md:px-12 lg:px-20">
              <span className="flex items-center gap-1.5">
                <Stars rating={overallRating} />
                {overallRating.toFixed(1).replace(".", ",")} · {allReviews.length} reseñas
              </span>
              <span>
                {settings.installments} {settings.installments === 1 ? "cuota" : "cuotas"} sin interés
              </span>
            </div>
          )}
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-heading text-[36px] font-extrabold tracking-[-0.03em] text-navy">
              Nuestros productos
            </h2>
            <Link href="/catalogo" className="font-heading text-sm font-bold text-blue hover:text-navy">
              Ver todos →
            </Link>
          </div>
          {products.length === 0 ? (
            <p className="mt-8 text-ink-soft">Estamos cargando el catálogo, volvé pronto.</p>
          ) : (
            <div className="mt-10 grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
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
