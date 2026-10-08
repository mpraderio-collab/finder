"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, cartItemKey } from "@/lib/cart-context";
import { trackEvent, getSessionId } from "@/lib/analytics";
import { formatPrice } from "@/lib/products";
import { shippingMethods, type ShippingMethod } from "@/lib/shipping";
import { PROVINCES, getShippingCostForProvince } from "@/lib/shipping-zones";
import { ArrowLeftIcon, CardIcon, LockIcon, ReturnIcon, TruckIcon } from "@/components/store/Icons";
import { PageTransition } from "@/components/store/PageTransition";

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

  return (
    <>
      <header
        data-store
        style={{ viewTransitionName: "site-header" }}
        className="sticky top-0 z-40 border-b border-e-line bg-e-bg"
      >
        <div className="grid h-[72px] grid-cols-[1fr_auto_1fr] items-center px-4 md:px-8">
          <Link
            href="/carrito"
            transitionTypes={["nav-back"]}
            className="e-mono flex items-center gap-2 text-e-ink transition-opacity hover:opacity-60"
          >
            <ArrowLeftIcon size={16} />
            <span className="hidden sm:inline">Volver al carrito</span>
          </Link>
          <Link href="/" className="text-[20px] font-bold tracking-[0.2em] text-e-ink">
            FINDER
          </Link>
          <span className="e-mono flex items-center justify-end gap-2 text-e-ink">
            <LockIcon size={16} />
            <span className="hidden sm:inline">Compra segura</span>
          </span>
        </div>
      </header>
      <PageTransition>
        <main className="flex-1 bg-e-bg text-e-ink">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(380px,520px)]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-10 px-4 py-10 md:px-8 lg:px-16">
              {error && (
                <p className="rounded-[16px] border border-err-line bg-err-bg px-4 py-3 text-[13px] text-err-ink">
                  {error}
                </p>
              )}

              <Step number={1} title="Contacto">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nombre y apellido">
                    <input
                      required
                      autoComplete="name"
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      className="e-input"
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={form.customerEmail}
                      onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                      className="e-input"
                    />
                  </Field>
                </div>
                <Field label="Teléfono">
                  <input
                    required
                    autoComplete="tel"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    className="e-input"
                  />
                </Field>
              </Step>

              <Step number={2} title="Entrega">
                <Field label="Dirección">
                  <input
                    required
                    autoComplete="street-address"
                    placeholder="Calle, número, piso/depto"
                    value={form.shippingAddress}
                    onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                    className="e-input"
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Ciudad">
                    <input
                      required
                      autoComplete="address-level2"
                      value={form.shippingCity}
                      onChange={(e) => setForm({ ...form, shippingCity: e.target.value })}
                      className="e-input"
                    />
                  </Field>
                  <Field label="Provincia">
                    <select
                      required
                      value={form.shippingProvince}
                      onChange={(e) => setForm({ ...form, shippingProvince: e.target.value })}
                      className="e-input"
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
                      className="e-input"
                    />
                  </Field>
                </div>
                <div className="flex flex-col gap-2">
                  {(Object.entries(shippingMethods) as [ShippingMethod, (typeof shippingMethods)[ShippingMethod]][]).map(
                    ([key, method]) => {
                      const selected = shippingMethod === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setShippingMethod(key)}
                          aria-pressed={selected}
                          className={`flex items-center gap-4 rounded-[24px] border px-5 py-4 text-left transition-colors ${
                            selected ? "border-e-ink" : "border-e-line hover:border-e-faint"
                          }`}
                        >
                          <span
                            className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                              selected ? "border-e-ink" : "border-e-faint"
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full bg-e-ink transition-transform ${
                                selected ? "scale-100" : "scale-0"
                              }`}
                            />
                          </span>
                          <span className="flex flex-1 flex-col">
                            <span className="text-[14px]">{method.label}</span>
                            <span className="text-[12px] text-e-muted">{method.detail}</span>
                          </span>
                          <span className="text-[14px] tabular-nums">
                            {form.shippingProvince ? formatPrice(shippingCost) : ""}
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>
              </Step>

              <Step number={3} title="Pago">
                <div className="flex items-center gap-4 rounded-[24px] border border-e-ink px-5 py-4">
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-e-ink">
                    <span className="h-2 w-2 rounded-full bg-e-ink" />
                  </span>
                  <CardIcon size={20} />
                  <span className="flex flex-col">
                    <span className="text-[14px]">Mercado Pago</span>
                    <span className="text-[12px] text-e-muted">
                      Tarjeta de crédito o débito, cuotas o dinero en cuenta
                    </span>
                  </span>
                </div>
                <button type="submit" disabled={submitting} className="e-pill e-pill--dark h-12 w-full sm:w-fit sm:px-10">
                  {submitting ? "Redirigiendo…" : `Pagar ${formatPrice(total)} con Mercado Pago`}
                </button>
                <p className="flex items-center gap-2 text-[12px] text-e-muted">
                  <LockIcon size={14} />
                  Al continuar te llevamos a Mercado Pago para completar el pago.
                </p>
              </Step>
            </form>

            <aside className="flex flex-col gap-5 bg-e-tile px-4 py-10 md:px-8 lg:min-h-[calc(100vh-72px)] lg:px-12">
              <p className="e-mono">Resumen del pedido ({items.reduce((n, i) => n + i.quantity, 0)})</p>
              <ul className="flex flex-col gap-4">
                {items.map((item) => (
                  <li key={cartItemKey(item.productId, item.variantName)} className="flex items-center gap-4">
                    <div className="relative h-[72px] w-[60px] shrink-0 overflow-hidden bg-e-bg">
                      {item.image && (
                        <Image src={item.image} alt={item.name} fill className="object-contain" sizes="60px" />
                      )}
                      <span className="e-mono absolute right-1 top-1 rounded-full bg-e-ink px-1.5 text-[10px] leading-4 text-white">
                        {item.quantity}
                      </span>
                    </div>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[14px]">{item.name}</span>
                      {item.variantName && <span className="e-mono text-e-muted">{item.variantName}</span>}
                    </span>
                    <span className="text-[14px] tabular-nums">
                      {formatPrice(
                        lineTotals.get(cartItemKey(item.productId, item.variantName)) ??
                          item.price * item.quantity,
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-e-line pt-5">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-[24px] bg-e-bg px-5 py-3 text-[13px]">
                    <span>
                      Cupón {appliedCoupon.code} aplicado (−{appliedCoupon.percentOff}%)
                    </span>
                    <button
                      type="button"
                      onClick={() => setAppliedCoupon(null)}
                      className="text-e-muted underline underline-offset-4 hover:text-e-ink"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-2">
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
                        className="e-input flex-1 uppercase"
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={couponChecking || !couponInput.trim()}
                        className="e-pill e-pill--outline h-12 shrink-0"
                      >
                        {couponChecking ? "…" : "Aplicar"}
                      </button>
                    </div>
                    {couponError && <span className="text-xs text-err-ink">{couponError}</span>}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 border-t border-e-line pt-5 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-e-muted">Subtotal</span>
                  <span className="tabular-nums">{formatPrice(subtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between">
                    <span className="text-e-muted">Descuento ({appliedCoupon.code})</span>
                    <span className="tabular-nums">−{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-e-muted">Envío</span>
                  <span className="tabular-nums">
                    {form.shippingProvince ? formatPrice(shippingCost) : "Elegí tu provincia"}
                  </span>
                </div>
              </div>
              <div className="flex items-baseline justify-between border-t border-e-line pt-5">
                <span className="e-mono">Total</span>
                <span className="text-[40px] font-medium leading-none tabular-nums tracking-[-0.02em]">
                  {formatPrice(total)}
                </span>
              </div>
              <ul className="flex flex-col gap-2 text-[12px] text-e-muted">
                <li className="flex items-center gap-2">
                  <LockIcon size={14} /> Pago procesado por Mercado Pago
                </li>
                <li className="flex items-center gap-2">
                  <TruckIcon size={14} /> Envío a todo el país con Correo Argentino
                </li>
                <li className="flex items-center gap-2">
                  <ReturnIcon size={14} /> Cambios en 30 días
                </li>
              </ul>
            </aside>
          </div>
        </main>
        <footer className="flex flex-col justify-between gap-2 border-t border-e-line px-4 py-4 sm:flex-row md:px-8">
          <span className="e-mono text-e-muted">© {new Date().getFullYear()} Finder</span>
          <Link href="/contacto" className="e-mono text-e-muted hover:text-e-ink">
            Ayuda
          </Link>
        </footer>
      </PageTransition>
    </>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-center gap-3">
        <span className="e-mono grid h-6 w-6 place-items-center rounded-full bg-e-ink text-white">
          {number}
        </span>
        <span className="e-mono">{title}</span>
      </h2>
      {children}
    </section>
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
      <span className="pl-5 text-[12px] text-e-muted">{label}</span>
      {children}
    </label>
  );
}
