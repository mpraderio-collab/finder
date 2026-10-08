import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/d/PageTransition";

export default function CheckoutFailurePage() {
  return (
    <>
      <Header />
      <PageTransition>
        <main className="d-store flex-1 px-5 pb-24 pt-16 md:px-10">
          <div className="max-w-[620px] border-t border-d-ink pt-3">
            <p className="text-sm text-err-ink">Pago rechazado</p>
            <h1 className="mt-6 font-d-serif text-[40px] leading-[1.1] md:text-[48px]">No pudimos cobrar el pedido</h1>
            <p className="mt-4 text-[18px] leading-[1.4]">
              Guardamos tu carrito. Probá con otro medio de pago o escribinos y lo resolvemos.
            </p>
            <Link href="/carrito" className="d-btn mt-8">
              Reintentar el pago
            </Link>
          </div>
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
