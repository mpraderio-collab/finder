"use client";

import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addVariantStock, updateVariantStock } from "../actions";
import { attachVariantImage } from "./image-actions";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type Variant = {
  id: string;
  name: string;
  swatch: string;
  stock: number;
  imageUrl: string | null;
};

export function VariantStockEditor({ variants }: { variants: Variant[] }) {
  if (variants.length === 0) return null;
  return (
    <div className="mt-10 max-w-2xl">
      <p className="text-sm font-semibold text-ink">Variantes de color</p>
      <p className="mt-1 text-xs text-ink-soft">
        El stock general del producto no aplica cuando hay variantes: la
        disponibilidad se controla acá, por color. La foto es opcional — sin
        ella, el selector muestra solo el color.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {variants.map((variant) => (
          <VariantRow key={variant.id} variant={variant} />
        ))}
      </div>
    </div>
  );
}

function VariantRow({ variant }: { variant: Variant }) {
  const [value, setValue] = useState(variant.stock);
  const [addAmount, setAddAmount] = useState("");
  const [addPending, startAddTransition] = useTransition();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirty = value !== variant.stock;

  function handleAddStock() {
    const amount = Number(addAmount);
    if (!Number.isInteger(amount) || amount <= 0) {
      setError("Ingresá una cantidad entera mayor a 0.");
      return;
    }
    startAddTransition(async () => {
      const res = await addVariantStock(variant.id, amount);
      if (res.error) {
        setError(res.error);
        return;
      }
      setError(null);
      setAddAmount("");
      if (res.newStock != null) setValue(res.newStock);
      router.refresh();
    });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      setError("La imagen pesa más de 5MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload-token",
      });
      const res = await attachVariantImage(variant.id, blob.url);
      if (res.error) {
        setError(res.error);
      } else {
        setError(null);
      }
      router.refresh();
    } catch {
      setError("No se pudo subir la imagen. Probá de nuevo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const busy = pending || uploading;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-card px-3 py-2">
      <div className="flex items-center gap-3">
        <div
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-line"
          style={{ backgroundColor: variant.swatch }}
        >
          {variant.imageUrl && (
            <Image
              src={variant.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="40px"
            />
          )}
        </div>
        <span className="w-20 text-sm text-ink">{variant.name}</span>
        <input
          type="number"
          min={0}
          step={1}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-24 rounded-lg border border-line bg-cream px-2 py-1 text-sm outline-none focus:border-amber"
        />
        <button
          type="button"
          disabled={!dirty || pending}
          onClick={() =>
            startTransition(async () => {
              const res = await updateVariantStock(variant.id, value);
              if (res.error) {
                setError(res.error);
                return;
              }
              setError(null);
              router.refresh();
            })
          }
          className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-cream disabled:opacity-40"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            step={1}
            placeholder="+ cant."
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value)}
            className="w-16 rounded-lg border border-line bg-cream px-2 py-1 text-sm outline-none focus:border-amber"
          />
          <button
            type="button"
            disabled={addAmount === "" || addPending}
            onClick={handleAddStock}
            title="Suma esta cantidad al stock actual (para reponer inventario)"
            className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink disabled:opacity-40"
          >
            {addPending ? "Sumando…" : "Sumar stock"}
          </button>
        </div>
        <label className="cursor-pointer text-xs font-semibold text-amber-dark hover:underline">
          {uploading ? "Subiendo…" : variant.imageUrl ? "Cambiar foto" : "+ Agregar foto"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            disabled={busy}
            className="hidden"
          />
        </label>
      </div>
      {error && <span className="text-xs text-coral">{error}</span>}
    </div>
  );
}
