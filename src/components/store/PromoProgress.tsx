"use client";

import type { CartItem } from "@/lib/cart-context";
import { formatPrice } from "@/lib/products";

// Display-only progress towards the next promotion tier, computed from the
// promotion data the cart items already carry (same tiers lib/promotions
// applies at checkout).
export function PromoProgress({ items }: { items: CartItem[] }) {
  const promo = items.find((i) => i.promotion && i.promotion.tiers.length > 0)?.promotion;
  if (!promo) return null;

  const lines = items.filter((i) => i.promotion?.id === promo.id);
  const byAmount = promo.triggerType === "amount";
  const metric = byAmount
    ? lines.reduce((sum, l) => sum + l.price * l.quantity, 0)
    : lines.reduce((sum, l) => sum + l.quantity, 0);
  const tiers = [...promo.tiers].sort((a, b) => a.threshold - b.threshold);
  const next = tiers.find((t) => t.threshold > metric);
  const reached = [...tiers].reverse().find((t) => t.threshold <= metric);
  const goal = (next ?? tiers[tiers.length - 1]).threshold;
  const segments = byAmount ? 1 : Math.min(goal, 6);
  const ratio = Math.min(1, metric / goal);

  const missing = next ? next.threshold - metric : 0;
  const label = next
    ? byAmount
      ? `Sumá ${formatPrice(missing)} más y ahorrá ${next.percentOff}%`
      : `Agregá ${missing} ${missing === 1 ? "luz" : "luces"} más y ahorrá ${next.percentOff}%`
    : `Ahorrás ${reached?.percentOff ?? 0}% con la promo`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] text-e-ink">{label}</span>
        {!byAmount && (
          <span className="e-mono text-e-muted">
            {Math.min(metric, goal)}/{goal}
          </span>
        )}
      </div>
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: segments }, (_, i) => {
          const fill = byAmount ? ratio : Math.min(1, Math.max(0, metric - i));
          return (
            <span key={i} className="relative h-[3px] flex-1 overflow-hidden bg-e-line">
              <span
                className="e-progress-fill absolute inset-0 bg-e-ink"
                style={{ transform: `scaleX(${fill})` }}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}
