"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Media = { id: string; url: string; type: string };

// Carrusel de ancho completo con todas las fotos y videos del producto.
// Cada foto se muestra entera (nunca recortada — hay infografías con texto)
// sobre el fondo de la página.
export function ProductPhotoWall({
  name,
  media,
  photoCount,
  videoCount,
}: {
  name: string;
  media: Media[];
  photoCount: number;
  videoCount: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.min(media.length - 1, Math.max(0, i));
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  }, [media.length]);

  // El índice sigue al scroll real (deslizar con el dedo, rueda o flechas).
  const onScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }, []);

  // La miniatura activa se mantiene a la vista en la tira de abajo. Se
  // desplaza solo la tira (no la página), y nunca al montar.
  useEffect(() => {
    const strip = thumbsRef.current;
    const thumb = strip?.children[index] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    strip.scrollTo({
      left: thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2,
      behavior: "smooth",
    });
  }, [index]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={`${name} — fotos y videos`}
      className="border-t border-d-ink pb-16 pt-3 font-d-sans text-d-ink"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") goTo(index + 1);
        if (e.key === "ArrowLeft") goTo(index - 1);
      }}
    >
      <div className="grid gap-4 px-5 pb-8 md:grid-cols-[330px_1fr] md:px-10">
        <p className="text-sm">En detalle</p>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="max-w-[820px] text-[22px] leading-[1.25] md:text-[26px]">Mirá el producto de cerca.</p>
          <p className="text-sm text-d-muted">
            {photoCount} {photoCount === 1 ? "foto" : "fotos"}
            {videoCount > 0 && ` y ${videoCount} ${videoCount === 1 ? "video" : "videos"}`} · deslizá o usá las
            flechas
          </p>
        </div>
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          onScroll={onScroll}
          tabIndex={0}
          className="flex h-[min(74vh,760px)] min-h-[380px] snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth bg-d-surface [scrollbar-width:none] focus-visible:outline-1 focus-visible:-outline-offset-2 focus-visible:outline-d-ink [&::-webkit-scrollbar]:hidden"
        >
          {media.map((m, i) => (
            <div
              key={m.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${media.length}`}
              className="relative h-full w-full shrink-0 snap-center overflow-hidden"
            >
              {m.type === "video" ? (
                <video
                  src={m.url}
                  controls
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : (
                <Image
                  src={m.url}
                  alt={`${name} — foto ${i + 1}`}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              )}
            </div>
          ))}
        </div>

        {media.length > 1 && (
          <div className="absolute inset-x-5 bottom-4 flex items-center justify-between text-sm md:inset-x-10">
            <span className="bg-d-bg px-2.5 py-1">
              {index + 1} / {media.length}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                disabled={index === 0}
                aria-label="Anterior"
                className="d-fade bg-d-bg px-3 py-1 disabled:opacity-30"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                disabled={index === media.length - 1}
                aria-label="Siguiente"
                className="d-fade bg-d-bg px-3 py-1 disabled:opacity-30"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 pt-4 md:px-10">
        <div
          ref={thumbsRef}
          className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {media.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ver ${m.type === "video" ? "video" : "foto"} ${i + 1}`}
              aria-current={i === index}
              className={`relative h-16 w-16 shrink-0 overflow-hidden border transition-opacity duration-[var(--d-dur)] ease-[var(--d-ease)] sm:h-[72px] sm:w-[72px] ${
                i === index ? "border-d-ink" : "border-transparent opacity-50 hover:opacity-100"
              }`}
            >
              {m.type === "video" ? (
                <span className="grid h-full w-full place-items-center bg-d-surface text-xs">Video</span>
              ) : (
                <Image src={m.url} alt="" fill sizes="72px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
