// Mismo desglose de costos que trae la planilla del proveedor — se usa
// tanto en el cliente (vista previa mientras se completa el form) como en
// el server (cálculo definitivo, nunca se confía en lo que mande el
// navegador).
export function calcPurchaseCosts(input: {
  quantity: number;
  unitPriceUsd: number;
  exchangeRate: number;
  taxesPesos?: number;
  shippingCostUsd?: number;
}) {
  const { quantity, unitPriceUsd, exchangeRate, taxesPesos, shippingCostUsd } = input;

  const taxesUsd =
    taxesPesos !== undefined && exchangeRate > 0 ? taxesPesos / exchangeRate : undefined;
  const netUsd = unitPriceUsd * quantity;
  const totalUsd = netUsd + (taxesUsd ?? 0);
  const unitCostUsd = quantity > 0 ? totalUsd / quantity : 0;
  const unitShippingCostUsd =
    shippingCostUsd !== undefined && quantity > 0 ? shippingCostUsd / quantity : undefined;
  const unitCostUsdFinal = unitCostUsd + (unitShippingCostUsd ?? 0);
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
