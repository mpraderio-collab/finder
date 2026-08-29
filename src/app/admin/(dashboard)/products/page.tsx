import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice, getHeroImageUrl } from "@/lib/products";

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orderItems: true } },
      variants: true,
      images: true,
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-extrabold text-navy">
          Productos
        </h1>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-navy px-5 py-2.5 font-heading text-sm font-bold text-white hover:bg-navy-deep"
        >
          + Nuevo producto
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-10 text-ink-soft">
          Todavía no cargaste ningún producto.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint" />
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Producto
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Precio
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Margen $
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Margen %
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Stock
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Estado
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                  Pedidos
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const totalStock =
                  product.variants.length > 0
                    ? product.variants.reduce((sum, v) => sum + v.stock, 0)
                    : product.stock;
                const heroUrl = getHeroImageUrl(product);
                return (
                <tr key={product.id} className="border-b border-line-soft last:border-0">
                  <td className="px-4 py-3">
                    <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-surface">
                      {heroUrl && (
                        <Image
                          src={heroUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="44px"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-heading font-semibold text-navy">
                    {product.name}
                    {product.variants.length > 0 && (
                      <span className="ml-1.5 font-body text-xs font-normal text-ink-faint">
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
                        return (
                          <span
                            className={
                              margin < 0 ? "font-semibold text-err-ink" : undefined
                            }
                          >
                            {formatPrice(margin)}
                          </span>
                        );
                      })()
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {product.costPrice == null ? (
                      "—"
                    ) : product.costPrice === 0 ? (
                      <span title="Costo $0 — el markup no está definido">
                        —
                      </span>
                    ) : (
                      (() => {
                        const margin = product.price - product.costPrice;
                        const markupPct = Math.round(
                          (margin / product.costPrice) * 100,
                        );
                        return (
                          <span
                            className={
                              markupPct < 0 ? "font-semibold text-err-ink" : undefined
                            }
                          >
                            {markupPct}%
                          </span>
                        );
                      })()
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {totalStock === 0 ? (
                      <span className="rounded-full bg-err-bg px-2 py-0.5 text-xs font-semibold text-err-ink">
                        Sin stock
                      </span>
                    ) : totalStock <= 3 ? (
                      <span className="rounded-full bg-amber-soft px-2 py-0.5 text-xs font-semibold text-amber-ink">
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
                      <span className="italic text-ink-faint">Archivado</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {product._count.orderItems}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="font-heading text-sm font-bold text-blue hover:text-navy"
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
