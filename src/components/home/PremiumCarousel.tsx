"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type CarouselSlide = {
  slug: string;
  eyebrow: string;
  title: string;
  text: string;
  imageUrl: string;
  // Dónde está la luz en la foto (% desde arriba a la izquierda).
  focusX: number | null;
  focusY: number | null;
  price: string;
};

// Punto de la pantalla donde se busca dejar la luz: el centro, porque la
// foto va a sangre y el epígrafe queda abajo.
const TARGET_X = 0.5;
const TARGET_Y = 0.5;

// object-position que lleva el punto (focus) de una foto "cover" lo más
// cerca posible del punto objetivo del contenedor.
function axisPosition(focus: number, target: number, container: number, scaled: number) {
  if (scaled <= container + 0.5) return 50;
  const p = (focus * scaled - target * container) / (scaled - container);
  return Math.min(1, Math.max(0, p)) * 100;
}

function FocusedPhoto({
  src,
  alt,
  focusX,
  focusY,
  priority,
  active,
}: {
  src: string;
  alt: string;
  focusX: number | null;
  focusY: number | null;
  priority: boolean;
  active: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setBox({ w: rect.width, h: rect.height });
    const observer = new ResizeObserver(([entry]) =>
      setBox({ w: entry.contentRect.width, h: entry.contentRect.height }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Si la foto ya terminó de cargar antes de hidratar, el onLoad no se
  // dispara: se lee el tamaño directo.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    }
  }, []);

  let objectPosition = "50% 50%";
  if (box && natural && focusX !== null && focusY !== null && box.w > 0 && box.h > 0) {
    const scale = Math.max(box.w / natural.w, box.h / natural.h);
    const x = axisPosition(focusX / 100, TARGET_X, box.w, natural.w * scale);
    const y = axisPosition(focusY / 100, TARGET_Y, box.h, natural.h * scale);
    objectPosition = `${x}% ${y}%`;
  }

  return (
    <div ref={boxRef} className="absolute inset-0">
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="100vw"
        style={{ objectPosition }}
        onLoad={(e) =>
          setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
        }
        className={`object-cover transition-opacity duration-[var(--d-light-dur)] ease-[var(--d-light-ease)] ${
          active ? "d-light-in opacity-100" : "opacity-0"
        }`}
        aria-hidden={!active}
      />
    </div>
  );
}

const SLIDE_MS = 6000;

// Hero de la home: foto a sangre que cambia con el fundido "lighting" de la
// referencia, epígrafe mínimo abajo al centro y una línea de progreso por
// producto.
export function PremiumCarousel({ slides }: { slides: CarouselSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next: number) => setIndex((next + slides.length) % slides.length),
    [slides.length],
  );

  const slide = slides[index];

  // Una pestaña por producto; cada producto puede traer varias fotos y su
  // pestaña se divide en un segmento por foto.
  const groups = useMemo(() => {
    const out: { slug: string; title: string; indices: number[] }[] = [];
    slides.forEach((s, i) => {
      const g = out.find((x) => x.slug === s.slug);
      if (g) g.indices.push(i);
      else out.push({ slug: s.slug, title: s.title, indices: [i] });
    });
    return out;
  }, [slides]);

  // Solo se montan la foto actual y sus vecinas: con muchas fotos no se
  // cargan todas de golpe.
  const mounted = new Set([index, (index + 1) % slides.length, (index - 1 + slides.length) % slides.length]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Productos destacados"
      className="relative isolate h-[min(88vh,900px)] min-h-[560px] overflow-hidden bg-d-surface font-d-sans text-d-ink"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
    >
      {slides.map((s, i) =>
        mounted.has(i) ? (
          <FocusedPhoto
            key={`${s.slug}-${i}`}
            src={s.imageUrl}
            alt={i === index ? s.title : ""}
            focusX={s.focusX}
            focusY={s.focusY}
            priority={i === 0}
            active={i === index}
          />
        ) : null,
      )}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-48 bg-gradient-to-t from-d-ink/50 to-transparent"
      />

      {/* Epígrafe mínimo abajo al centro, como en la referencia */}
      <div className="absolute inset-x-0 bottom-20 z-10 flex justify-center px-5">
        <p
          key={`c-${slide.slug}`}
          className="d-caption flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-d-bg px-4 py-2.5 text-center text-sm"
        >
          <span>
            {slide.title} — {slide.text}
          </span>
          <Link href={`/catalogo/${slide.slug}`} className="d-cta">
            Ver producto
          </Link>
        </p>
      </div>

      {/* Navegación: una pestaña por producto, con línea de progreso */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end gap-6 px-5 pb-5 md:px-10">
        <ol className="flex min-w-0 flex-1 gap-6">
          {groups.map((g) => {
            const active = g.indices.includes(index);
            return (
              <li key={g.slug} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => go(g.indices[0])}
                  aria-label={`Ir a ${g.title}`}
                  aria-current={active}
                  className="group block w-full py-2 text-left"
                >
                  <span className="flex gap-1">
                    {g.indices.map((i) => (
                      <span key={i} className="relative h-px flex-1 bg-d-bg/40">
                        {i < index && g.indices.includes(index) && (
                          <span className="absolute inset-0 bg-d-bg" />
                        )}
                        {i === index && (
                          <span
                            key={`b-${index}`}
                            className="pc-filament absolute left-0 top-0 h-px bg-d-bg"
                            style={{
                              animationDuration: `${SLIDE_MS}ms`,
                              animationPlayState: paused ? "paused" : "running",
                            }}
                            onAnimationEnd={() => go(index + 1)}
                          />
                        )}
                      </span>
                    ))}
                  </span>
                  <span
                    className={`mt-2 hidden truncate text-sm text-d-bg transition-opacity duration-[var(--d-dur)] ease-[var(--d-ease)] sm:block ${
                      active ? "opacity-100" : "opacity-50 group-hover:opacity-100"
                    }`}
                  >
                    {g.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="hidden items-center gap-5 pb-2 text-sm text-d-bg sm:flex">
          <button type="button" onClick={() => go(index - 1)} aria-label="Anterior" className="d-fade">
            ←
          </button>
          <button type="button" onClick={() => go(index + 1)} aria-label="Siguiente" className="d-fade">
            →
          </button>
        </div>
      </div>

      <style>{`
        .pc-filament { width: 0; animation-name: pc-fill; animation-timing-function: linear; animation-fill-mode: forwards; }
        .d-caption { animation: d-caption-in var(--d-dur) var(--d-ease) both; }
        @keyframes pc-fill { from { width: 0; } to { width: 100%; } }
        @keyframes d-caption-in { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .d-caption { animation: none; }
          .pc-filament { animation: none; width: 100%; }
        }
      `}</style>
    </section>
  );
}
