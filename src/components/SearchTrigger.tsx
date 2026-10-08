"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

// Duración de cierre del modal (--modal-close-dur).
const MODAL_CLOSE_MS = 150;

export function SearchTrigger({
  triggerClassName,
}: {
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<SearchProduct[] | null>(null);
  const loading = open && products === null;
  const { mounted, visible } = usePresence(open, MODAL_CLOSE_MS);

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
        aria-label="Buscar productos"
        className={
          triggerClassName ??
          "hidden h-9 w-9 items-center justify-center text-espresso transition-opacity hover:opacity-70 sm:flex"
        }
      >
        <SearchIcon size={18} />
        {triggerClassName && <span>Buscar</span>}
      </button>

      {mounted &&
        createPortal(
          <div
            className={`t-scrim store fixed inset-0 z-[60] flex items-start justify-center bg-night/55 px-4 pt-[12vh] ${visible ? "is-open" : ""}`}
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Buscar productos"
              className={`t-modal w-full max-w-xl rounded-[2px] bg-cream ${visible ? "is-open" : "is-closing"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-linen px-5 py-4">
                <SearchIcon size={18} className="text-taupe" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="¿Qué luz estás buscando?"
                  className="flex-1 bg-transparent font-serif text-xl text-espresso outline-none placeholder:text-taupe/70"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar búsqueda"
                  className="flex h-8 w-8 items-center justify-center text-taupe hover:text-espresso"
                >
                  <CloseIcon size={18} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto px-2 py-2">
                {loading && (
                  <p className="px-3 py-6 text-center text-sm text-taupe">Buscando…</p>
                )}
                {!loading && products !== null && results.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-taupe">
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
                      onClick={() => setOpen(false)}
                      className="group flex items-center gap-4 rounded-[2px] px-3 py-3 transition-colors hover:bg-sand"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-sand">
                        {p.image && (
                          <Image
                            src={p.image}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-serif text-[17px] text-espresso">{p.name}</p>
                        <p className="truncate text-[13px] text-taupe">{p.tagline}</p>
                      </div>
                      <span className="shrink-0 text-sm tabular-nums text-espresso">
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
