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
      <p className="rounded-lg border border-amber-line bg-amber-soft px-3.5 py-2.5 text-[13px] font-semibold text-amber-ink">
        Listo, te avisamos por mail cuando vuelva a haber stock de {productName}.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <p className="text-[13px] font-semibold text-ink">
        Avisame cuando haya stock
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="focus-amber min-w-0 flex-1 rounded-lg border border-border-input bg-bg px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="shrink-0 rounded-lg bg-navy px-4 py-2 font-heading text-sm font-bold text-white transition-colors hover:bg-navy-deep disabled:opacity-50"
        >
          {submitting ? "…" : "Avisame"}
        </button>
      </div>
      {error && <span className="text-xs text-err-ink">{error}</span>}
    </form>
  );
}
