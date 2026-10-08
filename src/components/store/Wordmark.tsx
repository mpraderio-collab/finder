// Marca tipográfica de la tienda. El logo PNG es azul marino y no convive con
// la paleta crema/terracota; el pie ya usa el nombre en Fraunces, así que el
// header y el checkout hacen lo mismo para que la marca se lea igual en todos
// lados.
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-serif text-[26px] font-medium leading-none tracking-[-0.02em] text-espresso md:text-[30px] ${className}`}
    >
      Finder
    </span>
  );
}
