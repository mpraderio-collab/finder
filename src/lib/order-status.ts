export const orderStatusLabels: Record<string, string> = {
  cart: "En el carrito",
  draft: "Borrador",
  pending: "Pendiente de pago",
  paid: "Pagado, pendiente de envío",
  shipped: "Enviado",
  cancelled: "Cancelado",
  failed: "Pago fallido",
};

export const orderStatusColors: Record<string, string> = {
  cart: "bg-surface text-ink-soft",
  draft: "bg-surface text-ink-soft",
  pending: "bg-warn-bg text-warn-ink",
  paid: "bg-ok-bg text-ok-ink",
  shipped: "bg-info-bg text-info-ink",
  cancelled: "bg-err-bg text-err-ink",
  failed: "bg-err-bg text-err-ink",
};

// Estados válidos para ventas manuales una vez confirmadas (nunca vuelven
// a "draft" desde acá — ver finalizeManualSale).
export const manualSaleStatuses = ["paid", "shipped", "cancelled"] as const;

// El estado del pedido (`status`) mezcla dos cosas: si la venta está cobrada y
// si el envío salió. Estas funciones las separan para mostrarlas y cambiarlas
// por su lado, sin tocar los datos guardados.
//
// Venta: pending | failed | cancelled | paid, y en ventas manuales además
// "unpaid" (confirmada pero sin cobrar, el fiado). Envío: not_shipped | shipped.
export type SaleState = "pending" | "failed" | "cancelled" | "paid" | "unpaid" | "draft";
export type ShippingState = "not_shipped" | "shipped";

export function saleStateOf(order: { status: string; channel: string; isPaid: boolean }): SaleState {
  if (order.status === "draft") return "draft";
  if (order.status === "cancelled") return "cancelled";
  if (order.channel === "manual") return order.isPaid ? "paid" : "unpaid";
  if (order.status === "pending") return "pending";
  if (order.status === "failed") return "failed";
  return "paid"; // paid | shipped
}

export function shippingStateOf(order: { status: string }): ShippingState {
  return order.status === "shipped" ? "shipped" : "not_shipped";
}

export const saleStateLabels: Record<SaleState, string> = {
  draft: "Borrador",
  pending: "Pendiente de pago",
  failed: "Pago fallido",
  cancelled: "Cancelada",
  paid: "Pagada",
  unpaid: "Sin pagar (fiado)",
};

export const saleStateColors: Record<SaleState, string> = {
  draft: "bg-surface text-ink-soft",
  pending: "bg-warn-bg text-warn-ink",
  failed: "bg-err-bg text-err-ink",
  cancelled: "bg-err-bg text-err-ink",
  paid: "bg-ok-bg text-ok-ink",
  unpaid: "bg-warn-bg text-warn-ink",
};

export const shippingStateLabels: Record<ShippingState, string> = {
  not_shipped: "Sin enviar",
  shipped: "Enviado",
};

export const shippingStateColors: Record<ShippingState, string> = {
  not_shipped: "bg-surface text-ink-soft",
  shipped: "bg-info-bg text-info-ink",
};

// Opciones del selector "Estado de la venta" según el canal.
export const onlineSaleStates: SaleState[] = ["pending", "paid", "failed", "cancelled"];
export const manualSaleStates: SaleState[] = ["paid", "unpaid", "cancelled"];
