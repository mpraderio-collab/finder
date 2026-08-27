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
        <div className="max-w-md text-center">
          <span className="text-5xl">⏳</span>
          <h1 className="mt-4 font-heading text-3xl font-extrabold text-ink">
            {unavailable ? "Pedido recibido" : "Tu pago está en revisión"}
          </h1>
          <p className="mt-3 text-ink-soft">
            {unavailable
              ? "Registramos tu pedido, pero el cobro online todavía no está habilitado en la tienda. Te vamos a contactar para coordinar el pago."
              : "Algunos medios de pago tardan en confirmarse. Te avisamos por email apenas se acredite."}
          </p>
          <Link
            href="/catalogo"
            className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream hover:bg-amber-dark"
          >
            Seguir comprando
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
