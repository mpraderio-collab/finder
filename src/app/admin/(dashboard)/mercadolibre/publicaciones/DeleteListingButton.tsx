"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteListing } from "../actions";

export function DeleteListingButton({ id, mlItemId }: { id: string; mlItemId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Desvincular ${mlItemId}? Las ventas ya importadas de esa publicación quedan sin producto.`)) {
          return;
        }
        startTransition(async () => {
          await deleteListing(id);
          router.refresh();
        });
      }}
      className="text-xs font-semibold text-err-ink hover:underline disabled:opacity-50"
    >
      {pending ? "Quitando…" : "Desvincular"}
    </button>
  );
}
