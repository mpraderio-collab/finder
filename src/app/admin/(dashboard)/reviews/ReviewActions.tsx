"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveReview, rejectReview } from "./actions";

export function ReviewActions({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await approveReview(id);
              if (res.error) setError(res.error);
              router.refresh();
            })
          }
          className="rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-navy-deep disabled:opacity-50"
        >
          Aprobar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm("¿Rechazar y borrar esta reseña?")) return;
            startTransition(async () => {
              const res = await rejectReview(id);
              if (res.error) setError(res.error);
              router.refresh();
            });
          }}
          className="rounded-lg border border-border-btn px-3 py-1.5 text-xs font-bold text-err-ink hover:bg-surface disabled:opacity-50"
        >
          Rechazar
        </button>
      </div>
      {error && <span className="text-xs text-err-ink">{error}</span>}
    </div>
  );
}
