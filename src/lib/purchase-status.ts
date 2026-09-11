export const purchaseStatusLabels: Record<string, string> = {
  draft: "Borrador",
  confirmed: "Confirmado",
  received: "Recibido",
  cancelled: "Cancelado",
};

export const purchaseStatusColors: Record<string, string> = {
  draft: "bg-surface text-ink-soft",
  confirmed: "bg-warn-bg text-warn-ink",
  received: "bg-ok-bg text-ok-ink",
  cancelled: "bg-err-bg text-err-ink",
};
