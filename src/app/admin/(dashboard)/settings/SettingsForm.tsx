"use client";

import { useActionState } from "react";
import { updateSiteSettings, type SettingsActionState } from "./actions";

const initialState: SettingsActionState = {};

export function SettingsForm({ installments }: { installments: number }) {
  const [state, formAction, pending] = useActionState(updateSiteSettings, initialState);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      {state.error && (
        <p className="rounded-lg bg-err-bg px-3 py-2 text-sm text-err-ink">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-ok-bg px-3 py-2 text-sm text-ok-ink">
          Guardado.
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">
          Cantidad de cuotas a mostrar
        </span>
        <input
          name="installments"
          type="number"
          min={1}
          max={24}
          step={1}
          defaultValue={installments}
          required
          className="input max-w-[160px]"
        />
        {state.fieldErrors?.installments ? (
          <span className="text-xs text-err-ink">{state.fieldErrors.installments}</span>
        ) : (
          <span className="text-xs text-ink-soft">
            Se usa en la home (&quot;X cuotas sin interés&quot;) y en la ficha de cada
            producto (&quot;X cuotas de $...&quot;). No cambia las cuotas reales que
            ofrece Mercado Pago en el checkout, solo el texto informativo del sitio.
          </span>
        )}
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-fit rounded-lg bg-navy px-6 py-2.5 font-heading text-sm font-bold text-white transition-colors hover:bg-navy-deep disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar"}
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
