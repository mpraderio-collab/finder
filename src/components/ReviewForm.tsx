"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export function ReviewForm({ productId }: { productId: string }) {
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > MAX_PHOTO_SIZE) {
      setError("La foto pesa más de 5MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadingPhoto(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/review-photo-token",
      });
      setPhotoUrl(blob.url);
    } catch {
      setError("No se pudo subir la foto. Probá de nuevo.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Elegí una calificación.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, author, rating, text, photoUrl: photoUrl ?? "" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No pudimos guardar tu reseña.");
        setSubmitting(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <p className="rounded-xl border border-amber-line bg-amber-soft px-4 py-3 text-sm font-semibold text-amber-ink">
        ¡Gracias por tu reseña! Se va a publicar apenas la revisemos.
      </p>
    );
  }

  const busy = submitting || uploadingPhoto;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex max-w-md flex-col gap-3 rounded-xl border border-line bg-bg p-5"
    >
      <p className="font-heading text-sm font-bold text-navy">Dejá tu reseña</p>

      {/* Campo señuelo, oculto para personas: si un bot lo completa, el
          endpoint descarta el envío en silencio. */}
      <input
        type="text"
        name="website"
        id="review-website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        onChange={(e) => {
          if (e.target.value) setError(null);
        }}
      />

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} estrellas`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            className="text-2xl leading-none text-amber"
          >
            {(hoverRating || rating) >= n ? "★" : <span className="text-border-input">★</span>}
          </button>
        ))}
      </div>

      <input
        type="text"
        required
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="Tu nombre"
        maxLength={80}
        className="focus-amber rounded-lg border border-border-input bg-bg px-3 py-2 text-sm outline-none"
      />

      <textarea
        required
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Contanos qué te pareció el producto"
        maxLength={1000}
        rows={3}
        className="focus-amber resize-none rounded-lg border border-border-input bg-bg px-3 py-2 text-sm outline-none"
      />

      {photoUrl ? (
        <div className="flex items-center gap-2 text-xs text-ink-soft">
          <span className="text-amber-ink">✓ Foto adjuntada</span>
          <button
            type="button"
            onClick={() => {
              setPhotoUrl(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="text-err-ink hover:underline"
          >
            Quitar
          </button>
        </div>
      ) : (
        <label className="w-fit cursor-pointer text-xs font-semibold text-amber-ink hover:underline">
          {uploadingPhoto ? "Subiendo foto…" : "+ Agregar una foto (opcional)"}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            disabled={busy}
            className="hidden"
          />
        </label>
      )}

      {error && <span className="text-xs text-err-ink">{error}</span>}

      <button
        type="submit"
        disabled={busy}
        className="w-fit rounded-lg bg-navy px-4 py-2 font-heading text-sm font-bold text-white transition-colors hover:bg-navy-deep disabled:opacity-50"
      >
        {submitting ? "Enviando…" : "Enviar reseña"}
      </button>
    </form>
  );
}
