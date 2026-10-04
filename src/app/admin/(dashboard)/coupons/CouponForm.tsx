"use client";

import { useActionState } from "react";
import { createCoupon, type CouponActionState } from "./actions";

const initialState: CouponActionState = {};

export function CouponForm() {
  const [state, formAction, pending] = useActionState(createCoupon, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-bg p-5">
      {state.error && (
        <p className="w-full rounded-lg bg-err-bg px-3 py-2 text-sm text-err-ink">{state.error}</p>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Código</span>
        <input
          name="code"
          placeholder="FINDER10"
          required
          className="input w-40 uppercase"
        />
        {state.fieldErrors?.code && (
          <span className="text-xs text-err-ink">{state.fieldErrors.code}</span>
        )}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">% de descuento</span>
        <input
          name="percentOff"
          type="number"
          min={1}
          max={100}
          step="any"
          defaultValue={10}
          required
          className="input w-28"
        />
        {state.fieldErrors?.percentOff && (
          <span className="text-xs text-err-ink">{state.fieldErrors.percentOff}</span>
        )}
      </label>
      <label className="flex items-center gap-2 pb-2.5 text-sm font-medium text-ink">
        <input type="checkbox" name="active" defaultChecked className="h-4 w-4" />
        Activo
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-navy px-5 py-2.5 font-heading text-sm font-bold text-white hover:bg-navy-deep disabled:opacity-50"
      >
        {pending ? "Creando…" : "+ Crear cupón"}
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
          box-shadow: 0 0 0 3px rgba(240,160,28, 0.15);
        }
      `}</style>
    </form>
  );
}
