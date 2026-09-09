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
    },
  });
  if (!product) notFound();

  const boundAction = updateProduct.bind(null, product.id);

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-ink">
        {product.name}
      </h1>
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
          }}
        />
      </div>
      <ImageManager productId={product.id} images={product.images} />
      <VariantStockEditor variants={product.variants} />
      <DangerZone id={product.id} status={product.status} />
    </div>
  );
}
