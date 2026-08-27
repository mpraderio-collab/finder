const MP_API = "https://api.mercadopago.com";

export function isMercadoPagoConfigured() {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

type PreferenceItem = {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: "ARS";
};

export async function createPreference(params: {
  orderId: string;
  items: PreferenceItem[];
  payerEmail: string;
}) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("MP_ACCESS_TOKEN no está configurado.");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Evita crear preferencias duplicadas si el cliente reintenta la request.
      "X-Idempotency-Key": params.orderId,
    },
    body: JSON.stringify({
      items: params.items,
      payer: { email: params.payerEmail },
      external_reference: params.orderId,
      back_urls: {
        success: `${siteUrl}/checkout/success?order=${params.orderId}`,
        failure: `${siteUrl}/checkout/failure?order=${params.orderId}`,
        pending: `${siteUrl}/checkout/pending?order=${params.orderId}`,
      },
      auto_return: "approved",
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mercado Pago rechazó la preferencia: ${res.status} ${body}`);
  }

  return res.json() as Promise<{ id: string; init_point: string }>;
}

export async function getPayment(paymentId: string) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("MP_ACCESS_TOKEN no está configurado.");

  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`No se pudo obtener el pago ${paymentId}: ${res.status} ${body}`);
  }

  return res.json() as Promise<{
    id: number;
    status: string;
    status_detail: string;
    external_reference: string;
  }>;
}
