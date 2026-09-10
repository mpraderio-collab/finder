"use client";

// Input de dinero con separador de miles (ej: "12.365"). El valor real
// (sin puntos) viaja en un input hidden con el mismo name, para que el
// form action reciba un número plano — el input visible es solo texto.
function formatThousands(value: number | ""): string {
  if (value === "") return "";
  return value.toLocaleString("es-AR");
}

export function MoneyInput({
  name,
  value,
  onChange,
  required,
  disabled,
  className,
}: {
  name?: string;
  value: number | "";
  onChange: (value: number | "") => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <>
      {name && <input type="hidden" name={name} value={value} />}
      <input
        type="text"
        inputMode="numeric"
        value={formatThousands(value)}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          onChange(digits === "" ? "" : Number(digits));
        }}
        required={required}
        disabled={disabled}
        className={className}
      />
    </>
  );
}
