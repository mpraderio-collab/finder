// Mismo desglose de costos que trae la planilla del proveedor — se usa
// tanto en el cliente (vista previa mientras se completa el form) como en
// el server (cálculo definitivo, nunca se confía en lo que mande el
// navegador).
//
// Cotización, impuestos, costo de envío e impuesto por pago con tarjeta se
// cargan una sola vez por compra (referencian a todo el lote, no a una
// línea puntual). Los impuestos sí se prorratean por `totalLotQuantity` y
// pasan a formar parte del costo unitario de cada producto (van dentro del
// paquete que llega, ARCA los cobra por eso). El costo de envío en cambio
// NO se prorratea ni se suma al costo del producto — es un gasto de la
// compra en su conjunto (como el flete de un pedido a proveedor), se suma
// una sola vez al total de la compra y no afecta el costo/margen de cada
// producto individual.
export function calcPurchaseCosts(input: {
  quantity: number;
  unitPriceUsd: number;
  exchangeRate: number;
  taxesPesos?: number;
  shippingCostUsd?: number;
  cardFeePercent?: number;
  totalLotQuantity?: number;
}) {
  const {
    quantity,
    unitPriceUsd,
    exchangeRate,
    taxesPesos,
    shippingCostUsd,
    cardFeePercent,
    totalLotQuantity,
  } = input;
  // Si no se pasa la cantidad total del lote (ej. todavía no hay otras
  // líneas cargadas), se asume que esta línea es todo el lote.
  const lotQuantity = totalLotQuantity && totalLotQuantity > 0 ? totalLotQuantity : quantity;

  // El impuesto por pago con tarjeta encarece el dólar de lo que sale la
  // mercadería en sí (no el envío ni los impuestos locales, que no se
  // pagan con la tarjeta internacional) — ver `Total (cant. × precio
  // unitario)` en el resumen de la compra.
  const netUsdRaw = unitPriceUsd * quantity;
  const netUsd = netUsdRaw * (1 + (cardFeePercent ?? 0) / 100);

  const taxesUsd =
    taxesPesos !== undefined && exchangeRate > 0 ? taxesPesos / exchangeRate : undefined;
  const unitTaxesUsd = taxesUsd !== undefined && lotQuantity > 0 ? taxesUsd / lotQuantity : undefined;
  const totalUsd = netUsd + (unitTaxesUsd ?? 0) * quantity;
  const unitCostUsd = quantity > 0 ? totalUsd / quantity : 0;
  // Ya no se prorratea ni se suma al costo del producto — se mantiene como
  // dato informativo (cuánto de ese envío total "le tocaría" a esta línea)
  // pero no entra en unitCostUsdFinal/unitCostPesos, que es lo que termina
  // siendo el costPrice del producto.
  const unitShippingCostUsd =
    shippingCostUsd !== undefined && lotQuantity > 0 ? shippingCostUsd / lotQuantity : undefined;
  const unitCostUsdFinal = unitCostUsd;
  const unitCostPesos = Math.round(unitCostUsdFinal * exchangeRate);

  return {
    taxesUsd,
    netUsd,
    totalUsd,
    unitCostUsd,
    unitShippingCostUsd,
    unitCostUsdFinal,
    unitCostPesos,
  };
}
