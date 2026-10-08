import Image from "next/image";
import Link from "next/link";
import { formatPrice, getHeroImageUrl } from "@/lib/products";
import type { ProductWithRelations } from "@/lib/products";
import { activePromotion, maxPercentOff } from "@/lib/promotions";
import { ProductPhotoTransition } from "@/components/d/PageTransition";
import { CtaArrow } from "@/components/d/CtaLink";

export function ProductCard({
  product,
  aspect = "aspect-[4/5]",
  sizes = "(min-width: 768px) 33vw, 100vw",
  priority = false,
}: {
  product: ProductWithRelations;
  aspect?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const heroUrl = getHeroImageUrl(product);
  const totalStock =
    product.variants.length > 0
      ? product.variants.reduce((sum, v) => sum + v.stock, 0)
      : product.stock;
  const outOfStock = totalStock <= 0;
  const promo = activePromotion(product);

  return (
    <Link href={`/catalogo/${product.slug}`} className="group flex flex-col font-d-sans text-d-ink">
      <ProductPhotoTransition slug={product.slug}>
        <div className={`relative w-full overflow-hidden bg-d-surface ${aspect}`}>
          {heroUrl && (
            <Image
              src={heroUrl}
              alt={product.name}
              fill
              priority={priority}
              className="d-zoom object-cover"
              sizes={sizes}
            />
          )}
          {outOfStock ? (
            <span className="absolute left-3 top-3 bg-d-bg px-2 py-1 text-xs">Sin stock</span>
          ) : (
            promo && (
              <span className="absolute left-3 top-3 bg-d-bg px-2 py-1 text-xs">
                Hasta {maxPercentOff(promo)}% off
              </span>
            )
          )}
        </div>
      </ProductPhotoTransition>
      <div className="flex items-start justify-between gap-4 pt-4">
        <h3 className="font-d-serif text-[22px] leading-[1.2]">{product.name}</h3>
        <span className={`shrink-0 pt-1 text-sm ${outOfStock ? "text-d-muted" : ""}`}>
          {formatPrice(product.price)}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-d-muted">{product.tagline}</p>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="d-cta">
          <CtaArrow />
          {outOfStock ? "Avisame" : "Ver y agregar"}
        </span>
        {product.variants.length > 0 && (
          <span className="text-d-muted">{product.variants.length} colores</span>
        )}
      </div>
    </Link>
  );
}
