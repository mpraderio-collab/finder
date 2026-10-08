import Link from "next/link";
import { NewsletterForm } from "@/components/NewsletterForm";

const columns = [
  {
    title: "Tienda",
    links: [
      { label: "Catálogo completo", href: "/catalogo" },
      { label: "Nosotros", href: "/nosotros" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { label: "Contacto", href: "/contacto" },
      { label: "Envío a todo el país" },
      { label: "Pagos con Mercado Pago" },
      { label: "Cambios en 30 días" },
    ],
  },
  {
    title: "Contacto",
    links: [
      { label: "WhatsApp", href: "https://wa.me/5493442466265", external: true },
      { label: "ventas@findertecno.com", href: "mailto:ventas@findertecno.com" },
      { label: "Instagram", href: "https://instagram.com/finder.tecno", external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-d-ink bg-d-bg font-d-sans text-d-ink">
      <div className="grid gap-12 px-5 pb-14 pt-8 md:grid-cols-[minmax(0,520px)_1fr_1fr_1fr] md:gap-10 md:px-10">
        <div className="flex flex-col gap-4">
          <p className="text-[26px] leading-none tracking-[-0.02em]">Finder</p>
          <p className="max-w-[360px] text-sm/[1.5] text-d-muted">
            Importamos iluminación moderna para leer, trabajar y ambientar tu casa. Despachamos a todo
            el país.
          </p>
          <div className="max-w-[360px] pt-6">
            <p className="text-sm">Novedades y descuentos</p>
            <NewsletterForm />
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-2 text-sm">
            <p className="text-d-muted">{col.title}</p>
            {col.links.map((link) =>
              link.href ? (
                link.href.startsWith("/") ? (
                  <Link key={link.label} href={link.href} className="d-fade w-fit">
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    target={"external" in link && link.external ? "_blank" : undefined}
                    rel={"external" in link && link.external ? "noopener noreferrer" : undefined}
                    className="d-fade w-fit"
                  >
                    {link.label}
                  </a>
                )
              ) : (
                <span key={link.label}>{link.label}</span>
              ),
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 border-t border-d-line px-5 py-5 text-sm text-d-muted sm:flex-row sm:justify-between md:px-10">
        <span>© {new Date().getFullYear()} Finder. Todos los derechos reservados.</span>
        <span>Mercado Pago · Visa · Mastercard · Cuotas sin interés</span>
      </div>
    </footer>
  );
}
