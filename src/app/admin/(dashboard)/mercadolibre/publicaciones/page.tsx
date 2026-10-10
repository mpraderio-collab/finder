import Link from "next/link";
import { db } from "@/lib/db";
import { ListingForm } from "./ListingForm";
import { DeleteListingButton } from "./DeleteListingButton";

export default async function MlListingsPage() {
  const [products, listings, unlinked] = await Promise.all([
    db.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, variants: { select: { name: true }, orderBy: { name: "asc" } } },
    }),
    db.mlListing.findMany({
      orderBy: { createdAt: "desc" },
      include: { product: { select: { name: true } } },
    }),
    // Publicaciones que ya aparecen en ventas importadas pero no están vinculadas.
    db.mlOrderItem.groupBy({
      by: ["mlItemId", "title"],
      where: { productId: null },
      _count: { _all: true },
    }),
  ]);

  const options = products.map((p) => ({ id: p.id, name: p.name, variants: p.variants.map((v) => v.name) }));

  return (
    <div>
      <p className="text-sm text-ink-faint">
        <Link href="/admin/mercadolibre" className="hover:text-navy">
          Mercado Libre
        </Link>{" "}
        / <span className="text-ink">Publicaciones</span>
      </p>
      <h1 className="mt-1 font-heading text-2xl font-extrabold text-navy">Publicaciones vinculadas</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        Cada publicación de Mercado Libre se vincula con un producto de Finder. Con eso se sabe cuál
        es el costo de lo que vendiste y se puede calcular el margen de cada venta.
      </p>

      {unlinked.length > 0 && (
        <div className="mt-6 rounded-xl border border-warn-line bg-warn-bg p-4 text-sm text-warn-ink">
          <p className="font-semibold">Publicaciones vendidas que todavía no vinculaste</p>
          <ul className="mt-2 flex flex-col gap-1">
            {unlinked.map((u) => (
              <li key={u.mlItemId}>
                <span className="font-mono">{u.mlItemId}</span>
                {u.title && <span> — {u.title}</span>}
                <span className="text-warn-ink/70">
                  {" "}
                  ({u._count._all} {u._count._all === 1 ? "venta" : "ventas"})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <ListingForm products={options} />
      </div>

      {listings.length === 0 ? (
        <p className="mt-8 text-ink-soft">Todavía no vinculaste ninguna publicación.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-4 py-3">Publicación</th>
                <th className="px-4 py-3">Producto de Finder</th>
                <th className="px-4 py-3">Variante</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono text-navy">
                    <a
                      href={`https://articulo.mercadolibre.com.ar/${l.mlItemId.replace("MLA", "MLA-")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {l.mlItemId}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-ink">{l.product.name}</td>
                  <td className="px-4 py-3 text-ink-soft">{l.variantName ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <DeleteListingButton id={l.id} mlItemId={l.mlItemId} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
