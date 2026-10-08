import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StoreMain } from "@/components/store/StoreMain";
import { ClearCartOnMount } from "@/components/ClearCartOnMount";
import { SuccessCheck } from "@/components/SuccessCheck";
import { PurchasePixel } from "@/components/PurchasePixel";
import { db } from "@/lib/db";
import { formatPrice, getHeroImageUrl } from "@/lib/products";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { applyPaymentToOrder } from "@/lib/order-fulfillment";
import { packshotThumbFit } from "@/components/store/productImage";

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
      <StoreMain className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[820px] text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-clay text-paper">
            <SuccessCheck />
          </span>
          {order && (
            <p className="b-eyebrow mt-6">
              Pedido #{order.id.slice(-6).toUpperCase()} · Pago acreditado
            </p>
          )}
          <h1 className="mt-3 font-serif text-[40px]/[1.05] font-medium tracking-[-0.02em] md:text-[56px]/[1.05]">
            Gracias por tu compra
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-[17px]/[1.6] text-taupe">
            {order
              ? `Confirmamos tu pedido por ${formatPrice(order.total)}. Te vamos a escribir a ${order.customerEmail} con los detalles del envío.`
              : "Confirmamos tu pago. En breve te contactamos con los detalles del envío."}
          </p>

          {order && (
            <div className="mt-12 border-t border-espresso text-left">
              <div className="flex items-center justify-between py-4">
                <span className="font-serif text-xl">
                  Pedido #{order.id.slice(-6).toUpperCase()}
                </span>
                <span className="text-sm text-taupe">
                  {order.createdAt.toLocaleDateString("es-AR")}
                </span>
              </div>
              <div className="flex flex-col gap-4 border-t border-linen py-5">
                {order.items.map((item) => {
                  const hero = getHeroImageUrl(item.product);
                  return (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      <div className="relative h-14 w-12 shrink-0 overflow-hidden bg-sand">
                        {hero && (
                          <Image
                            src={hero}
                            alt={item.product.name}
                            fill
                            className={packshotThumbFit}
                            sizes="48px"
                          />
                        )}
                      </div>
                      <span className="flex-1 text-[15px]">
                        {item.quantity}× {item.product.name}
                        {item.variantName ? ` (${item.variantName})` : ""}
                      </span>
                      <span className="font-serif text-[17px] tabular-nums">
                        {formatPrice(item.lineTotal ?? item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 border-y border-linen">
                <TimelineStep label="Pago acreditado" detail="Hoy" done />
                <TimelineStep
                  label="En preparación"
                  detail="1 día hábil"
                />
                <TimelineStep
                  label="En camino"
                  detail="3 a 5 días hábiles"
                />
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/catalogo" className="b-btn b-btn-clay">
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
              className="b-btn b-btn-outline"
            >
              Escribinos por WhatsApp
            </a>
          </div>
        </div>
      </StoreMain>
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
    <div className="px-2 py-5 text-center">
      <p className={`flex items-center justify-center gap-2 text-sm ${done ? "text-espresso" : "text-taupe"}`}>
        <span
          aria-hidden="true"
          className={`h-2 w-2 rounded-full ${done ? "bg-clay" : "border border-taupe"}`}
        />
        <span className="font-semibold">{label}</span>
      </p>
      <p className="mt-1 text-[13px] text-taupe">{detail}</p>
    </div>
  );
}
