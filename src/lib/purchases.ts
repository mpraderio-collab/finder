// Mismo desglose de costos que trae la planilla del proveedor — se usa
// tanto en el cliente (vista previa mientras se completa el form) como en
// el server (cálculo definitivo, nunca se confía en lo que mande el
// navegador).
//
// Cotización, impuestos, costo por m³ e impuesto por pago con tarjeta se
// cargan una sola vez por compra (referencian a todo el lote, no a una
// línea puntual). Los impuestos sí se prorratean por `totalLotQuantity` y
// pasan a formar parte del costo unitario de cada producto (van dentro del
// paquete que llega, ARCA los cobra por eso). El envío en cambio nunca se
// suma al costo del producto — es un gasto de la compra en su conjunto
// (como el flete de un pedido a proveedor): el costo de envío de una línea
// es el volumen de UNA de sus cajas por el costo por m³ del lote, por la
// cantidad de cajas de esa línea (`boxCount`); la suma de todas las líneas
// da el costo de envío total de la compra, que se suma una sola vez al
// final y no afecta el costo/margen de cada producto individual.
//
// Si la caja no viene completa (`boxCapacityUnits` = cuántas unidades entran
// llena, `quantity` = cuántas trae esta compra), el volumen de esa caja se
// prorratea por ese porcentaje: una caja para 100 unidades de la que solo
// llegan 60 ocupa el 60% del volumen declarado.
export function calcPurchaseCosts(input: {
  quantity: number;
  unitPriceUsd: number;
  exchangeRate: number;
  taxesPesos?: number;
  cardFeePercent?: number;
  totalLotQuantity?: number;
  boxWidthM?: number;
  boxLengthM?: number;
  boxHeightM?: number;
  boxCapacityUnits?: number;
  boxCount?: number;
  costPerCubicMeterUsd?: number;
}) {
  const {
    quantity,
    unitPriceUsd,
    exchangeRate,
    taxesPesos,
    cardFeePercent,
    totalLotQuantity,
    boxWidthM,
    boxLengthM,
    boxHeightM,
    boxCapacityUnits,
    boxCount,
    costPerCubicMeterUsd,
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
  const unitCostUsdFinal = unitCostUsd;
  const unitCostPesos = Math.round(unitCostUsdFinal * exchangeRate);

  const hasBoxDims = boxWidthM !== undefined && boxLengthM !== undefined && boxHeightM !== undefined;
  // Si la caja no viene completa, el volumen se prorratea por cuánto trae
  // esta compra respecto de lo que entra llena (tope en 100%: no se puede
  // ocupar más volumen que el de la caja entera).
  const boxFillRatio =
    boxCapacityUnits !== undefined && boxCapacityUnits > 0
      ? Math.min(quantity / boxCapacityUnits, 1)
      : 1;
  // Cantidad de cajas iguales que tiene esta línea — multiplica todo lo
  // anterior (volumen ya prorrateado por el llenado × costo por m³).
  const effectiveBoxCount = boxCount !== undefined && boxCount > 0 ? boxCount : 1;
  const boxVolumeM3 = hasBoxDims
    ? boxWidthM! * boxLengthM! * boxHeightM! * boxFillRatio * effectiveBoxCount
    : undefined;
  const boxShippingCostUsd =
    boxVolumeM3 !== undefined && costPerCubicMeterUsd !== undefined
      ? boxVolumeM3 * costPerCubicMeterUsd
      : undefined;

  return {
    taxesUsd,
    netUsd,
    totalUsd,
    unitCostUsd,
    unitCostUsdFinal,
    unitCostPesos,
    boxVolumeM3,
    boxFillRatio,
    boxShippingCostUsd,
  };
}
