"use client";

import Image from "next/image";
import { FIT_PRODUCT } from "@/components/d/media";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/products";
import { BodyPortal } from "@/components/d/BodyPortal";

type SearchProduct = {
  slug: string;
  name: string;
  tagline: string;
  price: number;
  image: string | null;
};

function cssMs(name: string, fallback: number) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return fallback;
  return raw.endsWith("ms") ? parseFloat(raw) : parseFloat(raw) * 1000 || fallback;
}

export function SearchTrigger({
  triggerClassName = "d-fade hidden sm:inline",
}: {
  triggerClassName?: string;
}) {
  // mounted: overlay is in the DOM; open: transitions-dev modal .is-open.
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<SearchProduct[] | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loading = mounted && products === null;

  function show() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setClosing(false);
    setMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
  }

  const hide = useCallback(() => {
    setOpen(false);
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      setClosing(false);
      setMounted(false);
    }, cssMs("--modal-close-dur", 150));
  }, []);

  useEffect(() => {
    if (!mounted || products) return;
    fetch("/api/products/search")
      .then((res) => res.json())
      .then((data) => setProducts(data.products))
      .catch(() => setProducts([]));
  }, [mounted, products]);

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") hide();
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [mounted, hide]);

  const normalizedQuery = query.trim().toLowerCase();
  const results =
    products === null
      ? []
      : normalizedQuery === ""
        ? products
        : products.filter(
            (p) =>
              p.name.toLowerCase().includes(normalizedQuery) ||
              p.tagline.toLowerCase().includes(normalizedQuery),
          );

  return (
    <>
      <button type="button" onClick={show} className={triggerClassName}>
        Buscar
      </button>

      {mounted && (
        <BodyPortal>
          <div
            className="d-scrim fixed inset-0 z-[70] flex items-start justify-center bg-d-ink/40 px-4 pt-[12vh] font-d-sans text-d-ink"
            data-open={open}
            onClick={hide}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Buscar productos"
              className={`t-modal w-full max-w-xl border border-d-ink bg-d-bg ${open ? "is-open" : ""} ${closing ? "is-closing" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 border-b border-d-ink px-6 py-5">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar luces…"
                  aria-label="Buscar productos"
                  className="flex-1 bg-transparent text-[22px] outline-none placeholder:text-d-muted"
                />
                <button type="button" onClick={hide} className="d-fade text-sm">
                  Cerrar
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {loading && <p className="px-6 py-8 text-sm text-d-muted">Cargando…</p>}
                {!loading && products !== null && results.length === 0 && (
                  <p className="px-6 py-8 text-sm text-d-muted">
                    {normalizedQuery === ""
                      ? "Todavía no hay productos publicados."
                      : `No encontramos productos para "${query}".`}
                  </p>
                )}
                {!loading &&
                  results.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/catalogo/${p.slug}`}
                      onClick={hide}
                      className="group flex items-center gap-4 border-b border-d-line px-6 py-4 last:border-b-0"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-d-surface">
                        {p.image && (
                          <Image src={p.image} alt="" fill className={`d-zoom ${FIT_PRODUCT}`} sizes="56px" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{p.name}</p>
                        <p className="truncate text-sm text-d-muted">{p.tagline}</p>
                      </div>
                      <span className="shrink-0 text-sm">{formatPrice(p.price)}</span>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </BodyPortal>
      )}
    </>
  );
}
