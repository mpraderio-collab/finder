"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { cartItemKey, useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";

export default function CarritoPage() {
  const { items, updateQuantity, removeItem, subtotal, lineTotals } = useCart();
  const router = useRouter();

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-[960px] px-6 py-14">
          <h1 className="font-heading text-[30px] font-extrabold text-navy">
            Tu carrito
          </h1>

          {items.length === 0 ? (
            <div className="mt-10 rounded-[14px] border border-dashed border-border-btn p-[34px] text-center">
              <p className="font-heading text-xl font-extrabold text-navy">
                Todavía no agregaste productos
              </p>
              <p className="mt-1 text-[15px] text-ink-soft">
                Explorá el catálogo y encontrá tu próxima luz.
              </p>
              <Link
                href="/catalogo"
                className="mt-5 inline-block rounded-lg bg-navy px-6 py-3 font-heading text-sm font-bold text-white hover:bg-navy-deep"
              >
                Ver catálogo
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
              <div className="flex flex-col gap-4">
                {items.map((item) => {
                  const key = cartItemKey(item.productId, item.variantName);
                  const lineTotal = lineTotals.get(key) ?? item.price * item.quantity;
                  const rawTotal = item.price * item.quantity;
                  const discount = rawTotal - lineTotal;
                  return (
                    <div
                      key={key}
                      className="flex gap-4 rounded-[14px] border border-line p-4"
                    >
                      <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-[10px] bg-surface">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="92px"
                          />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <Link
                            href={`/catalogo/${item.slug}`}
                            className="font-heading text-base font-bold text-navy hover:underline"
                          >
                            {item.name}
                          </Link>
                          {item.variantName && (
                            <p className="text-[13px] text-ink-soft">
                              {item.variantName}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center rounded-lg border border-border-input">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(key, item.quantity - 1)
                              }
                              className="px-3 py-1.5 text-ink-soft hover:text-navy"
                              aria-label="Restar cantidad"
                            >
                              −
                            </button>
                            <span className="min-w-8 text-center font-heading text-sm font-bold text-ink">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(key, item.quantity + 1)
                              }
                              disabled={item.quantity >= item.maxStock}
                              className="px-3 py-1.5 text-ink-soft hover:text-navy disabled:opacity-30"
                              aria-label="Sumar cantidad"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-heading text-[17px] font-extrabold text-navy">
                            {formatPrice(lineTotal)}
                          </span>
                        </div>
                        {discount > 0 && (
                          <p className="text-right text-[12px] font-semibold text-amber-ink">
                            Promo aplicada (ahorrás {formatPrice(discount)})
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(key)}
                        className="self-start text-ink-faint hover:text-err-ink"
                        aria-label={`Quitar ${item.name} del carrito`}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="h-fit rounded-[14px] border border-line bg-surface p-[22px]">
                <p className="font-heading text-lg font-bold text-navy">
                  Resumen
                </p>
                <div className="mt-4 flex justify-between text-sm text-ink-soft">
                  <span>Subtotal</span>
                  <span className="font-semibold text-ink">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-sm text-ink-soft">
                  <span>Envío</span>
                  <span className="font-bold text-amber-ink">Gratis</span>
                </div>
                <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
                  <span className="text-[15px] font-semibold text-ink">
                    Total
                  </span>
                  <span className="font-heading text-[26px] font-extrabold text-navy">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/checkout")}
                  className="mt-5 w-full rounded-lg bg-navy px-6 py-3 font-heading text-sm font-bold text-white transition-colors hover:bg-navy-deep"
                >
                  Continuar al pago
                </button>
                <p className="mt-2 text-center text-xs text-ink-faint">
                  Pagás con Mercado Pago
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
