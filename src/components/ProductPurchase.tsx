"use client";

/// <reference types="react/canary" />
import Image from "next/image";
import { ViewTransition, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addCartItem } from "@/lib/cart-context";
import { trackEvent } from "@/lib/analytics";
import { NotifyStockForm } from "@/components/NotifyStockForm";
import { formatPrice } from "@/lib/products";
import { CloseIcon, PlayIcon } from "@/components/store/Icons";
import { usePresence } from "@/components/store/usePresence";
import { productTransitionName } from "@/components/store/scenes";
import { packshotThumbFit, productImageFit } from "@/components/store/productImage";
import {
  calculateSingleLineTotal,
  currentPercentOff,
  type PromotionInfo,
} from "@/lib/promotions";

type GalleryImage = { id: string; url: string; type: string; showInCarousel?: boolean };

type Variant = {
  name: string;
  swatch: string;
  stock: number;
  images: GalleryImage[];
};

export function ProductPurchase({
  productId,
  slug,
  name,
  price,
  stock,
  variants,
  images,
  installments,
  promotion,
  aboveActions,
  belowActions,
}: {
  productId: string;
  slug: string;
  name: string;
  price: number;
  stock: number;
  variants: Variant[];
  images: GalleryImage[];
  installments: number;
  promotion: PromotionInfo | null;
  aboveActions?: React.ReactNode;
  belowActions?: React.ReactNode;
}) {
  const router = useRouter();
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(
    variants[0]?.name,
  );
  const [quantity, setQuantity] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const addLabelRef = useRef<HTMLSpanElement>(null);
  const addLabelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buyPanelRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  // Duración de cierre del modal (--modal-close-dur).
  const lightbox = usePresence(lightboxOpen, 150);

  // Avisa al botón flotante de WhatsApp que hay una barra de compra fija
  // abajo, para que se suba y no tape el botón Comprar.
  useEffect(() => {
    if (!showStickyBar) return;
    document.body.setAttribute("data-sticky-bar", "");
    return () => document.body.removeAttribute("data-sticky-bar");
  }, [showStickyBar]);

  useEffect(() => {
    trackEvent("view_content", { productId, productName: name, value: price });
    // Solo al montar: no queremos re-disparar el evento si el usuario
    // solo cambia de color o cantidad en la misma página de producto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const activeVariant = variants.find((v) => v.name === selectedVariant);

  // Si la variante elegida tiene sus propias fotos, la galería muestra
  // solo esas; si no tiene ninguna, se ven las fotos generales del producto.
  const gallery = useMemo(() => {
    if (activeVariant && activeVariant.images.length > 0) return activeVariant.images;
    return images;
  }, [activeVariant, images]);

  // El carrito y el resumen del pedido necesitan una imagen real, nunca un video.
  const cartImage = gallery.find((g) => g.type !== "video")?.url;

  // El lightbox navega por toda la galería, fotos y video incluido.
  const imageGallery = gallery;

  const maxStock = variants.length === 0 ? stock : (activeVariant?.stock ?? 0);
  const outOfStock = maxStock <= 0;
  const installment = Math.round(price / installments);

  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") showPrevLightbox();
      else if (e.key === "ArrowRight") showNextLightbox();
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, lightboxIndex, imageGallery.length]);

  // Barra flotante de compra: aparece cuando el panel principal ya salió
  // de la vista por scroll, para no perder la conversión en páginas largas.
  useEffect(() => {
    const el = buyPanelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { rootMargin: "-72px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // La galería muestra todas las fotos a la vez: el lightbox abre en la
  // que se tocó.
  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
  }

  function showPrevLightbox() {
    setLightboxIndex((i) => (i - 1 + imageGallery.length) % imageGallery.length);
  }

  function showNextLightbox() {
    setLightboxIndex((i) => (i + 1) % imageGallery.length);
  }

  const touchStartX = useRef<number | null>(null);

  function handleLightboxTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleLightboxTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return; // toque corto, no fue swipe
    if (delta > 0) showPrevLightbox();
    else showNextLightbox();
  }

  function selectVariant(name: string) {
    setSelectedVariant(name);
    setQuantity(1);
  }

  // Swap the "Agregar al carrito" label to a confirmation and back, per
  // transitions-dev's text-states-swap (see globals.css for .t-text-swap).
  function swapAddLabel(next: string) {
    const el = addLabelRef.current;
    if (!el) return;
    // getComputedStyle normalizes CSS <time> values to seconds (e.g. "0.2s"),
    // not the "200ms" the raw custom property was written as — parseFloat
    // alone silently reads that as 0.2ms. Convert explicitly.
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--text-swap-dur")
      .trim();
    const dur = raw.endsWith("ms")
      ? parseFloat(raw)
      : parseFloat(raw) * 1000 || 200;
    el.classList.add("is-exit");
    setTimeout(() => {
      el.textContent = next;
      el.classList.remove("is-exit");
      el.classList.add("is-enter-start");
      void el.offsetHeight; // reflow so the re-entry transitions
      el.classList.remove("is-enter-start");
    }, dur);
  }

  function handleAddToCart() {
    addCartItem(buildCartItem(), quantity);
    trackEvent("add_to_cart", { productId, productName: name, value: price });
    if (addLabelTimeoutRef.current) clearTimeout(addLabelTimeoutRef.current);
    swapAddLabel("Agregado al carrito");
    addLabelTimeoutRef.current = setTimeout(
      () => swapAddLabel("Agregar al carrito"),
      2000,
    );
  }

  function buildCartItem() {
    return {
      productId,
      slug,
      name,
      price,
      image: cartImage,
      variantName: selectedVariant,
      maxStock,
      promotion,
    };
  }

  const promoTotal =
    promotion && currentPercentOff(promotion, price, quantity) > 0
      ? calculateSingleLineTotal(price, quantity, promotion)
      : null;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,768fr)_minmax(0,480fr)] lg:gap-16">
      {/* Galería: en escritorio las fotos se apilan (la primera grande, después
          de a pares); en mobile es un carrusel horizontal con snap. */}
      <div
        key={selectedVariant ?? "all"}
        className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 [scrollbar-width:none] lg:mx-0 lg:grid lg:snap-none lg:grid-cols-2 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {gallery.map((img, i) => {
          const isFirst = i === 0;
          // La última foto queda sola a lo ancho si el resto no forma pares.
          const isWide = isFirst || (i === gallery.length - 1 && (gallery.length - 1) % 2 === 1);
          const frame = `relative w-[85%] shrink-0 snap-center overflow-hidden bg-sand lg:w-auto ${
            isWide ? "aspect-[4/5] lg:col-span-2 lg:aspect-[768/720]" : "aspect-[4/5] lg:aspect-[378/420]"
          }`;
          if (img.type === "video") {
            return (
              <div key={img.id} className={frame}>
                <video
                  src={img.url}
                  controls
                  controlsList="nofullscreen noremoteplayback"
                  disablePictureInPicture
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              </div>
            );
          }
          const photo = (
            <Image
              src={img.url}
              alt={isFirst ? name : `${name} — foto ${i + 1}`}
              fill
              priority={isFirst}
              className={`b-photo-fade b-zoom ${productImageFit(img.showInCarousel)}`}
              sizes={isWide ? "(min-width: 1024px) 55vw, 85vw" : "(min-width: 1024px) 27vw, 85vw"}
            />
          );
          return (
            <button
              key={img.id}
              type="button"
              onClick={() => openLightbox(i)}
              aria-label={`Ver foto ${i + 1} en pantalla completa`}
              className={`group cursor-zoom-in ${frame}`}
            >
              {isFirst ? (
                <ViewTransition name={productTransitionName(slug)} share="morph" default="none">
                  {photo}
                </ViewTransition>
              ) : (
                photo
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-7 lg:sticky lg:top-28 lg:self-start">
        {aboveActions}

        <div ref={buyPanelRef} className="flex flex-col gap-7">
          <div className="border-b border-linen pb-6">
            <p className="font-serif text-[40px] leading-none">{formatPrice(price)}</p>
            <p className="mt-2 text-sm text-taupe">
              {installments} {installments === 1 ? "cuota" : "cuotas"} sin interés de{" "}
              {formatPrice(installment)} con Mercado Pago
            </p>
            {promoTotal !== null && (
              <p className="mt-2 text-sm font-semibold text-clay-ink">
                Total con promo: {formatPrice(promoTotal)}
              </p>
            )}
          </div>

          {variants.length > 0 && (
            <div>
              <p className="text-sm font-medium">
                Color — <span className="t-text-swap">{activeVariant?.name ?? ""}</span>
              </p>
              <div className="mt-3 flex gap-3">
                {variants.map((variant) => {
                  const avatarUrl = variant.images.find((img) => img.type !== "video")?.url;
                  const selected = selectedVariant === variant.name;
                  return (
                    <button
                      key={variant.name}
                      type="button"
                      title={variant.stock <= 0 ? `${variant.name} — sin stock` : variant.name}
                      aria-label={variant.stock <= 0 ? `${variant.name}, sin stock` : variant.name}
                      aria-pressed={selected}
                      onClick={() => selectVariant(variant.name)}
                      disabled={variant.stock <= 0}
                      className={`relative h-9 w-9 rounded-full p-[3px] ring-1 transition-[box-shadow] duration-300 disabled:cursor-not-allowed disabled:opacity-30 ${
                        selected ? "ring-espresso" : "ring-transparent hover:ring-linen"
                      }`}
                    >
                      <span
                        className="relative block h-full w-full overflow-hidden rounded-full border border-espresso/15"
                        style={{ backgroundColor: variant.swatch }}
                      >
                        {avatarUrl && (
                          <Image src={avatarUrl} alt="" fill className="object-cover" sizes="36px" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex shrink-0 items-center border border-linen">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={outOfStock}
                  className="h-full px-4 text-lg text-taupe transition-colors hover:text-espresso disabled:opacity-30"
                  aria-label="Restar cantidad"
                >
                  −
                </button>
                <span className="min-w-6 text-center tabular-nums" aria-live="polite">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                  disabled={outOfStock || quantity >= maxStock}
                  className="h-full px-4 text-lg text-taupe transition-colors hover:text-espresso disabled:opacity-30"
                  aria-label="Sumar cantidad"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                disabled={outOfStock}
                onClick={handleAddToCart}
                className="b-btn b-btn-clay flex-1"
              >
                {outOfStock ? (
                  "Sin stock"
                ) : (
                  <span ref={addLabelRef} className="t-text-swap">
                    Agregar al carrito
                  </span>
                )}
              </button>
            </div>
            <button
              type="button"
              disabled={outOfStock}
              onClick={() => {
                addCartItem(buildCartItem(), quantity);
                trackEvent("add_to_cart", { productId, productName: name, value: price });
                router.push("/checkout");
              }}
              className="b-btn b-btn-outline w-full"
            >
              Comprar ahora
            </button>
            {!outOfStock && maxStock <= 5 && (
              <p className="text-sm text-clay-ink">Quedan {maxStock} unidades</p>
            )}
          </div>

          {outOfStock && <NotifyStockForm productId={productId} productName={name} />}

        </div>

        {belowActions}
      </div>

      {/* Barra de compra fija: entra desde abajo cuando el panel principal
          sale de la vista (transitions-dev "panel reveal"). */}
      <div
        data-open={showStickyBar}
        aria-hidden={!showStickyBar}
        className="t-panel-slide store fixed inset-x-0 bottom-0 z-30 border-t border-linen bg-cream/95 backdrop-blur [--panel-translate-y:100%]"
      >
        <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-6 py-3 md:px-16">
          <div className="relative hidden h-12 w-12 shrink-0 overflow-hidden bg-sand sm:block">
            {cartImage && <Image src={cartImage} alt="" fill className={packshotThumbFit} sizes="48px" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-[17px]">{name}</p>
            <p className="text-sm text-taupe">{formatPrice(price)}</p>
          </div>
          <button
            type="button"
            tabIndex={showStickyBar ? 0 : -1}
            disabled={outOfStock}
            onClick={handleAddToCart}
            className="b-btn b-btn-outline hidden shrink-0 !py-3 sm:inline-flex"
          >
            Agregar al carrito
          </button>
          <button
            type="button"
            tabIndex={showStickyBar ? 0 : -1}
            disabled={outOfStock}
            onClick={() => {
              addCartItem(buildCartItem(), quantity);
              trackEvent("add_to_cart", { productId, productName: name, value: price });
              router.push("/checkout");
            }}
            className="b-btn b-btn-clay shrink-0 !py-3"
          >
            {outOfStock ? "Sin stock" : "Comprar ahora"}
          </button>
        </div>
      </div>

      {lightbox.mounted && imageGallery[lightboxIndex] && (
        <div
          className={`t-scrim store fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-night/95 p-4 ${lightbox.visible ? "is-open" : ""}`}
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`${name} — fotos`}
        >
          <button
            type="button"
            onClick={closeLightbox}
            aria-label="Cerrar"
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-cream/25 text-cream transition-colors hover:border-cream"
          >
            <CloseIcon size={20} />
          </button>

          {imageGallery.length > 1 && (
            <span className="absolute left-5 top-6 z-10 font-serif text-lg tabular-nums text-cream">
              {lightboxIndex + 1} <span className="text-cream/50">/ {imageGallery.length}</span>
            </span>
          )}

          {imageGallery.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                showPrevLightbox();
              }}
              aria-label="Foto anterior"
              className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-cream/25 text-xl text-cream transition-colors hover:border-cream"
            >
              ‹
            </button>
          )}
          {imageGallery.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                showNextLightbox();
              }}
              aria-label="Foto siguiente"
              className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-cream/25 text-xl text-cream transition-colors hover:border-cream"
            >
              ›
            </button>
          )}

          <div
            className={`t-modal relative h-full max-h-[75vh] w-full max-w-5xl flex-1 ${lightbox.visible ? "is-open" : "is-closing"}`}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleLightboxTouchStart}
            onTouchEnd={handleLightboxTouchEnd}
          >
            {imageGallery[lightboxIndex].type === "video" ? (
              <video
                key={imageGallery[lightboxIndex].id}
                src={imageGallery[lightboxIndex].url}
                controls
                controlsList="nofullscreen noremoteplayback"
                disablePictureInPicture
                playsInline
                className="h-full w-full object-contain"
              />
            ) : (
              <Image
                key={imageGallery[lightboxIndex].id}
                src={imageGallery[lightboxIndex].url}
                alt={name}
                fill
                className="b-photo-fade object-contain"
                sizes="100vw"
              />
            )}
          </div>

          {imageGallery.length > 1 && (
            <div
              className="flex w-full max-w-xl shrink-0 justify-center gap-2 overflow-x-auto pb-1"
              onClick={(e) => e.stopPropagation()}
            >
              {imageGallery.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  aria-label={img.type === "video" ? `Ver video ${i + 1}` : `Ver foto ${i + 1}`}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden border transition-[border-color,opacity] duration-300 ${
                    i === lightboxIndex ? "border-cream" : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  {img.type === "video" ? (
                    <span className="grid h-full w-full place-items-center bg-cream/10 text-cream">
                      <PlayIcon size={14} />
                    </span>
                  ) : (
                    <Image src={img.url} alt="" fill className="object-cover" sizes="56px" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
