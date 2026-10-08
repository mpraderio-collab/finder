/// <reference types="react/canary" />
import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { formatPrice, getHeroImageUrl } from "@/lib/products";
import type { ProductWithRelations } from "@/lib/products";
import { activePromotion, maxPercentOff } from "@/lib/promotions";
import { ArrowRight } from "@/components/store/Icons";
import { productTransitionName } from "@/components/store/scenes";

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const heroUrl = getHeroImageUrl(product);
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
      className="group flex flex-col"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-sand">
        {heroUrl && (
          <ViewTransition name={productTransitionName(product.slug)} share="morph" default="none">
            <Image
              src={heroUrl}
              alt={product.name}
              fill
              className="b-zoom object-cover"
              sizes="(min-width: 768px) 33vw, 100vw"
            />
          </ViewTransition>
        )}
        {outOfStock && (
          <span className="absolute left-4 top-4 bg-espresso px-2.5 py-1 text-xs font-semibold text-cream">
            Sin stock
          </span>
        )}
        {!outOfStock && promo && (
          <span className="absolute left-4 top-4 bg-cream px-2.5 py-1 text-xs font-semibold text-clay-ink">
            Hasta {maxPercentOff(promo)}% off
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 border-b border-linen py-5">
        <h3 className="font-serif text-[22px]/[1.2] text-espresso">{product.name}</h3>
        <p className="line-clamp-2 text-[15px]/[1.55] text-taupe">{product.tagline}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className={`font-serif text-[22px] ${outOfStock ? "text-taupe" : "text-espresso"}`}>
            {formatPrice(product.price)}
          </span>
          <span className="flex items-center gap-2 text-sm font-semibold text-clay-ink">
            {outOfStock
              ? "Avisame"
              : product.variants.length > 0
                ? `${product.variants.length} colores`
                : "Ver producto"}
            <ArrowRight size={16} className="b-arrow" />
          </span>
        </div>
      </div>
    </Link>
  );
}
