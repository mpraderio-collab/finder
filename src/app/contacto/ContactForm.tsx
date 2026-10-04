"use client";

import { useState } from "react";
import { SuccessCheck } from "@/components/SuccessCheck";

type FormState = {
  name: string;
  email: string;
  phone: string;
  message: string;
  website: string; // señuelo anti-spam, se mantiene siempre vacío
};

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  message: "",
  website: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No pudimos enviar tu mensaje.");
        setSubmitting(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 rounded-[14px] border border-amber-line bg-amber-soft px-6 py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-line bg-bg text-amber-ink">
          <SuccessCheck />
        </span>
        <p className="font-heading text-lg font-bold text-navy">
          ¡Mensaje enviado!
        </p>
        <p className="max-w-xs text-sm text-ink-soft">
          Gracias por escribirnos, {form.name.split(" ")[0]}. Te respondemos a
          la brevedad.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      {error && (
        <p className="rounded-[10px] border border-err-line bg-err-bg px-3 py-2 text-[13px] text-err-ink">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input"
          />
        </Field>
        <Field label="Correo electrónico *">
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input"
          />
        </Field>
      </div>

      <Field label="Número de teléfono">
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="input"
        />
      </Field>

      <Field label="Comentario">
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="input resize-none"
        />
      </Field>

      {/* Señuelo anti-spam: oculto para personas, los bots suelen completar todo. */}
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 w-fit rounded-lg bg-navy px-6 py-3.5 font-heading text-sm font-bold text-white transition-colors hover:bg-navy-deep disabled:opacity-50"
      >
        {submitting ? "Enviando…" : "Enviar"}
      </button>

      <style jsx global>{`
        .input {
          border-radius: 8px;
          border: 1px solid var(--color-border-input);
          background: var(--color-bg);
          padding: 12px 14px;
          font-size: 14px;
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}
