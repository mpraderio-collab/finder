"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setTrackingCode } from "../actions";

export function TrackingCode({
  orderId,
  trackingCode,
}: {
  orderId: string;
  trackingCode: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(trackingCode ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!editing) {
    return trackingCode ? (
      <div className="flex items-center justify-between">
        <dd className="text-ink">{trackingCode}</dd>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs font-semibold text-blue hover:text-navy"
        >
          Editar
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-sm font-semibold text-blue hover:text-navy"
      >
        + Agregar código
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Código de seguimiento"
          className="w-full rounded-lg border border-border-input bg-bg px-2.5 py-1.5 text-sm outline-none focus:border-amber"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await setTrackingCode(orderId, value);
              if (res.error) {
                setError(res.error);
                return;
              }
              setError(null);
              setEditing(false);
              router.refresh();
            })
          }
          className="shrink-0 rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {pending ? "…" : "Guardar"}
        </button>
      </div>
      {error && <p className="text-xs text-err-ink">{error}</p>}
    </div>
  );
}
