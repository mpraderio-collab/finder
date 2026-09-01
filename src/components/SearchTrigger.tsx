"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/products";

type SearchProduct = {
  slug: string;
  name: string;
  tagline: string;
  price: number;
  image: string | null;
};

export function SearchTrigger() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<SearchProduct[] | null>(null);
  const loading = open && products === null;

  useEffect(() => {
    if (!open || products) return;
    fetch("/api/products/search")
      .then((res) => res.json())
      .then((data) => setProducts(data.products))
      .catch(() => setProducts([]));
  }, [open, products]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden text-sm font-medium text-ink-soft transition-colors hover:text-navy sm:inline"
      >
        Buscar
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/60 px-4 pt-[12vh]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-line bg-bg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-line px-5 py-4">
              <span className="text-ink-faint" aria-hidden="true">
                ⌕
              </span>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar productos…"
                className="flex-1 bg-transparent text-base outline-none placeholder:text-ink-faint"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar búsqueda"
                className="text-xl leading-none text-ink-faint hover:text-ink"
              >
                ×
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {loading && (
                <p className="px-3 py-6 text-center text-sm text-ink-soft">
                  Cargando…
                </p>
              )}
              {!loading && products !== null && results.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-ink-soft">
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
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                      {p.image && (
                        <Image
                          src={p.image}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-sm font-bold text-navy">
                        {p.name}
                      </p>
                      <p className="truncate text-xs text-ink-soft">
                        {p.tagline}
                      </p>
                    </div>
                    <span className="shrink-0 font-heading text-sm font-bold text-ink">
                      {formatPrice(p.price)}
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
