"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  archiveProduct,
  deleteProduct,
  restoreProduct,
} from "../actions";

export function DangerZone({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="mt-10 max-w-2xl rounded-xl border border-line bg-card p-5">
      <p className="text-sm font-semibold text-ink">Zona de riesgo</p>
      {error && <p className="mt-2 text-sm text-coral">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-3">
        {status === "active" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await archiveProduct(id);
                router.refresh();
              })
            }
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-soft hover:border-ink hover:text-ink disabled:opacity-50"
          >
            Archivar (ocultar de la tienda)
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await restoreProduct(id);
                router.refresh();
              })
            }
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-soft hover:border-ink hover:text-ink disabled:opacity-50"
          >
            Reactivar producto
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              if (!confirm("¿Borrar este producto definitivamente?")) return;
              const res = await deleteProduct(id);
              if (res.error) {
                setError(res.error);
                return;
              }
              router.push("/admin/products");
            })
          }
          className="rounded-full border border-coral px-4 py-2 text-sm font-semibold text-coral hover:bg-coral-soft disabled:opacity-50"
        >
          Borrar definitivamente
        </button>
      </div>
    </div>
  );
}
