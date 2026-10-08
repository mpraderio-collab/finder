import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StoreMain } from "@/components/store/StoreMain";

export default function CheckoutFailurePage() {
  return (
    <>
      <Header />
      <StoreMain className="flex items-center justify-center px-6 py-24">
        <div className="max-w-[520px] border-t border-espresso pt-10 text-center">
          <p className="b-eyebrow">
            Pago rechazado
          </p>
          <h1 className="mt-4 font-serif text-[36px]/[1.1] font-medium tracking-[-0.01em]">
            No pudimos cobrar el pedido
          </h1>
          <p className="mt-4 text-[17px]/[1.6] text-taupe">
            Guardamos tu carrito. Probá con otro medio de pago o escribinos y
            lo resolvemos.
          </p>
          <Link
            href="/carrito"
            className="b-btn b-btn-clay mt-8"
          >
            Reintentar el pago
          </Link>
        </div>
      </StoreMain>
      <Footer />
    </>
  );
}
