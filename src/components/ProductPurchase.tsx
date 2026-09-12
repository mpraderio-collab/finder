"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addCartItem } from "@/lib/cart-context";
import { trackEvent } from "@/lib/analytics";
import { NotifyStockForm } from "@/components/NotifyStockForm";
import { formatPrice } from "@/lib/products";
import { calculateLineTotal, promoSavings, type Promo } from "@/lib/promotions";

type GalleryImage = { id: string; url: string; type: string };

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
  promo,
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
  promo: Promo | null;
  aboveActions?: React.ReactNode;
  belowActions?: React.ReactNode;
}) {
  const router = useRouter();
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(
    variants[0]?.name,
  );
  const [quantity, setQuantity] = useState(1);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const addLabelRef = useRef<HTMLSpanElement>(null);
  const addLabelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buyPanelRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

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

  // El lightbox navega solo entre fotos — un video no se agranda igual.
  const imageGallery = useMemo(
    () => gallery.filter((g) => g.type !== "video"),
    [gallery],
  );

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

  function openLightbox() {
    const idx = imageGallery.findIndex(
      (img) => img.id === gallery[carouselIndex]?.id,
    );
    setLightboxIndex(idx === -1 ? 0 : idx);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
    // Al cerrar, la miniatura seleccionada abajo sigue a la última foto vista.
    const shown = imageGallery[lightboxIndex];
    if (!shown) return;
    const galleryIdx = gallery.findIndex((img) => img.id === shown.id);
    if (galleryIdx !== -1) setCarouselIndex(galleryIdx);
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
    setCarouselIndex(0);
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
    swapAddLabel("¡Agregado! ✓");
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
      promoQuantity: promo?.promoQuantity,
      promoPrice: promo?.promoPrice,
    };
  }

  return (
    <div className="grid gap-11 md:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-line bg-surface">
          {gallery[carouselIndex] &&
            (gallery[carouselIndex].type === "video" ? (
              <video
                key={gallery[carouselIndex].id}
                src={gallery[carouselIndex].url}
                controls
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <button
                type="button"
                onClick={openLightbox}
                aria-label="Ver foto en pantalla completa"
                className="absolute inset-0 h-full w-full cursor-zoom-in"
              >
                <Image
                  src={gallery[carouselIndex].url}
                  alt={name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </button>
            ))}
        </div>
        {gallery.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {gallery.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setCarouselIndex(i)}
                aria-label={
                  img.type === "video" ? `Ver video ${i + 1}` : `Ver foto ${i + 1}`
                }
                className={`relative aspect-square overflow-hidden rounded-[10px] border-2 bg-surface transition-colors ${
                  i === carouselIndex ? "border-navy" : "border-line"
                }`}
              >
                {img.type === "video" ? (
                  <>
                    <video
                      src={img.url}
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-ink/20 text-lg text-white">
                      ▶
                    </span>
                  </>
                ) : (
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="150px"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5">
        {aboveActions}

        <div
          ref={buyPanelRef}
          className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-[22px]"
        >
          <div className="flex items-baseline gap-3.5">
            <span className="font-heading text-[34px] font-extrabold text-navy">
              {formatPrice(price)}
            </span>
            <span className="text-[13px] text-ink-soft">
              {installments} {installments === 1 ? "cuota" : "cuotas"} de{" "}
              {formatPrice(installment)}
            </span>
          </div>

          {promo && (
            <p className="w-fit rounded-lg bg-amber-soft px-3 py-2 text-[13px] font-semibold text-amber-ink">
              Llevando {promo.promoQuantity}, pagás {formatPrice(promo.promoPrice)}
              {" "}
              <span className="font-normal">
                (ahorrás {formatPrice(promoSavings(price, promo))})
              </span>
            </p>
          )}

          {variants.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-ink">
                Color — {activeVariant?.name ?? ""}
              </p>
              <div className="mt-2.5 flex gap-2.5">
                {variants.map((variant) => (
                  <button
                    key={variant.name}
                    type="button"
                    title={
                      variant.stock <= 0
                        ? `${variant.name} — sin stock`
                        : variant.name
                    }
                    onClick={() => selectVariant(variant.name)}
                    disabled={variant.stock <= 0}
                    className={`relative h-[46px] w-[46px] overflow-hidden rounded-full border-2 transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                      selectedVariant === variant.name
                        ? "border-amber"
                        : "border-border-input"
                    }`}
                    style={{ backgroundColor: variant.swatch }}
                  >
                    {(() => {
                      const avatarUrl = variant.images.find(
                        (img) => img.type !== "video",
                      )?.url;
                      return (
                        avatarUrl && (
                          <Image
                            src={avatarUrl}
                            alt={variant.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        )
                      );
                    })()}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-border-input bg-bg">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={outOfStock}
                className="px-3 py-2 text-ink-soft hover:text-navy disabled:opacity-30"
                aria-label="Restar cantidad"
              >
                −
              </button>
              <span className="min-w-8 text-center font-heading text-sm font-bold text-ink">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                disabled={outOfStock || quantity >= maxStock}
                className="px-3 py-2 text-ink-soft hover:text-navy disabled:opacity-30"
                aria-label="Sumar cantidad"
              >
                +
              </button>
            </div>
            {!outOfStock && maxStock <= 5 && (
              <span className="text-[13px] font-semibold text-amber-ink">
                Quedan {maxStock} unidades
              </span>
            )}
          </div>

          {promo && quantity >= promo.promoQuantity && (
            <p className="text-[13px] font-semibold text-navy">
              Total: {formatPrice(calculateLineTotal(price, quantity, promo))}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={outOfStock}
              onClick={handleAddToCart}
              className="flex-1 rounded-lg border border-navy bg-bg px-6 py-3.5 font-heading text-sm font-bold text-navy transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:border-line disabled:text-ink-faint"
            >
              {outOfStock ? (
                "Sin stock"
              ) : (
                <span ref={addLabelRef} className="t-text-swap">
                  Agregar al carrito
                </span>
              )}
            </button>
            <button
              type="button"
              disabled={outOfStock}
              onClick={() => {
                addCartItem(buildCartItem(), quantity);
                trackEvent("add_to_cart", { productId, productName: name, value: price });
                router.push("/checkout");
              }}
              className="flex-1 rounded-lg bg-navy px-6 py-3.5 font-heading text-sm font-bold text-white transition-colors hover:bg-navy-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint"
            >
              Comprar ahora
            </button>
          </div>

          {outOfStock && (
            <NotifyStockForm productId={productId} productName={name} />
          )}

          <p className="text-xs text-ink-faint">
            Envío a todo el país · Pagos con Mercado Pago · Cambios en 30
            días
          </p>
        </div>

        {belowActions}
      </div>

      {showStickyBar && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
            <div className="relative hidden h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface sm:block">
              {cartImage && (
                <Image
                  src={cartImage}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-sm font-bold text-navy">
                {name}
              </p>
              <p className="font-heading text-base font-extrabold text-navy">
                {formatPrice(price)}
              </p>
            </div>
            <button
              type="button"
              disabled={outOfStock}
              onClick={handleAddToCart}
              className="hidden shrink-0 rounded-lg border border-navy px-4 py-2.5 font-heading text-sm font-bold text-navy transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:border-line disabled:text-ink-faint sm:inline-block"
            >
              Agregar al carrito
            </button>
            <button
              type="button"
              disabled={outOfStock}
              onClick={() => {
                addCartItem(buildCartItem(), quantity);
                trackEvent("add_to_cart", { productId, productName: name, value: price });
                router.push("/checkout");
              }}
              className="shrink-0 rounded-lg bg-navy px-5 py-2.5 font-heading text-sm font-bold text-white transition-colors hover:bg-navy-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint"
            >
              {outOfStock ? "Sin stock" : "Comprar ahora"}
            </button>
          </div>
        </div>
      )}

      {lightboxOpen && imageGallery[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-ink/90 p-4"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            aria-label="Cerrar"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white hover:bg-white/20"
          >
            ×
          </button>

          {imageGallery.length > 1 && (
            <span className="absolute left-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              {lightboxIndex + 1} / {imageGallery.length}
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
              className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white hover:bg-white/20"
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
              className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white hover:bg-white/20"
            >
              ›
            </button>
          )}

          <div
            className="relative h-full max-h-[75vh] w-full max-w-5xl flex-1"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleLightboxTouchStart}
            onTouchEnd={handleLightboxTouchEnd}
          >
            <Image
              src={imageGallery[lightboxIndex].url}
              alt={name}
              fill
              className="object-contain"
              sizes="100vw"
            />
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
                  aria-label={`Ver foto ${i + 1}`}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-surface transition-colors ${
                    i === lightboxIndex ? "border-amber" : "border-white/20"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
