export const orderStatusLabels: Record<string, string> = {
  pending: "Pendiente de pago",
  paid: "Pagado",
  shipped: "Enviado",
  cancelled: "Cancelado",
  failed: "Pago fallido",
};

export const orderStatusColors: Record<string, string> = {
  pending: "bg-amber/20 text-amber-dark",
  paid: "bg-emerald-100 text-emerald-700",
  shipped: "bg-sky-100 text-sky-700",
  cancelled: "bg-coral-soft text-coral",
  failed: "bg-coral-soft text-coral",
};
