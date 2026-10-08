export function Stars({
  rating,
  tone = "amber",
}: {
  rating: number;
  // "ink" is the storefront (D · Galería) look; admin keeps amber.
  tone?: "amber" | "ink";
}) {
  const filled = tone === "ink" ? "tracking-[0.1em] text-d-ink" : "text-amber";
  const empty = tone === "ink" ? "text-d-line" : "text-border-input";
  return (
    <span className={filled} aria-label={`${rating} de 5 estrellas`}>
      {"★".repeat(Math.round(rating))}
      <span className={empty}>{"★".repeat(5 - Math.round(rating))}</span>
    </span>
  );
}
