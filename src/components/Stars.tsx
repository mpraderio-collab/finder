export function Stars({ rating, tone = "amber" }: { rating: number; tone?: "amber" | "ink" }) {
  const filled = tone === "ink" ? "text-e-ink" : "text-amber";
  const empty = tone === "ink" ? "text-e-line" : "text-border-input";
  return (
    <span className={filled} aria-label={`${rating} de 5 estrellas`}>
      {"★".repeat(Math.round(rating))}
      <span className={empty}>
        {"★".repeat(5 - Math.round(rating))}
      </span>
    </span>
  );
}
