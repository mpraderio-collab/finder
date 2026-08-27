import Image from "next/image";
import Link from "next/link";
import { formatPrice, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/catalogo/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-shadow hover:shadow-lg hover:shadow-ink/5"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-cream-soft">
        <Image
          src={product.images.hero}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(min-width: 768px) 33vw, 100vw"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-heading text-lg font-bold text-ink">
          {product.name}
        </h3>
        <p className="line-clamp-2 text-sm text-ink-soft">
          {product.tagline}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-heading text-xl font-extrabold text-ink">
            {formatPrice(product.price)}
          </span>
          <span className="text-sm font-semibold text-amber-dark group-hover:underline">
            Ver más →
          </span>
        </div>
      </div>
    </Link>
  );
}
