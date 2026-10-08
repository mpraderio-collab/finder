import Image from "next/image";
import { FIT_PRODUCT } from "@/components/d/media";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PremiumCarousel, type CarouselSlide } from "@/components/home/PremiumCarousel";
import { PageTransition } from "@/components/d/PageTransition";
import { Reveal } from "@/components/d/Reveal";
import { CtaLink } from "@/components/d/CtaLink";
import { averageRating, formatPrice, getActiveProducts, getHeroImageUrl } from "@/lib/products";
import { getSiteSettings } from "@/lib/settings";
import { getSetOffer, SetPanel } from "@/components/d/SetOffer";

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

// Escena (momento de uso) de cada producto, para la sección Colección.
const SCENES: Record<string, string> = {
  "lampara-lectura-led": "Leer",
  "luz-escritorio-magnetica": "Trabajar",
  "luz-gradiente-rgb-sensor-movimiento": "Ambientar",
};
const SCENE_ORDER = ["Leer", "Trabajar", "Ambientar"];

// El nombre completo del producto no entra en un título: se corta antes de
// "con"/"carga" (el nombre completo sigue en la ficha).
function shortTitle(name: string) {
  return name.split(/ con | carga /)[0];
}

function SectionHead({
  label,
  children,
  id,
}: {
  label: string;
  children?: React.ReactNode;
  id?: string;
}) {
  return (
    <Reveal
      as="header"
      className="grid gap-4 border-t border-d-ink px-5 pt-3 md:grid-cols-[330px_1fr] md:gap-0 md:px-10"
    >
      <p id={id} className="t-stagger-line text-sm">
        {label}
      </p>
      {children && (
        <p className="t-stagger-line t-stagger-line--2 max-w-[820px] text-[22px] leading-[1.25] md:text-[26px]">
          {children}
        </p>
      )}
    </Reveal>
  );
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
  const quote = allReviews.find((r) => r.rating === 5 && r.text.length > 40) ?? allReviews[0];

  // Una foto "de ambiente" por producto: las marcadas para el carrusel desde
  // el admin son las de ambiente (no infografías); si no hay, la principal.
  const scenePhoto = (p: (typeof products)[number]) => {
    const photos = p.images.filter((img) => img.type !== "video");
    return (photos.find((img) => img.showInCarousel) ?? photos.find((img) => img.isHero) ?? photos[0])?.url;
  };

  const scenes = products
    .map((p) => ({ p, scene: SCENES[p.slug] ?? DEFAULT_EYEBROW, photo: scenePhoto(p) }))
    .filter((s) => s.photo)
    .sort((a, b) => SCENE_ORDER.indexOf(a.scene) - SCENE_ORDER.indexOf(b.scene))
    .slice(0, 3);

  const featured = products[0];

  const setOffer = getSetOffer(products);
  const setPhoto = setOffer ? scenePhoto(setOffer.items[setOffer.items.length - 1]) : undefined;

  return (
    <>
      <Header />
      <PageTransition>
        <main className="d-store flex-1">
          {slides.length > 0 ? (
            <PremiumCarousel slides={slides} />
          ) : (
            <section className="px-5 py-32 md:px-10">
              <h1 className="max-w-[900px] font-d-serif text-[44px] leading-[1.1] md:text-[64px]">
                La luz que hace que tu casa se sienta mejor
              </h1>
            </section>
          )}

          {scenes.length > 0 && (
            <section className="pb-24 pt-10">
              <SectionHead label="Colección" id="escenas">
                Iluminación pensada para tres momentos de la casa: leer sin cansar la vista, trabajar
                con foco y ambientar cuando cae el sol.
              </SectionHead>
              <div className="mt-14 grid gap-10 px-5 md:grid-cols-3 md:gap-5 md:px-10">
                {scenes.map(({ p, scene, photo }) => (
                  <Link key={p.slug} href={`/catalogo/${p.slug}`} className="group">
                    <div className="relative aspect-[4/5] overflow-hidden bg-d-surface">
                      <Image
                        src={photo!}
                        alt={`${scene}: ${p.name}`}
                        fill
                        className="d-zoom object-cover"
                        sizes="(min-width: 768px) 33vw, 100vw"
                      />
                    </div>
                    <p className="mt-4 text-[26px] leading-none">
                      {scene}
                      <sup className="ml-0.5 align-super text-xs">
                        {products.filter((x) => (SCENES[x.slug] ?? DEFAULT_EYEBROW) === scene).length}
                      </sup>
                    </p>
                    <p className="mt-2 text-sm text-d-muted">{shortTitle(p.name)}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {featured && (
            <section className="border-t border-d-ink px-5 pb-24 pt-3 md:px-10">
              <div className="grid gap-10 md:grid-cols-[330px_minmax(0,640px)_1fr] md:gap-0">
                <div className="text-sm">
                  <p>Destacado</p>
                  <p className="text-d-muted">01 / {String(products.length).padStart(2, "0")}</p>
                </div>
                <Link href={`/catalogo/${featured.slug}`} className="group relative block aspect-[8/11] overflow-hidden bg-d-surface md:mt-10">
                  {scenePhoto(featured) && (
                    <Image
                      src={scenePhoto(featured)!}
                      alt={featured.name}
                      fill
                      className="d-zoom object-cover"
                      sizes="(min-width: 768px) 640px, 100vw"
                    />
                  )}
                  <span className="absolute left-4 top-4 bg-d-bg px-2.5 py-1.5 text-sm">
                    {shortTitle(featured.name)} — {featured.tagline}
                  </span>
                </Link>
                <Reveal className="flex flex-col gap-6 md:mt-10 md:pl-10">
                  <p className="t-stagger-line text-[18px] leading-[1.35]">{featured.description}</p>
                  {getHeroImageUrl(featured) && (
                    <div className="t-stagger-line t-stagger-line--2 relative aspect-square w-40 overflow-hidden bg-d-surface">
                      <Image src={getHeroImageUrl(featured)!} alt="" fill className={FIT_PRODUCT} sizes="160px" />
                    </div>
                  )}
                  <div className="t-stagger-line t-stagger-line--3">
                    <h2 className="font-d-serif text-[28px] leading-[1.15]">{featured.name}</h2>
                    <p className="mt-1 text-sm text-d-muted">
                      {formatPrice(featured.price)} · {settings.installments}{" "}
                      {settings.installments === 1 ? "cuota" : "cuotas"} sin interés
                    </p>
                  </div>
                  {featured.specs.length > 0 && (
                    <dl className="t-stagger-line t-stagger-line--4 text-sm">
                      {featured.specs.slice(0, 4).map((spec) => (
                        <div key={spec.id} className="flex justify-between gap-4 border-t border-d-line py-2.5">
                          <dt className="text-d-muted">{spec.label}</dt>
                          <dd className="text-right">{spec.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <div className="flex flex-col items-start gap-4">
                    <Link href={`/catalogo/${featured.slug}`} className="d-btn w-full">
                      Ver producto — {formatPrice(featured.price)}
                    </Link>
                    <CtaLink href="/catalogo">Ver todo el catálogo</CtaLink>
                  </div>
                </Reveal>
              </div>
            </section>
          )}

          {setOffer && (
            <section className="pb-24 pt-0">
              <SectionHead label="Sets" id="sets">
                Combiná tres luces, la que quieras de cada una, y llevate el set con descuento.
              </SectionHead>
              <div className="mt-14 grid gap-10 px-5 md:grid-cols-[minmax(0,880px)_1fr] md:gap-10 md:px-10">
                <div className="relative aspect-[4/3] overflow-hidden bg-d-surface md:aspect-auto md:min-h-[680px]">
                  {setPhoto && (
                    <Image
                      src={setPhoto}
                      alt="Las luces del set en uso"
                      fill
                      className="object-cover"
                      sizes="(min-width: 768px) 60vw, 100vw"
                    />
                  )}
                </div>
                <SetPanel offer={setOffer} className="justify-end" />
              </div>
            </section>
          )}

          {quote && (
            <section className="bg-d-surface px-5 py-24 md:px-10 md:py-32">
              <Reveal className="mx-auto max-w-[920px] text-center">
                <p className="t-stagger-line font-d-serif text-[28px] leading-[1.3] md:text-[40px]">
                  &ldquo;{quote.text}&rdquo;
                </p>
                <p className="t-stagger-line t-stagger-line--2 mt-8 text-sm text-d-muted">
                  {quote.author} — {overallRating.toFixed(1).replace(".", ",")} de 5 en {allReviews.length}{" "}
                  reseñas
                </p>
              </Reveal>
            </section>
          )}

          <section className="grid gap-8 border-t border-d-ink px-5 pb-16 pt-3 md:grid-cols-[330px_1fr_1fr_1fr] md:gap-10 md:px-10">
            <p className="text-sm">Servicio</p>
            {[
              {
                title: "Envío a todo el país",
                text: "Despachamos con Correo Argentino a donde estés, en 3 a 5 días hábiles.",
              },
              {
                title: "Pagá como quieras",
                text: `Mercado Pago: tarjeta, dinero en cuenta y hasta ${settings.installments} cuotas sin interés.`,
              },
              {
                title: "Cambios en 30 días",
                text: "Si no es lo que esperabas, escribinos y lo resolvemos.",
              },
            ].map((item) => (
              <div key={item.title} className="text-sm">
                <p>{item.title}</p>
                <p className="mt-1.5 text-d-muted">{item.text}</p>
              </div>
            ))}
          </section>
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
