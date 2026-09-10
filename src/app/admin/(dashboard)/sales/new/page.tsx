import { db } from "@/lib/db";
import { ManualSaleForm } from "../ManualSaleForm";

export default async function NewManualSalePage() {
  const products = await db.product.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
    include: { variants: true },
  });

  const options = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    variants: p.variants.map((v) => ({ name: v.name, stock: v.stock })),
  }));

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-ink">
        Nueva venta manual
      </h1>
      <p className="mt-1 max-w-xl text-sm text-ink-soft">
        Registrá una venta que hiciste por fuera de la página (en persona,
        por WhatsApp, en una feria, etc.). Arranca como borrador — podés
        seguir editándola hasta que la confirmes, recién ahí se descuenta
        el stock.
      </p>

      <div className="mt-8">
        <ManualSaleForm products={options} />
      </div>
    </div>
  );
}
