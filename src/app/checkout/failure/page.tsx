import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function CheckoutFailurePage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="max-w-md text-center">
          <span className="text-5xl">✕</span>
          <h1 className="mt-4 font-heading text-3xl font-extrabold text-ink">
            El pago no se pudo completar
          </h1>
          <p className="mt-3 text-ink-soft">
            No te preocupes, no se realizó ningún cobro. Podés volver a
            intentarlo o probar con otro medio de pago.
          </p>
          <Link
            href="/carrito"
            className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream hover:bg-amber-dark"
          >
            Volver al carrito
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
