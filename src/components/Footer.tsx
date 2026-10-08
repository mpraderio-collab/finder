import Link from "next/link";
import { NewsletterForm } from "@/components/NewsletterForm";
import { CardIcon, ReturnIcon, TruckIcon } from "@/components/store/Icons";

const services = [
  {
    Icon: TruckIcon,
    title: "Envío a todo el país",
    text: "Correo Argentino, 3 a 5 días hábiles",
  },
  {
    Icon: CardIcon,
    title: "Pagos con Mercado Pago",
    text: "Tarjeta, cuotas o dinero en cuenta",
  },
  {
    Icon: ReturnIcon,
    title: "Cambios en 30 días",
    text: "Si no es lo que esperabas, lo resolvemos",
  },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-e-bg text-e-ink">
      <div className="grid gap-10 border-t border-e-line px-4 py-14 sm:grid-cols-3 md:px-8">
        {services.map(({ Icon, title, text }) => (
          <div key={title} className="flex flex-col items-center gap-2.5 text-center">
            <Icon size={28} />
            <p className="text-[14px] font-medium">{title}</p>
            <p className="text-[12px] text-e-muted">{text}</p>
          </div>
        ))}
      </div>

      <div className="bg-e-ink px-4 pb-8 pt-14 text-white md:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_420px]">
          <div className="flex flex-col gap-2.5">
            <p className="e-mono text-e-faint">Tienda</p>
            <Link href="/catalogo" className="text-[14px] transition-opacity hover:opacity-60">
              Catálogo completo
            </Link>
            <Link href="/nosotros" className="text-[14px] transition-opacity hover:opacity-60">
              Nosotros
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <p className="e-mono text-e-faint">Ayuda</p>
            <Link href="/contacto" className="text-[14px] transition-opacity hover:opacity-60">
              Contacto
            </Link>
            <span className="text-[14px]">Envío a todo el país</span>
            <span className="text-[14px]">Pagos con Mercado Pago</span>
          </div>
          <div className="flex flex-col gap-2.5">
            <p className="e-mono text-e-faint">Finder</p>
            <a
              href="https://wa.me/5493442466265"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] transition-opacity hover:opacity-60"
            >
              WhatsApp
            </a>
            <a
              href="https://instagram.com/finder.tecno"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] transition-opacity hover:opacity-60"
            >
              Instagram
            </a>
          </div>
          <div className="flex flex-col gap-3">
            <p className="e-mono text-e-faint">Novedades y descuentos</p>
            <p className="text-[14px]">
              Sumate para enterarte antes que nadie de productos nuevos y ofertas.
            </p>
            <NewsletterForm />
          </div>
        </div>
        <div className="mt-14 flex flex-col justify-between gap-3 sm:flex-row">
          <span className="e-mono text-e-faint">
            © {new Date().getFullYear()} Finder
          </span>
          <span className="e-mono text-e-faint">Mercado Pago · Visa · Mastercard · Cuotas sin interés</span>
        </div>
      </div>
    </footer>
  );
}
