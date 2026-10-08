import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { SceneHero, type HeroScene } from "@/components/home/SceneHero";
import { StoreMain } from "@/components/store/StoreMain";
import { Reveal } from "@/components/store/Reveal";
import { StarRating } from "@/components/store/StarRating";
import { ArrowRight, CheckIcon } from "@/components/store/Icons";
import { contextImage, contextPhoto, groupByScene } from "@/components/store/scenes";
import { averageRating, formatPrice, getActiveProducts } from "@/lib/products";
import { activePromotion } from "@/lib/promotions";
import { getSiteSettings } from "@/lib/settings";

// Titular del hero por escena — el nombre completo del producto vive en la
// ficha; acá va la promesa del momento de uso.
const HEADLINES: Record<string, string> = {
  leer: "Leé de noche sin despertar a nadie.",
  trabajar: "Tu escritorio, sin cables sueltos.",
  ambientar: "Que la casa cambie de clima.",
};

// El nombre completo del producto no entra en un botón: se corta antes de
// "con"/"carga" (el nombre completo sigue en la ficha).
function shortName(name: string) {
  return name.split(/ con | carga /)[0];
}

function lowerFirst(text: string) {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export default async function Home() {
  const [products, settings] = await Promise.all([getActiveProducts(), getSiteSettings()]);
  const { scenes, others } = groupByScene(products);

  const installmentsNote = `${settings.installments} ${settings.installments === 1 ? "cuota" : "cuotas"} sin interés`;

  const heroScenes: HeroScene[] = scenes
    .map(({ scene, product }): HeroScene | null => {
      const photo = contextImage(product);
      if (!photo) return null;
      return {
        id: scene.id,
        number: scene.number,
        name: scene.name,
        productName: shortName(product.name),
        headline: HEADLINES[scene.id] ?? scene.title,
        text: product.tagline,
        href: `/catalogo/${product.slug}`,
        cta: `Ver ${lowerFirst(shortName(product.name))}`,
        priceNote: `${formatPrice(product.price)} · ${installmentsNote}`,
        imageUrl: photo.url,
        focusX: photo.focusX,
        focusY: photo.focusY,
      };
    })
    .filter((s): s is HeroScene => s !== null);

  const allReviews = products.flatMap((p) => p.reviews);
  const overallRating = averageRating(allReviews);
  const featuredReviews = [...allReviews]
    .sort((a, b) => b.rating - a.rating || b.text.length - a.text.length)
    .slice(0, 3);

  // Banda del pack: solo si la promo existe y con los productos de las
  // escenas alcanza el primer tramo por cantidad.
  const promo = products.map(activePromotion).find((p) => p && p.tiers.length > 0) ?? null;
  const firstTier = promo?.tiers[0];
  const packProducts = scenes.map((s) => s.product);
  const packTotal = packProducts.reduce((sum, p) => sum + p.price, 0);
  const showPack =
    promo?.triggerType === "quantity" && firstTier && packProducts.length >= firstTier.threshold;

  return (
    <>
      <Header />
      <StoreMain>
        {heroScenes.length > 0 ? (
          <SceneHero scenes={heroScenes} />
        ) : (
          <section className="bg-night px-6 py-28 text-cream md:px-16">
            <h1 className="max-w-[760px] font-serif text-[48px]/[1.02] font-medium md:text-[84px]/[1.02]">
              La luz que hace que tu casa se sienta mejor
            </h1>
          </section>
        )}

        <Reveal
          as="section"
          className="mx-auto grid max-w-[1440px] gap-8 px-6 pb-16 pt-20 md:grid-cols-[minmax(0,720px)_minmax(0,400px)] md:items-end md:justify-between md:px-16 md:pb-20 md:pt-32"
        >
          <h2 className="t-stagger-line t-stagger-line--1 font-serif text-[34px]/[1.1] font-medium tracking-[-0.01em] md:text-[48px]/[1.1]">
            Iluminación pensada para un momento, no para un catálogo.
          </h2>
          <p className="t-stagger-line t-stagger-line--2 text-[17px]/[1.6] text-taupe">
            Elegí qué querés hacer y te mostramos la luz que lo acompaña.
            Tres productos, tres escenas, ninguna instalación.
          </p>
        </Reveal>

        {scenes.map(({ scene, product }, i) => {
          const photo = contextPhoto(product);
          const flipped = i % 2 === 1;
          return (
            <section
              key={scene.id}
              id={scene.id}
              className={`grid scroll-mt-28 md:min-h-[720px] md:grid-cols-[780fr_660fr] ${flipped ? "bg-sand" : ""}`}
            >
              <div className={`relative min-h-[380px] overflow-hidden md:min-h-0 ${flipped ? "md:order-2" : ""}`}>
                {photo && (
                  <Image
                    src={photo}
                    alt={`${product.name} en uso`}
                    fill
                    sizes="(min-width: 768px) 55vw, 100vw"
                    className="object-cover"
                  />
                )}
              </div>
              <Reveal className="flex flex-col justify-center gap-6 px-6 py-14 md:px-20 md:py-20">
                <p className="t-stagger-line t-stagger-line--1 flex items-center gap-3 text-clay-ink">
                  <span className="font-serif text-[15px]">{scene.number}</span>
                  <span className="h-px w-8 bg-clay" />
                  <span className="text-[13px] font-semibold uppercase tracking-[0.16em]">{scene.name}</span>
                </p>
                <h2 className="t-stagger-line t-stagger-line--2 max-w-[500px] font-serif text-[38px]/[1.05] font-medium tracking-[-0.02em] md:text-[52px]/[1.05]">
                  {scene.title}
                </h2>
                <p className="t-stagger-line t-stagger-line--3 max-w-[500px] text-[17px]/[1.6] text-taupe">
                  {product.description.split(/(?<=\.)\s/)[0]}
                </p>
                {product.features.length > 0 && (
                  <ul className="t-stagger-line t-stagger-line--3 flex max-w-[500px] flex-col gap-2.5">
                    {product.features.slice(0, 3).map((f) => (
                      <li key={f.id} className="flex gap-2.5 text-[15px]/[1.45] text-espresso">
                        <CheckIcon size={16} className="mt-0.5 shrink-0 text-clay" />
                        {f.text}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="t-stagger-line t-stagger-line--4 flex max-w-[500px] flex-wrap items-center justify-between gap-4 border-t border-linen pt-6">
                  <div>
                    <p className="text-[15px] text-espresso">{shortName(product.name)}</p>
                    <p className="font-serif text-xl text-espresso">{formatPrice(product.price)}</p>
                  </div>
                  <Link
                    href={`/catalogo/${product.slug}`}
                    transitionTypes={["nav-forward"]}
                    className={`b-btn ${i === 0 ? "b-btn-clay" : "b-btn-outline"} !px-[22px] !py-[14px] !text-sm`}
                  >
                    Ver producto
                    <ArrowRight size={16} className="b-arrow" />
                  </Link>
                </div>
              </Reveal>
            </section>
          );
        })}

        {others.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-6 py-20 md:px-16">
            <h2 className="font-serif text-[34px] font-medium md:text-[44px]">Más luces</h2>
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </section>
        )}

        {products.length === 0 && (
          <p className="mx-auto max-w-[1440px] px-6 pb-20 text-taupe md:px-16">
            Estamos cargando el catálogo, volvé pronto.
          </p>
        )}

        {featuredReviews.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-6 py-20 md:px-16 md:py-[120px]">
            <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <h2 className="t-stagger-line t-stagger-line--1 max-w-[640px] font-serif text-[34px]/[1.1] font-medium tracking-[-0.01em] md:text-[44px]/[1.1]">
                Lo que pasa cuando se apaga la luz del techo.
              </h2>
              <p className="t-stagger-line t-stagger-line--2 flex items-center gap-2.5 text-sm text-taupe">
                <StarRating rating={overallRating} size={16} />
                {overallRating.toFixed(1).replace(".", ",")} de 5 · {allReviews.length} reseñas
              </p>
            </Reveal>
            <Reveal className="mt-12 grid grid-cols-1 gap-10 md:mt-16 md:grid-cols-3 md:gap-16">
              {featuredReviews.map((review, i) => (
                <figure
                  key={review.id}
                  className={`t-stagger-line t-stagger-line--${i + 1} flex flex-col gap-5 border-t border-espresso pt-8`}
                >
                  <blockquote className="font-serif text-[22px]/[1.35] md:text-2xl/[1.35]">
                    &ldquo;{review.text}&rdquo;
                  </blockquote>
                  <figcaption className="text-sm">
                    <span className="font-semibold">{review.author}</span>
                    <span className="block text-taupe">Compra verificada</span>
                  </figcaption>
                </figure>
              ))}
            </Reveal>
          </section>
        )}

        {showPack && firstTier && (
          <section className="bg-clay text-paper">
            <Reveal className="mx-auto flex max-w-[1440px] flex-col gap-10 px-6 py-16 md:flex-row md:items-center md:justify-between md:px-16 md:py-20">
              <div className="t-stagger-line t-stagger-line--1 max-w-[560px]">
                <h2 className="font-serif text-[36px]/[1.1] font-medium md:text-[48px]/[1.1]">
                  Una luz para cada escena.
                </h2>
                <p className="mt-3 text-lg text-paper/85">
                  Llevá {firstTier.threshold} y pagás {firstTier.percentOff}% menos. Combinalas como quieras.
                </p>
              </div>
              <div className="t-stagger-line t-stagger-line--2 flex flex-col items-start gap-3">
                <p className="flex items-baseline gap-3">
                  <span className="text-lg text-paper/60 line-through">{formatPrice(packTotal)}</span>
                  <span className="font-serif text-[44px] leading-none">
                    {formatPrice(Math.round(packTotal * (1 - firstTier.percentOff / 100)))}
                  </span>
                </p>
                <Link href="/catalogo" className="b-btn b-btn-paper">
                  Armar el pack de {firstTier.threshold}
                  <ArrowRight size={16} className="b-arrow" />
                </Link>
              </div>
            </Reveal>
          </section>
        )}
      </StoreMain>
      <Footer />
    </>
  );
}
