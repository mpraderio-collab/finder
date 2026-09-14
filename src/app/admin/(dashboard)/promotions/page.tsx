import Link from "next/link";
import { db } from "@/lib/db";
import { tierLabel } from "@/lib/promotions";
import { DeletePromotionButton } from "./DeletePromotionButton";

export default async function PromotionsPage() {
  const promotions = await db.promotion.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      products: { select: { id: true, name: true } },
      tiers: { orderBy: { threshold: "asc" } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-extrabold text-navy">
          Promociones
        </h1>
        <Link
          href="/admin/promotions/new"
          className="rounded-lg bg-navy px-5 py-2.5 font-heading text-sm font-bold text-white hover:bg-navy-deep"
        >
          + Nueva promoción
        </Link>
      </div>
      <p className="mt-1 max-w-xl text-sm text-ink-soft">
        Combiná uno o varios productos en una misma promo: las cantidades (o
        el monto) de todos se suman para ver a qué tramo de descuento llega
        el cliente.
      </p>

      {promotions.length === 0 ? (
        <p className="mt-10 text-ink-soft">Todavía no creaste ninguna promoción.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {promotions.map((promo) => (
            <div key={promo.id} className="rounded-xl border border-line bg-bg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/promotions/${promo.id}`}
                      className="font-heading text-lg font-bold text-navy hover:underline"
                    >
                      {promo.name}
                    </Link>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                        promo.active
                          ? "bg-ok-bg text-ok-ink"
                          : "bg-surface text-ink-faint"
                      }`}
                    >
                      {promo.active ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">
                    {promo.products.map((p) => p.name).join(", ")}
                  </p>
                  <p className="mt-2 text-sm text-ink">
                    {promo.tiers
                      .map((t) => tierLabel({ triggerType: promo.triggerType }, t))
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    href={`/admin/promotions/${promo.id}`}
                    className="font-heading text-sm font-bold text-blue hover:text-navy"
                  >
                    Editar
                  </Link>
                  <DeletePromotionButton id={promo.id} name={promo.name} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
