export const orderStatusLabels: Record<string, string> = {
  draft: "Borrador",
  pending: "Pendiente de pago",
  paid: "Pagado, pendiente de envío",
  shipped: "Enviado",
  cancelled: "Cancelado",
  failed: "Pago fallido",
};

export const orderStatusColors: Record<string, string> = {
  draft: "bg-surface text-ink-soft",
  pending: "bg-warn-bg text-warn-ink",
  paid: "bg-ok-bg text-ok-ink",
  shipped: "bg-info-bg text-info-ink",
  cancelled: "bg-err-bg text-err-ink",
  failed: "bg-err-bg text-err-ink",
};

// Estados válidos para ventas manuales una vez confirmadas (nunca vuelven
// a "draft" desde acá — ver finalizeManualSale).
export const manualSaleStatuses = ["paid", "cancelled"] as const;
