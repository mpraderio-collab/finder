"use client";

import { useActionState } from "react";
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
  };
  submitLabel: string;
};

const initialState: ProductActionState = {};

export function ProductForm({ action, defaultValues, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      {state.error && (
        <p className="rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">
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

      <div className="grid grid-cols-2 gap-4">
        <Field label="Precio de venta (ARS)" name="price" error={state.fieldErrors?.price}>
          <input
            name="price"
            type="number"
            min={0}
            step={1}
            defaultValue={defaultValues?.price}
            required
            className="input"
          />
        </Field>

        <Field
          label="Precio de costo (ARS)"
          name="costPrice"
          error={state.fieldErrors?.costPrice}
          hint="Opcional. Solo lo ves vos, nunca se muestra en la tienda."
        >
          <input
            name="costPrice"
            type="number"
            min={0}
            step={1}
            defaultValue={defaultValues?.costPrice ?? undefined}
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
        className="mt-2 w-fit rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-amber-dark disabled:opacity-50"
      >
        {pending ? "Guardando…" : submitLabel}
      </button>

      <style jsx global>{`
        .input {
          border-radius: 0.5rem;
          border: 1px solid var(--color-line);
          background: var(--color-card);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: var(--color-amber);
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
      {error && <span className="text-xs text-coral">{error}</span>}
    </label>
  );
}
