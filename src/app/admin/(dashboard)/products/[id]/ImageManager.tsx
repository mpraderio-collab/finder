"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteProductImage,
  setHeroImage,
  uploadProductImage,
} from "./image-actions";

type ProductImage = { id: string; url: string; isHero: boolean };

export function ImageManager({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const res = await uploadProductImage(productId, formData);
      if (res.error) setError(res.error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    });
  }

  return (
    <div className="mt-10 max-w-2xl">
      <p className="text-sm font-semibold text-ink">Fotos del producto</p>
      {error && <p className="mt-2 text-sm text-coral">{error}</p>}

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="flex flex-col gap-1.5">
              <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-cream-soft">
                <Image
                  src={img.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="150px"
                />
                {img.isHero && (
                  <span className="absolute left-1 top-1 rounded-full bg-ink/80 px-1.5 py-0.5 text-[10px] font-semibold text-cream">
                    Principal
                  </span>
                )}
              </div>
              <div className="flex justify-between gap-1 text-xs">
                {!img.isHero && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await setHeroImage(productId, img.id);
                        router.refresh();
                      })
                    }
                    className="text-amber-dark hover:underline disabled:opacity-50"
                  >
                    Usar como principal
                  </button>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteProductImage(productId, img.id);
                      router.refresh();
                    })
                  }
                  className="ml-auto text-coral hover:underline disabled:opacity-50"
                >
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-ink">
        {pending ? "Subiendo…" : "+ Subir foto"}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          disabled={pending}
          className="hidden"
        />
      </label>
      <p className="mt-1.5 text-xs text-ink-soft">
        JPG, PNG o WEBP, hasta 5MB. La primera foto que subas queda como
        principal.
      </p>
    </div>
  );
}
