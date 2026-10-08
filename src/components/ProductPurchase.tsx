"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, ViewTransition } from "react";
import { useRouter } from "next/navigation";
import { addCartItem } from "@/lib/cart-context";
import { openCartDrawer } from "@/lib/cart-drawer";
import { productImageTransitionName } from "@/components/ProductCard";
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon, PlayIcon } from "@/components/store/Icons";
import { QuantityPill } from "@/components/store/QuantityPill";
import { trackEvent } from "@/lib/analytics";
import { NotifyStockForm } from "@/components/NotifyStockForm";
import { formatPrice } from "@/lib/products";
import {
  calculateSingleLineTotal,
  currentPercentOff,
  tierLabel,
  type PromotionInfo,
} from "@/lib/promotions";

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
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const addLabelRef = useRef<HTMLSpanElement>(null);
  const addLabelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buyPanelRef = useRef<HTMLDivElement>(null);
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

  function openLightbox(index = carouselIndex) {
    const idx = imageGallery.findIndex(
      (img) => img.id === gallery[index]?.id,
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

  // La foto principal del producto (no la de una variante) es la que viaja
  // desde la tarjeta del catálogo en la transición entre páginas.
  const heroUrl = images.find((img) => img.type !== "video")?.url;

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
    swapAddLabel("Agregado");
    openCartDrawer();
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

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] md:gap-10 lg:gap-14">
      {/* Galería: grilla 2x2 en desktop (maap.cc), carrusel con miniaturas en mobile. */}
      <div className="flex flex-col gap-3">
        <div className="hidden grid-cols-2 gap-2 md:grid">
          {gallery.map((img, i) => (
            <div key={img.id} className={i === 0 && gallery.length % 2 === 1 ? "col-span-2" : ""}>
              <GalleryTile
                img={img}
                name={name}
                wide={i === 0 && gallery.length % 2 === 1}
                priority={i === 0}
                transitionName={img.url === heroUrl ? productImageTransitionName(slug) : undefined}
                onOpen={() => openLightbox(i)}
              />
            </div>
          ))}
        </div>
        <div className="md:hidden">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-e-tile">
            {gallery[carouselIndex] && (
              <GalleryTile
                key={gallery[carouselIndex].id}
                img={gallery[carouselIndex]}
                name={name}
                priority
                fill
                onOpen={() => openLightbox()}
              />
            )}
            {gallery.length > 1 && (
              <span className="e-mono absolute right-3 top-3 rounded-[12px] bg-white px-2.5 py-1">
                {carouselIndex + 1} / {gallery.length}
              </span>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {gallery.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setCarouselIndex(i)}
                  aria-label={img.type === "video" ? `Ver video ${i + 1}` : `Ver foto ${i + 1}`}
                  className={`relative h-[72px] w-[60px] shrink-0 overflow-hidden bg-e-tile transition-opacity ${
                    i === carouselIndex ? "opacity-100 outline outline-1 outline-e-ink" : "opacity-55"
                  }`}
                >
                  {img.type === "video" ? (
                    <span className="grid h-full w-full place-items-center text-e-ink">
                      <PlayIcon size={14} />
                    </span>
                  ) : (
                    <Image src={img.url} alt="" fill className="object-cover" sizes="60px" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="md:sticky md:top-24 md:self-start">
        <div className="flex flex-col gap-6">
          {aboveActions}

          <div ref={buyPanelRef} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <span className="text-[22px] tabular-nums">{formatPrice(price)}</span>
              <span className="text-[13px] text-e-muted">
                {installments} {installments === 1 ? "cuota" : "cuotas"} de {formatPrice(installment)} sin interés
              </span>
            </div>

            {promotion && (
              <div className="flex flex-col gap-1 rounded-[16px] bg-e-tile px-4 py-3 text-[13px]">
                {promotion.tiers.map((tier) => (
                  <p key={tier.threshold}>{tierLabel(promotion, tier)}</p>
                ))}
                {promotion.products && promotion.products.length > 1 && (
                  <p className="text-e-muted">
                    Se combina con:{" "}
                    {promotion.products
                      .filter((p) => p.id !== productId)
                      .map((p) => p.name)
                      .join(", ")}
                  </p>
                )}
              </div>
            )}

            {variants.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <p className="e-mono">
                  Color <span className="text-e-muted">— {activeVariant?.name ?? ""}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => {
                    const selected = selectedVariant === variant.name;
                    return (
                      <button
                        key={variant.name}
                        type="button"
                        title={variant.stock <= 0 ? `${variant.name} — sin stock` : variant.name}
                        onClick={() => selectVariant(variant.name)}
                        disabled={variant.stock <= 0}
                        aria-pressed={selected}
                        className={`e-pill border ${
                          selected
                            ? "border-e-ink bg-e-ink text-white"
                            : "border-e-line text-e-ink hover:border-e-ink"
                        } ${variant.stock <= 0 ? "line-through" : ""}`}
                      >
                        <span
                          className="h-3 w-3 rounded-full border border-black/10"
                          style={{ backgroundColor: variant.swatch }}
                        />
                        {variant.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <QuantityPill
                value={quantity}
                onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
                onIncrement={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                canDecrement={!outOfStock && quantity > 1}
                canIncrement={!outOfStock && quantity < maxStock}
              />
              {!outOfStock && maxStock <= 5 && (
                <span className="e-mono text-e-muted">Quedan {maxStock} unidades</span>
              )}
            </div>

            {promotion && currentPercentOff(promotion, price, quantity) > 0 && (
              <p className="text-[13px]">
                Total: {formatPrice(calculateSingleLineTotal(price, quantity, promotion))}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={outOfStock}
                onClick={handleAddToCart}
                className="e-pill e-pill--dark h-12 w-full"
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
                className="e-pill e-pill--outline h-12 w-full"
              >
                Comprar ahora
              </button>
            </div>

            {outOfStock && <NotifyStockForm productId={productId} productName={name} />}

            <p className="e-mono text-e-muted">Envío a todo el país · Mercado Pago · Cambios en 30 días</p>
          </div>

          {belowActions}
        </div>
      </div>

      <div
        data-open={showStickyBar}
        aria-hidden={!showStickyBar}
        className="t-panel-slide fixed inset-x-0 bottom-0 z-30 border-t border-e-line bg-e-bg/95 backdrop-blur"
      >
        <div className="flex items-center gap-3 px-4 py-3 md:px-8">
          <div className="relative hidden h-12 w-10 shrink-0 overflow-hidden bg-e-tile sm:block">
            {cartImage && <Image src={cartImage} alt="" fill className="object-cover" sizes="40px" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px]">{name}</p>
            <p className="text-[13px] tabular-nums text-e-muted">{formatPrice(price)}</p>
          </div>
          <button
            type="button"
            disabled={outOfStock}
            tabIndex={showStickyBar ? 0 : -1}
            onClick={handleAddToCart}
            className="e-pill e-pill--outline hidden shrink-0 sm:inline-flex"
          >
            Agregar al carrito
          </button>
          <button
            type="button"
            disabled={outOfStock}
            tabIndex={showStickyBar ? 0 : -1}
            onClick={() => {
              addCartItem(buildCartItem(), quantity);
              trackEvent("add_to_cart", { productId, productName: name, value: price });
              router.push("/checkout");
            }}
            className="e-pill e-pill--dark shrink-0"
          >
            {outOfStock ? "Sin stock" : "Comprar ahora"}
          </button>
        </div>
      </div>

      {lightboxOpen && imageGallery[lightboxIndex] && (
        <div
          className="e-drawer-overlay fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-black/95 p-4 text-white"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            aria-label="Cerrar"
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <CloseIcon size={18} />
          </button>

          {imageGallery.length > 1 && (
            <span className="e-mono absolute left-4 top-4 z-10 rounded-[12px] bg-white/10 px-3 py-1">
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
              className="absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <ArrowLeftIcon size={18} />
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
              className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <ArrowRightIcon size={18} />
            </button>
          )}

          <div
            className="relative h-full max-h-[75vh] w-full max-w-5xl flex-1"
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
                src={imageGallery[lightboxIndex].url}
                alt={name}
                fill
                className="object-contain"
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
                  className={`relative h-14 w-12 shrink-0 overflow-hidden bg-white/10 transition-opacity ${
                    i === lightboxIndex ? "opacity-100 outline outline-1 outline-white" : "opacity-50"
                  }`}
                >
                  {img.type === "video" ? (
                    <span className="grid h-full w-full place-items-center">
                      <PlayIcon size={12} />
                    </span>
                  ) : (
                    <Image src={img.url} alt="" fill className="object-cover" sizes="48px" />
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

function GalleryTile({
  img,
  name,
  priority,
  fill = false,
  wide = false,
  transitionName,
  onOpen,
}: {
  img: GalleryImage;
  name: string;
  priority: boolean;
  fill?: boolean;
  wide?: boolean;
  transitionName?: string;
  onOpen: () => void;
}) {
  const box = fill
    ? "absolute inset-0"
    : `relative w-full ${wide ? "aspect-[900/760]" : "aspect-[446/560]"}`;
  if (img.type === "video") {
    return (
      <div className={`${box} overflow-hidden bg-e-tile`}>
        <video
          src={img.url}
          controls
          controlsList="nofullscreen noremoteplayback"
          disablePictureInPicture
          playsInline
          className="h-full w-full object-cover"
        />
      </div>
    );
  }
  const image = (
    <Image
      src={img.url}
      alt={name}
      fill
      priority={priority}
      className="object-contain"
      sizes={fill ? "(max-width: 767px) 100vw, 30vw" : wide ? "(min-width: 768px) 60vw, 100vw" : "(min-width: 768px) 30vw, 100vw"}
    />
  );
  // Fotos e infografías se muestran enteras (sin recortar el texto) sobre
  // una versión desenfocada que llena el tile.
  const backdrop = (
    <Image
      src={img.url}
      alt=""
      aria-hidden
      fill
      className="scale-125 object-cover opacity-40 blur-2xl"
      sizes="120px"
    />
  );
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Ver foto en pantalla completa"
      className={`${box} cursor-zoom-in overflow-hidden bg-e-tile`}
    >
      {backdrop}
      {transitionName ? (
        <ViewTransition name={transitionName} share="e-morph" default="none">
          {image}
        </ViewTransition>
      ) : (
        image
      )}
    </button>
  );
}
