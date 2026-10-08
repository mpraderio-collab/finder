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
      <div className="mt-8 flex flex-col items-start gap-4 border-t border-espresso py-10">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-clay text-paper">
          <SuccessCheck />
        </span>
        <p className="font-serif text-[28px]">Mensaje enviado</p>
        <p className="max-w-sm text-[15px]/[1.6] text-taupe">
          Gracias por escribirnos, {form.name.split(" ")[0]}. Te respondemos a
          la brevedad.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
      {error && (
        <p role="alert" className="border-l-2 border-err-ink bg-err-bg px-4 py-3 text-sm text-err-ink">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nombre">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="b-input"
          />
        </Field>
        <Field label="Correo electrónico *">
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="b-input"
          />
        </Field>
      </div>

      <Field label="Número de teléfono">
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="b-input"
        />
      </Field>

      <Field label="Comentario">
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="b-input resize-none"
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
        className="b-btn b-btn-clay mt-2 w-fit"
      >
        {submitting ? "Enviando…" : "Enviar mensaje"}
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
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-taupe">{label}</span>
      {children}
    </label>
  );
}
