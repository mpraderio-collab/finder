"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/store/Icons";

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

// Punto de la pantalla donde se busca dejar la luz: centrado y algo arriba,
// porque el texto del hero queda abajo a la izquierda.
const TARGET_X = 0.55;
const TARGET_Y = 0.42;

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
        className={`e-hero-photo object-cover ${active ? "opacity-100" : "opacity-0"}`}
        aria-hidden={!active}
      />
    </div>
  );
}

const SLIDE_MS = 5000;

// Hero a sangre (maap.cc): foto oscura, texto abajo a la izquierda, pastillas
// blancas a la derecha. Cada producto marcado para el carrusel rota con un
// filamento de progreso; el texto entra con el reveal escalonado de
// transitions-dev.
export function PremiumCarousel({ slides }: { slides: CarouselSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const copyRef = useRef<HTMLDivElement>(null);

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

  // transitions-dev texts reveal: replay the staggered entrance whenever the
  // product (not just the photo) changes.
  useEffect(() => {
    const block = copyRef.current;
    if (!block) return;
    block.classList.remove("is-shown");
    void block.offsetHeight;
    block.classList.add("is-shown");
  }, [slide.slug]);

  // Solo se montan la foto actual y sus vecinas: con muchas fotos no se
  // cargan todas de golpe.
  const mounted = new Set([index, (index + 1) % slides.length, (index - 1 + slides.length) % slides.length]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Productos destacados"
      className="relative isolate h-[min(88vh,850px)] min-h-[560px] overflow-hidden bg-black text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
    >
      <div className="absolute inset-0">
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5] bg-black/25 bg-[linear-gradient(to_top,rgba(0,0,0,.86)_0%,rgba(0,0,0,.62)_30%,rgba(0,0,0,.18)_62%,rgba(0,0,0,0)_100%),linear-gradient(to_right,rgba(0,0,0,.45)_0%,rgba(0,0,0,0)_60%)]"
      />

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-6 px-4 pb-8 md:px-8 md:pb-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div ref={copyRef} className="t-stagger flex max-w-[720px] flex-col gap-3">
            <span className="t-stagger-line t-stagger-line--1 e-mono">{slide.eyebrow}</span>
            <h1 className="t-stagger-line t-stagger-line--2 text-[44px] font-medium leading-[1.02] tracking-[-0.03em] md:text-[64px]">
              {slide.title}
            </h1>
            <p className="t-stagger-line t-stagger-line--3 max-w-[520px] text-[16px]/[1.4] text-white/85">
              {slide.text} · {slide.price}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/catalogo/${slide.slug}`}
              transitionTypes={["nav-forward"]}
              className="e-pill e-pill--light"
            >
              Ver producto
            </Link>
            <Link href="/catalogo" className="e-pill e-pill--light">
              Ver todo
            </Link>
          </div>
        </div>

        {/* pr deja libre la esquina del botón flotante de WhatsApp. */}
        <div className="flex items-center gap-4 pr-[72px] md:pr-[76px]">
          <ol className="flex min-w-0 flex-1 items-stretch gap-3">
            {groups.map((g) => {
              const active = g.indices.includes(index);
              return (
                <li key={g.slug} className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => go(g.indices[0])}
                    aria-label={`Ir a ${g.title}`}
                    aria-current={active}
                    className="group flex w-full flex-col gap-2 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                  >
                    <span className="flex w-full gap-1">
                      {g.indices.map((i) => (
                        <span key={i} className="relative h-px flex-1 bg-white/25">
                          {i < index && g.indices.includes(index) && (
                            <span className="absolute inset-0 bg-white" />
                          )}
                          {i === index && (
                            <span
                              key={`b-${index}`}
                              className="pc-filament absolute left-0 top-0 h-px bg-white"
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
                      className={`e-mono hidden truncate transition-opacity sm:block ${
                        active ? "opacity-100" : "opacity-50 group-hover:opacity-80"
                      }`}
                    >
                      {g.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="hidden items-center gap-1 sm:flex">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Anterior"
              className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-white/15"
            >
              <ArrowLeftIcon size={18} />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Siguiente"
              className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-white/15"
            >
              <ArrowRightIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .pc-filament { width: 0; animation-name: pc-fill; animation-timing-function: linear; animation-fill-mode: forwards; }
        @keyframes pc-fill { from { width: 0; } to { width: 100%; } }
        @media (prefers-reduced-motion: reduce) {
          .pc-filament { animation: none; width: 100%; }
        }
      `}</style>
    </section>
  );
}
