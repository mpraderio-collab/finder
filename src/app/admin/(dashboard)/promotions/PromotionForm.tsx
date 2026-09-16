"use client";

import { useActionState, useState } from "react";
import { formatPrice } from "@/lib/products";
import type { PromotionActionState } from "./actions";

type ProductOption = {
  id: string;
  name: string;
  price: number;
  cost: number | null;
  otherActivePromoName: string | null;
};

type Tier = {
  threshold: number | "";
  percentOff: number | "";
  price: number | ""; // vacío = usar el promedio de los productos elegidos
  cost: number | ""; // vacío = usar el promedio de los productos elegidos
};

type Props = {
  action: (
    state: PromotionActionState,
    formData: FormData,
  ) => Promise<PromotionActionState>;
  products: ProductOption[];
  defaultValues?: {
    name: string;
    triggerType: string;
    active: boolean;
    productIds: string[];
    tiers: { threshold: number; percentOff: number }[];
  };
  submitLabel: string;
};

const initialState: PromotionActionState = {};

export function PromotionForm({ action, products, defaultValues, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [triggerType, setTriggerType] = useState(defaultValues?.triggerType ?? "quantity");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(defaultValues?.productIds ?? []),
  );
  const [shippingCost, setShippingCost] = useState<number | "">(10500);
  const [mpPercent, setMpPercent] = useState<number | "">(5);
  const [iibbPercent, setIibbPercent] = useState<number | "">(5);
  const [tiers, setTiers] = useState<Tier[]>(
    defaultValues?.tiers && defaultValues.tiers.length > 0
      ? defaultValues.tiers.map((t) => ({
          threshold: t.threshold,
          percentOff: t.percentOff,
          price: "",
          cost: "",
        }))
      : [{ threshold: "", percentOff: "", price: "", cost: "" }],
  );

  function toggleProduct(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function updateTier(index: number, field: keyof Tier, value: string) {
    setTiers((prev) =>
      prev.map((t, i) =>
        i === index ? { ...t, [field]: value === "" ? "" : Number(value) } : t,
      ),
    );
  }

  function addTier() {
    setTiers((prev) => [...prev, { threshold: "", percentOff: "", price: "", cost: "" }]);
  }

  function removeTier(index: number) {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  }

  const tiersJson = JSON.stringify(
    tiers
      .filter((t) => t.threshold !== "" && t.percentOff !== "")
      .map((t) => ({ threshold: t.threshold, percentOff: t.percentOff })),
  );

  // Precio/costo de cada tramo son editables (por si esa combinación puntual
  // no es la típica), pero arrancan sugiriendo el promedio de los productos
  // elegidos — la promo puede mezclar productos distintos, así que no hay
  // un precio "correcto" único.
  const selectedProducts = products.filter((p) => selected.has(p.id));
  const avgPrice =
    selectedProducts.length > 0
      ? selectedProducts.reduce((sum, p) => sum + p.price, 0) / selectedProducts.length
      : 0;
  const costsKnown = selectedProducts.filter((p) => p.cost !== null).map((p) => p.cost as number);
  const avgCost = costsKnown.length > 0 ? costsKnown.reduce((s, c) => s + c, 0) / costsKnown.length : null;

  function tierCalc(t: Tier) {
    const price = t.price !== "" ? Number(t.price) : avgPrice;
    const cost = t.cost !== "" ? Number(t.cost) : avgCost;
    const quantity = triggerType === "amount" && price > 0 ? Number(t.threshold || 0) / price : Number(t.threshold || 0);
    const total = triggerType === "amount" ? Number(t.threshold || 0) : price * quantity;
    const percentOff = t.percentOff === "" ? 0 : Number(t.percentOff);
    const totalAfterDiscount = total * (1 - percentOff / 100);
    const shipping = shippingCost === "" ? 0 : shippingCost;
    const mpFee = totalAfterDiscount * (mpPercent === "" ? 0 : mpPercent) / 100;
    const iibbFee = totalAfterDiscount * (iibbPercent === "" ? 0 : iibbPercent) / 100;
    const margin =
      cost !== null ? totalAfterDiscount - cost * quantity - shipping - mpFee - iibbFee : null;
    return { price, cost, total, margin };
  }

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      {state.error && (
        <p className="rounded-lg bg-err-bg px-3 py-2 text-sm text-err-ink">
          {state.error}
        </p>
      )}

      <input type="hidden" name="tiersJson" value={tiersJson} />

      <Field label="Nombre" name="name" error={state.fieldErrors?.name} hint="Uso interno, ej: Combo veladores">
        <input name="name" defaultValue={defaultValues?.name} required className="input" />
      </Field>

      <Field
        label="Cómo se cuenta el tramo"
        name="triggerType"
        error={state.fieldErrors?.triggerType}
        hint={
          triggerType === "amount"
            ? "Se suma lo gastado en todos los productos de la promo"
            : "Se suman las unidades de todos los productos de la promo"
        }
      >
        <select
          name="triggerType"
          value={triggerType}
          onChange={(e) => setTriggerType(e.target.value)}
          className="input"
        >
          <option value="quantity">Por cantidad de unidades combinadas</option>
          <option value="amount">Por monto combinado ($)</option>
        </select>
      </Field>

      <label className="flex items-center gap-2 text-sm font-medium text-ink">
        <input
          type="checkbox"
          name="active"
          defaultChecked={defaultValues?.active ?? true}
          className="h-4 w-4"
        />
        Activa
      </label>

      <div>
        <p className="text-sm font-medium text-ink">Productos incluidos</p>
        {state.fieldErrors?.productIds && (
          <p className="mt-1 text-xs text-err-ink">{state.fieldErrors.productIds}</p>
        )}
        <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-line bg-bg">
          {products.length === 0 ? (
            <p className="p-4 text-sm text-ink-soft">No hay productos activos.</p>
          ) : (
            products.map((p) => {
              const blocked = Boolean(p.otherActivePromoName) && !selected.has(p.id);
              return (
                <label
                  key={p.id}
                  className={`flex items-center justify-between gap-2 border-b border-line-soft px-4 py-2.5 text-sm last:border-0 ${
                    blocked ? "opacity-50" : "cursor-pointer hover:bg-surface"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="productIds"
                      value={p.id}
                      checked={selected.has(p.id)}
                      disabled={blocked}
                      onChange={() => toggleProduct(p.id)}
                      className="h-4 w-4"
                    />
                    {p.name}
                  </span>
                  {blocked && (
                    <span className="text-xs text-ink-faint">
                      ya está en &quot;{p.otherActivePromoName}&quot;
                    </span>
                  )}
                </label>
              );
            })
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink">Tramos</p>
          <button
            type="button"
            onClick={addTier}
            className="text-xs font-semibold text-blue hover:text-navy"
          >
            + Agregar tramo
          </button>
        </div>
        {state.fieldErrors?.tiers && (
          <p className="mt-1 text-xs text-err-ink">{state.fieldErrors.tiers}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-4">
          <label className="flex w-56 flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Costo de envío (se descuenta 1 vez por tramo)</span>
            <input
              type="number"
              min={0}
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value === "" ? "" : Number(e.target.value))}
              className="input"
            />
          </label>
          <label className="flex w-40 flex-col gap-1.5">
            <span className="text-xs text-ink-soft">% Mercado Pago</span>
            <input
              type="number"
              min={0}
              max={100}
              step="any"
              value={mpPercent}
              onChange={(e) => setMpPercent(e.target.value === "" ? "" : Number(e.target.value))}
              className="input"
            />
          </label>
          <label className="flex w-40 flex-col gap-1.5">
            <span className="text-xs text-ink-soft">% IIBB</span>
            <input
              type="number"
              min={0}
              max={100}
              step="any"
              value={iibbPercent}
              onChange={(e) => setIibbPercent(e.target.value === "" ? "" : Number(e.target.value))}
              className="input"
            />
          </label>
        </div>
        <div className="mt-2 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs text-ink-soft">
              <tr>
                <th className="px-3 py-2 font-medium">
                  {triggerType === "amount" ? "Monto ($)" : "Cantidad"}
                </th>
                <th className="px-3 py-2 font-medium">Precio</th>
                <th className="px-3 py-2 font-medium">Costo</th>
                <th className="px-3 py-2 font-medium">Total</th>
                <th className="px-3 py-2 font-medium">% Descuento</th>
                <th className="px-3 py-2 font-medium">Margen Total</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier, i) => {
                const calc = tierCalc(tier);
                return (
                  <tr key={i} className="border-b border-line-soft last:border-0">
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={1}
                        value={tier.threshold}
                        onChange={(e) => updateTier(i, "threshold", e.target.value)}
                        placeholder={triggerType === "amount" ? "100000" : "2"}
                        className="input"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={tier.price}
                        onChange={(e) => updateTier(i, "price", e.target.value)}
                        placeholder={avgPrice > 0 ? String(Math.round(avgPrice)) : "0"}
                        className="input"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={tier.cost}
                        onChange={(e) => updateTier(i, "cost", e.target.value)}
                        placeholder={avgCost !== null ? String(Math.round(avgCost)) : "sin datos"}
                        className="input"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-semibold text-ink">
                      {formatPrice(Math.round(calc.total))}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={tier.percentOff}
                        onChange={(e) => updateTier(i, "percentOff", e.target.value)}
                        placeholder="10"
                        className="input"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-semibold text-ink">
                      {calc.margin !== null ? formatPrice(Math.round(calc.margin)) : "—"}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => removeTier(i)}
                        disabled={tiers.length === 1}
                        className="text-ink-faint hover:text-err-ink disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Quitar tramo"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          Precio y costo arrancan sugiriendo el promedio de los productos elegidos — editalos
          por tramo si esa combinación puntual tiene un precio distinto. Total y Margen Total
          se recalculan solos, y el Margen Total ya descuenta el costo de envío, Mercado Pago
          e IIBB de arriba (estos dos últimos, como % del total con descuento).
        </p>
      </div>

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
          width: 100%;
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
