"use client";

import { Wordmark } from "@/components/store/Wordmark";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/Footer";
import { StoreMain } from "@/components/store/StoreMain";
import {
  ArrowLeft,
  ArrowRight,
  CardIcon,
  CheckIcon,
  LockIcon,
  ReturnIcon,
} from "@/components/store/Icons";
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
  const { items, subtotal, lineTotals, itemCount } = useCart();
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
  const errorRef = useRef<HTMLParagraphElement>(null);
  const couponWrapRef = useRef<HTMLDivElement>(null);

  // transitions-dev "error state shake": el aviso de error (o el campo del
  // cupón) se sacude cada vez que aparece un error nuevo.
  useEffect(() => {
    if (error) replayShake(errorRef.current);
  }, [error]);

  useEffect(() => {
    if (couponError) replayShake(couponWrapRef.current?.querySelector<HTMLElement>(".t-input") ?? null);
  }, [couponError]);

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

  // Pasos visuales del formulario (es una sola página): se marcan a medida
  // que se completan los datos, sin cambiar cómo se envía el pedido.
  const contactDone = Boolean(form.customerName && form.customerEmail && form.customerPhone);
  const shippingDone = Boolean(
    form.shippingAddress && form.shippingCity && form.shippingProvince && form.shippingZip,
  );
  const currentStep = !contactDone ? 0 : !shippingDone ? 1 : 2;
  const steps = [
    { label: "Datos", detail: contactDone ? form.customerName : "Contacto" },
    { label: "Envío", detail: shippingDone ? form.shippingCity : "Dirección y entrega" },
    { label: "Pago", detail: "Mercado Pago" },
  ];

  return (
    <>
      <header
        className="store border-b border-linen bg-cream"
        style={{ viewTransitionName: "site-header" }}
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-6 py-5 md:px-16">
          <Link
            href="/carrito"
            transitionTypes={["nav-back"]}
            className="group flex items-center gap-2 text-sm text-espresso"
          >
            <ArrowLeft size={16} className="transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-1" />
            <span className="b-link hidden sm:inline">Volver al carrito</span>
          </Link>
          <Link href="/" className="shrink-0" aria-label="Finder — inicio">
            <Wordmark />
          </Link>
          <span className="flex items-center justify-end gap-2 text-sm text-taupe">
            <LockIcon size={15} />
            <span className="hidden sm:inline">Pago seguro</span>
          </span>
        </div>
      </header>
      <StoreMain>
        <section className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-6 pb-24 pt-10 md:px-16 md:pt-14 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-16">
          <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-10">
            <div>
              <h1 className="font-serif text-[36px]/[1.05] font-medium tracking-[-0.02em] md:text-[44px]">
                Finalizá tu compra
              </h1>
              <ol className="relative mt-8 grid grid-cols-3 border-t border-linen" aria-label="Pasos">
                <span
                  aria-hidden="true"
                  className="absolute -top-px left-0 h-0.5 bg-espresso transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
                {steps.map((step, i) => (
                  <li
                    key={step.label}
                    aria-current={i === currentStep ? "step" : undefined}
                    className="flex flex-col gap-1 pt-4"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition-colors duration-300 ${
                          i < currentStep
                            ? "bg-espresso text-cream"
                            : i === currentStep
                              ? "bg-clay text-paper"
                              : "border border-linen text-taupe"
                        }`}
                      >
                        {i < currentStep ? <CheckIcon size={12} /> : i + 1}
                      </span>
                      <span className={`font-serif text-lg ${i > currentStep ? "text-taupe" : ""}`}>
                        {step.label}
                      </span>
                    </span>
                    <span className="truncate pl-8 text-[13px] text-taupe">{step.detail}</span>
                  </li>
                ))}
              </ol>
            </div>

            {error && (
              <p
                ref={errorRef}
                role="alert"
                className="t-input border-l-2 border-err-ink bg-err-bg px-4 py-3 text-sm text-err-ink"
              >
                {error}
              </p>
            )}

            <fieldset className="flex flex-col gap-5">
              <legend className="mb-5 font-serif text-2xl">¿Quién recibe el pedido?</legend>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Nombre y apellido">
                  <input
                    required
                    autoComplete="name"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="b-input"
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={form.customerEmail}
                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                    className="b-input"
                  />
                </Field>
              </div>
              <Field label="Teléfono">
                <input
                  required
                  type="tel"
                  autoComplete="tel"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  className="b-input"
                />
              </Field>
            </fieldset>

            <fieldset className="flex flex-col gap-5">
              <legend className="mb-5 font-serif text-2xl">¿Dónde te lo enviamos?</legend>
              <Field label="Dirección">
                <input
                  required
                  autoComplete="street-address"
                  placeholder="Calle, número, piso/depto"
                  value={form.shippingAddress}
                  onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                  className="b-input"
                />
              </Field>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <Field label="Ciudad">
                  <input
                    required
                    autoComplete="address-level2"
                    value={form.shippingCity}
                    onChange={(e) => setForm({ ...form, shippingCity: e.target.value })}
                    className="b-input"
                  />
                </Field>
                <Field label="Provincia">
                  <select
                    required
                    value={form.shippingProvince}
                    onChange={(e) => setForm({ ...form, shippingProvince: e.target.value })}
                    className="b-input"
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
                    className="b-input"
                  />
                </Field>
              </div>

              <div className="flex flex-col gap-3" role="radiogroup" aria-label="Entrega">
                {(Object.entries(shippingMethods) as [ShippingMethod, (typeof shippingMethods)[ShippingMethod]][]).map(
                  ([key, method]) => {
                    const selected = shippingMethod === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setShippingMethod(key)}
                        className={`flex items-center gap-4 border px-5 py-4 text-left transition-colors duration-300 ${
                          selected ? "border-espresso bg-field" : "border-linen hover:border-taupe"
                        }`}
                      >
                        <span
                          className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${
                            selected ? "border-espresso" : "border-linen"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full bg-espresso transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                              selected ? "scale-100" : "scale-0"
                            }`}
                          />
                        </span>
                        <span className="flex-1">
                          <span className="block text-[15px] font-semibold">{method.label}</span>
                          <span className="block text-[13px] text-taupe">{method.detail}</span>
                        </span>
                        <span className="text-[15px] tabular-nums">
                          {form.shippingProvince ? formatPrice(shippingCost) : "—"}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-4">
              <legend className="mb-5 font-serif text-2xl">Pago</legend>
              <div className="flex items-center gap-4 border border-linen bg-field px-5 py-4">
                <CardIcon size={20} className="text-taupe" />
                <p className="text-[15px]">
                  <span className="font-semibold">Mercado Pago</span>
                  <span className="block text-[13px] text-taupe">
                    Tarjeta, cuotas o dinero en cuenta. Te llevamos a Mercado Pago para pagar.
                  </span>
                </p>
              </div>
            </fieldset>

            <div className="flex flex-col-reverse gap-5 border-t border-linen pt-8 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/carrito"
                transitionTypes={["nav-back"]}
                className="group flex items-center gap-2 text-sm text-espresso"
              >
                <ArrowLeft size={16} className="transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-1" />
                <span className="b-link">Volver al carrito</span>
              </Link>
              <button type="submit" disabled={submitting} className="b-btn b-btn-clay">
                <span className="t-text-swap">
                  {submitting ? "Redirigiendo…" : "Ir a pagar con Mercado Pago"}
                </span>
                {!submitting && <ArrowRight size={16} className="b-arrow" />}
              </button>
            </div>
          </form>

          <aside className="h-fit bg-sand p-7 lg:sticky lg:top-8 md:p-8">
            <div className="flex items-baseline justify-between">
              <p className="font-serif text-[26px]">Tu pedido</p>
              <p className="text-sm text-taupe">
                {itemCount} {itemCount === 1 ? "producto" : "productos"}
              </p>
            </div>
            <ul className="mt-6 flex flex-col gap-4">
              {items.map((item) => (
                <li
                  key={cartItemKey(item.productId, item.variantName)}
                  className="flex items-center gap-4"
                >
                  <div className="relative h-[60px] w-[52px] shrink-0 overflow-hidden bg-cream">
                    {item.image && (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="52px" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-[16px]">{item.name}</p>
                    <p className="text-[13px] text-taupe">
                      {item.variantName ? `${item.variantName} · ` : ""}× {item.quantity}
                    </p>
                  </div>
                  <span className="text-[15px] tabular-nums">
                    {formatPrice(
                      lineTotals.get(cartItemKey(item.productId, item.variantName)) ??
                        item.price * item.quantity,
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-linen pt-6">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-cream px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 font-semibold text-clay-ink">
                    <CheckIcon size={14} />
                    Cupón {appliedCoupon.code} aplicado (−{appliedCoupon.percentOff}%)
                  </span>
                  <button
                    type="button"
                    onClick={() => setAppliedCoupon(null)}
                    className="b-link text-[13px] text-taupe"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <div ref={couponWrapRef} className={`t-input-wrap flex flex-col gap-2 ${couponError ? "is-error" : ""}`}>
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        if (couponError) setCouponError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyCoupon();
                        }
                      }}
                      placeholder="Código de descuento"
                      aria-label="Código de descuento"
                      className={`b-input t-input flex-1 uppercase ${couponError ? "is-error" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponChecking || !couponInput.trim()}
                      className="b-btn b-btn-outline shrink-0 !px-5 !py-0 !text-sm"
                    >
                      {couponChecking ? "…" : "Aplicar"}
                    </button>
                  </div>
                  <span className="t-error-msg text-[13px] text-err-ink" aria-live="polite">
                    {couponError}
                  </span>
                </div>
              )}
            </div>

            <dl className="mt-4 flex flex-col gap-2.5 border-t border-linen pt-6 text-[15px]">
              <div className="flex justify-between">
                <dt className="text-taupe">Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-clay-ink">
                  <dt>Descuento ({appliedCoupon.code})</dt>
                  <dd className="tabular-nums">−{formatPrice(couponDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-taupe">Envío</dt>
                <dd className="tabular-nums">
                  {form.shippingProvince ? formatPrice(shippingCost) : "Elegí tu provincia"}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex items-baseline justify-between border-t border-linen pt-6">
              <span className="text-[15px] font-semibold">Total</span>
              <span className="font-serif text-[40px] leading-none tabular-nums">{formatPrice(total)}</span>
            </div>
            <ul className="mt-6 flex flex-col gap-2 text-[13px] text-taupe">
              <li className="flex items-center gap-2">
                <LockIcon size={14} /> Al continuar te llevamos a Mercado Pago para completar el pago.
              </li>
              <li className="flex items-center gap-2">
                <ReturnIcon size={14} /> Cambios en 30 días
              </li>
            </ul>
          </aside>
        </section>
      </StoreMain>
      <Footer />
    </>
  );
}

function replayShake(el: HTMLElement | null) {
  if (!el) return;
  const cs = getComputedStyle(document.documentElement);
  const ms = (name: string, fallback: number) => {
    const v = parseFloat(cs.getPropertyValue(name));
    return Number.isFinite(v) ? v : fallback;
  };
  el.classList.remove("is-shaking");
  void el.offsetWidth; // reflow para que la animación se repita
  el.classList.add("is-shaking");
  const shakeMs = ms("--shake-dur-a", 80) * 2 + ms("--shake-dur-b", 60) * 2;
  setTimeout(() => el.classList.remove("is-shaking"), shakeMs + 20);
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-taupe">{label}</span>
      {children}
    </label>
  );
}
