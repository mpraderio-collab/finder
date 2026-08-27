"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateVariantStock } from "../actions";

type Variant = { id: string; name: string; swatch: string; stock: number };

export function VariantStockEditor({ variants }: { variants: Variant[] }) {
  if (variants.length === 0) return null;
  return (
    <div className="mt-10 max-w-2xl">
      <p className="text-sm font-semibold text-ink">Stock por variante</p>
      <p className="mt-1 text-xs text-ink-soft">
        El stock general del producto no aplica cuando hay variantes: la
        disponibilidad se controla acá, por color.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {variants.map((variant) => (
          <VariantRow key={variant.id} variant={variant} />
        ))}
      </div>
    </div>
  );
}

function VariantRow({ variant }: { variant: Variant }) {
  const [value, setValue] = useState(variant.stock);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const dirty = value !== variant.stock;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-card px-3 py-2">
      <span
        className="h-5 w-5 shrink-0 rounded-full border border-line"
        style={{ backgroundColor: variant.swatch }}
      />
      <span className="w-20 text-sm text-ink">{variant.name}</span>
      <input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-24 rounded-lg border border-line bg-cream px-2 py-1 text-sm outline-none focus:border-amber"
      />
      <button
        type="button"
        disabled={!dirty || pending}
        onClick={() =>
          startTransition(async () => {
            const res = await updateVariantStock(variant.id, value);
            if (res.error) {
              setError(res.error);
              return;
            }
            setError(null);
            router.refresh();
          })
        }
        className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-cream disabled:opacity-40"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
      {error && <span className="text-xs text-coral">{error}</span>}
    </div>
  );
}
