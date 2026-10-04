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

// Punto de la pantalla donde se busca dejar la luz: a la derecha del
// centro, porque el costado izquierdo queda bajo el degradé del texto.
const TARGET_X = 0.6;
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
        sizes="(min-width: 768px) 55vw, 100vw"
        style={{ objectPosition }}
        onLoad={(e) =>
          setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
        }
        className={`object-cover transition-opacity duration-[900ms] ${
          active ? "pc-photo opacity-100" : "opacity-0"
        }`}
        aria-hidden={!active}
      />
    </div>
  );
}

const SLIDE_MS = 5000;

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
      className="pc-root relative isolate overflow-hidden bg-[#061f33] text-[#fff4dc]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
    >
      <div className="mx-auto grid min-h-[620px] max-w-[1400px] md:min-h-[min(86vh,760px)] ">
        {/* Degradés a todo el ancho: la foto se disuelve en el fondo, sin corte */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5] max-md:bg-[#061f33]/65 md:bg-[linear-gradient(to_right,#061f33_0%,#061f33_36%,rgba(6,31,51,.6)_50%,rgba(6,31,51,0)_82%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-1/3 bg-gradient-to-t from-[#061f33] to-transparent"
        />

        {/* Texto */}
        <div className="relative z-10 flex flex-col justify-center gap-6 px-6 pb-40 pt-20 md:pb-32 md:pl-12 md:pr-4 lg:pl-20">
          <p key={`e-${slide.slug}`} className="pc-rise text-xs font-bold uppercase tracking-[0.28em] text-amber">
            {slide.eyebrow}
          </p>
          <h1
            key={`t-${slide.slug}`}
            className="pc-rise font-heading text-[44px] font-extrabold leading-[1.02] tracking-[-0.035em] md:text-[68px]"
            style={{ animationDelay: "80ms" }}
          >
            {slide.title}
          </h1>
          <p
            key={`p-${slide.slug}`}
            className="pc-rise max-w-[440px] text-[17px]/[1.65] text-[#fff4dc]/70"
            style={{ animationDelay: "160ms" }}
          >
            {slide.text}
          </p>
          <div
            key={`c-${slide.slug}`}
            className="pc-rise flex flex-wrap items-center gap-4"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              href={`/catalogo/${slide.slug}`}
              className="rounded-full bg-amber px-8 py-4 font-heading text-sm font-bold text-[#061f33] transition-colors hover:bg-[#ffc04d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber"
            >
              Ver producto
            </Link>
            <Link
              href="/catalogo"
              className="font-heading text-sm font-bold text-[#fff4dc]/80 underline decoration-amber/60 decoration-2 underline-offset-8 transition-colors hover:text-white"
            >
              Ver todo el catálogo
            </Link>
            <span className="font-heading text-sm font-semibold text-[#fff4dc]/55">{slide.price}</span>
          </div>
        </div>

        {/* Foto: la luz se enciende al entrar cada slide */}
        <div className="absolute inset-0 md:left-[34%]">
          <div
            key={`g-${index}`}
            aria-hidden
            className="pc-lamp pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2"
          />
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
        </div>
      </div>

      {/* Navegación: una pestaña por producto, con filamento de progreso */}
      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#061f33]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-stretch gap-2 px-6 md:px-12 lg:px-20">
          <ol className="flex min-w-0 flex-1 items-stretch">
            {groups.map((g) => {
              const active = g.indices.includes(index);
              return (
                <li key={g.slug} className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => go(g.indices[0])}
                    aria-label={`Ir a ${g.title}`}
                    aria-current={active}
                    className="group relative block w-full truncate py-5 pr-4 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber"
                  >
                    <span
                      className={`block truncate font-heading text-[13px] font-bold transition-colors ${
                        active ? "text-white" : "text-[#fff4dc]/45 group-hover:text-[#fff4dc]/80"
                      }`}
                    >
                      {g.title}
                    </span>
                    <span className="absolute inset-x-0 top-0 flex gap-1 pr-4">
                      {g.indices.map((i) => (
                        <span key={i} className="relative h-[2px] flex-1 bg-white/10">
                          {i < index && g.indices.includes(index) && (
                            <span className="absolute inset-0 bg-amber" />
                          )}
                          {i === index && (
                            <span
                              key={`b-${index}`}
                              className="pc-filament absolute left-0 top-0 h-[2px] bg-amber"
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
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="hidden items-center gap-2 pl-6 sm:flex">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Anterior"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-white transition-colors hover:border-amber hover:text-amber focus-visible:outline-2 focus-visible:outline-amber"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Siguiente"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-white transition-colors hover:border-amber hover:text-amber focus-visible:outline-2 focus-visible:outline-amber"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .pc-lamp {
          background: radial-gradient(closest-side, rgba(240,160,28,.5), rgba(240,160,28,.12) 55%, transparent 75%);
          mix-blend-mode: screen;
          animation: pc-lamp-on 1400ms cubic-bezier(.2,.7,.2,1) both;
        }
        .pc-photo { animation: pc-photo-on 1600ms cubic-bezier(.2,.7,.2,1) both; }
        .pc-rise { animation: pc-rise 800ms cubic-bezier(.2,.7,.2,1) both; }
        .pc-filament { width: 0; animation-name: pc-fill; animation-timing-function: linear; animation-fill-mode: forwards; }
        @keyframes pc-lamp-on { from { opacity: 0; transform: translate(-50%,-50%) scale(.6); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        @keyframes pc-photo-on { from { filter: brightness(.45) saturate(.8); transform: scale(1.06); } to { filter: brightness(1) saturate(1); transform: scale(1); } }
        @keyframes pc-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes pc-fill { from { width: 0; } to { width: 100%; } }
        @media (prefers-reduced-motion: reduce) {
          .pc-lamp, .pc-photo, .pc-rise { animation: none; }
          .pc-filament { animation: none; width: 100%; }
        }
      `}</style>
    </section>
  );
}
