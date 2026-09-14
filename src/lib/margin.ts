export type MarginableItem = { quantity: number; product: { costPrice: number | null } };

// Costo de mercadería vendida — usa el costo actual del producto (no hay
// una foto histórica del costo al momento de la venta), mismo criterio que
// ya usa el margen de /admin/products.
export function calculateCogs(items: MarginableItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * (item.product.costPrice ?? 0), 0);
}

// Margen en pesos = lo cobrado − costo de mercadería − costo real de envío
// (lo que le cuesta a Finder despachar, no lo que se le cobra al cliente).
export function calculateMargin(
  revenue: number,
  cogs: number,
  shippingCost: number | null,
): number {
  return revenue - cogs - (shippingCost ?? 0);
}
