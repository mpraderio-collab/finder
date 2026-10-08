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
      <div className="mt-8 flex flex-col items-start gap-4 border-t border-d-ink pt-6">
        <span className="flex h-12 w-12 items-center justify-center border border-d-ink">
          <SuccessCheck />
        </span>
        <p className="font-d-serif text-[28px] leading-tight">Mensaje enviado</p>
        <p className="max-w-xs text-sm text-d-muted">
          Gracias por escribirnos, {form.name.split(" ")[0]}. Te respondemos a la brevedad.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex max-w-[720px] flex-col gap-6">
      {error && (
        <p role="alert" className="border border-err-line bg-err-bg px-3 py-2 text-sm text-err-ink">
          {error}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Nombre">
          <input
            required
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="d-input"
          />
        </Field>
        <Field label="Correo electrónico *">
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="d-input"
          />
        </Field>
      </div>

      <Field label="Número de teléfono">
        <input
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="d-input"
        />
      </Field>

      <Field label="Comentario">
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="d-input resize-none"
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

      <button type="submit" disabled={submitting} className="d-btn w-fit">
        {submitting ? "Enviando…" : "Enviar"}
      </button>
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
    <label className="flex flex-col gap-1">
      <span className="text-sm text-d-muted">{label}</span>
      {children}
    </label>
  );
}
