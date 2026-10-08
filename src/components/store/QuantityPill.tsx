import { MinusIcon, PlusIcon } from "@/components/store/Icons";

export function QuantityPill({
  value,
  onDecrement,
  onIncrement,
  canDecrement = true,
  canIncrement = true,
  size = "md",
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  canDecrement?: boolean;
  canIncrement?: boolean;
  size?: "sm" | "md";
}) {
  const height = size === "sm" ? "h-8" : "h-10";
  return (
    <div
      className={`inline-flex ${height} items-center rounded-[24px] border border-e-line bg-e-bg`}
    >
      <button
        type="button"
        onClick={onDecrement}
        disabled={!canDecrement}
        aria-label="Restar cantidad"
        className="grid h-full w-9 place-items-center text-e-ink transition-opacity disabled:opacity-30"
      >
        <MinusIcon size={14} />
      </button>
      <span className="min-w-6 text-center text-[13px] tabular-nums text-e-ink">{value}</span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={!canIncrement}
        aria-label="Sumar cantidad"
        className="grid h-full w-9 place-items-center text-e-ink transition-opacity disabled:opacity-30"
      >
        <PlusIcon size={14} />
      </button>
    </div>
  );
}
