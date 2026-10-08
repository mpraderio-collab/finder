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
      <p className="e-mono text-white">
        Listo, ya estás suscripto.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="flex h-12 items-center rounded-[24px] border border-white pl-5 pr-1.5 transition-colors focus-within:border-white/60">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          aria-label="Tu email"
          className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-e-faint"
        />
        <button
          type="submit"
          disabled={submitting}
          className="e-mono h-9 shrink-0 rounded-[18px] bg-white px-[18px] text-e-ink transition-colors hover:bg-e-line disabled:opacity-50"
        >
          {submitting ? "…" : "Sumarme"}
        </button>
      </div>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </form>
  );
}
