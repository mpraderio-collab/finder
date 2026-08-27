"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart, cartItemKey } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <Header />
      <main className="flex-1">
        <section className="mx-auto grid max-w-5xl gap-10 px-6 py-14 lg:grid-cols-3">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 lg:col-span-2"
          >
            <h1 className="font-heading text-2xl font-extrabold text-ink">
              Datos de envío
            </h1>

            {error && (
              <p className="rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">
                {error}
              </p>
            )}

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

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-fit rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-amber-dark disabled:opacity-50"
            >
              {submitting ? "Procesando…" : "Ir a pagar con Mercado Pago"}
            </button>

            <style jsx global>{`
              .input {
                border-radius: 0.5rem;
                border: 1px solid var(--color-line);
                background: var(--color-card);
                padding: 0.5rem 0.75rem;
                font-size: 0.875rem;
                outline: none;
              }
              .input:focus {
                border-color: var(--color-amber);
              }
            `}</style>
          </form>

          <div className="h-fit rounded-2xl border border-line bg-card p-6">
            <p className="font-heading text-lg font-bold text-ink">
              Tu pedido
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {items.map((item) => (
                <div
                  key={cartItemKey(item.productId, item.variantName)}
                  className="flex justify-between text-sm"
                >
                  <span className="text-ink-soft">
                    {item.quantity}× {item.name}
                    {item.variantName ? ` (${item.variantName})` : ""}
                  </span>
                  <span className="font-medium text-ink">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-line pt-4 text-sm">
              <span className="text-ink-soft">Total</span>
              <span className="font-heading text-lg font-extrabold text-ink">
                {formatPrice(subtotal)}
              </span>
            </div>
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
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
