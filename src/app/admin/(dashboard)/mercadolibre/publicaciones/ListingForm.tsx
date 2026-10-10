"use client";

import { useActionState, useState } from "react";
import { saveListing, type ListingActionState } from "../actions";

type ProductOption = { id: string; name: string; variants: string[] };

const initialState: ListingActionState = {};

export function ListingForm({ products }: { products: ProductOption[] }) {
  const [state, formAction, pending] = useActionState(saveListing, initialState);
  const [productId, setProductId] = useState("");
  const variants = products.find((p) => p.id === productId)?.variants ?? [];

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-line bg-bg p-5"
    >
      <p className="text-sm font-semibold text-navy">Vincular una publicación</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink-soft">Código o link de la publicación</span>
          <input
            name="mlItemId"
            required
            placeholder="MLA1234567890"
            className="rounded-lg border border-border-input bg-bg px-3 py-2 text-sm outline-none focus:border-amber sm:w-64"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink-soft">Producto de Finder</span>
          <select
            name="productId"
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="rounded-lg border border-border-input bg-bg px-3 py-2 text-sm outline-none focus:border-amber sm:w-72"
          >
            <option value="">Elegí un producto…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {variants.length > 0 && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink-soft">Variante (opcional)</span>
            <select
              name="variantName"
              defaultValue=""
              className="rounded-lg border border-border-input bg-bg px-3 py-2 text-sm outline-none focus:border-amber"
            >
              <option value="">Todas / no aplica</option>
              {variants.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-navy px-5 py-2 font-heading text-sm font-bold text-white hover:bg-navy-deep disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Vincular"}
        </button>
      </div>
      {state.error && <p className="text-sm text-err-ink">{state.error}</p>}
      {state.success && <p className="text-sm text-ok-ink">{state.success}</p>}
    </form>
  );
}
