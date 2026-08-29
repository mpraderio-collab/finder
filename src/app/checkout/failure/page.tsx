import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function CheckoutFailurePage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="max-w-[420px] rounded-[14px] border border-err-line bg-err-bg p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-err-ink">
            Pago rechazado
          </p>
          <h1 className="mt-2 font-heading text-2xl font-extrabold text-navy">
            No pudimos cobrar el pedido
          </h1>
          <p className="mt-3 text-sm/[1.6] text-ink-soft">
            Guardamos tu carrito. Probá con otro medio de pago o escribinos y
            lo resolvemos.
          </p>
          <Link
            href="/carrito"
            className="mt-6 inline-block rounded-lg bg-navy px-6 py-3 font-heading text-sm font-bold text-white hover:bg-navy-deep"
          >
            Reintentar el pago
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
