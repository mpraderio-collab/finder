"use client";

import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/products";
import { CloseIcon, SearchIcon } from "@/components/store/Icons";
import { usePresence } from "@/components/store/usePresence";

type SearchProduct = {
  slug: string;
  name: string;
  tagline: string;
  price: number;
  image: string | null;
};

export function SearchTrigger({
  triggerClassName = "flex h-11 min-w-11 items-center justify-center gap-2 rounded-full px-2 text-e-ink transition-colors hover:bg-e-tile",
  showLabel = false,
}: {
  triggerClassName?: string;
  showLabel?: boolean;
}) {
  const { state, open, close } = usePresence("--modal-close-dur", 150);
  const modalRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<SearchProduct[] | null>(null);
  const isOpen = state !== "closed";
  const loading = isOpen && products === null;

  useEffect(() => {
    if (!isOpen || products) return;
    fetch("/api/products/search")
      .then((res) => res.json())
      .then((data) => setProducts(data.products))
      .catch(() => setProducts([]));
  }, [isOpen, products]);

  // transitions-dev modal: mount at the resting scale, then flip to .is-open
  // on the next frame so the scale-up runs.
  useEffect(() => {
    if (state !== "open") return;
    const frame = requestAnimationFrame(() =>
      modalRef.current?.classList.add("is-open"),
    );
    return () => cancelAnimationFrame(frame);
  }, [state]);

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

  const modalClass = state === "closing" ? "is-closing" : "";

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={triggerClassName}
        aria-label="Buscar"
      >
        <SearchIcon size={18} />
        {showLabel ? (
          <span>Buscar</span>
        ) : (
          <span className="e-mono hidden lg:inline">Buscar</span>
        )}
      </button>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
            <div
              data-state={state}
              className="e-drawer-overlay absolute inset-0 bg-black/50"
              onClick={close}
            />
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-label="Buscar productos"
              className={`t-modal relative w-full max-w-xl overflow-hidden rounded-[24px] bg-e-bg text-e-ink ${modalClass}`}
            >
              <div className="flex items-center gap-3 border-b border-e-line px-6 py-4">
                <SearchIcon size={18} className="text-e-muted" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar luces…"
                  className="flex-1 bg-transparent text-[16px] outline-none placeholder:text-e-faint"
                />
                <button
                  type="button"
                  onClick={close}
                  aria-label="Cerrar búsqueda"
                  className="-mr-2.5 grid h-11 w-11 place-items-center rounded-full hover:bg-e-tile"
                >
                  <CloseIcon size={16} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-3">
                {loading && (
                  <p className="e-mono px-3 py-6 text-center text-e-muted">
                    Cargando…
                  </p>
                )}
                {!loading && products !== null && results.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-e-muted">
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
                      transitionTypes={["nav-forward"]}
                      onClick={close}
                      className="flex items-center gap-4 rounded-[16px] px-3 py-2.5 transition-colors hover:bg-e-tile"
                    >
                      <div className="relative h-14 w-12 shrink-0 overflow-hidden bg-e-tile">
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
                        <p className="truncate text-[14px]">{p.name}</p>
                        <p className="truncate text-[12px] text-e-muted">
                          {p.tagline}
                        </p>
                      </div>
                      <span className="shrink-0 text-[13px] tabular-nums">
                        {formatPrice(p.price)}
                      </span>
                    </Link>
                  ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
