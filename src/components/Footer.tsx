import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line bg-ink text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-3">
        <div>
          <p className="font-heading text-xl font-extrabold">
            Finder<span className="text-amber">.</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-cream/70">
            Importamos iluminación moderna para leer, trabajar y ambientar tu
            casa.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-cream/90">Tienda</p>
          <ul className="mt-3 space-y-2 text-sm text-cream/70">
            <li>
              <Link href="/catalogo" className="hover:text-cream">
                Catálogo completo
              </Link>
            </li>
            <li>
              <Link href="/nosotros" className="hover:text-cream">
                Nosotros
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-cream/90">Ayuda</p>
          <ul className="mt-3 space-y-2 text-sm text-cream/70">
            <li>
              <Link href="/contacto" className="hover:text-cream">
                Contacto
              </Link>
            </li>
            <li>
              <span>Envíos a todo el país</span>
            </li>
            <li>
              <span>Pagos con Mercado Pago</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10 px-6 py-5 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} Finder. Todos los derechos reservados.
      </div>
    </footer>
  );
}
