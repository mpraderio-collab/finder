"use client";

import Image from "next/image";
import { FIT_PRODUCT } from "@/components/d/media";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageTransition } from "@/components/d/PageTransition";
import { useCart, cartItemKey } from "@/lib/cart-context";
import { trackEvent, getSessionId } from "@/lib/analytics";
import { formatPrice } from "@/lib/products";
import { shippingMethods, type ShippingMethod } from "@/lib/shipping";
import { PROVINCES, getShippingCostForProvince } from "@/lib/shipping-zones";

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
  const { items, subtotal, lineTotals } = useCart();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("correo");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percentOff: number } | null>(
    null,
  );
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);

  const shippingCost = form.shippingProvince
    ? getShippingCostForProvince(form.shippingProvince)
    : 0;
  const couponDiscount = appliedCoupon
    ? Math.round((subtotal * appliedCoupon.percentOff) / 100)
    : 0;
  const total = subtotal - couponDiscount + shippingCost;

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCouponChecking(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error ?? "No pudimos validar el código.");
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon({ code: data.code, percentOff: data.percentOff });
      setCouponInput("");
    } catch {
      setCouponError("Error de conexión. Intentá de nuevo.");
    } finally {
      setCouponChecking(false);
    }
  }
  const trackedInitiateCheckout = useRef(false);

  useEffect(() => {
    if (trackedInitiateCheckout.current) return;
    if (items.length === 0) return;
    trackedInitiateCheckout.current = true;
    trackEvent("initiate_checkout", { value: subtotal });
    // Solo se dispara una vez al entrar al checkout con ítems en el carrito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

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
          sessionId: getSessionId(),
          shippingMethod,
          couponCode: appliedCoupon?.code,
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

  const fieldsFilled = (keys: (keyof FormState)[]) => keys.every((k) => form[k].trim() !== "");

  return (
    <>
      <header
        className="border-b border-d-ink bg-d-bg font-d-sans text-d-ink"
        style={{ viewTransitionName: "site-header" }}
      >
        <div className="grid h-[72px] grid-cols-[1fr_auto_1fr] items-center px-5 text-sm md:px-10">
          <Link href="/carrito" className="d-fade justify-self-start">
            ← Volver al carrito
          </Link>
          <Link href="/" className="d-fade text-[26px] leading-none tracking-[-0.02em]">
            Finder
          </Link>
          <span className="invisible justify-self-end sm:visible">Compra segura</span>
        </div>
      </header>
      <PageTransition>
        <main className="d-store flex-1">
          <section className="grid md:grid-cols-[minmax(0,1fr)_520px]">
            <form
              id="checkout-form"
              onSubmit={handleSubmit}
              className="flex flex-col px-5 pb-16 pt-10 md:border-r md:border-d-ink md:px-10"
            >
              <h1 className="font-d-serif text-[36px] leading-none md:text-[44px]">Finalizá tu compra</h1>

              {error && (
                <p role="alert" className="mt-6 border border-err-line bg-err-bg px-3 py-2 text-sm text-err-ink">
                  {error}
                </p>
              )}

              <Step
                number="01"
                title="Contacto"
                done={fieldsFilled(["customerName", "customerEmail", "customerPhone"])}
              >
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Nombre y apellido">
                    <input
                      required
                      autoComplete="name"
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      className="d-input"
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={form.customerEmail}
                      onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                      className="d-input"
                    />
                  </Field>
                </div>
                <Field label="Teléfono">
                  <input
                    required
                    autoComplete="tel"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    className="d-input"
                  />
                </Field>
              </Step>

              <Step
                number="02"
                title="Entrega"
                done={fieldsFilled(["shippingAddress", "shippingCity", "shippingProvince", "shippingZip"])}
              >
                <Field label="Dirección">
                  <input
                    required
                    autoComplete="street-address"
                    placeholder="Calle, número, piso/depto"
                    value={form.shippingAddress}
                    onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                    className="d-input"
                  />
                </Field>
                <div className="grid gap-6 sm:grid-cols-3">
                  <Field label="Ciudad">
                    <input
                      required
                      autoComplete="address-level2"
                      value={form.shippingCity}
                      onChange={(e) => setForm({ ...form, shippingCity: e.target.value })}
                      className="d-input"
                    />
                  </Field>
                  <Field label="Provincia">
                    <select
                      required
                      value={form.shippingProvince}
                      onChange={(e) => setForm({ ...form, shippingProvince: e.target.value })}
                      className="d-input"
                    >
                      <option value="" disabled>
                        Elegí tu provincia
                      </option>
                      {PROVINCES.map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Código postal">
                    <input
                      required
                      autoComplete="postal-code"
                      value={form.shippingZip}
                      onChange={(e) => setForm({ ...form, shippingZip: e.target.value })}
                      className="d-input"
                    />
                  </Field>
                </div>
                <div role="radiogroup" aria-label="Método de entrega" className="flex flex-col">
                  {(Object.entries(shippingMethods) as [ShippingMethod, (typeof shippingMethods)[ShippingMethod]][]).map(
                    ([key, method]) => (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={shippingMethod === key}
                        onClick={() => setShippingMethod(key)}
                        className="flex items-center gap-4 border-y border-d-line py-4 text-left text-sm"
                      >
                        <span
                          aria-hidden="true"
                          className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border border-d-ink"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full bg-d-ink transition-transform duration-[var(--d-dur)] ease-[var(--d-ease)] ${
                              shippingMethod === key ? "scale-100" : "scale-0"
                            }`}
                          />
                        </span>
                        <span className="flex-1">
                          {method.label}
                          <span className="block text-d-muted">{method.detail}</span>
                        </span>
                        <span className="text-right">
                          {form.shippingProvince ? formatPrice(shippingCost) : "Elegí tu provincia"}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </Step>

              <Step number="03" title="Pago">
                <div className="flex items-center gap-4 border-y border-d-line py-4 text-sm">
                  <span
                    aria-hidden="true"
                    className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border border-d-ink"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-d-ink" />
                  </span>
                  <span className="flex-1">
                    Mercado Pago
                    <span className="block text-d-muted">Tarjeta de crédito o débito, cuotas o dinero en cuenta</span>
                  </span>
                </div>
                <p className="text-sm text-d-muted">Al continuar te llevamos a Mercado Pago para completar el pago.</p>
                <button type="submit" disabled={submitting} className="d-btn w-full sm:w-fit">
                  {submitting ? "Redirigiendo…" : "Ir a pagar con Mercado Pago"}
                </button>
              </Step>
            </form>

            <aside className="bg-d-surface px-5 py-10 md:px-10">
              <div className="md:sticky md:top-10">
                <p className="text-sm">Tu pedido ({items.reduce((n, i) => n + i.quantity, 0)})</p>
                <ul className="mt-5">
                  {items.map((item) => (
                    <li
                      key={cartItemKey(item.productId, item.variantName)}
                      className="flex items-center gap-4 border-t border-d-line py-3 text-sm"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-d-bg">
                        {item.image && (
                          <Image src={item.image} alt={item.name} fill className={FIT_PRODUCT} sizes="56px" />
                        )}
                      </div>
                      <span className="flex-1">
                        {item.name}
                        <span className="block text-d-muted">
                          {item.variantName ? `${item.variantName} · ` : ""}
                          {item.quantity} {item.quantity === 1 ? "unidad" : "unidades"}
                        </span>
                      </span>
                      <span>
                        {formatPrice(
                          lineTotals.get(cartItemKey(item.productId, item.variantName)) ??
                            item.price * item.quantity,
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-d-line py-4">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        Cupón {appliedCoupon.code} aplicado (−{appliedCoupon.percentOff}%)
                      </span>
                      <button
                        type="button"
                        onClick={() => setAppliedCoupon(null)}
                        className="d-fade text-d-muted underline underline-offset-2"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-4 border-b border-d-ink">
                        <input
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              applyCoupon();
                            }
                          }}
                          placeholder="Código de descuento"
                          aria-label="Código de descuento"
                          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm uppercase outline-none placeholder:normal-case placeholder:text-d-muted"
                        />
                        <button
                          type="button"
                          onClick={applyCoupon}
                          disabled={couponChecking || !couponInput.trim()}
                          className="d-fade shrink-0 text-sm disabled:opacity-40"
                        >
                          {couponChecking ? "Validando…" : "Aplicar"}
                        </button>
                      </div>
                      {couponError && <span className="text-sm text-err-ink">{couponError}</span>}
                    </div>
                  )}
                </div>

                <dl className="flex flex-col gap-2 border-t border-d-line pt-4 text-sm">
                  <div className="flex justify-between">
                    <dt>Subtotal</dt>
                    <dd>{formatPrice(subtotal)}</dd>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between">
                      <dt>Descuento ({appliedCoupon.code})</dt>
                      <dd>−{formatPrice(couponDiscount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt>Envío</dt>
                    <dd>{form.shippingProvince ? formatPrice(shippingCost) : "Elegí tu provincia"}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex items-baseline justify-between border-t border-d-ink pt-4">
                  <span className="text-sm">Total</span>
                  <span className="font-d-serif text-[40px] leading-none">{formatPrice(total)}</span>
                </div>
                <button type="submit" form="checkout-form" disabled={submitting} className="d-btn mt-6 w-full">
                  {submitting ? "Redirigiendo…" : `Pagar ${formatPrice(total)}`}
                </button>
                <p className="mt-3 text-sm text-d-muted">Pago procesado por Mercado Pago · Cambios en 30 días</p>
              </div>
            </aside>
          </section>
        </main>
      </PageTransition>
      <footer className="flex flex-col gap-2 border-t border-d-ink px-5 py-4 font-d-sans text-sm text-d-muted sm:flex-row sm:justify-between md:px-10">
        <span>© {new Date().getFullYear()} Finder</span>
        <Link href="/contacto" className="d-fade">
          ¿Dudas? Escribinos
        </Link>
      </footer>
    </>
  );
}

function Step({
  number,
  title,
  done,
  children,
}: {
  number: string;
  title: string;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="mt-10 grid gap-6 border-t border-d-ink pt-3 md:grid-cols-[180px_1fr]">
      <legend className="sr-only">{title}</legend>
      <p aria-hidden="true" className="text-sm">
        {number} {title}
        <span
          className={`ml-2 inline-block text-d-muted transition-opacity duration-[var(--d-dur)] ease-[var(--d-ease)] ${
            done ? "opacity-100" : "opacity-0"
          }`}
        >
          — listo
        </span>
      </p>
      <div className="flex flex-col gap-6">{children}</div>
    </fieldset>
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
    <label className="flex flex-col gap-1">
      <span className="text-sm text-d-muted">{label}</span>
      {children}
    </label>
  );
}
