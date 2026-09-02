"use client";

import { useState } from "react";

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
      <p className="text-sm font-semibold text-amber">
        ¡Listo! Ya estás suscripto.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-amber"
        />
        <button
          type="submit"
          disabled={submitting}
          className="shrink-0 rounded-lg bg-amber px-4 py-2 font-heading text-sm font-bold text-[#3a2500] transition-colors hover:bg-amber-hover disabled:opacity-50"
        >
          {submitting ? "…" : "Sumarme"}
        </button>
      </div>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </form>
  );
}
