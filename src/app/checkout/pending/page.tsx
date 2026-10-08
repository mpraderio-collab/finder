import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/store/PageTransition";
import { ClearCartOnMount } from "@/components/ClearCartOnMount";

export default async function CheckoutPendingPage(
  props: PageProps<"/checkout/pending">,
) {
  const searchParams = await props.searchParams;
  const unavailable = searchParams?.unavailable === "1";

  return (
    <>
      <Header />
      <ClearCartOnMount />
      <PageTransition>
      <main className="flex flex-1 items-center justify-center bg-e-bg px-4 py-20 text-e-ink">
        <div className="flex max-w-[460px] flex-col items-center text-center">
          <p className="e-mono text-e-muted">
            Pago pendiente
          </p>
          <h1 className="mt-3 text-[32px] font-medium leading-tight tracking-[-0.02em]">
            {unavailable ? "Pedido recibido" : "Estamos esperando la confirmación"}
          </h1>
          <p className="mt-3 text-[15px]/[1.5] text-e-muted">
            {unavailable
              ? "Registramos tu pedido, pero el cobro online todavía no está habilitado en la tienda. Te vamos a contactar para coordinar el pago."
              : "Mercado Pago todavía no confirmó el pago. Apenas se acredite te avisamos por mail; no hace falta que hagas nada."}
          </p>
          <Link
            href="/catalogo"
            className="e-pill e-pill--dark mt-8"
          >
            Seguir comprando
          </Link>
        </div>
      </main>
      <Footer />
      </PageTransition>
    </>
  );
}
