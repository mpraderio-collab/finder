import { Resend } from "resend";
import { formatPrice } from "@/lib/products";

const FROM_ADDRESS = "Finder <pedidos@findertecno.com>";

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "RESEND_API_KEY no está configurada — no se envían emails de pedidos.",
    );
    return null;
  }
  return new Resend(apiKey);
}

type OrderItemSummary = {
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number | null;
};

type OrderEmailData = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingProvince: string;
  shippingZip: string;
  total: number;
  items: OrderItemSummary[];
};

function itemsRowsHtml(items: OrderItemSummary[]): string {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e7e0d0;">
            ${item.productName}${item.variantName ? ` — ${item.variantName}` : ""}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #e7e0d0;text-align:center;">
            ${item.quantity}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #e7e0d0;text-align:right;">
            ${formatPrice(item.lineTotal ?? item.unitPrice * item.quantity)}
          </td>
        </tr>`,
    )
    .join("");
}

type ContactMessageData = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

export async function sendContactMessage(
  data: ContactMessageData,
): Promise<{ error?: string }> {
  const client = getClient();
  if (!client) {
    return { error: "El envío de mensajes no está disponible en este momento." };
  }

  const to = process.env.ORDER_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
  if (!to) {
    console.warn(
      "Ni ORDER_NOTIFICATION_EMAIL ni ADMIN_EMAIL están configuradas — no se puede enviar el mensaje de contacto.",
    );
    return { error: "El envío de mensajes no está disponible en este momento." };
  }

  const { error } = await client.emails.send({
    from: FROM_ADDRESS,
    to,
    replyTo: data.email,
    subject: `Nuevo mensaje de contacto — ${data.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>Nuevo mensaje desde el formulario de contacto</h2>
        <p><strong>Nombre:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        ${data.phone ? `<p><strong>Teléfono:</strong> ${data.phone}</p>` : ""}
        <p style="margin-top:16px;white-space:pre-wrap;">${data.message}</p>
      </div>
    `,
  });

  if (error) {
    console.error("Error al enviar mensaje de contacto:", error);
    return { error: "No pudimos enviar tu mensaje. Probá de nuevo." };
  }
  return {};
}

export async function sendStockNotificationSignup(data: {
  email: string;
  productName: string;
}) {
  const client = getClient();
  if (!client) return;

  const to = process.env.ORDER_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
  if (!to) return;

  const { error } = await client.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Aviso de stock pedido — ${data.productName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <p><strong>${data.email}</strong> pidió que le avisen cuando vuelva a
        haber stock de <strong>${data.productName}</strong>.</p>
      </div>
    `,
  });

  if (error) console.error("Error al enviar aviso de stock pedido:", error);
}

export async function sendNewsletterSignup(email: string) {
  const client = getClient();
  if (!client) return;

  const to = process.env.ORDER_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
  if (!to) return;

  const { error } = await client.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Nuevo suscriptor al newsletter — ${email}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <p><strong>${email}</strong> se suscribió al newsletter de Finder.</p>
      </div>
    `,
  });

  if (error) console.error("Error al enviar aviso de nuevo suscriptor:", error);
}

export async function sendOrderNotificationToAdmin(order: OrderEmailData) {
  const client = getClient();
  if (!client) return;

  const to = process.env.ORDER_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL;
  if (!to) {
    console.warn(
      "Ni ORDER_NOTIFICATION_EMAIL ni ADMIN_EMAIL están configuradas — no se notifica el pedido.",
    );
    return;
  }

  const { error } = await client.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Nuevo pedido pago — ${formatPrice(order.total)}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>Nuevo pedido pago 🎉</h2>
        <p><strong>Pedido:</strong> ${order.id}</p>
        <p><strong>Cliente:</strong> ${order.customerName} (${order.customerEmail}, ${order.customerPhone})</p>
        <p><strong>Envío:</strong> ${order.shippingAddress}, ${order.shippingCity}, ${order.shippingProvince} (${order.shippingZip})</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <thead>
            <tr>
              <th style="text-align:left;border-bottom:2px solid #1c1815;padding:8px 0;">Producto</th>
              <th style="text-align:center;border-bottom:2px solid #1c1815;padding:8px 0;">Cant.</th>
              <th style="text-align:right;border-bottom:2px solid #1c1815;padding:8px 0;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsRowsHtml(order.items)}</tbody>
        </table>
        <p style="text-align:right;font-size:1.1em;margin-top:12px;">
          <strong>Total: ${formatPrice(order.total)}</strong>
        </p>
        <p style="margin-top:24px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders/${order.id}">Ver pedido en el admin →</a>
        </p>
      </div>
    `,
  });

  if (error) console.error("Error al enviar notificación de pedido:", error);
}

export async function sendOrderConfirmationToCustomer(order: OrderEmailData) {
  const client = getClient();
  if (!client) return;

  const { error } = await client.emails.send({
    from: FROM_ADDRESS,
    to: order.customerEmail,
    subject: "Confirmamos tu pedido en Finder",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>¡Gracias por tu compra, ${order.customerName}!</h2>
        <p>Confirmamos tu pago. Preparamos tu pedido para enviarlo a la brevedad.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <thead>
            <tr>
              <th style="text-align:left;border-bottom:2px solid #1c1815;padding:8px 0;">Producto</th>
              <th style="text-align:center;border-bottom:2px solid #1c1815;padding:8px 0;">Cant.</th>
              <th style="text-align:right;border-bottom:2px solid #1c1815;padding:8px 0;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsRowsHtml(order.items)}</tbody>
        </table>
        <p style="text-align:right;font-size:1.1em;margin-top:12px;">
          <strong>Total: ${formatPrice(order.total)}</strong>
        </p>
        <p style="margin-top:16px;">
          <strong>Envío a:</strong> ${order.shippingAddress}, ${order.shippingCity}, ${order.shippingProvince} (${order.shippingZip})
        </p>
        <p style="margin-top:24px;color:#4a443c;font-size:0.9em;">
          Número de pedido: ${order.id}. Ante cualquier consulta, respondé este mail o escribinos por WhatsApp.
        </p>
      </div>
    `,
  });

  if (error) console.error("Error al enviar confirmación al cliente:", error);
}
