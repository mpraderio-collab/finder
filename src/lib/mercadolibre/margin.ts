export type MlMarginInput = {
  totalAmount: number;
  sellerShippingCost: number;
  items: {
    quantity: number;
    saleFee: number;
    productId: string | null;
    product: { costPrice: number | null } | null;
  }[];
};

export type MlMargin = {
  revenue: number;
  cogs: number;
  fee: number;
  shipping: number;
  tax: number;
  margin: number;
  // false si alguna línea no está vinculada a un producto o el producto no
  // tiene costo cargado: el margen mostrado es entonces una cota, no el real.
  complete: boolean;
};

// Margen de una venta de ML = lo vendido − costo de la mercadería − comisión
// de ML − envío a cargo del vendedor − impuestos estimados (% del precio).
// El costo es el actual del producto, igual que en el resto de Finder.
export function calculateMlMargin(order: MlMarginInput, taxPercent: number): MlMargin {
  let cogs = 0;
  let fee = 0;
  let complete = true;
  for (const item of order.items) {
    fee += item.saleFee;
    if (!item.productId || item.product?.costPrice == null) {
      complete = false;
      continue;
    }
    cogs += item.quantity * item.product.costPrice;
  }
  const revenue = order.totalAmount;
  const shipping = order.sellerShippingCost;
  const tax = Math.round((revenue * taxPercent) / 100);
  return { revenue, cogs, fee, shipping, tax, margin: revenue - cogs - fee - shipping - tax, complete };
}
