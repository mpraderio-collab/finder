"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setManualSalePaid } from "../../sales/actions";

export function PaymentToggle({ orderId, isPaid }: { orderId: string; isPaid: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await setManualSalePaid(orderId, !isPaid);
            if (res.error) {
              setError(res.error);
              return;
            }
            setError(null);
            router.refresh();
          })
        }
        className={`rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-40 ${
          isPaid
            ? "border-border-btn text-ink hover:bg-surface"
            : "border-ok-ink bg-ok-ink text-white hover:bg-ok-ink/90"
        }`}
      >
        {pending ? "Guardando…" : isPaid ? "Marcar como no pagada" : "Marcar como pagada"}
      </button>
      {error && <span className="text-xs text-err-ink">{error}</span>}
    </div>
  );
}
