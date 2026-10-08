"use client";

import { useState } from "react";

export function NotifyStockForm({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/notify-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No pudimos guardar tu aviso.");
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
      <p className="border border-d-line px-4 py-3 text-sm">
        Listo, te avisamos por mail cuando vuelva a haber stock de {productName}.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <p className="text-sm">Avisame cuando haya stock</p>
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
        <button
          type="submit"
          disabled={submitting}
          className="d-fade shrink-0 text-sm disabled:opacity-50"
        >
          {submitting ? "…" : "Avisame"}
        </button>
      </div>
      {error && <span className="text-xs text-err-ink">{error}</span>}
    </form>
  );
}
