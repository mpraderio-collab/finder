"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addCartItem } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";

type Variant = {
  name: string;
  swatch: string;
  stock: number;
  imageUrl: string | null;
};

type GalleryImage = { id: string; url: string; type: string };

export function ProductPurchase({
  productId,
  slug,
  name,
  price,
  stock,
  variants,
  images,
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
  aboveActions?: React.ReactNode;
  belowActions?: React.ReactNode;
}) {
  const router = useRouter();
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(
    variants[0]?.name,
  );
  const [quantity, setQuantity] = useState(1);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const addLabelRef = useRef<HTMLSpanElement>(null);
  const addLabelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeVariant = variants.find((v) => v.name === selectedVariant);

  // La galería muestra la foto propia de la variante primero (si tiene una
  // cargada); el resto de las fotos generales del producto siguen abajo.
  const gallery = useMemo(() => {
    if (!activeVariant?.imageUrl) return images;
    const rest = images.filter((img) => img.url !== activeVariant.imageUrl);
    return [
      { id: `variant-${activeVariant.name}`, url: activeVariant.imageUrl, type: "image" },
      ...rest,
    ];
  }, [activeVariant, images]);

  // El carrito y el resumen del pedido necesitan una imagen real, nunca un video.
  const cartImage = gallery.find((g) => g.type !== "video")?.url;

  const maxStock = variants.length === 0 ? stock : (activeVariant?.stock ?? 0);
  const outOfStock = maxStock <= 0;
  const installment = Math.round(price / 6);

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
              <Image
                src={gallery[carouselIndex].url}
                alt={name}
                fill
                priority
                className="object-cover"
                sizes="(min-width: 768px) 50vw, 100vw"
              />
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

        <div className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-[22px]">
          <div className="flex items-baseline gap-3.5">
            <span className="font-heading text-[34px] font-extrabold text-navy">
              {formatPrice(price)}
            </span>
            <span className="text-[13px] text-ink-soft">
              6 cuotas de {formatPrice(installment)}
            </span>
          </div>

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
                    {variant.imageUrl && (
                      <Image
                        src={variant.imageUrl}
                        alt={variant.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    )}
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
                router.push("/checkout");
              }}
              className="flex-1 rounded-lg bg-navy px-6 py-3.5 font-heading text-sm font-bold text-white transition-colors hover:bg-navy-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint"
            >
              Comprar ahora
            </button>
          </div>

          <p className="text-xs text-ink-faint">
            Envío a todo el país · Pagos con Mercado Pago · Cambios en 30
            días
          </p>
        </div>

        {belowActions}
      </div>
    </div>
  );
}
