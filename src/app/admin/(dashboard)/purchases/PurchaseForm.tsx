"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { formatPrice } from "@/lib/products";
import { calcPurchaseCosts, purchaseLineBase } from "@/lib/purchases";
import { purchaseStatusLabels } from "@/lib/purchase-status";
import {
  createPurchase,
  updatePurchase,
  confirmPurchase,
  receivePurchase,
  cancelPurchase,
  deletePurchase,
  type PurchaseActionState,
} from "./actions";

const NEW_PRODUCT = "__new__";

type ProductOption = { id: string; name: string; heroImageUrl?: string };

type ItemLine = {
  productId?: string;
  productName: string;
  quantity: number;
  unitPriceUsd: number;
  exchangeRate: number;
  taxesPesos?: number;
  cardFeePercent?: number;
  costPerCubicMeterUsd?: number;
  boxWidthM?: number;
  boxLengthM?: number;
  boxHeightM?: number;
  boxCapacityUnits?: number;
  boxCount?: number;
  suggestedPrice?: number;
  containerCostUsd?: number;
  netPriceUsd?: number;
  vatUsd?: number;
  referenceUrl?: string;
  imageUrl?: string;
};

const MAX_LINE_IMAGE_SIZE = 5 * 1024 * 1024;

const DEFAULT_CARD_FEE_PERCENT = 2.9;

type InitialValues = {
  supplierName: string;
  purchaseDate: string; // yyyy-mm-dd
  status: string;
  items: ItemLine[];
};

const initialState: PurchaseActionState = {};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function usd(value: number | undefined): string {
  if (value === undefined) return "—";
  return `US$ ${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PurchaseForm({
  products,
  suppliers,
  purchaseId,
  initial,
  lastPrices,
}: {
  products: ProductOption[];
  suppliers: { name: string }[];
  purchaseId?: string;
  initial?: InitialValues;
  lastPrices?: Record<string, number>;
}) {
  const router = useRouter();
  const action = purchaseId ? updatePurchase.bind(null, purchaseId) : createPurchase;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [statusPending, startStatusTransition] = useTransition();
  const [statusError, setStatusError] = useState<string | null>(null);

  const status = initial?.status ?? "draft";
  const readOnly = Boolean(initial) && status !== "draft";

  const [supplierName, setSupplierName] = useState(initial?.supplierName ?? "");
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? todayIso());
  const [items, setItems] = useState<ItemLine[]>(initial?.items ?? []);

  // Datos del lote — se cargan una sola vez y valen para toda la compra
  // (todas las líneas), no por producto. Si se está editando una compra ya
  // cargada, se toman del primer ítem (todos comparten el mismo valor).
  const [exchangeRate, setExchangeRate] = useState(initial?.items[0]?.exchangeRate ?? 0);
  // Impuestos del lote y costo por m³: ya no se muestran en pantalla, pero el valor
  // guardado se conserva y sigue viajando al guardar (no se pisa en las compras viejas).
  const [taxesPesos] = useState<number | "">(initial?.items[0]?.taxesPesos ?? "");
  // Servicio anual del container: dato del lote (igual en todas las líneas).
  const [containerCostUsd, setContainerCostUsd] = useState<number | "">(
    initial?.items[0]?.containerCostUsd ?? "",
  );
  const [costPerCubicMeterUsd] = useState<number | "">(
    initial?.items[0]?.costPerCubicMeterUsd ?? "",
  );
  // El % de recargo por pago con tarjeta se guarda con la compra; en las compras
  // viejas, que no lo tenían, se usa el default al editarlas.
  const [cardFeePercent, setCardFeePercent] = useState<number | "">(
    initial?.items[0]?.cardFeePercent ?? DEFAULT_CARD_FEE_PERCENT,
  );

  // Formulario de la línea que se está armando, todavía no agregada.
  const [productChoice, setProductChoice] = useState(products[0]?.id ?? NEW_PRODUCT);
  const [productName, setProductName] = useState(products[0]?.name ?? "");
  const [quantity, setQuantity] = useState(1);
  const [unitPriceUsd, setUnitPriceUsd] = useState(
    lastPrices?.[products[0]?.id ?? ""] ?? 0,
  );
  const [suggestedPrice, setSuggestedPrice] = useState<number | "">("");
  const [netPriceUsd, setNetPriceUsd] = useState<number | "">("");
  const [vatUsd, setVatUsd] = useState<number | "">("");
  // Las medidas de la caja ya no se cargan al agregar una línea: quedan vacías. Las
  // líneas viejas conservan las que tenían guardadas en la base.
  const [boxWidthM] = useState<number | "">("");
  const [boxLengthM] = useState<number | "">("");
  const [boxHeightM] = useState<number | "">("");
  const [boxCapacityUnits] = useState<number | "">("");
  const [boxCount] = useState<number | "">("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [uploadingRowIndex, setUploadingRowIndex] = useState<number | null>(null);

  const isNewProduct = productChoice === NEW_PRODUCT;
  const selectedProductImage = !isNewProduct
    ? products.find((p) => p.id === productChoice)?.heroImageUrl
    : undefined;

  function selectProduct(id: string) {
    setProductChoice(id);
    setImageUrl("");
    if (id !== NEW_PRODUCT) {
      const product = products.find((p) => p.id === id);
      if (product) setProductName(product.name);
      // Sugiere el último precio unitario pagado por este producto — se
      // puede pisar a mano si esta vez cambió.
      setUnitPriceUsd(lastPrices?.[id] ?? 0);
    } else {
      setProductName("");
      setUnitPriceUsd(0);
    }
  }

  // Solo aplica a producto nuevo (sin vincular) — uno ya vinculado siempre
  // muestra su propia foto principal, no tiene sentido subirle otra acá.
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAddError(null);
    if (file.size > MAX_LINE_IMAGE_SIZE) {
      setAddError("La imagen pesa más de 5MB.");
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }
    setUploadingImage(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload-token",
      });
      setImageUrl(blob.url);
    } catch {
      setAddError("No se pudo subir la imagen. Probá de nuevo.");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  // Igual que handleImageUpload pero para una línea ya agregada a la
  // tabla — solo tiene sentido en líneas sin producto vinculado.
  async function handleRowImageUpload(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LINE_IMAGE_SIZE) {
      setAddError("La imagen pesa más de 5MB.");
      e.target.value = "";
      return;
    }
    setUploadingRowIndex(index);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload-token",
      });
      updateItem(index, { imageUrl: blob.url });
    } catch {
      setAddError("No se pudo subir la imagen. Probá de nuevo.");
    } finally {
      setUploadingRowIndex(null);
      e.target.value = "";
    }
  }

  // Cantidad total del lote hasta ahora (líneas ya agregadas) — se usa para
  // prorratear impuestos/tarjeta, que son del lote completo.
  const addedLotQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  // Servicio del container: cada línea se lleva el % de la compra que representa
  // (su costo total operación sobre el total) y de ahí sale su parte del costo.
  const containerUsd = containerCostUsd === "" ? 0 : containerCostUsd;
  const lotBaseValue = items.reduce((sum, item) => sum + purchaseLineBase(item), 0);
  function lineShareOf(item: ItemLine) {
    return lotBaseValue > 0 ? purchaseLineBase(item) / lotBaseValue : 0;
  }
  // Costo total de una unidad: costo neto con el recargo por pago con tarjeta + IVA,
  // más lo que le toca del servicio del container dividido la cantidad.
  // undefined si todavía no hay nada cargado.
  function lineUnitTotalUsd(item: ItemLine): number | undefined {
    const hasCost = item.netPriceUsd !== undefined || item.vatUsd !== undefined;
    const containerPerUnit =
      item.quantity > 0 ? (containerUsd * lineShareOf(item)) / item.quantity : 0;
    const feeFactor = 1 + (cardFeePercent === "" ? 0 : cardFeePercent) / 100;
    return hasCost || containerPerUnit > 0
      ? (item.netPriceUsd ?? 0) * feeFactor + (item.vatUsd ?? 0) + containerPerUnit
      : undefined;
  }
  // Costo total operación de una línea: cantidad × costo total.
  function lineOperationUsd(item: ItemLine): number | undefined {
    const unit = lineUnitTotalUsd(item);
    return unit === undefined ? undefined : item.quantity * unit;
  }
  // La línea que se está armando todavía no está en la lista: su % se calcula
  // como si ya estuviera agregada.
  const draftBase = purchaseLineBase({
    quantity: quantity || 0,
    unitPriceUsd: unitPriceUsd || 0,
    netPriceUsd: netPriceUsd === "" ? undefined : netPriceUsd,
    vatUsd: vatUsd === "" ? undefined : vatUsd,
  });
  const draftShare = lotBaseValue + draftBase > 0 ? draftBase / (lotBaseValue + draftBase) : 0;

  const draftCosts = useMemo(
    () =>
      calcPurchaseCosts({
        quantity: quantity || 0,
        unitPriceUsd: unitPriceUsd || 0,
        exchangeRate: exchangeRate || 0,
        taxesPesos: taxesPesos === "" ? undefined : taxesPesos,
        containerCostUsd: containerCostUsd === "" ? undefined : containerCostUsd,
        cardFeePercent: cardFeePercent === "" ? undefined : cardFeePercent,
        totalLotQuantity: addedLotQuantity + (quantity || 0),
        containerShare: draftShare,
        netPriceUsd: netPriceUsd === "" ? undefined : netPriceUsd,
        vatUsd: vatUsd === "" ? undefined : vatUsd,
        boxWidthM: boxWidthM === "" ? undefined : boxWidthM,
        boxLengthM: boxLengthM === "" ? undefined : boxLengthM,
        boxHeightM: boxHeightM === "" ? undefined : boxHeightM,
        boxCapacityUnits: boxCapacityUnits === "" ? undefined : boxCapacityUnits,
        boxCount: boxCount === "" ? undefined : boxCount,
        costPerCubicMeterUsd: costPerCubicMeterUsd === "" ? undefined : costPerCubicMeterUsd,
      }),
    [
      quantity,
      unitPriceUsd,
      exchangeRate,
      taxesPesos,
      containerCostUsd,
      draftShare,
      netPriceUsd,
      vatUsd,
      cardFeePercent,
      addedLotQuantity,
      boxWidthM,
      boxLengthM,
      boxHeightM,
      boxCapacityUnits,
      boxCount,
      costPerCubicMeterUsd,
    ],
  );

  function addItem() {
    setAddError(null);
    if (!productName.trim()) {
      setAddError("Ingresá el nombre del producto.");
      return;
    }
    if (quantity < 1) {
      setAddError("La cantidad tiene que ser al menos 1.");
      return;
    }
    if (unitPriceUsd <= 0 || exchangeRate <= 0) {
      setAddError("Completá precio unitario y cotización del lote.");
      return;
    }
    const isDuplicate = isNewProduct
      ? items.some(
          (item) => !item.productId && item.productName.trim().toLowerCase() === productName.trim().toLowerCase(),
        )
      : items.some((item) => item.productId === productChoice);
    if (isDuplicate) {
      setAddError("Este producto ya está en la lista — editá la línea existente en vez de agregarlo de nuevo.");
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        productId: isNewProduct ? undefined : productChoice,
        productName: productName.trim(),
        quantity,
        unitPriceUsd,
        exchangeRate,
        taxesPesos: taxesPesos === "" ? undefined : taxesPesos,
        containerCostUsd: containerCostUsd === "" ? undefined : containerCostUsd,
        cardFeePercent: cardFeePercent === "" ? undefined : cardFeePercent,
        costPerCubicMeterUsd: costPerCubicMeterUsd === "" ? undefined : costPerCubicMeterUsd,
        boxWidthM: boxWidthM === "" ? undefined : boxWidthM,
        boxLengthM: boxLengthM === "" ? undefined : boxLengthM,
        boxHeightM: boxHeightM === "" ? undefined : boxHeightM,
        boxCapacityUnits: boxCapacityUnits === "" ? undefined : boxCapacityUnits,
        boxCount: boxCount === "" ? undefined : boxCount,
        suggestedPrice: suggestedPrice === "" ? undefined : suggestedPrice,
        netPriceUsd: netPriceUsd === "" ? undefined : netPriceUsd,
        vatUsd: vatUsd === "" ? undefined : vatUsd,
        referenceUrl: referenceUrl.trim() === "" ? undefined : referenceUrl.trim(),
        imageUrl: isNewProduct && imageUrl ? imageUrl : undefined,
      },
    ]);
    // Cotización/impuestos/tarjeta/costo por m³ son del lote — quedan
    // cargados para la próxima línea; solo se resetea lo propio de este
    // producto (incluidas las medidas de la caja, que son de esta línea).
    setQuantity(1);
    setUnitPriceUsd(0);
    setSuggestedPrice("");
    setNetPriceUsd("");
    setVatUsd("");
    setReferenceUrl("");
    setImageUrl("");
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, patch: Partial<ItemLine>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  type SortKey = "productName" | "quantity" | "unitPriceUsd" | "unitCostPesos";
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // Costo de una línea usando los datos del lote vigentes ahora mismo (no
  // lo que tenía guardado esa línea al agregarla) — así, si se corrige la
  // cotización o el costo por m³ del lote, se refleja en todas las líneas
  // ya cargadas, no solo en las nuevas. Las medidas de la caja sí son
  // propias de cada línea.
  function costsFor(item: ItemLine) {
    return calcPurchaseCosts({
      quantity: item.quantity,
      unitPriceUsd: item.unitPriceUsd,
      exchangeRate: exchangeRate || 0,
      taxesPesos: taxesPesos === "" ? undefined : taxesPesos,
      containerCostUsd: containerCostUsd === "" ? undefined : containerCostUsd,
      cardFeePercent: cardFeePercent === "" ? undefined : cardFeePercent,
      totalLotQuantity: addedLotQuantity,
      containerShare: lineShareOf(item),
      netPriceUsd: item.netPriceUsd,
      vatUsd: item.vatUsd,
      boxWidthM: item.boxWidthM,
      boxLengthM: item.boxLengthM,
      boxHeightM: item.boxHeightM,
      boxCapacityUnits: item.boxCapacityUnits,
      boxCount: item.boxCount,
      costPerCubicMeterUsd: costPerCubicMeterUsd === "" ? undefined : costPerCubicMeterUsd,
    });
  }

  // Ordena una copia con el índice original a mano — remove/update siguen
  // operando sobre la posición real en `items`, no en el orden mostrado.
  const sortedItems = useMemo(() => {
    const withIndex = items.map((item, index) => ({
      item,
      index,
      productName: item.productName.toLowerCase(),
      quantity: item.quantity,
      unitPriceUsd: item.unitPriceUsd,
      unitCostPesos: costsFor(item).unitCostPesos,
    }));
    if (!sortKey) return withIndex;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...withIndex].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- costsFor lee exchangeRate/taxesPesos/cardFeePercent/costPerCubicMeterUsd/addedLotQuantity, ya listados abajo
  }, [items, sortKey, sortDir, exchangeRate, taxesPesos, containerCostUsd, cardFeePercent, costPerCubicMeterUsd, addedLotQuantity]);

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return null;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const totals = useMemo(() => {
    const base = items.reduce(
      (acc, item) => {
        const costs = costsFor(item);
        // Costo de la mercadería + impuestos + tarjeta, SIN envío — unitCostUsdFinal
        // ya incluye el envío prorrateado (ver calcPurchaseCosts), así que si se
        // sumara acá el envío quedaría contado dos veces junto con totalShippingUsd.
        acc.totalGoodsUsd += costs.unitCostUsd * item.quantity;
        // Envío: volumen de la caja de esta línea × costo por m³ del lote.
        acc.totalShippingUsd += costs.boxShippingCostUsd ?? 0;
        acc.totalVolumeM3 += costs.boxVolumeM3 ?? 0;
        acc.units += item.quantity;
        // Costo total operación de una línea = cantidad × (costo neto + IVA) + su parte del container; el total de la operación es la suma de todas.
        acc.operationTotalUsd += lineOperationUsd(item) ?? 0;
        return acc;
      },
      {
        totalGoodsUsd: 0,
        totalShippingUsd: 0,
        totalVolumeM3: 0,
        units: 0,
        operationTotalUsd: 0,
      },
    );
    return { ...base, totalNetUsd: base.totalGoodsUsd + base.totalShippingUsd };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- costsFor lee exchangeRate/taxesPesos/cardFeePercent/costPerCubicMeterUsd/addedLotQuantity, ya listados abajo
  }, [items, exchangeRate, taxesPesos, containerCostUsd, cardFeePercent, costPerCubicMeterUsd, addedLotQuantity]);

  useEffect(() => {
    if (state.purchaseId && !purchaseId) router.push("/admin/purchases");
  }, [state.purchaseId, purchaseId, router]);

  function runStatusAction(fn: () => Promise<{ error?: string }>, redirectAfter?: string) {
    setStatusError(null);
    startStatusTransition(async () => {
      const res = await fn();
      if (res.error) {
        setStatusError(res.error);
        return;
      }
      router.refresh();
      if (redirectAfter) router.push(redirectAfter);
    });
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {initial && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-soft">Estado:</span>
          <span className="rounded-md bg-surface px-2 py-0.5 text-xs font-semibold text-ink">
            {purchaseStatusLabels[status] ?? status}
          </span>
        </div>
      )}

      {!readOnly && (
        <div className="rounded-xl border border-line bg-bg p-5">
          <p className="text-sm font-semibold text-ink">Datos del lote</p>
          <p className="mt-1 text-xs text-ink-faint">
            Se cargan una sola vez y aplican a todos los productos de esta compra.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">Cotización del dólar</span>
              <input
                type="number"
                step="0.01"
                min={0}
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value))}
                className="input"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">Servicio anual del container (USD)</span>
              <input
                type="number"
                step="0.01"
                min={0}
                value={containerCostUsd}
                onChange={(e) =>
                  setContainerCostUsd(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="input"
              />
              <span className="text-[11px] text-ink-faint">
                Cada línea se lleva el % de la compra que representa (según su costo total operación) y
                esa parte se suma al costo de sus unidades.
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">Impuesto pago con tarjeta (%)</span>
              <input
                type="number"
                step="0.01"
                min={0}
                value={cardFeePercent}
                onChange={(e) =>
                  setCardFeePercent(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="input"
              />
              <span className="text-[11px] text-ink-faint">
                Se suma solo al costo neto de cada línea (no al IVA) y entra en el costo total y en el costo en pesos.
              </span>
            </label>
          </div>

          <p className="mt-4 text-sm text-ink-soft">
            Total neto (Total + impuestos + envío + tarjeta):{" "}
            <strong className="text-ink">{usd(totals.totalNetUsd)}</strong>
            {" · "}
            Envío: <strong className="text-ink">{usd(totals.totalShippingUsd)}</strong>
            {" · "}
            Volumen total:{" "}
            <strong className="text-ink">
              {totals.totalVolumeM3.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 3,
              })}{" "}
              m³
            </strong>
          </p>
        </div>
      )}

      {!readOnly && (
        <div className="rounded-xl border border-line bg-bg p-5">
          <p className="text-sm font-semibold text-ink">Agregar producto</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">Producto</span>
              <select
                value={productChoice}
                onChange={(e) => selectProduct(e.target.value)}
                className="input"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                <option value={NEW_PRODUCT}>— Producto nuevo (sin vincular) —</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">
                Nombre {isNewProduct ? "" : "(en la compra)"}
              </span>
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ej: Luz iman pasillo"
                className="input"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">Cantidad</span>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="input"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">Precio unitario (USD)</span>
              <input
                type="number"
                step="0.01"
                min={0}
                value={unitPriceUsd}
                onChange={(e) => setUnitPriceUsd(Number(e.target.value))}
                className="input"
              />
              {!isNewProduct && lastPrices?.[productChoice] !== undefined && (
                <span className="text-[11px] text-ink-faint">
                  Sugerido: último pagado {usd(lastPrices[productChoice])}
                </span>
              )}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">Costo neto (USD)</span>
              <input
                type="number"
                step="0.01"
                min={0}
                value={netPriceUsd}
                onChange={(e) => setNetPriceUsd(e.target.value === "" ? "" : Number(e.target.value))}
                className="input"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">IVA (USD)</span>
              <input
                type="number"
                step="0.01"
                min={0}
                value={vatUsd}
                onChange={(e) => setVatUsd(e.target.value === "" ? "" : Number(e.target.value))}
                className="input"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">Precio de venta sugerido</span>
              <input
                type="number"
                min={0}
                value={suggestedPrice}
                onChange={(e) =>
                  setSuggestedPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="input"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">Link de referencia (opcional)</span>
              <input
                type="url"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                placeholder="https://proveedor.com/producto"
                className="input"
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">Foto del producto</span>
              {isNewProduct ? (
                <>
                  <div className="flex items-center gap-2">
                    {imageUrl && (
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-line bg-surface">
                        <Image src={imageUrl} alt="" fill className="object-cover" sizes="40px" />
                      </div>
                    )}
                    <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-border-btn px-3 py-1.5 text-xs font-semibold text-navy hover:bg-surface">
                      {uploadingImage ? "Subiendo…" : imageUrl ? "Cambiar foto" : "+ Subir foto"}
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </>
              ) : selectedProductImage ? (
                <div className="flex items-center gap-2">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-line bg-surface">
                    <Image src={selectedProductImage} alt="" fill className="object-cover" sizes="40px" />
                  </div>
                  <span className="text-[11px] text-ink-faint">Foto principal del producto</span>
                </div>
              ) : (
                <span className="text-[11px] text-ink-faint">Este producto todavía no tiene fotos cargadas.</span>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-ink-soft">
            <span>Costo unitario en pesos: <strong className="text-ink">{formatPrice(draftCosts.unitCostPesos)}</strong></span>
            <button
              type="button"
              onClick={addItem}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white"
            >
              + Agregar línea
            </button>
          </div>
          {addError && <p className="mt-2 text-xs text-err-ink">{addError}</p>}
        </div>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[1400px] text-left text-sm">
            <thead className="border-b border-line text-ink-soft">
              <tr>
                <th className="px-4 py-2 font-medium">Foto</th>
                <th className="px-4 py-2 font-medium">
                  <button type="button" onClick={() => toggleSort("productName")} className="hover:text-ink">
                    Producto{sortIndicator("productName")}
                  </button>
                </th>
                <th className="px-4 py-2 text-right font-medium">
                  <button type="button" onClick={() => toggleSort("quantity")} className="hover:text-ink">
                    Cant.{sortIndicator("quantity")}
                  </button>
                </th>
                <th className="px-4 py-2 text-right font-medium">
                  <button type="button" onClick={() => toggleSort("unitPriceUsd")} className="hover:text-ink">
                    P. unitario{sortIndicator("unitPriceUsd")}
                  </button>
                </th>
                <th className="px-4 py-2 text-right font-medium">Costo neto (USD)</th>
                <th className="px-4 py-2 text-right font-medium">IVA (USD)</th>
                <th className="px-4 py-2 text-right font-medium">% de la compra</th>
                <th className="px-4 py-2 text-right font-medium">Container (USD)</th>
                <th className="px-4 py-2 text-right font-medium">Costo total (USD)</th>
                <th className="px-4 py-2 text-right font-medium">Costo total operación (USD)</th>
                <th className="px-4 py-2 font-medium">Link</th>
                <th className="px-4 py-2 text-right font-medium">
                  <button type="button" onClick={() => toggleSort("unitCostPesos")} className="hover:text-ink">
                    Costo unit. (pesos){sortIndicator("unitCostPesos")}
                  </button>
                </th>
                <th className="px-4 py-2 text-right font-medium">Precio venta sug.</th>
                {!readOnly && <th className="px-4 py-2" />}
              </tr>
            </thead>
            <tbody>
              {sortedItems.map(({ item, index, unitCostPesos }) => {
                const linkedHeroImage = item.productId
                  ? products.find((p) => p.id === item.productId)?.heroImageUrl
                  : undefined;
                const thumb = linkedHeroImage ?? item.imageUrl;
                return (
                <tr key={index} className="border-b border-line last:border-0">
                  <td className="px-4 py-2">
                    {thumb ? (
                      <span className="relative inline-block h-10 w-10 shrink-0 overflow-hidden rounded-md border border-line bg-surface align-middle">
                        <Image src={thumb} alt="" fill className="object-cover" sizes="40px" />
                      </span>
                    ) : (
                      <span className="inline-block h-10 w-10 shrink-0 rounded-md border border-dashed border-line" />
                    )}
                    {!readOnly && !item.productId && (
                      <label className="mt-1 block w-fit cursor-pointer text-[11px] font-semibold text-blue hover:underline">
                        {uploadingRowIndex === index ? "Subiendo…" : thumb ? "Cambiar" : "+ Subir"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => handleRowImageUpload(index, e)}
                          disabled={uploadingRowIndex === index}
                          className="hidden"
                        />
                      </label>
                    )}
                  </td>
                  <td className="px-4 py-2 text-ink">
                    {item.productName}
                    {!item.productId && (
                      <span className="ml-1 text-xs text-ink-faint">(sin vincular)</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right text-ink-soft">
                    {readOnly ? (
                      item.quantity
                    ) : (
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                        className="input text-right w-20"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 text-right text-ink-soft">
                    {readOnly ? (
                      usd(item.unitPriceUsd)
                    ) : (
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={item.unitPriceUsd}
                        onChange={(e) => updateItem(index, { unitPriceUsd: Number(e.target.value) })}
                        className="input text-right w-24"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 text-right text-ink-soft">
                    {readOnly ? (
                      usd(item.netPriceUsd)
                    ) : (
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={item.netPriceUsd ?? ""}
                        onChange={(e) =>
                          updateItem(index, {
                            netPriceUsd: e.target.value === "" ? undefined : Number(e.target.value),
                          })
                        }
                        className="input text-right w-28"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 text-right text-ink-soft">
                    {readOnly ? (
                      usd(item.vatUsd)
                    ) : (
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={item.vatUsd ?? ""}
                        onChange={(e) =>
                          updateItem(index, {
                            vatUsd: e.target.value === "" ? undefined : Number(e.target.value),
                          })
                        }
                        className="input text-right w-28"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2 text-right text-ink-soft">
                    {lotBaseValue > 0
                      ? `${(lineShareOf(item) * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-right text-ink-soft">
                    {containerUsd > 0 ? usd(containerUsd * lineShareOf(item)) : "—"}
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-ink">
                    {lineUnitTotalUsd(item) === undefined ? "—" : usd(lineUnitTotalUsd(item))}
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-ink">
                    {lineOperationUsd(item) === undefined ? "—" : usd(lineOperationUsd(item))}
                  </td>
                  <td className="px-4 py-2 text-ink-soft">
                    {readOnly ? (
                      item.referenceUrl ? (
                        <a
                          href={item.referenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-blue hover:underline"
                        >
                          Ver ↗
                        </a>
                      ) : (
                        "—"
                      )
                    ) : (
                      <div className="flex flex-col gap-1">
                        <input
                          type="url"
                          value={item.referenceUrl ?? ""}
                          onChange={(e) =>
                            updateItem(index, {
                              referenceUrl: e.target.value === "" ? undefined : e.target.value,
                            })
                          }
                          placeholder="https://…"
                          className="input w-40"
                        />
                        {item.referenceUrl && (
                          <a
                            href={item.referenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-semibold text-blue hover:underline"
                          >
                            Ver ↗
                          </a>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right text-ink-soft">{formatPrice(unitCostPesos)}</td>
                  <td className="px-4 py-2 text-right text-ink-soft">
                    {readOnly ? (
                      item.suggestedPrice != null ? formatPrice(item.suggestedPrice) : "—"
                    ) : (
                      <input
                        type="number"
                        min={0}
                        value={item.suggestedPrice ?? ""}
                        onChange={(e) =>
                          updateItem(index, {
                            suggestedPrice: e.target.value === "" ? undefined : Number(e.target.value),
                          })
                        }
                        className="input text-right w-24"
                      />
                    )}
                  </td>
                  {!readOnly && (
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-xs font-semibold text-err-ink hover:underline"
                      >
                        Quitar
                      </button>
                    </td>
                  )}
                </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-line font-medium">
                <td className="px-4 py-2" />
                <td className="px-4 py-2 text-ink">Total</td>
                <td className="px-4 py-2 text-right text-ink-soft">{totals.units}</td>
                <td className="px-4 py-2" />
                <td className="px-4 py-2" />
                <td className="px-4 py-2" />
                <td className="px-4 py-2 text-right text-ink-soft">{lotBaseValue > 0 ? "100%" : ""}</td>
                <td className="px-4 py-2 text-right text-ink-soft">{containerUsd > 0 ? usd(containerUsd) : ""}</td>
                <td className="px-4 py-2" />
                <td className="px-4 py-2 text-right text-ink">{usd(totals.operationTotalUsd)}</td>
                <td className="px-4 py-2" />
                <td className="px-4 py-2" />
                <td className="px-4 py-2" />
                {!readOnly && <td className="px-4 py-2" />}
              </tr>
            </tfoot>
          </table>
          <div className="flex items-center justify-end gap-3 border-t border-line px-4 py-3">
            <span className="text-sm text-ink-soft">Total de la operación (suma del costo total operación, con el container)</span>
            <strong className="text-base text-ink">{usd(totals.operationTotalUsd)}</strong>
          </div>
        </div>
      )}

      <form
        action={formAction}
        className="flex flex-col gap-4 rounded-xl border border-line bg-bg p-5"
      >
        <input
          type="hidden"
          name="items"
          value={JSON.stringify(
            items.map((item) => ({
              ...item,
              exchangeRate,
              taxesPesos: taxesPesos === "" ? undefined : taxesPesos,
              containerCostUsd: containerCostUsd === "" ? undefined : containerCostUsd,
              cardFeePercent: cardFeePercent === "" ? undefined : cardFeePercent,
              costPerCubicMeterUsd: costPerCubicMeterUsd === "" ? undefined : costPerCubicMeterUsd,
            })),
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Proveedor (opcional)</span>
            <input
              name="supplierName"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Ej: Woker Import"
              list="purchase-suppliers"
              autoComplete="off"
              disabled={readOnly}
              className="input"
            />
            <datalist id="purchase-suppliers">
              {suppliers.map((s) => (
                <option key={s.name} value={s.name} />
              ))}
            </datalist>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Fecha de compra</span>
            <input
              type="date"
              name="purchaseDate"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              disabled={readOnly}
              className="input"
              required
            />
          </label>
        </div>

        {state.error && (
          <p className="rounded-lg bg-err-bg px-3 py-2 text-sm text-err-ink">{state.error}</p>
        )}

        {!readOnly && (
          <div>
            <button
              type="submit"
              disabled={pending || items.length === 0}
              className="w-fit rounded-lg bg-navy px-6 py-2.5 font-heading text-sm font-bold text-white disabled:opacity-40"
            >
              {pending ? "Guardando…" : purchaseId ? "Guardar cambios" : "Registrar borrador"}
            </button>
          </div>
        )}
      </form>

      {statusError && (
        <p className="rounded-lg bg-err-bg px-3 py-2 text-sm text-err-ink">{statusError}</p>
      )}

      {purchaseId && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-bg p-5">
          {status === "draft" && (
            <>
              <button
                type="button"
                disabled={statusPending}
                onClick={() => runStatusAction(() => confirmPurchase(purchaseId))}
                className="w-fit rounded-lg bg-navy px-5 py-2.5 font-heading text-sm font-bold text-white disabled:opacity-40"
              >
                {statusPending ? "Confirmando…" : "Confirmar pedido"}
              </button>
              <button
                type="button"
                disabled={statusPending}
                onClick={() => {
                  if (!confirm("¿Cancelar esta compra?")) return;
                  runStatusAction(() => cancelPurchase(purchaseId));
                }}
                className="w-fit rounded-lg border border-border-btn bg-bg px-5 py-2.5 text-sm font-semibold text-ink-soft hover:bg-surface disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={statusPending}
                onClick={() => {
                  if (!confirm("¿Borrar este borrador? Esta acción no se puede deshacer.")) return;
                  runStatusAction(() => deletePurchase(purchaseId), "/admin/purchases");
                }}
                className="w-fit text-sm font-semibold text-err-ink hover:underline disabled:opacity-40"
              >
                Borrar borrador
              </button>
            </>
          )}

          {status === "confirmed" && (
            <>
              <button
                type="button"
                disabled={statusPending}
                onClick={() => runStatusAction(() => receivePurchase(purchaseId))}
                className="w-fit rounded-lg bg-ok-ink px-5 py-2.5 font-heading text-sm font-bold text-white disabled:opacity-40"
              >
                {statusPending ? "Recibiendo…" : "Marcar como recibido"}
              </button>
              <button
                type="button"
                disabled={statusPending}
                onClick={() => {
                  if (!confirm("¿Cancelar esta compra?")) return;
                  runStatusAction(() => cancelPurchase(purchaseId));
                }}
                className="w-fit rounded-lg border border-border-btn bg-bg px-5 py-2.5 text-sm font-semibold text-ink-soft hover:bg-surface disabled:opacity-40"
              >
                Cancelar
              </button>
            </>
          )}

          {status === "received" && (
            <p className="text-sm text-ink-soft">
              Ya se recibió — el stock y el costo de los productos vinculados se actualizaron.
            </p>
          )}

          {status === "cancelled" && (
            <p className="text-sm text-ink-soft">Esta compra está cancelada.</p>
          )}
        </div>
      )}

      <style jsx global>{`
        .input {
          border-radius: 0.5rem;
          border: 1px solid var(--color-border-input);
          background: var(--color-bg);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: var(--color-amber);
        }
        .input:disabled {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}
