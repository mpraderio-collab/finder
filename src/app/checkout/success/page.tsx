import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ClearCartOnMount } from "@/components/ClearCartOnMount";
import { SuccessCheck } from "@/components/SuccessCheck";
import { PurchasePixel } from "@/components/PurchasePixel";
import { PageTransition } from "@/components/d/PageTransition";
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
        <main className="d-store flex-1 px-5 pb-24 pt-16 md:px-10">
          <div className="mx-auto max-w-[820px]">
            <span className="flex h-14 w-14 items-center justify-center border border-d-ink">
              <SuccessCheck />
            </span>
            {order && (
              <p className="mt-6 text-sm text-d-muted">
                Pedido #{order.id.slice(-6).toUpperCase()} · Pago acreditado
              </p>
            )}
            <h1 className="mt-2 font-d-serif text-[40px] leading-[1.1] md:text-[56px]">Gracias por tu compra</h1>
            <p className="mt-4 max-w-[620px] text-[18px] leading-[1.4]">
              {order
                ? `Confirmamos tu pedido por ${formatPrice(order.total)}. Te vamos a escribir a ${order.customerEmail} con los detalles del envío.`
                : "Confirmamos tu pago. En breve te contactamos con los detalles del envío."}
            </p>

            {order && (
              <div className="mt-10 border-t border-d-ink">
                <div className="flex items-center justify-between py-3 text-sm">
                  <span>Pedido #{order.id.slice(-6).toUpperCase()}</span>
                  <span className="text-d-muted">{order.createdAt.toLocaleDateString("es-AR")}</span>
                </div>
                <ul>
                  {order.items.map((item) => {
                    const hero = getHeroImageUrl(item.product);
                    return (
                      <li key={item.id} className="flex items-center gap-4 border-t border-d-line py-3 text-sm">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-d-surface">
                          {hero && (
                            <Image src={hero} alt={item.product.name} fill className="object-cover" sizes="56px" />
                          )}
                        </div>
                        <span className="flex-1">
                          {item.quantity}× {item.product.name}
                          {item.variantName ? ` (${item.variantName})` : ""}
                        </span>
                        <span>{formatPrice(item.lineTotal ?? item.unitPrice * item.quantity)}</span>
                      </li>
                    );
                  })}
                </ul>
                <ol className="grid grid-cols-3 border-y border-d-ink text-sm">
                  <TimelineStep label="Pago acreditado" detail="Hoy" done />
                  <TimelineStep label="En preparación" detail="1 día hábil" />
                  <TimelineStep label="En camino" detail="3 a 5 días hábiles" />
                </ol>
              </div>
            )}

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/catalogo" className="d-btn">
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
                className="d-btn-outline"
              >
                Escribinos por WhatsApp
              </a>
            </div>
          </div>
        </main>
      </PageTransition>
      <Footer />
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
    <li className="border-l border-d-line px-3 py-4 first:border-l-0 first:pl-0">
      <p className={done ? "" : "text-d-muted"}>
        <span
          aria-hidden="true"
          className={`mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle ${done ? "bg-d-ink" : "border border-d-muted"}`}
        />
        {label}
      </p>
      <p className="mt-0.5 text-d-muted">{detail}</p>
    </li>
  );
}
