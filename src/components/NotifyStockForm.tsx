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
      <p className="border-l-2 border-clay bg-sand px-4 py-3 text-sm text-espresso">
        Listo, te avisamos por mail cuando vuelva a haber stock de {productName}.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <p className="text-sm font-medium">
        Avisame cuando haya stock
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="b-input min-w-0 flex-1"
        />
        <button
          type="submit"
          disabled={submitting}
          className="b-btn b-btn-ink shrink-0 !px-5 !py-0"
        >
          {submitting ? "…" : "Avisame"}
        </button>
      </div>
      {error && <span className="text-[13px] text-err-ink">{error}</span>}
    </form>
  );
}
