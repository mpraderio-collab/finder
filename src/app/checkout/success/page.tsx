import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/store/PageTransition";
import { ClearCartOnMount } from "@/components/ClearCartOnMount";
import { SuccessCheck } from "@/components/SuccessCheck";
import { PurchasePixel } from "@/components/PurchasePixel";
import { db } from "@/lib/db";
import { formatPrice, getHeroImageUrl } from "@/lib/products";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { applyPaymentToOrder } from "@/lib/order-fulfillment";

export default async function CheckoutSuccessPage(
  props: PageProps<"/checkout/success">,
) {
  const searchParams = await props.searchParams;
  const orderId =
    typeof searchParams?.order === "string" ? searchParams.order : undefined;
  const paymentId =
    typeof searchParams?.payment_id === "string" ? searchParams.payment_id : undefined;

  let order = orderId
    ? await db.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: { include: { images: true } } } } },
      })
    : null;

  // Red de contención: Mercado Pago ya redirigió acá porque el pago se
  // aprobó, pero el webhook que debería confirmarlo puede tardar, fallar o
  // no llegar nunca — ya pasó. Si el pedido todavía figura sin pagar y MP
  // nos dio el payment_id en la propia redirección, se reconcilia acá
  // mismo antes de mostrar la página (misma lógica que usa el webhook).
  if (order && order.status !== "paid" && paymentId) {
    try {
      await applyPaymentToOrder(paymentId);
      order = await db.order.findUnique({
        where: { id: orderId! },
        include: { items: { include: { product: { include: { images: true } } } } },
      });
    } catch (err) {
      console.error("Error reconciliando pago en success page:", err);
    }
  }

  return (
    <>
      <Header />
      <ClearCartOnMount />
      {order && <PurchasePixel orderId={order.id} value={order.total} />}
      <PageTransition>
        <main className="flex-1 bg-e-bg px-4 py-14 text-e-ink md:px-8">
          <div className="mx-auto flex max-w-[820px] flex-col items-center text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-e-ink text-white">
              <SuccessCheck />
            </span>
            {order && (
              <p className="e-mono mt-6 text-e-muted">
                Pedido #{order.id.slice(-6).toUpperCase()} · Pago acreditado
              </p>
            )}
            <h1 className="mt-3 text-[40px] font-medium leading-none tracking-[-0.03em] md:text-[56px]">
              Gracias por tu compra
            </h1>
            <p className="mt-4 max-w-[560px] text-[16px]/[1.5] text-e-muted">
              {order
                ? `Confirmamos tu pedido por ${formatPrice(order.total)}. Te vamos a escribir a ${order.customerEmail} con los detalles del envío.`
                : "Confirmamos tu pago. En breve te contactamos con los detalles del envío."}
            </p>

            {order && (
              <div className="mt-10 w-full bg-e-tile text-left">
                <div className="flex items-center justify-between border-b border-e-line px-6 py-4">
                  <span className="e-mono">Pedido #{order.id.slice(-6).toUpperCase()}</span>
                  <span className="e-mono text-e-muted">{order.createdAt.toLocaleDateString("es-AR")}</span>
                </div>
                <ul className="flex flex-col gap-4 px-6 py-5">
                  {order.items.map((item) => {
                    const hero = getHeroImageUrl(item.product);
                    return (
                      <li key={item.id} className="flex items-center gap-4 text-[14px]">
                        <div className="relative h-[72px] w-[60px] shrink-0 overflow-hidden bg-e-bg">
                          {hero && (
                            <Image src={hero} alt={item.product.name} fill className="object-contain" sizes="60px" />
                          )}
                        </div>
                        <span className="flex-1">
                          {item.quantity}× {item.product.name}
                          {item.variantName ? ` (${item.variantName})` : ""}
                        </span>
                        <span className="tabular-nums">
                          {formatPrice(item.lineTotal ?? item.unitPrice * item.quantity)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <ol className="grid grid-cols-3 border-t border-e-line">
                  <TimelineStep label="Pago acreditado" detail="Hoy" done />
                  <TimelineStep label="En preparación" detail="1 día hábil" />
                  <TimelineStep label="En camino" detail="3 a 5 días hábiles" />
                </ol>
              </div>
            )}

            <div className="mt-10 flex flex-wrap justify-center gap-2">
              <Link href="/catalogo" className="e-pill e-pill--dark">
                Seguir comprando
              </Link>
              <a
                href={getWhatsAppUrl(
                  order
                    ? `Hola! Tengo una consulta sobre mi pedido #${order.id.slice(-6).toUpperCase()}.`
                    : "Hola! Tengo una consulta sobre mi pedido.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="e-pill e-pill--outline"
              >
                Escribinos por WhatsApp
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </PageTransition>
    </>
  );
}

function TimelineStep({
  label,
  detail,
  done,
}: {
  label: string;
  detail: string;
  done?: boolean;
}) {
  return (
    <li className="flex flex-col gap-2 px-4 py-4">
      <span className={`h-[3px] w-full ${done ? "bg-e-ink" : "bg-e-line"}`} />
      <span className={`e-mono ${done ? "text-e-ink" : "text-e-muted"}`}>{label}</span>
      <span className="text-[12px] text-e-muted">{detail}</span>
    </li>
  );
}
