import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ClearCartOnMount } from "@/components/ClearCartOnMount";
import { PageTransition } from "@/components/d/PageTransition";

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
        <main className="d-store flex-1 px-5 pb-24 pt-16 md:px-10">
          <div className="max-w-[620px] border-t border-d-ink pt-3">
            <p className="text-sm text-d-muted">Pago pendiente</p>
            <h1 className="mt-6 font-d-serif text-[40px] leading-[1.1] md:text-[48px]">
              {unavailable ? "Pedido recibido" : "Estamos esperando la confirmación"}
            </h1>
            <p className="mt-4 text-[18px] leading-[1.4]">
              {unavailable
                ? "Registramos tu pedido, pero el cobro online todavía no está habilitado en la tienda. Te vamos a contactar para coordinar el pago."
                : "Mercado Pago todavía no confirmó el pago. Apenas se acredite te avisamos por mail; no hace falta que hagas nada."}
            </p>
            <Link href="/catalogo" className="d-btn mt-8">
              Seguir comprando
            </Link>
          </div>
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
