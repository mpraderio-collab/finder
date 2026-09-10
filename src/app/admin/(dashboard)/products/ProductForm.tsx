"use client";

import { useActionState, useState } from "react";
import type { ProductActionState } from "./actions";

type Props = {
  action: (
    state: ProductActionState,
    formData: FormData,
  ) => Promise<ProductActionState>;
  defaultValues?: {
    name: string;
    slug: string;
    tagline: string;
    description: string;
    price: number;
    costPrice: number | null;
    stock: number;
    status: string;
    features?: string;
    promoQuantity?: number | null;
    promoPrice?: number | null;
  };
  submitLabel: string;
};

const initialState: ProductActionState = {};

// % de margen sobre el costo, o "" si no se puede calcular (sin costo cargado).
function marginPercentOf(cost: number | "", sellPrice: number | ""): number | "" {
  if (cost === "" || cost <= 0 || sellPrice === "") return "";
  return Math.round(((sellPrice - cost) / cost) * 1000) / 10;
}

function marginAmountOf(cost: number | "", sellPrice: number | ""): number | "" {
  if (cost === "" || sellPrice === "") return "";
  return sellPrice - cost;
}

export function ProductForm({ action, defaultValues, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const [cost, setCost] = useState<number | "">(defaultValues?.costPrice ?? "");
  const [price, setPrice] = useState<number | "">(defaultValues?.price ?? "");
  const [marginPercent, setMarginPercent] = useState<number | "">(() =>
    marginPercentOf(defaultValues?.costPrice ?? "", defaultValues?.price ?? ""),
  );
  const [marginAmount, setMarginAmount] = useState<number | "">(() =>
    marginAmountOf(defaultValues?.costPrice ?? "", defaultValues?.price ?? ""),
  );

  const [promoQuantity, setPromoQuantity] = useState<number | "">(
    defaultValues?.promoQuantity ?? "",
  );
  const [promoPrice, setPromoPrice] = useState<number | "">(defaultValues?.promoPrice ?? "");
  const totalCost = (q: number | "") => (cost === "" || q === "" ? ("" as const) : cost * q);
  const [promoMarginPercent, setPromoMarginPercent] = useState<number | "">(() =>
    marginPercentOf(totalCost(defaultValues?.promoQuantity ?? ""), defaultValues?.promoPrice ?? ""),
  );
  const [promoMarginAmount, setPromoMarginAmount] = useState<number | "">(() =>
    marginAmountOf(totalCost(defaultValues?.promoQuantity ?? ""), defaultValues?.promoPrice ?? ""),
  );

  // Cambiar el costo no mueve el precio ya cargado — solo actualiza cuánto
  // margen queda con ese precio, tanto para la unidad como para la promo.
  function handleCostChange(value: number | "") {
    setCost(value);
    setMarginPercent(marginPercentOf(value, price));
    setMarginAmount(marginAmountOf(value, price));
    const newTotalCost = value === "" || promoQuantity === "" ? ("" as const) : value * promoQuantity;
    setPromoMarginPercent(marginPercentOf(newTotalCost, promoPrice));
    setPromoMarginAmount(marginAmountOf(newTotalCost, promoPrice));
  }

  function handlePriceChange(value: number | "") {
    setPrice(value);
    setMarginPercent(marginPercentOf(cost, value));
    setMarginAmount(marginAmountOf(cost, value));
  }

  function handleMarginPercentChange(value: number | "") {
    setMarginPercent(value);
    if (cost === "" || cost <= 0 || value === "") return;
    const newPrice = Math.round(cost * (1 + value / 100));
    setPrice(newPrice);
    setMarginAmount(newPrice - cost);
  }

  function handleMarginAmountChange(value: number | "") {
    setMarginAmount(value);
    if (cost === "" || value === "") return;
    const newPrice = cost + value;
    setPrice(newPrice);
    setMarginPercent(cost > 0 ? Math.round((value / cost) * 1000) / 10 : "");
  }

  function handlePromoQuantityChange(value: number | "") {
    setPromoQuantity(value);
    const newTotalCost = cost === "" || value === "" ? ("" as const) : cost * value;
    setPromoMarginPercent(marginPercentOf(newTotalCost, promoPrice));
    setPromoMarginAmount(marginAmountOf(newTotalCost, promoPrice));
  }

  function handlePromoPriceChange(value: number | "") {
    setPromoPrice(value);
    setPromoMarginPercent(marginPercentOf(totalCost(promoQuantity), value));
    setPromoMarginAmount(marginAmountOf(totalCost(promoQuantity), value));
  }

  function handlePromoMarginPercentChange(value: number | "") {
    setPromoMarginPercent(value);
    const tc = totalCost(promoQuantity);
    if (tc === "" || tc <= 0 || value === "") return;
    const newPromoPrice = Math.round(tc * (1 + value / 100));
    setPromoPrice(newPromoPrice);
    setPromoMarginAmount(newPromoPrice - tc);
  }

  function handlePromoMarginAmountChange(value: number | "") {
    setPromoMarginAmount(value);
    const tc = totalCost(promoQuantity);
    if (tc === "" || value === "") return;
    const newPromoPrice = tc + value;
    setPromoPrice(newPromoPrice);
    setPromoMarginPercent(tc > 0 ? Math.round((value / tc) * 1000) / 10 : "");
  }

  const promoTotalCost = totalCost(promoQuantity);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      {state.error && (
        <p className="rounded-lg bg-err-bg px-3 py-2 text-sm text-err-ink">
          {state.error}
        </p>
      )}

      <Field label="Nombre" name="name" error={state.fieldErrors?.name}>
        <input
          name="name"
          defaultValue={defaultValues?.name}
          required
          className="input"
        />
      </Field>

      <Field
        label="Slug (URL)"
        name="slug"
        error={state.fieldErrors?.slug}
        hint="Solo minúsculas, números y guiones. Ej: lampara-lectura-led"
      >
        <input
          name="slug"
          defaultValue={defaultValues?.slug}
          required
          className="input font-mono"
        />
      </Field>

      <Field label="Tagline" name="tagline" error={state.fieldErrors?.tagline}>
        <input
          name="tagline"
          defaultValue={defaultValues?.tagline}
          required
          className="input"
        />
      </Field>

      <Field
        label="Descripción"
        name="description"
        error={state.fieldErrors?.description}
      >
        <textarea
          name="description"
          defaultValue={defaultValues?.description}
          required
          rows={5}
          className="input"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field
          label="Precio de costo (ARS)"
          name="costPrice"
          error={state.fieldErrors?.costPrice}
          hint="Opcional. Nunca se muestra en la tienda."
        >
          <input
            name="costPrice"
            type="number"
            min={0}
            step={1}
            value={cost}
            onChange={(e) =>
              handleCostChange(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="input"
          />
        </Field>
        <Field label="% de margen" name="marginPercent" hint="Sobre el costo">
          <input
            type="number"
            step="any"
            value={marginPercent}
            onChange={(e) =>
              handleMarginPercentChange(e.target.value === "" ? "" : Number(e.target.value))
            }
            disabled={cost === "" || cost <= 0}
            className="input disabled:opacity-50"
          />
        </Field>
        <Field label="$ de margen" name="marginAmount" hint="Precio − costo">
          <input
            type="number"
            step={1}
            value={marginAmount}
            onChange={(e) =>
              handleMarginAmountChange(e.target.value === "" ? "" : Number(e.target.value))
            }
            disabled={cost === ""}
            className="input disabled:opacity-50"
          />
        </Field>
        <Field label="Precio de venta (ARS)" name="price" error={state.fieldErrors?.price}>
          <input
            name="price"
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(e) =>
              handlePriceChange(e.target.value === "" ? "" : Number(e.target.value))
            }
            required
            className="input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-line bg-surface p-4 sm:grid-cols-4">
        <Field
          label="Promo: cantidad"
          name="promoQuantity"
          error={state.fieldErrors?.promoQuantity}
          hint="Ej: 2 — vacío si no hay promo"
        >
          <input
            name="promoQuantity"
            type="number"
            min={2}
            step={1}
            value={promoQuantity}
            onChange={(e) =>
              handlePromoQuantityChange(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="input"
          />
        </Field>
        <Field label="% de margen" name="promoMarginPercent" hint="Sobre el costo total">
          <input
            type="number"
            step="any"
            value={promoMarginPercent}
            onChange={(e) =>
              handlePromoMarginPercentChange(e.target.value === "" ? "" : Number(e.target.value))
            }
            disabled={promoTotalCost === "" || promoTotalCost <= 0}
            className="input disabled:opacity-50"
          />
        </Field>
        <Field label="$ de margen" name="promoMarginAmount" hint="Precio − costo total">
          <input
            type="number"
            step={1}
            value={promoMarginAmount}
            onChange={(e) =>
              handlePromoMarginAmountChange(e.target.value === "" ? "" : Number(e.target.value))
            }
            disabled={promoTotalCost === ""}
            className="input disabled:opacity-50"
          />
        </Field>
        <Field
          label="Promo: precio total"
          name="promoPrice"
          error={state.fieldErrors?.promoPrice}
          hint="Ej: 45000 — llevando esa cantidad"
        >
          <input
            name="promoPrice"
            type="number"
            min={0}
            step={1}
            value={promoPrice}
            onChange={(e) =>
              handlePromoPriceChange(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="input"
          />
        </Field>
      </div>

      <Field label="Stock" name="stock" error={state.fieldErrors?.stock}>
        <input
          name="stock"
          type="number"
          min={0}
          step={1}
          defaultValue={defaultValues?.stock ?? 0}
          required
          className="input max-w-[calc(50%-0.5rem)]"
        />
      </Field>

      <Field
        label="Características"
        name="features"
        hint="Una por línea — se muestran con un ✓ en la ficha del producto"
      >
        <textarea
          name="features"
          defaultValue={defaultValues?.features ?? ""}
          rows={5}
          placeholder={
            "Sensor de movimiento PIR: se activa a 0-3 m y se apaga a los ~25 segundos\n16 colores RGB con control remoto incluido"
          }
          className="input"
        />
      </Field>

      <Field label="Estado" name="status" error={state.fieldErrors?.status}>
        <select
          name="status"
          defaultValue={defaultValues?.status ?? "active"}
          className="input"
        >
          <option value="active">Activo (visible en la tienda)</option>
          <option value="archived">Archivado (oculto)</option>
        </select>
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-fit rounded-lg bg-navy px-6 py-2.5 font-heading text-sm font-bold text-white transition-colors hover:bg-navy-deep disabled:opacity-50"
      >
        {pending ? "Guardando…" : submitLabel}
      </button>

      <style jsx global>{`
        .input {
          border-radius: 8px;
          border: 1px solid var(--color-border-input);
          background: var(--color-bg);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: var(--color-amber);
          box-shadow: 0 0 0 3px rgba(246, 168, 28, 0.15);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-ink-soft">{hint}</span>}
      {error && <span className="text-xs text-err-ink">{error}</span>}
    </label>
  );
}
