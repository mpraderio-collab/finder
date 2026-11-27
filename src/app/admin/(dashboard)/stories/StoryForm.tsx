"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { upload } from "@vercel/blob/client";
import { saveStory, type StoryActionState } from "./actions";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export type StoryFormValues = {
  customerName: string;
  location: string | null;
  text: string;
  photoUrl: string | null;
  productId: string | null;
  position: number;
  published: boolean;
};

export function StoryForm({
  storyId,
  products,
  defaultValues,
}: {
  storyId: string | null;
  products: { id: string; name: string }[];
  defaultValues?: StoryFormValues;
}) {
  const [state, formAction, pending] = useActionState<StoryActionState, FormData>(
    saveStory.bind(null, storyId),
    {},
  );
  // Controlados: si el guardado vuelve con errores, no se pierde lo escrito.
  const [customerName, setCustomerName] = useState(defaultValues?.customerName ?? "");
  const [location, setLocation] = useState(defaultValues?.location ?? "");
  const [text, setText] = useState(defaultValues?.text ?? "");
  const [productId, setProductId] = useState(defaultValues?.productId ?? "");
  const [position, setPosition] = useState(String(defaultValues?.position ?? 0));
  const [published, setPublished] = useState(defaultValues?.published ?? true);
  const [photoUrl, setPhotoUrl] = useState(defaultValues?.photoUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const errors = state.fieldErrors ?? {};

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setUploadError(null);
    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError("La imagen pesa más de 5MB.");
      input.value = "";
      return;
    }
    setUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload-token",
      });
      setPhotoUrl(blob.url);
    } catch {
      setUploadError("No se pudo subir la foto. Probá de nuevo.");
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  return (
    <form action={formAction} className="mt-6 flex max-w-xl flex-col gap-4">
      {state.error && <p className="text-sm text-err-ink">{state.error}</p>}

      <Field label="Nombre del cliente" error={errors.customerName}>
        <input
          name="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          maxLength={60}
          required
          className="input"
        />
      </Field>
      <Field label="Ciudad (opcional)" error={errors.location}>
        <input
          name="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={60}
          className="input"
        />
      </Field>
      <Field label="Historia" error={errors.text} hint={`${text.length} / 500`}>
        <textarea
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          rows={5}
          required
          className="input"
        />
      </Field>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Foto (opcional)</span>
        {photoUrl && (
          <div className="flex items-end gap-3">
            <div className="relative aspect-[4/5] w-32 overflow-hidden rounded-lg border border-line">
              <Image src={photoUrl} alt="Foto de la historia" fill className="object-cover" sizes="128px" />
            </div>
            <button type="button" onClick={() => setPhotoUrl("")} className="text-sm font-semibold text-err-ink">
              Quitar foto
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Elegir foto"
          onChange={handlePhoto}
          disabled={uploading}
          className="text-sm text-ink-soft"
        />
        {uploading && <span className="text-xs text-ink-soft">Subiendo foto…</span>}
        {(uploadError || errors.photoUrl) && (
          <span className="text-xs text-err-ink">{uploadError ?? errors.photoUrl}</span>
        )}
        <input type="hidden" name="photoUrl" value={photoUrl} />
      </div>

      <Field label="Producto (opcional)" error={errors.productId}>
        <select name="productId" value={productId} onChange={(e) => setProductId(e.target.value)} className="input">
          <option value="">Ninguno</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Orden" error={errors.position} hint="El número más chico aparece primero.">
        <input
          name="position"
          type="number"
          min={0}
          max={9999}
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="input w-28"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="published" checked={published} onChange={(e) => setPublished(e.target.checked)} />
        Mostrar en la portada
      </label>

      <div className="mt-2 flex items-center gap-4">
        <button
          type="submit"
          disabled={pending || uploading}
          className="rounded-lg bg-navy px-5 py-2.5 font-heading text-sm font-bold text-white hover:bg-navy-deep disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar historia"}
        </button>
        <Link href="/admin/stories" className="text-sm font-semibold text-ink-soft">
          Cancelar
        </Link>
      </div>

      <style jsx global>{`
        .input {
          border-radius: 8px;
          border: 1px solid var(--color-border-input);
          background: var(--color-bg);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: var(--color-amber);
          box-shadow: 0 0 0 3px rgba(240, 160, 28, 0.15);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-ink-soft">{hint}</span>}
      {error && <span className="text-xs text-err-ink">{error}</span>}
    </label>
  );
}
