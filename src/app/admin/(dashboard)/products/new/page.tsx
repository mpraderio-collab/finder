import { createProduct } from "../actions";
import { ProductForm } from "../ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-ink">
        Nuevo producto
      </h1>
      <div className="mt-6">
        <ProductForm action={createProduct} submitLabel="Crear producto" />
      </div>
    </div>
  );
}
