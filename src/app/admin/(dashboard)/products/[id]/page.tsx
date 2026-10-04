import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { updateProduct } from "../actions";
import { ProductForm } from "../ProductForm";
import { DangerZone } from "./DangerZone";
import { ImageManager } from "./ImageManager";
import { VariantStockEditor } from "./VariantStockEditor";

export default async function EditProductPage(
  props: PageProps<"/admin/products/[id]">,
) {
  const { id } = await props.params;
  const product = await db.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: {
        include: { images: { orderBy: { position: "asc" } } },
      },
      features: { orderBy: { position: "asc" } },
      specs: { orderBy: { position: "asc" } },
      promotions: { where: { active: true }, select: { id: true, name: true } },
    },
  });
  if (!product) notFound();

  const boundAction = updateProduct.bind(null, product.id);

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-ink">
        {product.name}
      </h1>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
        <span className="text-ink-soft">Promoción:</span>
        {product.promotions.length > 0 ? (
          <Link
            href={`/admin/promotions/${product.promotions[0].id}`}
            className="font-semibold text-blue hover:text-navy"
          >
            {product.promotions[0].name} →
          </Link>
        ) : (
          <>
            <span className="text-ink-faint">Sin promoción activa</span>
            <Link
              href="/admin/promotions/new"
              className="ml-auto font-semibold text-blue hover:text-navy"
            >
              + Crear promoción
            </Link>
          </>
        )}
      </div>
      <div className="mt-6">
        <ProductForm
          action={boundAction}
          submitLabel="Guardar cambios"
          defaultValues={{
            name: product.name,
            slug: product.slug,
            tagline: product.tagline,
            description: product.description,
            price: product.price,
            costPrice: product.costPrice,
            stock: product.stock,
            status: product.status,
            features: product.features.map((f) => f.text).join("\n"),
            specs: product.specs.map((s) => `${s.label}: ${s.value}`).join("\n"),
          }}
        />
      </div>
      <ImageManager productId={product.id} images={product.images} />
      <VariantStockEditor variants={product.variants} />
      <DangerZone id={product.id} status={product.status} />
    </div>
  );
}
