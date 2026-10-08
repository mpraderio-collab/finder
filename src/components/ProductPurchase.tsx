"use client";

import Image from "next/image";
import { mediaFit } from "@/components/d/media";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addCartItem } from "@/lib/cart-context";
import { trackEvent } from "@/lib/analytics";
import { NotifyStockForm } from "@/components/NotifyStockForm";
import { openCartDrawer } from "@/components/CartDrawer";
import { ProductPhotoTransition } from "@/components/d/PageTransition";
import { formatPrice } from "@/lib/products";
import {
  calculateSingleLineTotal,
  currentPercentOff,
  tierLabel,
  type PromotionInfo,
} from "@/lib/promotions";

type GalleryImage = { id: string; url: string; type: string; showInCarousel?: boolean | null };

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
  const [mobileIndex, setMobileIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const addLabelRef = useRef<HTMLSpanElement>(null);
  const addLabelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buyPanelRef = useRef<HTMLDivElement>(null);
  const mobileTrackRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

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
    setMobileIndex(0);
    mobileTrackRef.current?.scrollTo({ left: 0 });
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
    openCartDrawer();
  }

  function handleBuyNow() {
    addCartItem(buildCartItem(), quantity);
    trackEvent("add_to_cart", { productId, productName: name, value: price });
    router.push("/checkout");
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

  function renderMedia(item: GalleryImage, i: number, sizes: string) {
    if (item.type === "video") {
      return (
        <video
          key={item.id}
          src={item.url}
          controls
          controlsList="nofullscreen noremoteplayback"
          disablePictureInPicture
          playsInline
          className="h-full w-full object-cover"
        />
      );
    }
    return (
      <button
        type="button"
        onClick={() => openLightbox(i)}
        aria-label="Ver foto en pantalla completa"
        className="absolute inset-0 h-full w-full cursor-zoom-in"
      >
        <Image
          src={item.url}
          alt={i === 0 ? name : ""}
          fill
          priority={i === 0}
          className={mediaFit(item)}
          sizes={sizes}
        />
      </button>
    );
  }

  return (
    <div className="grid font-d-sans text-d-ink md:grid-cols-[minmax(0,860fr)_minmax(0,580fr)]">
      {/* Galería: fotos apiladas a sangre en desktop, deslizable en mobile */}
      <div className="relative">
        <div className="hidden flex-col md:flex">
          {gallery.map((item, i) => {
            const media = (
              <div key={item.id} className="relative aspect-[860/1100] w-full overflow-hidden bg-d-surface">
                {renderMedia(item, i, "60vw")}
              </div>
            );
            return i === 0 ? (
              <ProductPhotoTransition key={item.id} slug={slug}>
                {media}
              </ProductPhotoTransition>
            ) : (
              media
            );
          })}
        </div>
        <div className="md:hidden">
          <div
            ref={mobileTrackRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              if (el.clientWidth > 0) setMobileIndex(Math.round(el.scrollLeft / el.clientWidth));
            }}
            className="flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {gallery.map((item, i) => (
              <div key={item.id} className="relative h-full w-full shrink-0 snap-center bg-d-surface">
                {renderMedia(item, i, "(max-width: 767px) 100vw, 1px")}
              </div>
            ))}
          </div>
          {gallery.length > 1 && (
            <p className="px-5 pt-2 text-sm text-d-muted">
              {mobileIndex + 1} / {gallery.length}
            </p>
          )}
        </div>
      </div>

      {/* Columna de compra, fija mientras bajan las fotos */}
      <div className="px-5 pb-12 pt-6 md:px-10 md:pt-8">
        <div className="flex flex-col gap-6 md:sticky md:top-[96px]">
          {aboveActions}

          <div ref={buyPanelRef} className="flex flex-col gap-5">
            <p className="text-sm">
              {formatPrice(price)}
              <span className="text-d-muted">
                {" "}· {installments} {installments === 1 ? "cuota" : "cuotas"} de {formatPrice(installment)} sin
                interés
              </span>
            </p>

            {variants.length > 0 && (
              <div className="flex items-baseline gap-6 border-t border-d-line pt-4 text-sm">
                <span className="w-20 shrink-0 text-d-muted">Color</span>
                <div className="flex flex-wrap gap-5">
                  {variants.map((variant) => (
                    <button
                      key={variant.name}
                      type="button"
                      title={variant.stock <= 0 ? `${variant.name} — sin stock` : variant.name}
                      onClick={() => selectVariant(variant.name)}
                      disabled={variant.stock <= 0}
                      aria-pressed={selectedVariant === variant.name}
                      className={`flex items-center gap-2 underline-offset-4 transition-opacity duration-[var(--d-dur)] ease-[var(--d-ease)] disabled:cursor-not-allowed disabled:line-through disabled:opacity-30 ${
                        selectedVariant === variant.name ? "underline" : "hover:opacity-50"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 rounded-full border border-d-line"
                        style={{ backgroundColor: variant.swatch }}
                      />
                      {variant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-baseline gap-6 border-t border-d-line pt-4 text-sm">
              <span className="w-20 shrink-0 text-d-muted">Cantidad</span>
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={outOfStock}
                  className="d-step d-fade disabled:opacity-30"
                  aria-label="Restar cantidad"
                >
                  −
                </button>
                <span className="min-w-4 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                  disabled={outOfStock || quantity >= maxStock}
                  className="d-step d-fade disabled:opacity-30"
                  aria-label="Sumar cantidad"
                >
                  +
                </button>
              </div>
              {!outOfStock && maxStock <= 5 && (
                <span className="ml-auto text-d-muted">Quedan {maxStock} unidades</span>
              )}
            </div>

            {promotion && currentPercentOff(promotion, price, quantity) > 0 && (
              <p className="text-sm">
                Total: {formatPrice(calculateSingleLineTotal(price, quantity, promotion))}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button type="button" disabled={outOfStock} onClick={handleAddToCart} className="d-btn w-full">
                {outOfStock ? (
                  "Sin stock"
                ) : (
                  <span ref={addLabelRef} className="t-text-swap">
                    Agregar al carrito
                  </span>
                )}
              </button>
              <button type="button" disabled={outOfStock} onClick={handleBuyNow} className="d-btn-outline w-full">
                Comprar ahora con Mercado Pago
              </button>
            </div>

            {outOfStock && <NotifyStockForm productId={productId} productName={name} />}

            {promotion && (
              <div className="border border-d-line px-4 py-3 text-sm">
                {promotion.tiers.map((tier) => (
                  <p key={tier.threshold}>{tierLabel(promotion, tier)}</p>
                ))}
                {promotion.products && promotion.products.length > 1 && (
                  <p className="mt-1 text-d-muted">
                    Se combina con:{" "}
                    {promotion.products
                      .filter((p) => p.id !== productId)
                      .map((p) => p.name)
                      .join(", ")}
                  </p>
                )}
              </div>
            )}

            <p className="text-sm text-d-muted">
              Envío a todo el país · Pagos con Mercado Pago · Cambios en 30 días
            </p>
          </div>

          {belowActions}
        </div>
      </div>

      {showStickyBar && (
        <div className="d-sticky-bar fixed inset-x-0 bottom-0 z-30 border-t border-d-ink bg-d-bg md:hidden">
          <div className="flex items-center gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{name}</p>
              <p className="text-sm text-d-muted">{formatPrice(price)}</p>
            </div>
            <button
              type="button"
              disabled={outOfStock}
              onClick={handleBuyNow}
              className="d-btn shrink-0 px-5"
            >
              {outOfStock ? "Sin stock" : "Comprar ahora"}
            </button>
          </div>
        </div>
      )}

      {lightboxOpen && imageGallery[lightboxIndex] && (
        <div
          className="d-lightbox fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-d-bg p-4 font-d-sans text-d-ink"
          onClick={closeLightbox}
        >
          <button type="button" onClick={closeLightbox} className="d-fade absolute right-5 top-5 z-10 text-sm">
            Cerrar
          </button>

          {imageGallery.length > 1 && (
            <span className="absolute left-5 top-5 z-10 text-sm">
              {lightboxIndex + 1} / {imageGallery.length}
            </span>
          )}

          {imageGallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrevLightbox();
                }}
                aria-label="Foto anterior"
                className="d-fade absolute left-5 top-1/2 z-10 -translate-y-1/2 text-sm"
              >
                ←
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showNextLightbox();
                }}
                aria-label="Foto siguiente"
                className="d-fade absolute right-5 top-1/2 z-10 -translate-y-1/2 text-sm"
              >
                →
              </button>
            </>
          )}

          <div
            className="relative h-full max-h-[80vh] w-full max-w-5xl flex-1"
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
                className="d-light-in object-contain"
                sizes="100vw"
              />
            )}
          </div>
        </div>
      )}

      <style>{`
        .d-sticky-bar { animation: d-bar-in var(--d-dur) var(--d-ease) both; }
        .d-lightbox { animation: d-lightbox-in var(--d-dur) var(--d-ease) both; }
        @keyframes d-bar-in { from { transform: translateY(100%); } }
        @keyframes d-lightbox-in { from { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .d-sticky-bar, .d-lightbox { animation: none; }
        }
      `}</style>
    </div>
  );
}
