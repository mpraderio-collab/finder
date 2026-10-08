"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/store/Icons";

type Media = { id: string; url: string; type: string };

// Carrusel de ancho completo con todas las fotos y videos del producto.
// Cada foto se muestra entera (nunca recortada — hay infografías con texto)
// sobre una versión desenfocada de sí misma que llena el resto del ancho.
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

  // La miniatura activa se mantiene a la vista en la tira de abajo.
  useEffect(() => {
    const thumb = thumbsRef.current?.children[index] as HTMLElement | undefined;
    thumb?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [index]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={`${name} — fotos y videos`}
      className="bg-black text-white"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") goTo(index + 1);
        if (e.key === "ArrowLeft") goTo(index - 1);
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-2 px-4 pb-6 pt-14 md:px-8">
        <h2 className="e-mono">
          Mirá el producto en detalle
        </h2>
        <p className="e-mono text-white/60">
          {photoCount} {photoCount === 1 ? "foto" : "fotos"}
          {videoCount > 0 && ` y ${videoCount} ${videoCount === 1 ? "video" : "videos"}`} · deslizá
          o usá las flechas
        </p>
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          onScroll={onScroll}
          tabIndex={0}
          className="flex h-[min(74vh,760px)] min-h-[380px] snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white [&::-webkit-scrollbar]:hidden"
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
                <>
                  <Image
                    src={m.url}
                    alt=""
                    aria-hidden
                    fill
                    sizes="20vw"
                    className="scale-125 object-cover opacity-45 blur-2xl"
                  />
                  <Image
                    src={m.url}
                    alt={`${name} — foto ${i + 1}`}
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    className="object-contain"
                  />
                </>
              )}
            </div>
          ))}
        </div>

        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label="Anterior"
              className="e-carousel-arrow absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-e-ink focus-visible:outline-2 focus-visible:outline-white md:left-8"
            >
              <ArrowLeftIcon size={18} />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index === media.length - 1}
              aria-label="Siguiente"
              className="e-carousel-arrow absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-e-ink focus-visible:outline-2 focus-visible:outline-white md:right-8"
            >
              <ArrowRightIcon size={18} />
            </button>
            <span className="e-mono absolute right-4 top-4 rounded-[12px] bg-white px-2.5 py-1 text-e-ink md:right-8">
              {index + 1} / {media.length}
            </span>
          </>
        )}
      </div>

      <div className="px-4 py-5 md:px-8">
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
              className={`relative h-[72px] w-[60px] shrink-0 overflow-hidden transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                i === index ? "opacity-100 outline outline-1 outline-white" : "opacity-45 hover:opacity-100"
              }`}
            >
              {m.type === "video" ? (
                <span className="e-mono grid h-full w-full place-items-center bg-white/10 text-white">Video</span>
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
