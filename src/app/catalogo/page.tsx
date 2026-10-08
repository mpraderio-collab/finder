/// <reference types="react/canary" />
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { StoreMain } from "@/components/store/StoreMain";
import { Reveal } from "@/components/store/Reveal";
import { StarIcon, ArrowRight } from "@/components/store/Icons";
import {
  contextPhoto,
  groupByScene,
  productTransitionName,
} from "@/components/store/scenes";
import {
  averageRating,
  formatPrice,
  getActiveProducts,
  getHeroImageUrl,
  type ProductWithRelations,
} from "@/lib/products";
import { activePromotion, maxPercentOff } from "@/lib/promotions";
import { getSiteSettings } from "@/lib/settings";
import { isAmbienceImage, productImageFit } from "@/components/store/productImage";

export const metadata: Metadata = {
  title: "Catálogo — Finder",
  description: "Descubrí toda la iluminación moderna que importa Finder.",
};

export default async function CatalogoPage() {
  const [products, settings] = await Promise.all([getActiveProducts(), getSiteSettings()]);
  const { scenes, others } = groupByScene(products);

  const promo = products.map(activePromotion).find((p) => p && p.tiers.length > 0) ?? null;
  const firstTier = promo?.tiers[0];
  const packTotal = scenes.reduce((sum, s) => sum + s.product.price, 0);
  const showPack =
    promo?.triggerType === "quantity" && firstTier && scenes.length >= firstTier.threshold;

  return (
    <>
      <Header />
      <StoreMain>
        <section className="mx-auto max-w-[1440px] px-6 pb-10 pt-14 md:px-16 md:pb-14 md:pt-24">
          <Reveal className="flex flex-col gap-8">
            <p className="t-stagger-line t-stagger-line--1 b-eyebrow">Catálogo</p>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <h1 className="t-stagger-line t-stagger-line--2 max-w-[760px] font-serif text-[44px]/[1] font-medium tracking-[-0.02em] md:text-[72px]/[1]">
                ¿Qué vas a hacer con la luz?
              </h1>
              <p className="t-stagger-line t-stagger-line--3 max-w-[380px] text-[17px]/[1.6] text-taupe">
                {products.length === 1 ? "Un producto" : `${products.length} productos`}, ordenados
                por el momento en que los vas a usar.
              </p>
            </div>
          </Reveal>

          {scenes.length > 0 && (
            <nav
              aria-label="Ir a una escena"
              className="mt-10 grid border-y border-espresso sm:grid-cols-3"
            >
              {scenes.map(({ scene }, i) => (
                <a
                  key={scene.id}
                  href={`#${scene.id}`}
                  className={`group flex items-center justify-between px-5 py-5 transition-colors duration-500 hover:bg-sand md:px-6 ${
                    i < scenes.length - 1 ? "border-b border-linen sm:border-b-0 sm:border-r" : ""
                  }`}
                >
                  <span className="flex items-baseline gap-3.5">
                    <span className="font-serif text-[15px] text-clay-ink">{scene.number}</span>
                    <span className="font-serif text-[26px] leading-none">{scene.name}</span>
                  </span>
                  <span className="flex items-center gap-2 text-sm text-taupe">
                    1 producto
                    <ArrowRight size={14} className="b-arrow rotate-90" />
                  </span>
                </a>
              ))}
            </nav>
          )}
        </section>

        {products.length === 0 && (
          <p className="mx-auto max-w-[1440px] px-6 pb-24 text-taupe md:px-16">
            Todavía no hay productos publicados.
          </p>
        )}

        {scenes.map(({ scene, product }, i) => {
          const photo = contextPhoto(product);
          const flipped = i % 2 === 1;
          return (
            <section
              key={scene.id}
              id={scene.id}
              className="mx-auto max-w-[1440px] scroll-mt-28 px-6 pb-20 pt-10 md:px-16 md:pb-24 md:pt-16"
            >
              <Reveal className="flex flex-wrap items-end justify-between gap-3 border-b border-linen pb-5">
                <h2 className="t-stagger-line t-stagger-line--1 flex items-baseline gap-4">
                  <span className="font-serif text-xl text-clay-ink">{scene.number}</span>
                  <span className="font-serif text-[44px]/[1] font-medium tracking-[-0.02em] md:text-[56px]/[1]">
                    {scene.name}
                  </span>
                </h2>
                <p className="t-stagger-line t-stagger-line--2 font-serif text-lg text-taupe md:text-[22px]">
                  {scene.line}
                </p>
              </Reveal>

              <div
                className={`mt-8 grid grid-cols-1 gap-8 ${
                  flipped
                    ? "lg:grid-cols-[minmax(0,440fr)_minmax(0,840fr)]"
                    : "lg:grid-cols-[minmax(0,840fr)_minmax(0,440fr)]"
                }`}
              >
                <div
                  className={`relative min-h-[360px] overflow-hidden bg-sand lg:min-h-[600px] ${flipped ? "lg:order-2" : ""}`}
                >
                  {photo && (
                    <Image
                      src={photo}
                      alt={`${product.name} en uso`}
                      fill
                      sizes="(min-width: 1024px) 60vw, 100vw"
                      className="object-cover"
                    />
                  )}
                  <span className="absolute bottom-6 left-6 text-sm font-medium text-cream [text-shadow:0_1px_8px_rgba(31,24,19,0.6)]">
                    Así se ve en uso
                  </span>
                </div>
                <ProductPanel product={product} installments={settings.installments} />
              </div>
            </section>
          );
        })}

        {others.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-6 pb-24 md:px-16">
            <h2 className="border-b border-linen pb-5 font-serif text-[44px] font-medium">
              Más luces
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </section>
        )}

        {showPack && firstTier && (
          <section className="bg-sand">
            <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-14 md:flex-row md:items-center md:justify-between md:px-16">
              <div>
                <p className="font-serif text-[30px]/[1.15] font-medium md:text-[36px]">
                  {scenes.map((s) => s.scene.name).join(" + ")}
                </p>
                <p className="mt-2 text-base text-taupe">
                  Las {scenes.length === 3 ? "tres" : scenes.length} escenas por{" "}
                  {formatPrice(Math.round(packTotal * (1 - firstTier.percentOff / 100)))} en lugar de{" "}
                  {formatPrice(packTotal)} — llevando {firstTier.threshold} pagás {firstTier.percentOff}% menos.
                </p>
              </div>
              <a href={`#${scenes[0].scene.id}`} className="b-btn b-btn-ink shrink-0">
                Armar el pack
                <ArrowRight size={16} className="b-arrow" />
              </a>
            </div>
          </section>
        )}
      </StoreMain>
      <Footer />
    </>
  );
}

function ProductPanel({
  product,
  installments,
}: {
  product: ProductWithRelations;
  installments: number;
}) {
  const heroUrl = getHeroImageUrl(product);
  const rating = averageRating(product.reviews);
  const promo = activePromotion(product);
  const totalStock =
    product.variants.length > 0
      ? product.variants.reduce((sum, v) => sum + v.stock, 0)
      : product.stock;
  const outOfStock = totalStock <= 0;
  const href = `/catalogo/${product.slug}`;

  return (
    <div className="flex flex-col justify-between gap-8">
      <Link href={href} transitionTypes={["nav-forward"]} className="group flex flex-col gap-4">
        <div className="relative aspect-[440/280] overflow-hidden bg-sand">
          {heroUrl && (
            <ViewTransition name={productTransitionName(product.slug)} share="morph" default="none">
              <Image
                src={heroUrl}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 30vw, 100vw"
                className={`b-zoom ${productImageFit(isAmbienceImage(product.images, heroUrl))}`}
              />
            </ViewTransition>
          )}
          {(outOfStock || promo) && (
            <span className="absolute left-3 top-3 bg-cream px-2.5 py-1.5 text-xs font-semibold text-espresso">
              {outOfStock ? "Sin stock" : `Hasta ${maxPercentOff(promo!)}% off`}
            </span>
          )}
        </div>
        <h3 className="font-serif text-[26px]/[1.15] font-medium">{product.name}</h3>
        <p className="text-[15px]/[1.55] text-taupe">{product.tagline}</p>
        {product.reviews.length > 0 && (
          <p className="flex items-center gap-2 text-sm text-taupe">
            <StarIcon size={14} className="text-clay" />
            {rating.toFixed(1).replace(".", ",")} · {product.reviews.length} reseñas
          </p>
        )}
      </Link>

      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-serif text-[32px] leading-none">{formatPrice(product.price)}</p>
            <p className="mt-2 text-sm text-taupe">
              {installments} {installments === 1 ? "cuota" : "cuotas"} sin interés
            </p>
          </div>
          {product.variants.length > 0 && (
            <p className="text-sm text-taupe">{product.variants.length} colores</p>
          )}
        </div>
        <Link
          href={href}
          transitionTypes={["nav-forward"]}
          className={`b-btn w-full ${outOfStock ? "b-btn-outline" : "b-btn-clay"}`}
        >
          {outOfStock ? "Avisame cuando vuelva" : "Elegir y comprar"}
          <ArrowRight size={16} className="b-arrow" />
        </Link>
      </div>
    </div>
  );
}
