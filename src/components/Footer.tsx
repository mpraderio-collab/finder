import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-navy-deep text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-11 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Image
            src="/brand/finder-logo-white.png"
            alt="Finder"
            width={1463}
            height={303}
            className="h-5 w-auto"
          />
          <p className="mt-3 max-w-[290px] text-sm/relaxed text-white/68">
            Importamos iluminación moderna para leer, trabajar y ambientar tu
            casa.
          </p>
        </div>
        <div>
          <p className="font-heading text-[13px] font-bold text-white">
            Tienda
          </p>
          <ul className="mt-3 space-y-0 text-sm leading-[2] text-white/68">
            <li>
              <Link href="/catalogo" className="hover:text-white">
                Catálogo completo
              </Link>
            </li>
            <li>
              <Link href="/nosotros" className="hover:text-white">
                Nosotros
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-heading text-[13px] font-bold text-white">
            Ayuda
          </p>
          <ul className="mt-3 space-y-0 text-sm leading-[2] text-white/68">
            <li>
              <Link href="/contacto" className="hover:text-white">
                Contacto
              </Link>
            </li>
            <li>Envíos a todo el país</li>
            <li>Pagos con Mercado Pago</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Finder. Todos los derechos reservados.
      </div>
    </footer>
  );
}
