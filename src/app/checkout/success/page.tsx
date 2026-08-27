import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ClearCartOnMount } from "@/components/ClearCartOnMount";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";

export default async function CheckoutSuccessPage(
  props: PageProps<"/checkout/success">,
) {
  const searchParams = await props.searchParams;
  const orderId =
    typeof searchParams?.order === "string" ? searchParams.order : undefined;
  const order = orderId
    ? await db.order.findUnique({ where: { id: orderId } })
    : null;

  return (
    <>
      <Header />
      <ClearCartOnMount />
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="max-w-md text-center">
          <span className="text-5xl">✓</span>
          <h1 className="mt-4 font-heading text-3xl font-extrabold text-ink">
            ¡Gracias por tu compra!
          </h1>
          <p className="mt-3 text-ink-soft">
            {order
              ? `Confirmamos tu pedido por ${formatPrice(order.total)}. Te vamos a escribir a ${order.customerEmail} con los detalles del envío.`
              : "Confirmamos tu pago. En breve te contactamos con los detalles del envío."}
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
