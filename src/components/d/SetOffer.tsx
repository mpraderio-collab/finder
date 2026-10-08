import Image from "next/image";
import { FIT_PRODUCT } from "@/components/d/media";
import Link from "next/link";
import { formatPrice, getHeroImageUrl, type ProductWithRelations } from "@/lib/products";
import { activePromotion, calculateLineTotals } from "@/lib/promotions";

function shortTitle(name: string) {
  return name.split(/ con | carga /)[0];
}

// One unit of every product in the first active promotion, priced with the
// same calculation the cart uses. Null when there is no combinable promo.
export function getSetOffer(products: ProductWithRelations[]) {
  const promo = products.map((p) => activePromotion(p)).find(Boolean) ?? null;
  if (!promo) return null;
  const items = products.filter((p) => activePromotion(p)?.id === promo.id);
  if (items.length < 2) return null;
  const lines = items.map((p) => ({
    key: p.id,
    unitPrice: p.price,
    quantity: 1,
    promotion: activePromotion(p),
  }));
  const raw = lines.reduce((sum, l) => sum + l.unitPrice, 0);
  const total = Array.from(calculateLineTotals(lines).values()).reduce((a, b) => a + b, 0);
  if (total >= raw) return null;
  return { items, raw, total };
}

export function SetPanel({
  offer,
  className = "",
}: {
  offer: NonNullable<ReturnType<typeof getSetOffer>>;
  className?: string;
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      <h2 className="font-d-serif text-[32px] leading-tight">El set completo</h2>
      <ul className="mt-6 text-sm">
        {offer.items.map((p) => {
          const hero = getHeroImageUrl(p);
          return (
            <li key={p.id} className="flex items-center gap-4 border-t border-d-line py-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-d-surface">
                {hero && <Image src={hero} alt="" fill className={FIT_PRODUCT} sizes="56px" />}
              </div>
              <Link href={`/catalogo/${p.slug}`} className="d-fade flex-1">
                {shortTitle(p.name)}
              </Link>
              <span>{formatPrice(p.price)}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex items-baseline justify-between border-t border-d-ink pt-4">
        <span className="text-sm text-d-muted line-through">{formatPrice(offer.raw)}</span>
        <span className="font-d-serif text-[40px] leading-none">{formatPrice(offer.total)}</span>
      </div>
      <Link href="/catalogo#productos" className="d-btn mt-6 w-full">
        Armar el set
      </Link>
      <p className="mt-3 text-sm text-d-muted">El descuento se aplica solo en el carrito al sumar las tres.</p>
    </div>
  );
}
