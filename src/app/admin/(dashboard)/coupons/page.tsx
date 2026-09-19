import { db } from "@/lib/db";
import { CouponForm } from "./CouponForm";
import { CouponRowActions } from "./CouponRowActions";

export default async function CouponsPage() {
  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-navy">Cupones</h1>
      <p className="mt-1 max-w-xl text-sm text-ink-soft">
        Códigos que el cliente tipea en el checkout para un % de descuento sobre
        el subtotal (con promociones ya aplicadas, sin contar el envío) —
        distinto de las Promociones, que son automáticas por producto/cantidad.
      </p>

      <div className="mt-6">
        <CouponForm />
      </div>

      {coupons.length === 0 ? (
        <p className="mt-10 text-ink-soft">Todavía no creaste ningún cupón.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Descuento</th>
                <th className="px-4 py-3">Usado en</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono font-semibold text-navy">{c.code}</td>
                  <td className="px-4 py-3 text-ink">{c.percentOff}%</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {c._count.orders} {c._count.orders === 1 ? "pedido" : "pedidos"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                        c.active ? "bg-ok-bg text-ok-ink" : "bg-surface text-ink-faint"
                      }`}
                    >
                      {c.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CouponRowActions id={c.id} name={c.code} active={c.active} />
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
