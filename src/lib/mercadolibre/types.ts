// Subconjunto de la respuesta de la API de Mercado Libre (GET /orders/{id})
// que usamos para importar una venta. Los campos que no se necesitan no se
// declaran, así un cambio en el resto de la respuesta no rompe nada.
export type MlApiOrder = {
  id: number | string;
  status: string;
  date_created: string;
  total_amount: number;
  buyer?: { nickname?: string | null } | null;
  shipping?: { id?: number | string | null } | null;
  order_items: MlApiOrderItem[];
};

export type MlApiOrderItem = {
  item: {
    id: string;
    title?: string | null;
    variation_id?: number | string | null;
  };
  quantity: number;
  unit_price: number;
  // Comisión de ML por unidad vendida (la línea paga sale_fee × quantity).
  sale_fee?: number | null;
};
