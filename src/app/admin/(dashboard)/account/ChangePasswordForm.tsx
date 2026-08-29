"use client";

import { useActionState } from "react";
import { changePassword, type ChangePasswordState } from "./actions";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePassword,
    initialState,
  );

  return (
    <form
      key={state.success ? "reset" : "form"}
      action={formAction}
      className="flex max-w-sm flex-col gap-4"
    >
      {state.error && (
        <p className="rounded-lg bg-err-bg px-3 py-2 text-sm text-err-ink">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-ok-bg px-3 py-2 text-sm text-ok-ink">
          Contraseña actualizada correctamente.
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">
          Contraseña actual
        </span>
        <input
          name="currentPassword"
          type="password"
          required
          className="rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-amber"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">
          Contraseña nueva
        </span>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-amber"
        />
        <span className="text-xs text-ink-soft">Al menos 8 caracteres.</span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">
          Repetir contraseña nueva
        </span>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-amber"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-fit rounded-lg bg-navy px-6 py-2.5 font-heading text-sm font-bold text-white transition-colors hover:bg-navy-deep disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
