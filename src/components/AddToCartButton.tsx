"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";

type Variant = { name: string; swatch: string; stock: number };

export function AddToCartButton({
  productId,
  slug,
  name,
  price,
  image,
  stock,
  variants,
}: {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image?: string;
  stock: number;
  variants: Variant[];
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(
    variants[0]?.name,
  );
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const maxStock = useMemo(() => {
    if (variants.length === 0) return stock;
    return variants.find((v) => v.name === selectedVariant)?.stock ?? 0;
  }, [variants, selectedVariant, stock]);

  const outOfStock = maxStock <= 0;

  return (
    <div className="flex flex-col gap-4">
      {variants.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-ink">Color</p>
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
                onClick={() => {
                  setSelectedVariant(variant.name);
                  setQuantity(1);
                }}
                disabled={variant.stock <= 0}
                className={`h-8 w-8 rounded-full border-2 transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                  selectedVariant === variant.name
                    ? "border-ink"
                    : "border-line"
                }`}
                style={{ backgroundColor: variant.swatch }}
              />
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

      <button
        type="button"
        disabled={outOfStock}
        onClick={() => {
          addItem(
            {
              productId,
              slug,
              name,
              price,
              image,
              variantName: selectedVariant,
              maxStock,
            },
            quantity,
          );
          setJustAdded(true);
          setTimeout(() => setJustAdded(false), 2000);
        }}
        className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-amber-dark disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-soft sm:w-auto"
      >
        {outOfStock ? "Sin stock" : justAdded ? "¡Agregado! ✓" : "Agregar al carrito"}
      </button>

      {justAdded && (
        <button
          type="button"
          onClick={() => router.push("/carrito")}
          className="w-fit text-sm font-semibold text-amber-dark hover:underline"
        >
          Ir al carrito →
        </button>
      )}
    </div>
  );
}
