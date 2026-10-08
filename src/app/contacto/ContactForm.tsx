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
      <div className="mt-6 flex flex-col items-center gap-3 bg-e-tile px-6 py-12 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-e-ink text-white">
          <SuccessCheck />
        </span>
        <p className="text-[24px] font-medium tracking-[-0.01em]">
          Mensaje enviado
        </p>
        <p className="max-w-xs text-[14px] text-e-muted">
          Gracias por escribirnos, {form.name.split(" ")[0]}. Te respondemos a
          la brevedad.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      {error && (
        <p className="rounded-[16px] border border-err-line bg-err-bg px-4 py-3 text-[13px] text-err-ink">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="e-input"
          />
        </Field>
        <Field label="Correo electrónico *">
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="e-input"
          />
        </Field>
      </div>

      <Field label="Número de teléfono">
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="e-input"
        />
      </Field>

      <Field label="Comentario">
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="e-input resize-none"
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
        className="e-pill e-pill--dark mt-1 h-12 w-fit px-10"
      >
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
    <label className="flex flex-col gap-1.5">
      <span className="pl-5 text-[12px] text-e-muted">{label}</span>
      {children}
    </label>
  );
}
