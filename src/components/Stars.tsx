export function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber" aria-label={`${rating} de 5 estrellas`}>
      {"★".repeat(Math.round(rating))}
      <span className="text-border-input">
        {"★".repeat(5 - Math.round(rating))}
      </span>
    </span>
  );
}
