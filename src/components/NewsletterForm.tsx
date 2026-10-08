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
    return <p className="mt-3 text-sm">Listo, ya estás suscripto.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-1.5">
      <div className="flex items-center gap-4 border-b border-d-ink">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          aria-label="Tu email"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-d-muted"
        />
        <button type="submit" disabled={submitting} className="d-fade shrink-0 text-sm disabled:opacity-50">
          {submitting ? "Enviando…" : "Suscribirme"}
        </button>
      </div>
      {error && <span className="text-xs text-err-ink">{error}</span>}
    </form>
  );
}
