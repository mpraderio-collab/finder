import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { updatePromotion } from "../actions";
import { PromotionForm } from "../PromotionForm";
import { DeletePromotionButton } from "../DeletePromotionButton";

export default async function EditPromotionPage(
  props: PageProps<"/admin/promotions/[id]">,
) {
  const { id } = await props.params;

  const [promotion, products] = await Promise.all([
    db.promotion.findUnique({
      where: { id },
      include: {
        products: { select: { id: true } },
        tiers: { orderBy: { threshold: "asc" } },
      },
    }),
    db.product.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        price: true,
        costPrice: true,
        promotions: {
          where: { active: true, id: { not: id } },
          select: { name: true },
        },
      },
    }),
  ]);
  if (!promotion) notFound();

  const options = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    cost: p.costPrice,
    otherActivePromoName: p.promotions[0]?.name ?? null,
  }));

  const boundAction = updatePromotion.bind(null, promotion.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-extrabold text-navy">
          {promotion.name}
        </h1>
        <DeletePromotionButton id={promotion.id} name={promotion.name} />
      </div>
      <div className="mt-6">
        <PromotionForm
          action={boundAction}
          products={options}
          submitLabel="Guardar cambios"
          defaultValues={{
            name: promotion.name,
            triggerType: promotion.triggerType,
            active: promotion.active,
            productIds: promotion.products.map((p) => p.id),
            tiers: promotion.tiers.map((t) => ({
              threshold: t.threshold,
              percentOff: t.percentOff,
            })),
          }}
        />
      </div>
    </div>
  );
}
