import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StoreMain } from "@/components/store/StoreMain";
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
      <StoreMain className="flex items-center justify-center px-6 py-24">
        <div className="max-w-[520px] border-t border-espresso pt-10 text-center">
          <p className="b-eyebrow">
            Pago pendiente
          </p>
          <h1 className="mt-4 font-serif text-[36px]/[1.1] font-medium tracking-[-0.01em]">
            {unavailable ? "Pedido recibido" : "Estamos esperando la confirmación"}
          </h1>
          <p className="mt-4 text-[17px]/[1.6] text-taupe">
            {unavailable
              ? "Registramos tu pedido, pero el cobro online todavía no está habilitado en la tienda. Te vamos a contactar para coordinar el pago."
              : "Mercado Pago todavía no confirmó el pago. Apenas se acredite te avisamos por mail; no hace falta que hagas nada."}
          </p>
          <Link
            href="/catalogo"
            className="b-btn b-btn-clay mt-8"
          >
            Seguir comprando
          </Link>
        </div>
      </StoreMain>
      <Footer />
    </>
  );
}
