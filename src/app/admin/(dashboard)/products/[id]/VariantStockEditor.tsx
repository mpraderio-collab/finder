"use client";

import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addVariantStock, updateVariantStock } from "../actions";
import {
  attachVariantImage,
  deleteVariantImage,
  reorderVariantImages,
} from "./image-actions";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type VariantImage = { id: string; url: string; type: string };

type Variant = {
  id: string;
  name: string;
  swatch: string;
  stock: number;
  images: VariantImage[];
};

export function VariantStockEditor({ variants }: { variants: Variant[] }) {
  if (variants.length === 0) return null;
  return (
    <div className="mt-10 max-w-2xl">
      <p className="text-sm font-semibold text-ink">Variantes de color</p>
      <p className="mt-1 text-xs text-ink-soft">
        El stock general del producto no aplica cuando hay variantes: la
        disponibilidad se controla acá, por color. Las fotos son opcionales
        — sin ellas, el selector muestra solo el color, y al elegir la
        variante en la tienda se ven las fotos generales del producto.
      </p>
      <div className="mt-3 flex flex-col gap-3">
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

  const [items, setItems] = useState(variant.images);
  const [prevImages, setPrevImages] = useState(variant.images);
  if (variant.images !== prevImages) {
    setPrevImages(variant.images);
    setItems(variant.images);
  }
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  function handleDrop(dropIndex: number) {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
    if (from === null || from === dropIndex) return;

    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(dropIndex, 0, moved);
    setItems(next);

    startTransition(async () => {
      const res = await reorderVariantImages(
        variant.id,
        next.map((img) => img.id),
      );
      if (res.error) setError(res.error);
      router.refresh();
    });
  }

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
      const res = await attachVariantImage(variant.id, blob.url, file.type);
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
  const coverUrl = items[0]?.url;

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-line bg-bg px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-line"
          style={{ backgroundColor: variant.swatch }}
        >
          {coverUrl && (
            <Image src={coverUrl} alt="" fill className="object-cover" sizes="40px" />
          )}
        </div>
        <span className="w-20 text-sm text-ink">{variant.name}</span>
        <input
          type="number"
          min={0}
          step={1}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-24 rounded-lg border border-line bg-bg px-2 py-1 text-sm outline-none focus:border-amber"
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
          className="rounded-lg bg-navy px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
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
            className="w-16 rounded-lg border border-line bg-bg px-2 py-1 text-sm outline-none focus:border-amber"
          />
          <button
            type="button"
            disabled={addAmount === "" || addPending}
            onClick={handleAddStock}
            title="Suma esta cantidad al stock actual (para reponer inventario)"
            className="rounded-lg border border-border-btn px-3 py-1 text-xs font-semibold text-navy disabled:opacity-40"
          >
            {addPending ? "Sumando…" : "Sumar stock"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pl-[52px]">
        {items.map((img, index) => (
          <div
            key={img.id}
            draggable={!busy}
            onDragStart={() => {
              dragIndexRef.current = index;
              setDraggingIndex(index);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragOverIndex !== index) setDragOverIndex(index);
            }}
            onDragLeave={() => {
              setDragOverIndex((current) => (current === index ? null : current));
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(index);
            }}
            onDragEnd={() => {
              dragIndexRef.current = null;
              setDraggingIndex(null);
              setDragOverIndex(null);
            }}
            className={`group relative h-12 w-12 shrink-0 cursor-grab overflow-hidden rounded-md border-2 bg-surface transition-opacity active:cursor-grabbing ${
              draggingIndex === index ? "opacity-40" : ""
            } ${
              dragOverIndex === index && draggingIndex !== index
                ? "border-amber"
                : "border-line"
            }`}
          >
            {img.type === "video" ? (
              <video src={img.url} muted playsInline className="h-full w-full object-cover" />
            ) : (
              <Image src={img.url} alt="" fill className="object-cover" sizes="48px" />
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                startTransition(async () => {
                  await deleteVariantImage(variant.id, img.id);
                  router.refresh();
                })
              }
              aria-label="Borrar foto"
              className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink/70 text-[10px] leading-none text-white opacity-0 group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}
        <label className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md border border-dashed border-border-btn text-xs font-semibold text-amber-ink hover:bg-surface">
          {uploading ? "…" : "+"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            onChange={handleUpload}
            disabled={busy}
            className="hidden"
          />
        </label>
      </div>

      {error && <span className="pl-[52px] text-xs text-err-ink">{error}</span>}
    </div>
  );
}
