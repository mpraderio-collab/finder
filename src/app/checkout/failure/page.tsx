import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/store/PageTransition";

export default function CheckoutFailurePage() {
  return (
    <>
      <Header />
      <PageTransition>
      <main className="flex flex-1 items-center justify-center bg-e-bg px-4 py-20 text-e-ink">
        <div className="flex max-w-[460px] flex-col items-center text-center">
          <p className="e-mono text-e-muted">
            Pago rechazado
          </p>
          <h1 className="mt-3 text-[32px] font-medium leading-tight tracking-[-0.02em]">
            No pudimos cobrar el pedido
          </h1>
          <p className="mt-3 text-[15px]/[1.5] text-e-muted">
            Guardamos tu carrito. Probá con otro medio de pago o escribinos y
            lo resolvemos.
          </p>
          <Link
            href="/carrito"
            className="e-pill e-pill--dark mt-8"
          >
            Reintentar el pago
          </Link>
        </div>
      </main>
      <Footer />
      </PageTransition>
    </>
  );
}
