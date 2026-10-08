"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StoreMain } from "@/components/store/StoreMain";
import { ArrowRight, CloseIcon, LockIcon } from "@/components/store/Icons";
import { cartItemKey, useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";

export default function CarritoPage() {
  const { items, updateQuantity, removeItem, subtotal, lineTotals } = useCart();
  const router = useRouter();

  return (
    <>
      <Header />
      <StoreMain>
        <section className="mx-auto max-w-[1200px] px-6 pb-24 pt-12 md:px-16 md:pt-20">
          <p className="b-eyebrow">Carrito</p>
          <h1 className="mt-4 font-serif text-[40px]/[1.05] font-medium tracking-[-0.02em] md:text-[56px]/[1.05]">
            Tu carrito
          </h1>

          {items.length === 0 ? (
            <div className="mt-12 border-y border-linen py-16 text-center">
              <p className="font-serif text-[28px]">Todavía no agregaste productos</p>
              <p className="mt-2 text-[15px] text-taupe">
                Elegí una escena y encontrá tu próxima luz.
              </p>
              <Link href="/catalogo" className="b-btn b-btn-clay mt-8">
                Ver catálogo
                <ArrowRight size={16} className="b-arrow" />
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
              <ul className="border-t border-linen">
                {items.map((item) => {
                  const key = cartItemKey(item.productId, item.variantName);
                  const lineTotal = lineTotals.get(key) ?? item.price * item.quantity;
                  const rawTotal = item.price * item.quantity;
                  const discount = rawTotal - lineTotal;
                  return (
                    <li key={key} className="flex gap-5 border-b border-linen py-6">
                      <Link
                        href={`/catalogo/${item.slug}`}
                        transitionTypes={["nav-forward"]}
                        className="group relative h-[104px] w-[88px] shrink-0 overflow-hidden bg-sand sm:h-[128px] sm:w-[108px]"
                      >
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="b-zoom object-cover"
                            sizes="108px"
                          />
                        )}
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <Link
                              href={`/catalogo/${item.slug}`}
                              transitionTypes={["nav-forward"]}
                              className="b-link font-serif text-xl/[1.25]"
                            >
                              {item.name}
                            </Link>
                            {item.variantName && (
                              <p className="mt-1 text-sm text-taupe">Color: {item.variantName}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(key)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center text-taupe transition-colors hover:text-espresso"
                            aria-label={`Quitar ${item.name} del carrito`}
                          >
                            <CloseIcon size={16} />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-end justify-between gap-3">
                          <div className="flex items-center border border-linen">
                            <button
                              type="button"
                              onClick={() => updateQuantity(key, item.quantity - 1)}
                              className="px-3.5 py-2 text-taupe transition-colors hover:text-espresso"
                              aria-label="Restar cantidad"
                            >
                              −
                            </button>
                            <span className="min-w-6 text-center text-sm tabular-nums">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(key, item.quantity + 1)}
                              disabled={item.quantity >= item.maxStock}
                              className="px-3.5 py-2 text-taupe transition-colors hover:text-espresso disabled:opacity-30"
                              aria-label="Sumar cantidad"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="font-serif text-xl tabular-nums">{formatPrice(lineTotal)}</p>
                            {discount > 0 && (
                              <p className="text-[13px] font-semibold text-clay-ink">
                                Promo aplicada · ahorrás {formatPrice(discount)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <aside className="h-fit bg-sand p-7 lg:sticky lg:top-28">
                <p className="font-serif text-[26px]">Resumen</p>
                <dl className="mt-6 flex flex-col gap-3 text-[15px]">
                  <div className="flex justify-between">
                    <dt className="text-taupe">Subtotal</dt>
                    <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-taupe">Envío</dt>
                    <dd className="font-semibold text-clay-ink">Gratis</dd>
                  </div>
                </dl>
                <div className="mt-6 flex items-baseline justify-between border-t border-linen pt-6">
                  <span className="text-[15px] font-semibold">Total</span>
                  <span className="font-serif text-[36px] leading-none tabular-nums">{formatPrice(subtotal)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/checkout")}
                  className="b-btn b-btn-clay mt-7 w-full"
                >
                  Continuar al pago
                  <ArrowRight size={16} className="b-arrow" />
                </button>
                <p className="mt-4 flex items-center justify-center gap-2 text-[13px] text-taupe">
                  <LockIcon size={14} /> Pagás con Mercado Pago
                </p>
              </aside>
            </div>
          )}
        </section>
      </StoreMain>
      <Footer />
    </>
  );
}
