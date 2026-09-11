import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
      <main className="flex-1 px-6 py-16">
        <div className="mx-auto max-w-[820px] text-center">
          <span className="mx-auto flex h-[62px] w-[62px] items-center justify-center rounded-full border border-amber-line bg-amber-soft text-amber-ink">
            <SuccessCheck />
          </span>
          {order && (
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-amber-ink">
              Pedido #{order.id.slice(-6).toUpperCase()} · Pago acreditado
            </p>
          )}
          <h1 className="mt-2 font-heading text-4xl font-extrabold text-navy">
            ¡Gracias por tu compra!
          </h1>
          <p className="mt-3 text-base/[1.6] text-ink-soft">
            {order
              ? `Confirmamos tu pedido por ${formatPrice(order.total)}. Te vamos a escribir a ${order.customerEmail} con los detalles del envío.`
              : "Confirmamos tu pago. En breve te contactamos con los detalles del envío."}
          </p>

          {order && (
            <div className="mt-8 rounded-[14px] border border-line text-left">
              <div className="flex items-center justify-between rounded-t-[14px] bg-surface px-5 py-3.5">
                <span className="font-heading text-sm font-bold text-navy">
                  Pedido #{order.id.slice(-6).toUpperCase()}
                </span>
                <span className="text-xs text-ink-faint">
                  {order.createdAt.toLocaleDateString("es-AR")}
                </span>
              </div>
              <div className="flex flex-col gap-3 px-5 py-4">
                {order.items.map((item) => {
                  const hero = getHeroImageUrl(item.product);
                  return (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                        {hero && (
                          <Image
                            src={hero}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        )}
                      </div>
                      <span className="flex-1 text-ink-soft">
                        {item.quantity}× {item.product.name}
                        {item.variantName ? ` (${item.variantName})` : ""}
                      </span>
                      <span className="font-heading font-bold text-ink">
                        {formatPrice(item.lineTotal ?? item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
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

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/catalogo"
              className="rounded-lg bg-navy px-6 py-3 font-heading text-sm font-bold text-white hover:bg-navy-deep"
            >
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
              className="rounded-lg border border-border-btn bg-bg px-6 py-3 font-heading text-sm font-bold text-navy hover:bg-surface"
            >
              Escribinos por WhatsApp
            </a>
          </div>
        </div>
      </main>
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
    <div className="px-4 py-4 text-center">
      <p className={`text-sm ${done ? "text-navy" : "text-ink-faint"}`}>
        {done ? "●" : "○"}{" "}
        <span className="font-heading font-bold">{label}</span>
      </p>
      <p className="mt-0.5 text-xs text-ink-faint">{detail}</p>
    </div>
  );
}
