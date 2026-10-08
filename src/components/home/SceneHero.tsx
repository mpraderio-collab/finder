"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight } from "@/components/store/Icons";

export type HeroScene = {
  id: string;
  number: string;
  name: string;
  productName: string;
  headline: string;
  text: string;
  href: string;
  cta: string;
  priceNote: string;
  imageUrl: string;
  focusX: number | null;
  focusY: number | null;
};

const AUTO_ADVANCE_MS = 8000;
// Lo que tarda el texto en apagarse antes de cambiar de escena (salida de
// texts reveal, 200ms).
const TEXT_EXIT_MS = 200;

// Hero a pantalla completa con tabs de escenas (Leer / Trabajar / Ambientar).
// - La línea de la escena activa se desliza entre tabs (transitions-dev
//   "tabs sliding").
// - El texto sale con un fundido corto y vuelve a entrar escalonado
//   ("texts reveal").
// - La foto nueva aparece con un fundido largo encima de la anterior.
export function SceneHero({ scenes }: { scenes: HeroScene[] }) {
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(0);
  const copyRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const pausedRef = useRef(false);
  const activeRef = useRef(0);

  const movePill = useCallback((index: number, animate: boolean) => {
    const bar = tabsRef.current;
    const pill = pillRef.current;
    const tab = bar?.querySelectorAll<HTMLElement>(".t-tab")[index];
    if (!pill || !tab) return;
    if (!animate) {
      const prev = pill.style.transition;
      pill.style.transition = "none";
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
      void pill.offsetWidth;
      pill.style.transition = prev;
    } else {
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
    }
  }, []);

  useLayoutEffect(() => {
    movePill(0, false);
    function onResize() {
      movePill(activeRef.current, false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // Solo al montar: después la mueve `select`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Primera entrada del texto del hero.
  useEffect(() => {
    const raf = requestAnimationFrame(() => copyRef.current?.classList.add("is-shown"));
    return () => cancelAnimationFrame(raf);
  }, []);

  const select = useCallback(
    (index: number) => {
      if (index === activeRef.current) return;
      activeRef.current = index;
      setActive(index);
      movePill(index, true);
      const copy = copyRef.current;
      if (!copy) {
        setShown(index);
        return;
      }
      copy.classList.add("is-hiding");
      copy.classList.remove("is-shown");
      setTimeout(() => {
        setShown(index);
        copy.classList.remove("is-hiding");
        void copy.offsetHeight;
        copy.classList.add("is-shown");
      }, TEXT_EXIT_MS);
    },
    [movePill],
  );

  // Avanza solo cada 8s, salvo que el usuario esté encima o haya pedido
  // menos movimiento.
  useEffect(() => {
    if (scenes.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => {
      if (pausedRef.current || document.hidden) return;
      select((activeRef.current + 1) % scenes.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(interval);
  }, [scenes.length, select]);

  const scene = scenes[shown];

  return (
    <section
      className="relative isolate flex min-h-[640px] flex-col justify-end overflow-hidden bg-night text-cream md:h-[calc(100svh-120px)] md:max-h-[780px]"
      aria-roledescription="carousel"
      aria-label="Escenas"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onFocus={() => (pausedRef.current = true)}
      onBlur={() => (pausedRef.current = false)}
    >
      {scenes.map((s, i) => (
        <div
          key={s.id}
          aria-hidden={i !== active}
          className={`absolute inset-0 -z-10 transition-opacity duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={s.imageUrl}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className={`object-cover ${i === active ? "b-photo-fade" : ""}`}
            style={{
              objectPosition:
                s.focusX !== null && s.focusY !== null ? `${s.focusX}% ${s.focusY}%` : "60% 50%",
            }}
          />
        </div>
      ))}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(31,24,19,0.86)_0%,rgba(31,24,19,0.55)_45%,rgba(31,24,19,0.15)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-[linear-gradient(0deg,rgba(31,24,19,0.7),transparent)]" />

      <div className="mx-auto w-full max-w-[1440px] px-6 pb-10 pt-24 md:px-16 md:pb-14">
        <div ref={copyRef} className="t-stagger max-w-[760px]">
          <p className="t-stagger-line t-stagger-line--1 text-[13px] font-semibold uppercase tracking-[0.16em] text-cream/80">
            Una luz para cada momento del día
          </p>
          <h1 className="t-stagger-line t-stagger-line--2 mt-5 font-serif text-[48px]/[1.02] font-medium tracking-[-0.02em] sm:text-[64px]/[1.02] lg:text-[84px]/[1.02]">
            {scene.headline}
          </h1>
          <p className="t-stagger-line t-stagger-line--3 mt-5 max-w-[560px] text-[17px]/[1.5] text-cream/85 md:text-lg/[1.5]">
            {scene.text}
          </p>
          <div className="t-stagger-line t-stagger-line--4 mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href={scene.href} transitionTypes={["nav-forward"]} className="b-btn b-btn-clay">
              {scene.cta}
              <ArrowRight size={16} className="b-arrow" />
            </Link>
            <span className="text-[15px] text-cream/80">{scene.priceNote}</span>
          </div>
        </div>

        {scenes.length > 1 && (
          <div
            ref={tabsRef}
            role="tablist"
            aria-label="Elegí una escena"
            className="t-tabs mt-12 grid border-t border-cream/25 md:mt-12"
            style={{ gridTemplateColumns: `repeat(${scenes.length}, minmax(0, 1fr))` }}
          >
            <span ref={pillRef} className="t-tabs-pill bg-cream" aria-hidden="true" />
            {scenes.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                onClick={() => select(i)}
                className={`t-tab flex flex-col items-start gap-1.5 pt-5 text-left ${
                  i === active ? "text-cream" : "text-cream/55 hover:text-cream/85"
                }`}
              >
                <span className="flex flex-col font-serif text-[17px] leading-tight sm:block sm:text-lg md:text-[22px]">
                  <span className="text-[12px] tabular-nums sm:mr-2 sm:text-[0.75em]">{s.number}</span>
                  {s.name}
                </span>
                <span className="hidden text-sm sm:block">{s.productName}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
