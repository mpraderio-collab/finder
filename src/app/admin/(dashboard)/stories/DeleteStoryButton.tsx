"use client";

import { useTransition } from "react";
import { deleteStory } from "./actions";

export function DeleteStoryButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`¿Borrar la historia de "${name}"?`)) return;
        startTransition(() => deleteStory(id));
      }}
      className="text-sm font-semibold text-err-ink hover:text-err-ink/80 disabled:opacity-50"
    >
      Borrar
    </button>
  );
}
