"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/products";
import { createManualSale, type ManualSaleState } from "../actions";

type Variant = { name: string; stock: number };
type ProductOption = {
  id: string;
  name: string;
  price: number;
  stock: number;
  variants: Variant[];
};

type LineItem = {
  productId: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  maxStock: number;
};

const initialState: ManualSaleState = {};

export function ManualSaleForm({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createManualSale, initialState);

  const [items, setItems] = useState<LineItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(products[0]?.price ?? 0);
  const [addError, setAddError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  function selectProduct(id: string) {
    setSelectedProductId(id);
    const product = products.find((p) => p.id === id);
    setUnitPrice(product?.price ?? 0);
    setSelectedVariant(product?.variants[0]?.name ?? "");
  }

  useEffect(() => {
    if (state.orderId) router.push(`/admin/orders/${state.orderId}`);
  }, [state.orderId, router]);

  const maxStockForSelection = useMemo(() => {
    if (!selectedProduct) return 0;
    if (selectedProduct.variants.length > 0) {
      return selectedProduct.variants.find((v) => v.name === selectedVariant)?.stock ?? 0;
    }
    return selectedProduct.stock;
  }, [selectedProduct, selectedVariant]);

  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  function addItem() {
    setAddError(null);
    if (!selectedProduct) return;
    if (selectedProduct.variants.length > 0 && !selectedVariant) {
      setAddError("Elegí un color.");
      return;
    }
    if (quantity < 1) {
      setAddError("La cantidad tiene que ser al menos 1.");
      return;
    }
    if (quantity > maxStockForSelection) {
      setAddError(`Solo quedan ${maxStockForSelection} unidades disponibles.`);
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        variantName: selectedVariant || undefined,
        quantity,
        unitPrice,
        maxStock: maxStockForSelection,
      },
    ]);
    setQuantity(1);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  if (products.length === 0) {
    return (
      <p className="text-ink-soft">
        No hay productos activos para vender. Cargá o activá un producto
        primero.
      </p>
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="rounded-xl border border-line bg-card p-5">
        <p className="text-sm font-semibold text-ink">Agregar producto</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Producto</span>
            <select
              value={selectedProductId}
              onChange={(e) => selectProduct(e.target.value)}
              className="input"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          {selectedProduct && selectedProduct.variants.length > 0 && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-ink-soft">Color</span>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="input"
              >
                {selectedProduct.variants.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.stock} disp.)
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Cantidad</span>
            <input
              type="number"
              min={1}
              max={Math.max(maxStockForSelection, 1)}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="input w-20"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-soft">Precio unitario</span>
            <input
              type="number"
              min={0}
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              className="input w-28"
            />
          </label>

          <button
            type="button"
            onClick={addItem}
            disabled={maxStockForSelection <= 0}
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream disabled:opacity-40"
          >
            + Agregar
          </button>
        </div>
        {maxStockForSelection <= 0 && (
          <p className="mt-2 text-xs text-coral">Sin stock disponible.</p>
        )}
        {addError && <p className="mt-2 text-xs text-coral">{addError}</p>}
      </div>

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-line bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-ink-soft">
              <tr>
                <th className="px-4 py-2 font-medium">Producto</th>
                <th className="px-4 py-2 font-medium">Cant.</th>
                <th className="px-4 py-2 font-medium">Subtotal</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  <td className="px-4 py-2 text-ink">
                    {item.productName}
                    {item.variantName ? ` — ${item.variantName}` : ""}
                  </td>
                  <td className="px-4 py-2 text-ink-soft">{item.quantity}</td>
                  <td className="px-4 py-2 text-ink-soft">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-xs font-semibold text-coral hover:underline"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-line px-4 py-3 text-right text-sm font-semibold text-ink">
            Total: {formatPrice(total)}
          </div>
        </div>
      )}

      <form
        action={formAction}
        className="flex flex-col gap-4 rounded-xl border border-line bg-card p-5"
      >
        <input type="hidden" name="items" value={JSON.stringify(items)} />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">
            Cliente (opcional)
          </span>
          <input
            name="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Venta manual"
            className="input"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Nota (opcional)</span>
          <textarea
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Ej: vendido en feria, transferencia recibida"
            className="input"
          />
        </label>

        {state.error && (
          <p className="rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={items.length === 0 || pending}
          className="w-fit rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-cream disabled:opacity-40"
        >
          {pending ? "Guardando…" : `Registrar venta — ${formatPrice(total)}`}
        </button>
      </form>

      <style jsx global>{`
        .input {
          border-radius: 0.5rem;
          border: 1px solid var(--color-line);
          background: var(--color-cream);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: var(--color-amber);
        }
      `}</style>
    </div>
  );
}
