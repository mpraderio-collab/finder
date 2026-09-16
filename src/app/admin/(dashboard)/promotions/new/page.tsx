import { db } from "@/lib/db";
import { createPromotion } from "../actions";
import { PromotionForm } from "../PromotionForm";

export default async function NewPromotionPage() {
  const products = await db.product.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      price: true,
      costPrice: true,
      promotions: { where: { active: true }, select: { name: true } },
    },
  });

  const options = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    cost: p.costPrice,
    otherActivePromoName: p.promotions[0]?.name ?? null,
  }));

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-navy">
        Nueva promoción
      </h1>
      <div className="mt-6">
        <PromotionForm action={createPromotion} products={options} submitLabel="Crear promoción" />
      </div>
    </div>
  );
}
