"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePurchase } from "./actions";

export function DeletePurchaseButton({ id, appliedToStock }: { id: string; appliedToStock: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    const message = appliedToStock
      ? "¿Borrar esta compra? Ya está aplicada al stock/costo del producto — borrarla no revierte esos cambios."
      : "¿Borrar esta compra?";
    if (!confirm(message)) return;
    startTransition(async () => {
      await deletePurchase(id);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      className="text-xs font-semibold text-err-ink hover:underline disabled:opacity-50"
    >
      {pending ? "Borrando…" : "Borrar"}
    </button>
  );
}
