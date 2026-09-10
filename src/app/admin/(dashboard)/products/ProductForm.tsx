"use client";

import { useActionState, useState } from "react";
import { MoneyInput } from "@/components/admin/MoneyInput";
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
const DEFAULT_SHIPPING_COST = 10500;

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
  // Costo de envío — solo se usa acá para calcular el margen real, no es un
  // dato del producto y no se guarda (siempre arranca en el default).
  const [shippingCost, setShippingCost] = useState<number | "">(DEFAULT_SHIPPING_COST);

  // Costo + envío: la base real contra la que se mide el margen de una
  // unidad sola.
  function unitCostBasis(c: number | "", s: number | ""): number | "" {
    if (c === "") return "";
    return c + (s === "" ? 0 : s);
  }

  // El envío es un costo fijo del envío completo, no por unidad — se suma
  // una sola vez sin importar si la promo es de 2 o de 5.
  function promoCostBasis(c: number | "", s: number | "", q: number | ""): number | "" {
    if (c === "" || q === "") return "";
    return c * q + (s === "" ? 0 : s);
  }

  const [marginPercent, setMarginPercent] = useState<number | "">(() =>
    marginPercentOf(unitCostBasis(defaultValues?.costPrice ?? "", DEFAULT_SHIPPING_COST), defaultValues?.price ?? ""),
  );
  const [marginAmount, setMarginAmount] = useState<number | "">(() =>
    marginAmountOf(unitCostBasis(defaultValues?.costPrice ?? "", DEFAULT_SHIPPING_COST), defaultValues?.price ?? ""),
  );

  const [promoQuantity, setPromoQuantity] = useState<number | "">(
    defaultValues?.promoQuantity ?? "",
  );
  const [promoPrice, setPromoPrice] = useState<number | "">(defaultValues?.promoPrice ?? "");
  const totalCost = (q: number | "") => promoCostBasis(cost, shippingCost, q);
  const [promoMarginPercent, setPromoMarginPercent] = useState<number | "">(() => {
    const tc = promoCostBasis(defaultValues?.costPrice ?? "", DEFAULT_SHIPPING_COST, defaultValues?.promoQuantity ?? "");
    return marginPercentOf(tc, defaultValues?.promoPrice ?? "");
  });
  const [promoMarginAmount, setPromoMarginAmount] = useState<number | "">(() => {
    const tc = promoCostBasis(defaultValues?.costPrice ?? "", DEFAULT_SHIPPING_COST, defaultValues?.promoQuantity ?? "");
    return marginAmountOf(tc, defaultValues?.promoPrice ?? "");
  });

  // Cambiar el costo no mueve el precio ya cargado — solo actualiza cuánto
  // margen queda con ese precio, tanto para la unidad como para la promo.
  function handleCostChange(value: number | "") {
    setCost(value);
    setMarginPercent(marginPercentOf(unitCostBasis(value, shippingCost), price));
    setMarginAmount(marginAmountOf(unitCostBasis(value, shippingCost), price));
    const newTotalCost = promoCostBasis(value, shippingCost, promoQuantity);
    setPromoMarginPercent(marginPercentOf(newTotalCost, promoPrice));
    setPromoMarginAmount(marginAmountOf(newTotalCost, promoPrice));
  }

  // Igual que el costo: cambiar el envío solo recalcula el margen mostrado,
  // no mueve el precio ya cargado.
  function handleShippingCostChange(value: number | "") {
    setShippingCost(value);
    setMarginPercent(marginPercentOf(unitCostBasis(cost, value), price));
    setMarginAmount(marginAmountOf(unitCostBasis(cost, value), price));
    const newTotalCost = promoCostBasis(cost, value, promoQuantity);
    setPromoMarginPercent(marginPercentOf(newTotalCost, promoPrice));
    setPromoMarginAmount(marginAmountOf(newTotalCost, promoPrice));
  }

  function handlePriceChange(value: number | "") {
    setPrice(value);
    const basis = unitCostBasis(cost, shippingCost);
    setMarginPercent(marginPercentOf(basis, value));
    setMarginAmount(marginAmountOf(basis, value));
  }

  function handleMarginPercentChange(value: number | "") {
    setMarginPercent(value);
    const basis = unitCostBasis(cost, shippingCost);
    if (basis === "" || basis <= 0 || value === "") return;
    const newPrice = Math.round(basis * (1 + value / 100));
    setPrice(newPrice);
    setMarginAmount(newPrice - basis);
  }

  function handleMarginAmountChange(value: number | "") {
    setMarginAmount(value);
    const basis = unitCostBasis(cost, shippingCost);
    if (basis === "" || value === "") return;
    const newPrice = basis + value;
    setPrice(newPrice);
    setMarginPercent(basis > 0 ? Math.round((value / basis) * 1000) / 10 : "");
  }

  function handlePromoQuantityChange(value: number | "") {
    setPromoQuantity(value);
    const newTotalCost = promoCostBasis(cost, shippingCost, value);
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Field
          label="Precio de costo (ARS)"
          name="costPrice"
          error={state.fieldErrors?.costPrice}
          hint="Opcional. Nunca se muestra en la tienda."
          labelClassName="min-h-10"
        >
          <MoneyInput name="costPrice" value={cost} onChange={handleCostChange} className="input" />
        </Field>
        <Field label="% de margen" name="marginPercent" hint="Sobre costo + envío" labelClassName="min-h-10">
          <input
            type="number"
            step="any"
            value={marginPercent}
            onChange={(e) =>
              handleMarginPercentChange(e.target.value === "" ? "" : Number(e.target.value))
            }
            disabled={cost === ""}
            className="input disabled:opacity-50"
          />
        </Field>
        <Field label="$ de margen" name="marginAmount" hint="Precio − costo − envío" labelClassName="min-h-10">
          <MoneyInput
            value={marginAmount}
            onChange={handleMarginAmountChange}
            disabled={cost === ""}
            className="input disabled:opacity-50"
          />
        </Field>
        <Field
          label="Costo de envío (ARS)"
          name="shippingCost"
          hint="Solo para calcular el margen"
          labelClassName="min-h-10"
        >
          <MoneyInput value={shippingCost} onChange={handleShippingCostChange} className="input" />
        </Field>
        <Field
          label="Precio de venta (ARS)"
          name="price"
          error={state.fieldErrors?.price}
          labelClassName="min-h-10"
        >
          <MoneyInput
            name="price"
            value={price}
            onChange={handlePriceChange}
            required
            className="input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-line bg-surface p-4 sm:grid-cols-5">
        <Field
          label="Promo: cantidad"
          name="promoQuantity"
          error={state.fieldErrors?.promoQuantity}
          hint="Ej: 2 — vacío si no hay promo"
          labelClassName="min-h-10"
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
        <Field
          label="% de margen"
          name="promoMarginPercent"
          hint="Sobre costo + envío total"
          labelClassName="min-h-10"
        >
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
        <Field
          label="$ de margen"
          name="promoMarginAmount"
          hint="Precio − costo − envío total"
          labelClassName="min-h-10"
        >
          <MoneyInput
            value={promoMarginAmount}
            onChange={handlePromoMarginAmountChange}
            disabled={promoTotalCost === ""}
            className="input disabled:opacity-50"
          />
        </Field>
        <Field
          label="Costo de envío (ARS)"
          name="promoShippingCost"
          hint="Solo para calcular el margen"
          labelClassName="min-h-10"
        >
          <MoneyInput value={shippingCost} onChange={handleShippingCostChange} className="input" />
        </Field>
        <Field
          label="Promo: precio total"
          name="promoPrice"
          error={state.fieldErrors?.promoPrice}
          hint="Ej: 45000 — llevando esa cantidad"
          labelClassName="min-h-10"
        >
          <MoneyInput
            name="promoPrice"
            value={promoPrice}
            onChange={handlePromoPriceChange}
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
  labelClassName,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  labelClassName?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={`text-sm font-medium text-ink ${labelClassName ?? ""}`}>{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-ink-soft">{hint}</span>}
      {error && <span className="text-xs text-err-ink">{error}</span>}
    </label>
  );
}
