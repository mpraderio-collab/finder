import { StarIcon } from "@/components/store/Icons";

// Estrellas de la tienda B (línea fina en terracota). El admin sigue usando
// components/Stars.
export function StarRating({
  rating,
  size = 14,
  className = "text-clay",
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const full = Math.round(rating);
  return (
    <span
      className={`inline-flex items-center gap-[3px] ${className}`}
      role="img"
      aria-label={`${rating.toFixed(1).replace(".", ",")} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} size={size} filled={n <= full} />
      ))}
    </span>
  );
}
