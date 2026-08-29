export const orderStatusLabels: Record<string, string> = {
  pending: "Pendiente de pago",
  paid: "Pagado",
  shipped: "Enviado",
  cancelled: "Cancelado",
  failed: "Pago fallido",
};

export const orderStatusColors: Record<string, string> = {
  pending: "bg-warn-bg text-warn-ink",
  paid: "bg-ok-bg text-ok-ink",
  shipped: "bg-info-bg text-info-ink",
  cancelled: "bg-err-bg text-err-ink",
  failed: "bg-err-bg text-err-ink",
};
