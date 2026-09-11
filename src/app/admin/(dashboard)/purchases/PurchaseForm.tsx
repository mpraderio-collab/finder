"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/products";
import { calcPurchaseCosts } from "@/lib/purchases";
import { createPurchase, updatePurchase, type PurchaseActionState } from "./actions";

const NEW_PRODUCT = "__new__";

type ProductOption = { id: string; name: string };

type InitialValues = {
  productId: string | null;
  productName: string;
  supplierName: string;
  purchaseDate: string; // yyyy-mm-dd
  quantity: number;
  unitPriceUsd: number;
  exchangeRate: number;
  taxesPesos: number | null;
  shippingCostUsd: number | null;
  suggestedPrice: number | null;
  appliedToStock: boolean;
};

const initialState: PurchaseActionState = {};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PurchaseForm({
  products,
  suppliers,
  purchaseId,
  initial,
}: {
  products: ProductOption[];
  suppliers: { name: string }[];
  purchaseId?: string;
  initial?: InitialValues;
}) {
  const router = useRouter();
  const action = purchaseId ? updatePurchase.bind(null, purchaseId) : createPurchase;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [productChoice, setProductChoice] = useState(
    initial ? (initial.productId ?? NEW_PRODUCT) : (products[0]?.id ?? NEW_PRODUCT),
  );
  const [productName, setProductName] = useState(
    initial?.productName ?? products[0]?.name ?? "",
  );
  const [supplierName, setSupplierName] = useState(initial?.supplierName ?? "");
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? todayIso());
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1);
  const [unitPriceUsd, setUnitPriceUsd] = useState(initial?.unitPriceUsd ?? 0);
  const [exchangeRate, setExchangeRate] = useState(initial?.exchangeRate ?? 0);
  const [taxesPesos, setTaxesPesos] = useState<number | "">(initial?.taxesPesos ?? "");
  const [shippingCostUsd, setShippingCostUsd] = useState<number | "">(
    initial?.shippingCostUsd ?? "",
  );
  const [suggestedPrice, setSuggestedPrice] = useState<number | "">(
    initial?.suggestedPrice ?? "",
  );
  const [applyToStock, setApplyToStock] = useState(
    initial ? initial.appliedToStock : true,
  );

  const isNewProduct = productChoice === NEW_PRODUCT;
  const alreadyApplied = initial?.appliedToStock ?? false;

  function selectProduct(id: string) {
    setProductChoice(id);
    if (id !== NEW_PRODUCT) {
      const product = products.find((p) => p.id === id);
      if (product) setProductName(product.name);
    } else {
      setProductName("");
    }
  }

  const costs = useMemo(
    () =>
      calcPurchaseCosts({
        quantity: quantity || 0,
        unitPriceUsd: unitPriceUsd || 0,
        exchangeRate: exchangeRate || 0,
        taxesPesos: taxesPesos === "" ? undefined : taxesPesos,
        shippingCostUsd: shippingCostUsd === "" ? undefined : shippingCostUsd,
      }),
    [quantity, unitPriceUsd, exchangeRate, taxesPesos, shippingCostUsd],
  );

  useEffect(() => {
    if (state.purchaseId) router.push("/admin/purchases");
  }, [state.purchaseId, router]);

  return (
    <form
      action={formAction}
      className="flex max-w-3xl flex-col gap-6 rounded-xl border border-line bg-bg p-5"
    >
      <input type="hidden" name="productId" value={isNewProduct ? "" : productChoice} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Producto</span>
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
          <span className="text-sm font-medium text-ink">
            Nombre del producto {isNewProduct ? "" : "(en la compra)"}
          </span>
          <input
            name="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Ej: Luz iman pasillo"
            className="input"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Proveedor (opcional)</span>
          <input
            name="supplierName"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="Ej: Woker Import"
            list="purchase-suppliers"
            autoComplete="off"
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
            className="input"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Cantidad</span>
          <input
            type="number"
            name="quantity"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="input"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Precio unitario (USD)</span>
          <input
            type="number"
            step="0.01"
            name="unitPriceUsd"
            min={0}
            value={unitPriceUsd}
            onChange={(e) => setUnitPriceUsd(Number(e.target.value))}
            className="input"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Cotización del dólar</span>
          <input
            type="number"
            step="0.01"
            name="exchangeRate"
            min={0}
            value={exchangeRate}
            onChange={(e) => setExchangeRate(Number(e.target.value))}
            className="input"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            Impuestos del lote (pesos, opcional)
          </span>
          <input
            type="number"
            step="0.01"
            name="taxesPesos"
            min={0}
            value={taxesPesos}
            onChange={(e) => setTaxesPesos(e.target.value === "" ? "" : Number(e.target.value))}
            className="input"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            Costo de envío del lote (USD, opcional)
          </span>
          <input
            type="number"
            step="0.01"
            name="shippingCostUsd"
            min={0}
            value={shippingCostUsd}
            onChange={(e) =>
              setShippingCostUsd(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="input"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            Precio de venta sugerido (opcional)
          </span>
          <input
            type="number"
            name="suggestedPrice"
            min={0}
            value={suggestedPrice}
            onChange={(e) =>
              setSuggestedPrice(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="input"
          />
        </label>
      </div>

      <div className="rounded-lg bg-surface p-4 text-sm">
        <p className="font-semibold text-ink">Cálculo automático</p>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
          <Calc label="Impuestos (USD)" value={costs.taxesUsd} usd />
          <Calc label="Neto (USD)" value={costs.netUsd} usd />
          <Calc label="Total (USD)" value={costs.totalUsd} usd />
          <Calc label="Costo unit. (USD)" value={costs.unitCostUsd} usd />
          <Calc label="Envío unit. (USD)" value={costs.unitShippingCostUsd} usd />
          <Calc label="Costo neto unit. (USD)" value={costs.unitCostUsdFinal} usd />
        </div>
        <div className="mt-3 border-t border-line pt-2">
          <span className="text-xs text-ink-soft">Costo unitario en pesos</span>
          <p className="font-heading text-xl font-extrabold text-navy">
            {formatPrice(costs.unitCostPesos)}
          </p>
        </div>
      </div>

      {isNewProduct ? (
        <p className="text-xs text-ink-faint">
          Como no está vinculada a un producto todavía, esta compra queda
          solo como registro histórico — no hay stock ni costo que
          actualizar hasta que vincules un producto.
        </p>
      ) : alreadyApplied ? (
        <p className="text-xs text-ink-faint">
          Esta compra ya se aplicó al stock y costo del producto — editar
          estos datos actualiza el registro pero no vuelve a tocar el stock.
        </p>
      ) : (
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="applyToStock"
            checked={applyToStock}
            onChange={(e) => setApplyToStock(e.target.checked)}
            className="h-4 w-4"
          />
          Sumar {quantity || 0} unidades al stock y actualizar el costo del
          producto ahora
        </label>
      )}

      {state.error && (
        <p className="rounded-lg bg-err-bg px-3 py-2 text-sm text-err-ink">{state.error}</p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-lg bg-navy px-6 py-2.5 font-heading text-sm font-bold text-white disabled:opacity-40"
        >
          {pending ? "Guardando…" : purchaseId ? "Guardar cambios" : "Registrar compra"}
        </button>
      </div>

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
      `}</style>
    </form>
  );
}

function Calc({ label, value, usd }: { label: string; value: number | undefined; usd?: boolean }) {
  return (
    <div>
      <span className="block text-xs text-ink-faint">{label}</span>
      <span className="font-medium text-ink">
        {value === undefined
          ? "—"
          : usd
            ? `US$ ${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : value}
      </span>
    </div>
  );
}
