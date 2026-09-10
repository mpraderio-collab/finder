import Image from "next/image";
import Link from "next/link";
import { formatPrice, getHeroImageUrl } from "@/lib/products";
import type { ProductWithRelations } from "@/lib/products";
import { normalizePromo } from "@/lib/promotions";

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const heroUrl = getHeroImageUrl(product);
  const totalStock =
    product.variants.length > 0
      ? product.variants.reduce((sum, v) => sum + v.stock, 0)
      : product.stock;
  const outOfStock = totalStock <= 0;
  const promo = normalizePromo(product);

  return (
    <Link
      href={`/catalogo/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-[14px] border border-line bg-bg transition-shadow hover:shadow-[0_2px_8px_rgba(15,67,104,0.08)]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surface">
        {heroUrl && (
          <Image
            src={heroUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 33vw, 100vw"
          />
        )}
        {outOfStock && (
          <span className="absolute left-3 top-3 rounded-md bg-navy px-2.5 py-1 font-heading text-xs font-bold text-white">
            Sin stock
          </span>
        )}
        {!outOfStock && promo && (
          <span className="absolute left-3 top-3 rounded-md bg-amber px-2.5 py-1 font-heading text-xs font-bold text-[#3a2500]">
            {promo.promoQuantity}x {formatPrice(promo.promoPrice)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <h3 className="font-heading text-lg font-bold text-navy">
          {product.name}
        </h3>
        <p className="line-clamp-2 text-sm text-ink-soft">
          {product.tagline}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span
            className={`font-heading text-[22px] font-extrabold ${outOfStock ? "text-ink-faint" : "text-navy"}`}
          >
            {formatPrice(product.price)}
          </span>
          {outOfStock ? (
            <span className="rounded-lg border border-border-btn bg-bg px-3 py-1.5 font-heading text-xs font-bold text-navy">
              Avisame
            </span>
          ) : product.variants.length > 0 ? (
            <span className="rounded-full bg-amber-soft px-2.5 py-1 text-xs font-semibold text-amber-ink">
              {product.variants.length} colores
            </span>
          ) : (
            <span className="rounded-lg bg-amber px-3 py-1.5 font-heading text-xs font-bold text-[#3a2500]">
              Agregar
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
