"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";

export type CarouselSlide = {
  slug: string;
  eyebrow: string;
  title: string;
  text: string;
  imageUrl: string;
  price: string;
};

const SLIDE_MS = 6500;

export function PremiumCarousel({ slides }: { slides: CarouselSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next: number) => setIndex((next + slides.length) % slides.length),
    [slides.length],
  );

  const slide = slides[index];

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
          <p key={`e-${index}`} className="pc-rise text-xs font-bold uppercase tracking-[0.28em] text-amber">
            {slide.eyebrow}
          </p>
          <h1
            key={`t-${index}`}
            className="pc-rise font-heading text-[44px] font-extrabold leading-[1.02] tracking-[-0.035em] md:text-[68px]"
            style={{ animationDelay: "80ms" }}
          >
            {slide.title}
          </h1>
          <p
            key={`p-${index}`}
            className="pc-rise max-w-[440px] text-[17px]/[1.65] text-[#fff4dc]/70"
            style={{ animationDelay: "160ms" }}
          >
            {slide.text}
          </p>
          <div
            key={`c-${index}`}
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
          {slides.map((s, i) => (
            <Image
              key={s.slug}
              src={s.imageUrl}
              alt={i === index ? s.title : ""}
              fill
              priority={i === 0}
              sizes="(min-width: 768px) 55vw, 100vw"
              className={`object-cover transition-opacity duration-[900ms] ${
                i === index ? "pc-photo opacity-100" : "opacity-0"
              }`}
              aria-hidden={i !== index}
            />
          ))}
        </div>
      </div>

      {/* Navegación: una pestaña por producto, con filamento de progreso */}
      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#061f33]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-stretch gap-2 px-6 md:px-12 lg:px-20">
          <ol className="flex min-w-0 flex-1 items-stretch">
            {slides.map((s, i) => (
              <li key={s.slug} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Ir a ${s.title}`}
                  aria-current={i === index}
                  className="group relative block w-full truncate py-5 pr-4 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber"
                >
                  <span
                    className={`block truncate font-heading text-[13px] font-bold transition-colors ${
                      i === index ? "text-white" : "text-[#fff4dc]/45 group-hover:text-[#fff4dc]/80"
                    }`}
                  >
                    {s.title}
                  </span>
                  <span className="absolute inset-x-0 top-0 h-[2px] bg-white/10" />
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
                </button>
              </li>
            ))}
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
