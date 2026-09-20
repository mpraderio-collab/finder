"use client";

import { useActionState } from "react";
import { updateCustomer, type CustomerActionState } from "./actions";

const initialState: CustomerActionState = {};

type Initial = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  zip: string;
};

export function CustomerForm({ customerId, initial }: { customerId: string; initial: Initial }) {
  const action = updateCustomer.bind(null, customerId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-xl border border-line bg-bg p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Nombre</span>
          <input
            name="name"
            defaultValue={initial.name}
            required
            className="rounded-lg border border-border-btn bg-bg px-3 py-2 text-sm text-ink outline-none focus-amber"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Email</span>
          <input
            name="email"
            type="email"
            defaultValue={initial.email}
            className="rounded-lg border border-border-btn bg-bg px-3 py-2 text-sm text-ink outline-none focus-amber"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Teléfono</span>
          <input
            name="phone"
            defaultValue={initial.phone}
            className="rounded-lg border border-border-btn bg-bg px-3 py-2 text-sm text-ink outline-none focus-amber"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Dirección</span>
          <input
            name="address"
            defaultValue={initial.address}
            className="rounded-lg border border-border-btn bg-bg px-3 py-2 text-sm text-ink outline-none focus-amber"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Localidad</span>
          <input
            name="city"
            defaultValue={initial.city}
            className="rounded-lg border border-border-btn bg-bg px-3 py-2 text-sm text-ink outline-none focus-amber"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Provincia</span>
          <input
            name="province"
            defaultValue={initial.province}
            className="rounded-lg border border-border-btn bg-bg px-3 py-2 text-sm text-ink outline-none focus-amber"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Código postal</span>
          <input
            name="zip"
            defaultValue={initial.zip}
            className="rounded-lg border border-border-btn bg-bg px-3 py-2 text-sm text-ink outline-none focus-amber"
          />
        </label>
      </div>

      {state.error && <p className="rounded-lg bg-err-bg px-3 py-2 text-sm text-err-ink">{state.error}</p>}
      {state.success && (
        <p className="rounded-lg bg-ok-bg px-3 py-2 text-sm text-ok-ink">Datos guardados.</p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-lg bg-navy px-6 py-2.5 font-heading text-sm font-bold text-white disabled:opacity-40"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
