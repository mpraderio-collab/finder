"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/store/PageTransition";
import { PromoProgress } from "@/components/store/PromoProgress";
import { QuantityPill } from "@/components/store/QuantityPill";
import { cartItemKey, useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";

export default function CarritoPage() {
  const { items, updateQuantity, removeItem, subtotal, lineTotals, itemCount } = useCart();
  const router = useRouter();

  return (
    <>
      <Header />
      <PageTransition>
        <main className="flex-1 bg-e-bg text-e-ink">
          <section className="px-4 pb-16 pt-10 md:px-8 md:pt-14">
            <h1 className="text-[44px] font-medium leading-none tracking-[-0.03em] md:text-[64px]">
              Tu carrito
              <sup className="e-mono ml-2 align-super text-e-muted">({itemCount})</sup>
            </h1>

            {items.length === 0 ? (
              <div className="mt-10 flex flex-col items-start gap-4 border-t border-e-line pt-10">
                <p className="text-[28px] font-medium leading-tight">Todavía no agregaste productos</p>
                <p className="text-[14px] text-e-muted">Explorá el catálogo y encontrá tu próxima luz.</p>
                <Link href="/catalogo" className="e-pill e-pill--dark">
                  Ver catálogo
                </Link>
              </div>
            ) : (
              <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px]">
                <div className="flex flex-col">
                  <div className="border-y border-e-line py-5">
                    <PromoProgress items={items} />
                  </div>
                  <ul className="divide-y divide-e-line border-b border-e-line">
                    {items.map((item) => {
                      const key = cartItemKey(item.productId, item.variantName);
                      const lineTotal = lineTotals.get(key) ?? item.price * item.quantity;
                      const rawTotal = item.price * item.quantity;
                      const discount = rawTotal - lineTotal;
                      return (
                        <li key={key} className="flex gap-5 py-6">
                          <Link
                            href={`/catalogo/${item.slug}`}
                            transitionTypes={["nav-forward"]}
                            className="relative h-[150px] w-[122px] shrink-0 overflow-hidden bg-e-tile"
                          >
                            {item.image && (
                              <Image src={item.image} alt={item.name} fill className="object-cover" sizes="122px" />
                            )}
                          </Link>
                          <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <Link
                                  href={`/catalogo/${item.slug}`}
                                  transitionTypes={["nav-forward"]}
                                  className="text-[16px] leading-snug hover:underline hover:underline-offset-4"
                                >
                                  {item.name}
                                </Link>
                                {item.variantName && (
                                  <p className="e-mono mt-1 text-e-muted">{item.variantName}</p>
                                )}
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1">
                                <span className="text-[16px] tabular-nums">{formatPrice(lineTotal)}</span>
                                {discount > 0 && (
                                  <span className="e-mono text-e-muted">Ahorrás {formatPrice(discount)}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <QuantityPill
                                value={item.quantity}
                                onDecrement={() => updateQuantity(key, item.quantity - 1)}
                                onIncrement={() => updateQuantity(key, item.quantity + 1)}
                                canDecrement={item.quantity > 1}
                                canIncrement={item.quantity < item.maxStock}
                              />
                              <button
                                type="button"
                                onClick={() => removeItem(key)}
                                aria-label={`Quitar ${item.name} del carrito`}
                                className="text-[13px] text-e-muted underline underline-offset-4 transition-colors hover:text-e-ink"
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <aside className="flex h-fit flex-col gap-4 bg-e-tile p-6 lg:sticky lg:top-24">
                  <p className="e-mono">Resumen</p>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-e-muted">Subtotal</span>
                    <span className="tabular-nums">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                    <span className="text-e-muted">Envío</span>
                    <span>Gratis</span>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-e-line pt-4">
                    <span className="e-mono">Total</span>
                    <span className="text-[32px] font-medium tabular-nums tracking-[-0.02em]">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/checkout")}
                    className="e-pill e-pill--dark h-12 w-full"
                  >
                    Continuar al pago
                  </button>
                  <p className="text-center text-[12px] text-e-muted">Pagás con Mercado Pago</p>
                </aside>
              </div>
            )}
          </section>
        </main>
        <Footer />
      </PageTransition>
    </>
  );
}
