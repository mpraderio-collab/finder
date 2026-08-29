"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/Footer";
import { useCart, cartItemKey } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";
import { shippingMethods, type ShippingMethod } from "@/lib/shipping";

type FormState = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingProvince: string;
  shippingZip: string;
};

const initialForm: FormState = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  shippingAddress: "",
  shippingCity: "",
  shippingProvince: "",
  shippingZip: "",
};

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("correo");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shippingCost = shippingMethods[shippingMethod].cost;
  const total = subtotal + shippingCost;

  useEffect(() => {
    // Se demora un tick para dar tiempo a que useSyncExternalStore adopte el
    // carrito persistido en localStorage antes de decidir si redirigir.
    const timeout = setTimeout(() => {
      if (items.length === 0) router.replace("/carrito");
    }, 0);
    return () => clearTimeout(timeout);
  }, [items.length, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          shippingMethod,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            variantName: i.variantName,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No pudimos procesar el pedido.");
        setSubmitting(false);
        return;
      }

      if (data.paymentUnavailable) {
        router.push(`/checkout/pending?order=${data.orderId}&unavailable=1`);
        return;
      }

      window.location.href = data.initPoint;
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="border-b border-line bg-bg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="shrink-0">
            <Image
              src="/brand/finder-logo.png"
              alt="Finder"
              width={1463}
              height={303}
              className="h-[22px] w-auto"
            />
          </Link>
          <div className="flex items-center gap-6 text-[13px] font-semibold">
            <span className="border-b-2 border-line pb-1 text-navy">
              1 Carrito
            </span>
            <span className="border-b-2 border-amber pb-1 text-navy">
              2 Envío
            </span>
            <span className="pb-1 text-ink-faint">3 Pago</span>
          </div>
          <span className="hidden text-sm text-ink-soft sm:inline">
            Compra segura 🔒
          </span>
        </div>
      </header>
      <main className="flex-1">
        <section className="mx-auto grid max-w-[1060px] gap-7 px-6 py-9 lg:grid-cols-[1fr_360px]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <p className="rounded-[10px] border border-err-line bg-err-bg px-3 py-2 text-[13px] text-err-ink">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-4 rounded-[14px] border border-line bg-surface p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre y apellido">
                  <input
                    required
                    value={form.customerName}
                    onChange={(e) =>
                      setForm({ ...form, customerName: e.target.value })
                    }
                    className="input"
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    required
                    value={form.customerEmail}
                    onChange={(e) =>
                      setForm({ ...form, customerEmail: e.target.value })
                    }
                    className="input"
                  />
                </Field>
              </div>

              <Field label="Teléfono">
                <input
                  required
                  value={form.customerPhone}
                  onChange={(e) =>
                    setForm({ ...form, customerPhone: e.target.value })
                  }
                  className="input"
                />
              </Field>

              <Field label="Dirección">
                <input
                  required
                  placeholder="Calle, número, piso/depto"
                  value={form.shippingAddress}
                  onChange={(e) =>
                    setForm({ ...form, shippingAddress: e.target.value })
                  }
                  className="input"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Ciudad">
                  <input
                    required
                    value={form.shippingCity}
                    onChange={(e) =>
                      setForm({ ...form, shippingCity: e.target.value })
                    }
                    className="input"
                  />
                </Field>
                <Field label="Provincia">
                  <input
                    required
                    value={form.shippingProvince}
                    onChange={(e) =>
                      setForm({ ...form, shippingProvince: e.target.value })
                    }
                    className="input"
                  />
                </Field>
                <Field label="Código postal">
                  <input
                    required
                    value={form.shippingZip}
                    onChange={(e) =>
                      setForm({ ...form, shippingZip: e.target.value })
                    }
                    className="input"
                  />
                </Field>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-ink">Entrega</p>
              <div className="mt-2 grid gap-3 grid-cols-1">
                {(Object.entries(shippingMethods) as [ShippingMethod, (typeof shippingMethods)[ShippingMethod]][]).map(
                  ([key, method]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setShippingMethod(key)}
                      className={`rounded-xl border p-3.5 text-left transition-colors ${
                        shippingMethod === key
                          ? "border-2 border-navy"
                          : "border border-line"
                      }`}
                    >
                      <p className="font-heading text-[15px] font-bold text-navy">
                        {method.label}
                      </p>
                      <p className="text-[13px] text-ink-soft">
                        {method.detail}
                      </p>
                    </button>
                  ),
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 w-fit rounded-lg bg-navy px-6 py-3.5 font-heading text-sm font-bold text-white transition-colors hover:bg-navy-deep disabled:opacity-50"
            >
              {submitting ? "Redirigiendo…" : "Ir a pagar con Mercado Pago"}
            </button>

            <style jsx global>{`
              .input {
                border-radius: 8px;
                border: 1px solid var(--color-border-input);
                background: var(--color-bg);
                padding: 12px 14px;
                font-size: 14px;
                outline: none;
              }
              .input:focus {
                border-color: var(--color-amber);
                box-shadow: 0 0 0 3px rgba(246, 168, 28, 0.15);
              }
            `}</style>
          </form>

          <div className="h-fit rounded-[14px] border border-line bg-surface p-6">
            <p className="font-heading text-lg font-bold text-navy">
              Tu pedido
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {items.map((item) => (
                <div
                  key={cartItemKey(item.productId, item.variantName)}
                  className="flex items-center gap-3 text-[13px]"
                >
                  <div className="relative h-[46px] w-[46px] shrink-0 overflow-hidden rounded-lg bg-bg">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="46px"
                      />
                    )}
                  </div>
                  <span className="flex-1 text-ink-soft">
                    {item.quantity}× {item.name}
                    {item.variantName ? ` (${item.variantName})` : ""}
                  </span>
                  <span className="font-heading text-[13px] font-bold text-ink">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-line pt-3 text-sm text-ink-soft">
              <span>Subtotal</span>
              <span className="font-semibold text-ink">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="mt-1.5 flex justify-between text-sm text-ink-soft">
              <span>Envío</span>
              <span className="font-semibold text-ink">
                {shippingCost > 0 ? formatPrice(shippingCost) : "Gratis"}
              </span>
            </div>
            <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm">
              <span className="font-semibold text-ink">Total</span>
              <span className="font-heading text-lg font-extrabold text-navy">
                {formatPrice(total)}
              </span>
            </div>
            <p className="mt-3 text-xs text-ink-faint">
              Al continuar te llevamos a Mercado Pago para completar el pago.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}
