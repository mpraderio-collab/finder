"use client";

import { useState } from "react";
import { ArrowRight } from "@/components/store/Icons";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No pudimos suscribirte.");
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
      <p className="font-serif text-lg text-clay-soft">
        Listo, ya estás suscripto.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="flex items-end gap-3 border-b border-cream/30 transition-colors focus-within:border-cream">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          aria-label="Tu email"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-cream outline-none placeholder:text-cream/40"
        />
        <button
          type="submit"
          disabled={submitting}
          className="group flex shrink-0 items-center gap-2 py-2.5 text-[15px] font-semibold text-cream disabled:opacity-50"
        >
          {submitting ? "Enviando…" : "Sumarme"}
          <ArrowRight size={16} className="b-arrow" />
        </button>
      </div>
      {error && <span className="text-xs text-clay-soft">{error}</span>}
    </form>
  );
}
