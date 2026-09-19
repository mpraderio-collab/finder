import Image from "next/image";
import Link from "next/link";
import { NewsletterForm } from "@/components/NewsletterForm";

export function Footer() {
  return (
    <footer className="bg-navy-deep text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-11 sm:grid-cols-[1.4fr_1fr_1fr] lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
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
          <div className="mt-4 flex items-center gap-3">
            <a
              href="https://instagram.com/finder.tecno"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de Finder"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/68 transition-colors hover:border-white/40 hover:text-white"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M12 2.2c2.7 0 3 0 4.1.06 1.1.05 1.8.22 2.2.36.5.2.9.44 1.3.84.4.4.64.8.84 1.3.15.4.32 1.1.36 2.2.06 1.2.06 1.5.06 4.1s0 3-.06 4.1c-.05 1.1-.22 1.8-.36 2.2-.2.5-.44.9-.84 1.3-.4.4-.8.64-1.3.84-.4.15-1.1.32-2.2.36-1.2.06-1.5.06-4.1.06s-3 0-4.1-.06c-1.1-.05-1.8-.22-2.2-.36a3.6 3.6 0 0 1-1.3-.84 3.6 3.6 0 0 1-.84-1.3c-.15-.4-.32-1.1-.36-2.2C2.2 15 2.2 14.7 2.2 12s0-3 .06-4.1c.05-1.1.22-1.8.36-2.2.2-.5.44-.9.84-1.3.4-.4.8-.64 1.3-.84.4-.15 1.1-.32 2.2-.36C9 2.2 9.3 2.2 12 2.2Zm0 1.8c-2.66 0-2.97 0-4.03.06-.9.04-1.4.19-1.72.31-.43.17-.74.36-1.07.69-.33.33-.52.64-.69 1.07-.12.32-.27.82-.31 1.72C4.12 9.03 4.12 9.34 4.12 12s0 2.97.06 4.03c.04.9.19 1.4.31 1.72.17.43.36.74.69 1.07.33.33.64.52 1.07.69.32.12.82.27 1.72.31 1.06.06 1.37.06 4.03.06s2.97 0 4.03-.06c.9-.04 1.4-.19 1.72-.31.43-.17.74-.36 1.07-.69.33-.33.52-.64.69-1.07.12-.32.27-.82.31-1.72.06-1.06.06-1.37.06-4.03s0-2.97-.06-4.03c-.04-.9-.19-1.4-.31-1.72a2.9 2.9 0 0 0-.69-1.07 2.9 2.9 0 0 0-1.07-.69c-.32-.12-.82-.27-1.72-.31C14.97 4 14.66 4 12 4Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 1.8a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2Zm5.1-1.98a1.14 1.14 0 1 1-2.28 0 1.14 1.14 0 0 1 2.28 0Z" />
              </svg>
            </a>
            <a
              href="https://wa.me/5493442466265"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp de Finder"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/68 transition-colors hover:border-white/40 hover:text-white"
            >
              <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor" aria-hidden="true">
                <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.36.687 4.56 1.875 6.406L4 29l7.79-1.844A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.75c-1.98 0-3.82-.55-5.394-1.5l-.386-.23-4.62 1.094 1.078-4.5-.25-.398A9.71 9.71 0 0 1 5.25 15c0-5.93 4.824-10.75 10.754-10.75S26.75 9.07 26.75 15 21.934 24.75 16.004 24.75Zm5.836-7.96c-.32-.16-1.89-.933-2.183-1.04-.293-.108-.507-.16-.72.16-.212.32-.827 1.04-1.015 1.253-.187.213-.373.24-.693.08-.32-.16-1.35-.497-2.572-1.585-.95-.848-1.592-1.895-1.78-2.215-.187-.32-.02-.493.14-.652.144-.144.32-.373.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.733-.986-2.373-.26-.626-.524-.54-.72-.55l-.613-.01c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.666s1.146 3.093 1.306 3.307c.16.213 2.256 3.44 5.467 4.826.764.33 1.36.527 1.826.674.767.244 1.466.21 2.018.127.616-.092 1.89-.773 2.157-1.52.267-.746.267-1.386.187-1.52-.08-.133-.293-.213-.613-.373Z" />
              </svg>
            </a>
          </div>
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
            <li>Envío gratis a todo el país</li>
            <li>Pagos con Mercado Pago</li>
          </ul>
        </div>
        <div>
          <p className="font-heading text-[13px] font-bold text-white">
            Novedades y descuentos
          </p>
          <p className="mt-3 text-sm/relaxed text-white/68">
            Sumate para enterarte antes que nadie de productos nuevos y
            ofertas.
          </p>
          <div className="mt-3">
            <NewsletterForm />
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-white/50 sm:flex-row">
          <span>© {new Date().getFullYear()} Finder. Todos los derechos reservados.</span>
          <span>Medios de pago: Mercado Pago · Visa · Mastercard · Cuotas sin interés</span>
        </div>
      </div>
    </footer>
  );
}
