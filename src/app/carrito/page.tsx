"use client";

import Image from "next/image";
import { FIT_PRODUCT } from "@/components/d/media";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/d/PageTransition";
import { CtaLink } from "@/components/d/CtaLink";
import { cartItemKey, useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";

export default function CarritoPage() {
  const { items, updateQuantity, removeItem, subtotal, lineTotals } = useCart();
  const router = useRouter();

  return (
    <>
      <Header />
      <PageTransition>
        <main className="d-store flex-1">
          <header className="px-5 pb-8 pt-14 md:px-10 md:pt-20">
            <h1 className="font-d-serif text-[44px] leading-none md:text-[56px]">
              Tu carrito
              {items.length > 0 && (
                <sup className="ml-1 align-super font-d-sans text-base">{items.length}</sup>
              )}
            </h1>
          </header>

          {items.length === 0 ? (
            <section className="border-t border-d-ink px-5 pb-24 pt-6 md:px-10">
              <p className="text-[22px] leading-[1.25] md:text-[26px]">Todavía no agregaste productos.</p>
              <p className="mt-2 text-sm text-d-muted">Explorá el catálogo y encontrá tu próxima luz.</p>
              <CtaLink href="/catalogo" className="mt-6">
                Ver catálogo
              </CtaLink>
            </section>
          ) : (
            <section className="grid border-t border-d-ink md:grid-cols-[minmax(0,1fr)_480px]">
              <ul className="px-5 md:border-r md:border-d-ink md:px-10">
                {items.map((item) => {
                  const key = cartItemKey(item.productId, item.variantName);
                  const lineTotal = lineTotals.get(key) ?? item.price * item.quantity;
                  const rawTotal = item.price * item.quantity;
                  const discount = rawTotal - lineTotal;
                  return (
                    <li key={key} className="flex gap-5 border-b border-d-line py-6">
                      <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-d-surface">
                        {item.image && (
                          <Image src={item.image} alt={item.name} fill className={FIT_PRODUCT} sizes="112px" />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                        <div className="flex justify-between gap-4">
                          <Link href={`/catalogo/${item.slug}`} className="d-fade font-d-serif text-[20px] leading-tight">
                            {item.name}
                          </Link>
                          <span className="shrink-0">{formatPrice(lineTotal)}</span>
                        </div>
                        {item.variantName && <p className="text-d-muted">{item.variantName}</p>}
                        {discount > 0 && (
                          <p className="text-d-muted">Promo aplicada (ahorrás {formatPrice(discount)})</p>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="flex items-center gap-5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(key, item.quantity - 1)}
                              className="d-step d-fade"
                              aria-label="Restar cantidad"
                            >
                              −
                            </button>
                            <span className="min-w-4 text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(key, item.quantity + 1)}
                              disabled={item.quantity >= item.maxStock}
                              className="d-step d-fade disabled:opacity-30"
                              aria-label="Sumar cantidad"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(key)}
                            className="d-fade text-d-muted underline underline-offset-2"
                            aria-label={`Quitar ${item.name} del carrito`}
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="bg-d-surface px-5 py-8 md:px-10">
                <p className="text-sm">Resumen</p>
                <div className="mt-6 flex justify-between border-t border-d-line pt-3 text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span>Envío</span>
                  <span>Gratis</span>
                </div>
                <div className="mt-6 flex items-baseline justify-between border-t border-d-ink pt-4">
                  <span className="text-sm">Total</span>
                  <span className="font-d-serif text-[40px] leading-none">{formatPrice(subtotal)}</span>
                </div>
                <button type="button" onClick={() => router.push("/checkout")} className="d-btn mt-6 w-full">
                  Continuar al pago
                </button>
                <p className="mt-3 text-center text-sm text-d-muted">Pagás con Mercado Pago</p>
              </div>
            </section>
          )}
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
