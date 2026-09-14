"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePromotion } from "./actions";

export function DeletePromotionButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (!confirm(`¿Borrar la promoción "${name}"?`)) return;
          await deletePromotion(id);
          router.refresh();
        })
      }
      className="text-sm font-semibold text-err-ink hover:text-err-ink/80 disabled:opacity-50"
    >
      Borrar
    </button>
  );
}
