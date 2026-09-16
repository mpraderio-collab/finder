import Image from "next/image";
import { db } from "@/lib/db";
import { Stars } from "@/components/Stars";
import { ReviewActions } from "./ReviewActions";

export default async function AdminReviewsPage() {
  const [pending, approved] = await Promise.all([
    db.review.findMany({
      where: { approved: false },
      orderBy: { createdAt: "desc" },
      include: { product: { select: { name: true, slug: true } } },
    }),
    db.review.findMany({
      where: { approved: true, isMocked: false },
      orderBy: { createdAt: "desc" },
      include: { product: { select: { name: true, slug: true } } },
      take: 20,
    }),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-navy">
        Reseñas
      </h1>
      <p className="mt-1 max-w-xl text-sm text-ink-soft">
        Las reseñas que dejan los clientes quedan acá pendientes hasta que las
        aprobás — recién ahí se muestran en la ficha del producto.
      </p>

      <h2 className="mt-8 font-heading text-lg font-bold text-navy">
        Pendientes {pending.length > 0 && `(${pending.length})`}
      </h2>
      {pending.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">No hay reseñas pendientes.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {pending.map((review) => (
            <div
              key={review.id}
              className="flex flex-col gap-3 rounded-xl border border-line bg-bg p-5 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex flex-1 gap-4">
                {review.photoUrl && (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={review.photoUrl}
                      alt={`Foto de ${review.author}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                )}
                <div>
                  <p className="text-xs text-ink-soft">{review.product.name}</p>
                  <Stars rating={review.rating} />
                  <p className="mt-1 text-sm/[1.5] text-ink">{review.text}</p>
                  <p className="mt-1 font-heading text-sm font-bold text-navy">
                    {review.author}
                  </p>
                </div>
              </div>
              <ReviewActions id={review.id} />
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-10 font-heading text-lg font-bold text-navy">
        Publicadas recientemente
      </h2>
      {approved.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">
          Todavía no se publicó ninguna reseña de clientes.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-bg">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Calificación</th>
                <th className="px-4 py-3">Texto</th>
              </tr>
            </thead>
            <tbody>
              {approved.map((review) => (
                <tr key={review.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">{review.product.name}</td>
                  <td className="px-4 py-3">{review.author}</td>
                  <td className="px-4 py-3">
                    <Stars rating={review.rating} />
                  </td>
                  <td className="max-w-sm truncate px-4 py-3 text-ink-soft">
                    {review.text}
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
