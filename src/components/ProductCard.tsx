import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { formatPrice, getHeroImageUrl } from "@/lib/products";
import type { ProductWithRelations } from "@/lib/products";
import { activePromotion, maxPercentOff } from "@/lib/promotions";

export function productImageTransitionName(slug: string) {
  return `product-image-${slug}`;
}

// maap.cc product tile: grey tile, tag top-left, second photo fades in on
// hover, name + price underneath. The photo morphs into the product page.
export function ProductCard({
  product,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  className = "",
}: {
  product: ProductWithRelations;
  sizes?: string;
  className?: string;
}) {
  const heroUrl = getHeroImageUrl(product);
  const secondaryUrl = product.images.find(
    (img) => img.type !== "video" && img.url !== heroUrl,
  )?.url;
  const totalStock =
    product.variants.length > 0
      ? product.variants.reduce((sum, v) => sum + v.stock, 0)
      : product.stock;
  const outOfStock = totalStock <= 0;
  const promo = activePromotion(product);

  return (
    <Link
      href={`/catalogo/${product.slug}`}
      transitionTypes={["nav-forward"]}
      className={`e-tile group flex flex-col gap-3 ${className}`}
    >
      <div className="e-tile-media relative aspect-[340/420] w-full overflow-hidden bg-e-tile">
        {heroUrl && (
          <ViewTransition name={productImageTransitionName(product.slug)} share="e-morph" default="none">
            <Image
              src={heroUrl}
              alt={product.name}
              fill
              className="e-tile-primary object-cover"
              sizes={sizes}
            />
          </ViewTransition>
        )}
        {secondaryUrl && (
          <Image
            src={secondaryUrl}
            alt=""
            aria-hidden
            fill
            className="e-tile-secondary object-cover"
            sizes={sizes}
          />
        )}
        {(outOfStock || promo) && (
          <span className="e-mono absolute left-3 top-3 rounded-[12px] bg-white px-2.5 py-1 text-e-ink">
            {outOfStock ? "Sin stock" : `Hasta ${maxPercentOff(promo!)}% off`}
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-[13px] leading-snug text-e-ink">{product.name}</h3>
          <p className={`text-[13px] tabular-nums ${outOfStock ? "text-e-faint" : "text-e-muted"}`}>
            {formatPrice(product.price)}
          </p>
        </div>
        {product.variants.length > 0 && (
          <span className="flex shrink-0 gap-1 pt-1" aria-label={`${product.variants.length} colores`}>
            {product.variants.map((v) => (
              <span
                key={v.name}
                title={v.name}
                className="h-2.5 w-2.5 rounded-full border border-e-line"
                style={{ backgroundColor: v.swatch }}
              />
            ))}
          </span>
        )}
      </div>
    </Link>
  );
}
