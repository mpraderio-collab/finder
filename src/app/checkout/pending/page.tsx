import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="max-w-[420px] rounded-[14px] border border-amber-line bg-amber-soft p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-ink">
            Pago pendiente
          </p>
          <h1 className="mt-2 font-heading text-2xl font-extrabold text-navy">
            {unavailable ? "Pedido recibido" : "Estamos esperando la confirmación"}
          </h1>
          <p className="mt-3 text-sm/[1.6] text-ink-soft">
            {unavailable
              ? "Registramos tu pedido, pero el cobro online todavía no está habilitado en la tienda. Te vamos a contactar para coordinar el pago."
              : "Mercado Pago todavía no confirmó el pago. Apenas se acredite te avisamos por mail; no hace falta que hagas nada."}
          </p>
          <Link
            href="/catalogo"
            className="mt-6 inline-block rounded-lg bg-navy px-6 py-3 font-heading text-sm font-bold text-white hover:bg-navy-deep"
          >
            Seguir comprando
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
