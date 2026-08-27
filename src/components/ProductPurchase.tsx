"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addCartItem } from "@/lib/cart-context";

type Variant = {
  name: string;
  swatch: string;
  stock: number;
  imageUrl: string | null;
};

type GalleryImage = { id: string; url: string };

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
  const [justAdded, setJustAdded] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const activeVariant = variants.find((v) => v.name === selectedVariant);

  // La galería muestra la foto propia de la variante primero (si tiene una
  // cargada); el resto de las fotos generales del producto siguen abajo.
  const gallery = useMemo(() => {
    if (!activeVariant?.imageUrl) return images;
    const rest = images.filter((img) => img.url !== activeVariant.imageUrl);
    return [{ id: `variant-${activeVariant.name}`, url: activeVariant.imageUrl }, ...rest];
  }, [activeVariant, images]);

  const maxStock = variants.length === 0 ? stock : (activeVariant?.stock ?? 0);
  const outOfStock = maxStock <= 0;

  function selectVariant(name: string) {
    setSelectedVariant(name);
    setQuantity(1);
    setCarouselIndex(0);
  }

  function buildCartItem() {
    return {
      productId,
      slug,
      name,
      price,
      image: gallery[0]?.url,
      variantName: selectedVariant,
      maxStock,
    };
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-cream-soft">
          {gallery[carouselIndex] && (
            <Image
              src={gallery[carouselIndex].url}
              alt={name}
              fill
              priority
              className="object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          )}
        </div>
        {gallery.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {gallery.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setCarouselIndex(i)}
                aria-label={`Ver foto ${i + 1}`}
                className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-cream-soft transition-colors ${
                  i === carouselIndex ? "border-ink" : "border-transparent"
                }`}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="150px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {aboveActions}
        {variants.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-ink">
              Color{activeVariant ? `: ${activeVariant.name}` : ""}
            </p>
            <div className="mt-2 flex gap-3">
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
                  className={`relative h-14 w-14 overflow-hidden rounded-full border-2 transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                    selectedVariant === variant.name
                      ? "border-ink"
                      : "border-line"
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
          <div className="flex items-center rounded-full border border-line">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={outOfStock}
              className="px-3 py-2 text-ink-soft hover:text-ink disabled:opacity-30"
              aria-label="Restar cantidad"
            >
              −
            </button>
            <span className="min-w-8 text-center text-sm font-semibold text-ink">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
              disabled={outOfStock || quantity >= maxStock}
              className="px-3 py-2 text-ink-soft hover:text-ink disabled:opacity-30"
              aria-label="Sumar cantidad"
            >
              +
            </button>
          </div>
          {!outOfStock && maxStock <= 5 && (
            <span className="text-xs text-amber-dark">
              Quedan {maxStock} unidades
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={outOfStock}
            onClick={() => {
              addCartItem(buildCartItem(), quantity);
              setJustAdded(true);
              setTimeout(() => setJustAdded(false), 2000);
            }}
            className="flex-1 rounded-full border border-ink px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-cream disabled:cursor-not-allowed disabled:border-line disabled:text-ink-soft"
          >
            {outOfStock ? "Sin stock" : justAdded ? "¡Agregado! ✓" : "Agregar al carrito"}
          </button>
          <button
            type="button"
            disabled={outOfStock}
            onClick={() => {
              addCartItem(buildCartItem(), quantity);
              router.push("/checkout");
            }}
            className="flex-1 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-amber-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-soft"
          >
            Comprar ahora
          </button>
        </div>
        {belowActions}
      </div>
    </div>
  );
}
