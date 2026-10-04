"use client";

import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  attachProductImage,
  deleteProductImage,
  reorderProductImages,
  setHeroImage,
  toggleCarouselImage,
} from "./image-actions";

type ProductImage = { id: string; url: string; type: string; isHero: boolean; showInCarousel: boolean };

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

export function ImageManager({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Copia local para poder reordenar al instante mientras se arrastra; se
  // resincroniza cuando el server component vuelve a mandar las imágenes
  // (tras guardar el orden, subir o borrar).
  const [items, setItems] = useState(images);
  const [prevImages, setPrevImages] = useState(images);
  if (images !== prevImages) {
    setPrevImages(images);
    setItems(images);
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
      const res = await reorderProductImages(
        productId,
        next.map((img) => img.id),
      );
      if (res.error) setError(res.error);
      router.refresh();
    });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      setError(isVideo ? "El video pesa más de 50MB." : "La imagen pesa más de 5MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload-token",
      });
      const res = await attachProductImage(productId, blob.url, file.type);
      if (res.error) setError(res.error);
      router.refresh();
    } catch {
      setError("No se pudo subir el archivo. Probá de nuevo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const busy = uploading || pending;

  return (
    <div className="mt-10 max-w-2xl">
      <p className="text-sm font-semibold text-ink">Fotos y videos del producto</p>
      {error && <p className="mt-2 text-sm text-err-ink">{error}</p>}

      {items.length > 0 && (
        <>
          <p className="mt-3 text-xs text-ink-soft">
            Arrastrá las fotos para cambiar el orden en que se muestran.
          </p>
          <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
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
              className={`flex cursor-grab flex-col gap-1.5 rounded-lg transition-opacity active:cursor-grabbing ${
                draggingIndex === index ? "opacity-40" : ""
              }`}
            >
              <div
                className={`relative aspect-square overflow-hidden rounded-lg border bg-surface ${
                  dragOverIndex === index && draggingIndex !== index
                    ? "border-2 border-amber"
                    : "border-line"
                }`}
              >
                {img.type === "video" ? (
                  <video
                    src={img.url}
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="150px"
                  />
                )}
                {img.type === "video" && (
                  <span className="absolute right-1 top-1 rounded-full bg-navy/85 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    ▶ Video
                  </span>
                )}
                {img.isHero && (
                  <span className="absolute left-1 top-1 rounded-full bg-navy/85 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Principal
                  </span>
                )}
              </div>
              <div className="flex justify-between gap-1 text-xs">
                {!img.isHero && img.type !== "video" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await setHeroImage(productId, img.id);
                        if (res.error) setError(res.error);
                        router.refresh();
                      })
                    }
                    className="text-amber-ink hover:underline disabled:opacity-50"
                  >
                    Usar como principal
                  </button>
                )}
                {img.type !== "video" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await toggleCarouselImage(productId, img.id);
                        if (res.error) setError(res.error);
                        router.refresh();
                      })
                    }
                    className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold disabled:opacity-50 ${
                      img.showInCarousel
                        ? "border-amber bg-amber-soft text-amber-ink"
                        : "border-line text-ink-faint hover:text-ink"
                    }`}
                  >
                    {img.showInCarousel ? "En el carrusel" : "Al carrusel"}
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteProductImage(productId, img.id);
                      router.refresh();
                    })
                  }
                  className="ml-auto text-err-ink hover:underline disabled:opacity-50"
                >
                  Borrar
                </button>
              </div>
            </div>
            ))}
          </div>
        </>
      )}

      <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-border-btn px-4 py-2 text-sm font-semibold text-navy hover:bg-surface">
        {uploading ? "Subiendo…" : "+ Subir foto o video"}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          onChange={handleUpload}
          disabled={busy}
          className="hidden"
        />
      </label>
      <p className="mt-1.5 text-xs text-ink-soft">
        Fotos: JPG, PNG o WEBP, hasta 5MB. Videos: MP4, WEBM o MOV, hasta
        50MB. La primera foto que subas queda como principal (los videos
        nunca son la principal).
      </p>
    </div>
  );
}
