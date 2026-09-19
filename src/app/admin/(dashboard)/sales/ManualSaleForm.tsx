"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/products";
import {
  createManualSale,
  createAndFinalizeManualSale,
  updateManualSale,
  updatePaidManualSale,
  finalizeManualSale,
  discardManualSale,
  type ManualSaleState,
} from "./actions";

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

export function ManualSaleForm({
  products,
  customers,
  orderId,
  orderStatus,
  initialItems,
  initialCustomerName,
  initialCustomerPhone,
  initialNote,
}: {
  products: ProductOption[];
  // Clientes ya cargados — alimentan el desplegable de autocompletado.
  customers: { name: string; phone: string | null }[];
  // Si viene orderId, el form edita esa venta en vez de crear una nueva.
  orderId?: string;
  // "draft" (default si no viene) | "paid" | "shipped" — cambia qué acción
  // se llama al guardar y qué botones se muestran.
  orderStatus?: string;
  initialItems?: LineItem[];
  initialCustomerName?: string;
  initialCustomerPhone?: string;
  initialNote?: string;
}) {
  const router = useRouter();
  const isDraft = !orderId || orderStatus === "draft";
  const action = !orderId
    ? createManualSale
    : isDraft
      ? updateManualSale.bind(null, orderId)
      : updatePaidManualSale.bind(null, orderId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [createConfirmState, createConfirmFormAction, createConfirmPending] = useActionState(
    createAndFinalizeManualSale,
    initialState,
  );
  const [confirmPending, startConfirmTransition] = useTransition();
  const [discardPending, startDiscardTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmAsPaid, setConfirmAsPaid] = useState(true);

  const [items, setItems] = useState<LineItem[]>(initialItems ?? []);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(products[0]?.price ?? 0);
  const [addError, setAddError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState(initialCustomerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone ?? "");
  const [note, setNote] = useState(initialNote ?? "");

  // Al elegir un nombre que ya existe en el desplegable, autocompleta el
  // teléfono si el campo todavía está vacío — no pisa lo que ya escribiste.
  function handleCustomerNameChange(value: string) {
    setCustomerName(value);
    const match = customers.find(
      (c) => c.name.toLowerCase() === value.trim().toLowerCase(),
    );
    if (match?.phone && !customerPhone) setCustomerPhone(match.phone);
  }

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  function selectProduct(id: string) {
    setSelectedProductId(id);
    const product = products.find((p) => p.id === id);
    setUnitPrice(product?.price ?? 0);
    setSelectedVariant(product?.variants[0]?.name ?? "");
  }

  useEffect(() => {
    // Al crear redirige a seguir editando el borrador recién creado; al
    // editar, ya estamos en esa pantalla.
    if (!orderId && state.orderId) router.push(`/admin/sales/${state.orderId}/edit`);
  }, [orderId, state.orderId, router]);

  useEffect(() => {
    // Crear y confirmar en un solo paso: va directo al pedido ya confirmado.
    if (!orderId && createConfirmState.orderId) {
      router.push(`/admin/orders/${createConfirmState.orderId}`);
    }
  }, [orderId, createConfirmState.orderId, router]);

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

  function updateItemQuantity(index: number, value: number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: value } : item)),
    );
  }

  function updateItemUnitPrice(index: number, value: number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, unitPrice: value } : item)),
    );
  }

  function handleConfirm() {
    if (!orderId) return;
    if (!confirm("¿Confirmar esta venta? Se descuenta el stock y ya no se va a poder editar.")) {
      return;
    }
    setActionError(null);
    startConfirmTransition(async () => {
      const res = await finalizeManualSale(orderId, confirmAsPaid);
      if (res.error) {
        setActionError(res.error);
        return;
      }
      router.push(`/admin/orders/${orderId}`);
    });
  }

  function handleDiscard() {
    if (!orderId) return;
    if (!confirm("¿Descartar este borrador? Esta acción no se puede deshacer.")) return;
    setActionError(null);
    startDiscardTransition(async () => {
      const res = await discardManualSale(orderId);
      if (res.error) {
        setActionError(res.error);
        return;
      }
      router.push("/admin/sales");
    });
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
      <div className="rounded-xl border border-line bg-bg p-5">
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
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            + Agregar
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          {isDraft
            ? "El stock recién se descuenta cuando confirmás la venta, así que podés cargar más de lo que ves disponible ahora si sabés que va a entrar."
            : "Esta venta ya está confirmada: el stock se ajusta al guardar, según la diferencia con lo que había antes."}
        </p>
        {addError && <p className="mt-2 text-xs text-err-ink">{addError}</p>}
      </div>

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-ink-soft">
              <tr>
                <th className="px-4 py-2 font-medium">Producto</th>
                <th className="px-4 py-2 font-medium">Cant.</th>
                <th className="px-4 py-2 font-medium">Precio unit.</th>
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
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(i, Number(e.target.value))}
                      className="input w-16 py-1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      value={item.unitPrice}
                      onChange={(e) => updateItemUnitPrice(i, Number(e.target.value))}
                      className="input w-28 py-1"
                    />
                  </td>
                  <td className="px-4 py-2 text-ink-soft">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-xs font-semibold text-err-ink hover:underline"
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
        className="flex flex-col gap-4 rounded-xl border border-line bg-bg p-5"
      >
        <input type="hidden" name="items" value={JSON.stringify(items)} />

        <div className="flex flex-wrap gap-4">
          <label className="flex flex-1 min-w-[200px] flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">
              Cliente (opcional)
            </span>
            <input
              name="customerName"
              value={customerName}
              onChange={(e) => handleCustomerNameChange(e.target.value)}
              placeholder="Venta manual"
              list="manual-sale-customers"
              autoComplete="off"
              className="input"
            />
            <datalist id="manual-sale-customers">
              {customers.map((c) => (
                <option key={c.name} value={c.name} />
              ))}
            </datalist>
          </label>

          <label className="flex flex-1 min-w-[160px] flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">
              Teléfono (opcional)
            </span>
            <input
              name="customerPhone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Ej: 11 5555-5555"
              className="input"
            />
          </label>
        </div>

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
          <p className="rounded-lg bg-err-bg px-3 py-2 text-sm text-err-ink">
            {state.error}
          </p>
        )}
        {actionError && (
          <p className="rounded-lg bg-err-bg px-3 py-2 text-sm text-err-ink">
            {actionError}
          </p>
        )}

        {createConfirmState.error && (
          <p className="rounded-lg bg-err-bg px-3 py-2 text-sm text-err-ink">
            {createConfirmState.error}
          </p>
        )}

        {isDraft && (
          <label className="flex w-fit items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              name="isPaid"
              checked={confirmAsPaid}
              onChange={(e) => setConfirmAsPaid(e.target.checked)}
              className="h-4 w-4"
            />
            Ya está pagada
            {!confirmAsPaid && (
              <span className="text-xs text-warn-ink">
                — queda como vendida/pendiente de envío sin cobrar (fiado); lo marcás pagado después
              </span>
            )}
          </label>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={items.length === 0 || pending}
            className="w-fit rounded-lg bg-navy px-6 py-2.5 font-heading text-sm font-bold text-white disabled:opacity-40"
          >
            {pending
              ? "Guardando…"
              : isDraft
                ? `Guardar borrador — ${formatPrice(total)}`
                : `Guardar cambios — ${formatPrice(total)}`}
          </button>

          {!orderId && (
            <button
              type="submit"
              formAction={createConfirmFormAction}
              disabled={items.length === 0 || createConfirmPending}
              className="w-fit rounded-lg bg-ok-ink px-6 py-2.5 font-heading text-sm font-bold text-white disabled:opacity-40"
            >
              {createConfirmPending
                ? "Confirmando…"
                : confirmAsPaid
                  ? "Confirmar venta (pagada)"
                  : "Confirmar venta (sin cobrar)"}
            </button>
          )}

          {orderId && isDraft && (
            <>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={items.length === 0 || confirmPending || discardPending}
                className="w-fit rounded-lg bg-ok-ink px-6 py-2.5 font-heading text-sm font-bold text-white disabled:opacity-40"
              >
                {confirmPending
                  ? "Confirmando…"
                  : confirmAsPaid
                    ? "Confirmar venta (pagada)"
                    : "Confirmar venta (sin cobrar)"}
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                disabled={confirmPending || discardPending}
                className="w-fit text-sm font-semibold text-err-ink hover:underline disabled:opacity-40"
              >
                {discardPending ? "Descartando…" : "Descartar borrador"}
              </button>
            </>
          )}
        </div>
      </form>

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
    </div>
  );
}
