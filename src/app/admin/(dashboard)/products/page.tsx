import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/products";

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orderItems: true } }, variants: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-extrabold text-ink">
          Productos
        </h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream hover:bg-amber-dark"
        >
          + Nuevo producto
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-10 text-ink-soft">
          Todavía no cargaste ningún producto.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Margen</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Pedidos</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const totalStock =
                  product.variants.length > 0
                    ? product.variants.reduce((sum, v) => sum + v.stock, 0)
                    : product.stock;
                return (
                <tr key={product.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">
                    {product.name}
                    {product.variants.length > 0 && (
                      <span className="ml-1.5 text-xs font-normal text-ink-soft">
                        ({product.variants.length} variantes)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {product.costPrice == null ? (
                      "—"
                    ) : (
                      (() => {
                        const margin = product.price - product.costPrice;
                        const marginPct = Math.round(
                          (margin / product.price) * 100,
                        );
                        return (
                          <span
                            className={
                              margin < 0 ? "text-coral font-semibold" : undefined
                            }
                          >
                            {formatPrice(margin)} ({marginPct}%)
                          </span>
                        );
                      })()
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {totalStock === 0 ? (
                      <span className="rounded-full bg-coral-soft px-2 py-0.5 text-xs font-semibold text-coral">
                        Sin stock
                      </span>
                    ) : totalStock <= 3 ? (
                      <span className="rounded-full bg-amber/20 px-2 py-0.5 text-xs font-semibold text-amber-dark">
                        {totalStock} — bajo
                      </span>
                    ) : (
                      totalStock
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {product.status === "active" ? (
                      <span className="text-ink-soft">Activo</span>
                    ) : (
                      <span className="text-ink-soft italic">Archivado</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {product._count.orderItems}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-sm font-semibold text-amber-dark hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
