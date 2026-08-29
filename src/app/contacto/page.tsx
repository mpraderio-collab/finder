import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contacto — Finder",
  description: "Escribinos por cualquier consulta sobre tu pedido.",
};

const cards = [
  { label: "Email", value: "hola@findertecno.com", href: "mailto:hola@findertecno.com" },
  {
    label: "Instagram",
    value: "@findertecno",
    href: "https://instagram.com/findertecno",
    external: true,
  },
  { label: "Envíos", value: "Correo Argentino / OCA" },
];

export default function ContactoPage() {
  return (
    <>
      <Header />
      <main className="flex-1 border-y border-line bg-surface">
        <div className="mx-auto max-w-[960px] px-6 py-10">
          <h1 className="font-heading text-[28px] font-extrabold text-navy">
            Contacto
          </h1>
          <p className="mt-2 max-w-lg text-base text-ink-soft">
            ¿Tenés una consulta sobre un pedido, un producto o un envío?
            Escribinos y te respondemos a la brevedad.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-line bg-bg p-5"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-faint">
                  {card.label}
                </p>
                {card.href ? (
                  <a
                    href={card.href}
                    target={card.external ? "_blank" : undefined}
                    rel={card.external ? "noopener noreferrer" : undefined}
                    className="mt-1 block font-heading text-base font-bold text-navy hover:underline"
                  >
                    {card.value}
                  </a>
                ) : (
                  <p className="mt-1 font-heading text-base font-bold text-navy">
                    {card.value}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-xl border border-line bg-bg p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-whatsapp text-white">
              ●
            </span>
            <p className="flex-1 text-sm text-ink-soft">
              También estamos por WhatsApp, de lunes a viernes de 9 a 18.
            </p>
            <a
              href={getWhatsAppUrl("Hola! Tengo una consulta sobre Finder.")}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg bg-navy px-5 py-2.5 font-heading text-sm font-bold text-white hover:bg-navy-deep"
            >
              Escribir
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
