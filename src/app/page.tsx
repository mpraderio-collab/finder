import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Stars } from "@/components/Stars";
import { averageRating, getActiveProducts, getHeroImageUrl } from "@/lib/products";
import type { ProductWithRelations } from "@/lib/products";
import { getSiteSettings } from "@/lib/settings";

const valueProps = [
  {
    title: "Envío gratis a todo el país",
    text: "Recibí tu pedido en la puerta de tu casa, estés donde estés.",
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

export default async function Home() {
  const [products, settings] = await Promise.all([getActiveProducts(), getSiteSettings()]);
  const featured = products[0];
  const featuredHero = featured ? getHeroImageUrl(featured) : undefined;
  const heroProducts = products.slice(0, 3);

  const allReviews = products.flatMap((p) => p.reviews);
  const overallRating = averageRating(allReviews);

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-[52px] px-6 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-14">
          <div className="flex flex-col gap-[22px]">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-amber-ink">
              Iluminación moderna · Argentina
            </span>
            <h1 className="font-heading text-[56px] font-extrabold leading-[1.05] tracking-[-0.03em] text-navy">
              La luz que hace que tu casa se sienta mejor
            </h1>
            <span className="h-1 w-16 rounded-full bg-amber" />
            <p className="max-w-[450px] text-[17px]/[1.65] text-ink-soft">
              Importamos lámparas y luces pensadas para leer, trabajar y
              ambientar cada rincón — sin cables sueltos ni instalaciones
              complicadas.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/catalogo"
                className="rounded-lg bg-navy px-[26px] py-[15px] font-heading text-sm font-bold text-white transition-colors hover:bg-navy-deep"
              >
                Ver catálogo
              </Link>
              <Link
                href="/nosotros"
                className="rounded-lg border border-border-btn bg-bg px-[26px] py-[15px] font-heading text-sm font-bold text-navy transition-colors hover:bg-surface"
              >
                Conocé la marca
              </Link>
            </div>
            {allReviews.length > 0 && (
              <div className="flex flex-wrap items-center gap-[26px] text-[13px] text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <Stars rating={overallRating} />
                  {overallRating.toFixed(1).replace(".", ",")} ·{" "}
                  {allReviews.length} reseñas
                </span>
                <span>Envío gratis a todo el país</span>
                <span>
                  {settings.installments}{" "}
                  {settings.installments === 1 ? "cuota" : "cuotas"} sin interés
                </span>
              </div>
            )}
          </div>
          {heroProducts.length >= 3 ? (
            <div className="grid aspect-[4/5] w-full grid-rows-[1.3fr_1fr] gap-3">
              <HeroTile product={heroProducts[0]} priority />
              <div className="grid grid-cols-2 gap-3">
                <HeroTile product={heroProducts[1]} />
                <HeroTile product={heroProducts[2]} />
              </div>
            </div>
          ) : (
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-line bg-surface">
              {featuredHero && (
                <Image
                  src={featuredHero}
                  alt={featured.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              )}
            </div>
          )}
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-[26px] sm:grid-cols-3 sm:divide-x sm:divide-line">
            {valueProps.map((item) => (
              <div key={item.title} className="sm:px-6 sm:first:pl-0">
                <p className="font-heading text-base font-bold text-navy">
                  {item.title}
                </p>
                <p className="mt-1 text-sm/[1.55] text-ink-soft">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 md:py-[52px]">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-heading text-[32px] font-extrabold tracking-[-0.02em] text-navy">
              Nuestros productos
            </h2>
            <Link
              href="/catalogo"
              className="font-heading text-sm font-bold text-blue hover:text-navy"
            >
              Ver todos →
            </Link>
          </div>
          {products.length === 0 ? (
            <p className="mt-8 text-ink-soft">
              Estamos cargando el catálogo, volvé pronto.
            </p>
          ) : (
            <div className="mt-8 grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
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

function HeroTile({
  product,
  priority,
}: {
  product: ProductWithRelations;
  priority?: boolean;
}) {
  const heroUrl = getHeroImageUrl(product);
  return (
    <Link
      href={`/catalogo/${product.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-line bg-surface"
    >
      {heroUrl && (
        <Image
          src={heroUrl}
          alt={product.name}
          fill
          priority={priority}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(min-width: 768px) 25vw, 50vw"
        />
      )}
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-3.5 pb-3 pt-8 font-heading text-[13px] font-bold text-white">
        {product.name}
      </span>
    </Link>
  );
}
