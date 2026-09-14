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
  };
  submitLabel: string;
};

const initialState: ProductActionState = {};
const DEFAULT_SHIPPING_COST = 10500;
// Valores reales observados en la cuenta de Mercado Pago del negocio — se
// usan como default para no tener que recordarlos cada vez, pero se pueden
// editar si cambian.
const DEFAULT_MP_COMMISSION_PERCENT = 4.3;
const DEFAULT_IIBB_PERCENT = 5;

// La comisión de MP y el IIBB se cobran como % del precio de venta (no del
// costo), así que el costo "real" contra el que se mide el margen depende
// del precio: costoReal = base fija (costo + envío) + precio × %fees.
function feeFraction(mpPercent: number | "", iibbPercent: number | ""): number {
  return ((mpPercent === "" ? 0 : mpPercent) + (iibbPercent === "" ? 0 : iibbPercent)) / 100;
}

// % de margen sobre el costo real (base fija + comisiones sobre el precio),
// o "" si no se puede calcular.
function marginPercentOf(
  fixedBasis: number | "",
  feeFrac: number,
  sellPrice: number | "",
): number | "" {
  if (fixedBasis === "" || sellPrice === "") return "";
  const realCost = fixedBasis + sellPrice * feeFrac;
  if (realCost <= 0) return "";
  return Math.round(((sellPrice - realCost) / realCost) * 1000) / 10;
}

function marginAmountOf(
  fixedBasis: number | "",
  feeFrac: number,
  sellPrice: number | "",
): number | "" {
  if (fixedBasis === "" || sellPrice === "") return "";
  return sellPrice - (fixedBasis + sellPrice * feeFrac);
}

// Despeja el precio necesario para lograr un $ de margen dado, sabiendo que
// una parte del costo real (las comisiones) escala con el propio precio.
function priceFromMarginAmount(
  fixedBasis: number | "",
  feeFrac: number,
  marginAmount: number | "",
): number | "" {
  if (fixedBasis === "" || marginAmount === "") return "";
  const denom = 1 - feeFrac;
  if (denom <= 0) return "";
  return Math.round((marginAmount + fixedBasis) / denom);
}

// Ídem para un % de margen dado.
function priceFromMarginPercent(
  fixedBasis: number | "",
  feeFrac: number,
  marginPercent: number | "",
): number | "" {
  if (fixedBasis === "" || marginPercent === "") return "";
  const m = marginPercent / 100;
  const denom = 1 - feeFrac * (1 + m);
  if (denom <= 0) return "";
  return Math.round((fixedBasis * (1 + m)) / denom);
}

export function ProductForm({ action, defaultValues, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const [cost, setCost] = useState<number | "">(defaultValues?.costPrice ?? "");
  const [price, setPrice] = useState<number | "">(defaultValues?.price ?? "");
  // Costo de envío y comisiones — solo se usan acá para calcular el margen
  // real, no son datos del producto y no se guardan (siempre arrancan en
  // el default).
  const [shippingCost, setShippingCost] = useState<number | "">(DEFAULT_SHIPPING_COST);
  const [mpCommissionPercent, setMpCommissionPercent] = useState<number | "">(
    DEFAULT_MP_COMMISSION_PERCENT,
  );
  const [iibbPercent, setIibbPercent] = useState<number | "">(DEFAULT_IIBB_PERCENT);
  const fees = feeFraction(mpCommissionPercent, iibbPercent);

  // Costo + envío: la parte fija del costo real de una unidad sola (las
  // comisiones son la parte variable, se calculan sobre el precio).
  function unitFixedBasis(c: number | "", s: number | ""): number | "" {
    if (c === "") return "";
    return c + (s === "" ? 0 : s);
  }

  const [marginPercent, setMarginPercent] = useState<number | "">(() =>
    marginPercentOf(
      unitFixedBasis(defaultValues?.costPrice ?? "", DEFAULT_SHIPPING_COST),
      feeFraction(DEFAULT_MP_COMMISSION_PERCENT, DEFAULT_IIBB_PERCENT),
      defaultValues?.price ?? "",
    ),
  );
  const [marginAmount, setMarginAmount] = useState<number | "">(() =>
    marginAmountOf(
      unitFixedBasis(defaultValues?.costPrice ?? "", DEFAULT_SHIPPING_COST),
      feeFraction(DEFAULT_MP_COMMISSION_PERCENT, DEFAULT_IIBB_PERCENT),
      defaultValues?.price ?? "",
    ),
  );

  // Recalcula el margen mostrado para la base fija y las comisiones
  // actuales, sin tocar el precio ya cargado.
  function recalcMargins(unitBasis: number | "", ff: number) {
    setMarginPercent(marginPercentOf(unitBasis, ff, price));
    setMarginAmount(marginAmountOf(unitBasis, ff, price));
  }

  // Cambiar el costo no mueve el precio ya cargado — solo actualiza cuánto
  // margen queda con ese precio.
  function handleCostChange(value: number | "") {
    setCost(value);
    recalcMargins(unitFixedBasis(value, shippingCost), fees);
  }

  // Igual que el costo: cambiar el envío o las comisiones solo recalcula el
  // margen mostrado, no mueve el precio ya cargado.
  function handleShippingCostChange(value: number | "") {
    setShippingCost(value);
    recalcMargins(unitFixedBasis(cost, value), fees);
  }

  function handleMpCommissionChange(value: number | "") {
    setMpCommissionPercent(value);
    const ff = feeFraction(value, iibbPercent);
    recalcMargins(unitFixedBasis(cost, shippingCost), ff);
  }

  function handleIibbChange(value: number | "") {
    setIibbPercent(value);
    const ff = feeFraction(mpCommissionPercent, value);
    recalcMargins(unitFixedBasis(cost, shippingCost), ff);
  }

  function handlePriceChange(value: number | "") {
    setPrice(value);
    const basis = unitFixedBasis(cost, shippingCost);
    setMarginPercent(marginPercentOf(basis, fees, value));
    setMarginAmount(marginAmountOf(basis, fees, value));
  }

  function handleMarginPercentChange(value: number | "") {
    setMarginPercent(value);
    const basis = unitFixedBasis(cost, shippingCost);
    const newPrice = priceFromMarginPercent(basis, fees, value);
    if (newPrice === "") return;
    setPrice(newPrice);
    setMarginAmount(marginAmountOf(basis, fees, newPrice));
  }

  function handleMarginAmountChange(value: number | "") {
    setMarginAmount(value);
    const basis = unitFixedBasis(cost, shippingCost);
    const newPrice = priceFromMarginAmount(basis, fees, value);
    if (newPrice === "") return;
    setPrice(newPrice);
    setMarginPercent(marginPercentOf(basis, fees, newPrice));
  }

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
        <Field label="% de margen" name="marginPercent" hint="Sobre costo + envío + comisiones" labelClassName="min-h-10">
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
        <Field label="$ de margen" name="marginAmount" hint="Precio − costo − envío − comisiones" labelClassName="min-h-10">
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
          label="% comisión Mercado Pago"
          name="mpCommissionPercent"
          hint="Se suma al costo, sobre el precio"
          labelClassName="min-h-10"
        >
          <input
            type="number"
            step="any"
            value={mpCommissionPercent}
            onChange={(e) =>
              handleMpCommissionChange(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="input"
          />
        </Field>
        <Field
          label="% IIBB"
          name="iibbPercent"
          hint="Se suma al costo, sobre el precio"
          labelClassName="min-h-10"
        >
          <input
            type="number"
            step="any"
            value={iibbPercent}
            onChange={(e) => handleIibbChange(e.target.value === "" ? "" : Number(e.target.value))}
            className="input"
          />
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
