"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { cartItemKey, useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";

export default function CarritoPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const router = useRouter();

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 py-14">
          <h1 className="font-heading text-3xl font-extrabold text-ink">
            Tu carrito
          </h1>

          {items.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-line bg-card p-10 text-center">
              <p className="text-ink-soft">Todavía no agregaste productos.</p>
              <Link
                href="/catalogo"
                className="mt-4 inline-block rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-cream hover:bg-amber-dark"
              >
                Ver catálogo
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              <div className="flex flex-col gap-4 lg:col-span-2">
                {items.map((item) => {
                  const key = cartItemKey(item.productId, item.variantName);
                  return (
                    <div
                      key={key}
                      className="flex gap-4 rounded-2xl border border-line bg-card p-4"
                    >
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-cream-soft">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <Link
                            href={`/catalogo/${item.slug}`}
                            className="font-heading text-base font-bold text-ink hover:underline"
                          >
                            {item.name}
                          </Link>
                          {item.variantName && (
                            <p className="text-sm text-ink-soft">
                              Color: {item.variantName}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center rounded-full border border-line">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(key, item.quantity - 1)
                              }
                              className="px-3 py-1.5 text-ink-soft hover:text-ink"
                              aria-label="Restar cantidad"
                            >
                              −
                            </button>
                            <span className="min-w-8 text-center text-sm font-semibold text-ink">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(key, item.quantity + 1)
                              }
                              disabled={item.quantity >= item.maxStock}
                              className="px-3 py-1.5 text-ink-soft hover:text-ink disabled:opacity-30"
                              aria-label="Sumar cantidad"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-semibold text-ink">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(key)}
                        className="self-start text-sm text-ink-soft hover:text-coral"
                        aria-label={`Quitar ${item.name} del carrito`}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="h-fit rounded-2xl border border-line bg-card p-6">
                <p className="font-heading text-lg font-bold text-ink">
                  Resumen
                </p>
                <div className="mt-4 flex justify-between text-sm text-ink-soft">
                  <span>Subtotal</span>
                  <span className="font-semibold text-ink">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  El envío se calcula en el siguiente paso.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/checkout")}
                  className="mt-5 w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-amber-dark"
                >
                  Continuar al pago
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
