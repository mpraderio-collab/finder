import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactForm } from "./ContactForm";
import { getWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contacto — Finder",
  description: "Escribinos por cualquier consulta sobre tu pedido.",
};

const infoRows = [
  {
    label: "Email",
    value: "hola@findertecno.com",
    href: "mailto:hola@findertecno.com",
  },
  {
    label: "WhatsApp",
    value: "+54 9 3442 466265",
    href: getWhatsAppUrl("Hola! Tengo una consulta sobre Finder."),
    external: true,
  },
  {
    label: "Instagram",
    value: "@finder.tecno",
    href: "https://instagram.com/finder.tecno",
    external: true,
  },
  {
    label: "Horario de atención",
    value: "Lunes a viernes de 9 a 18 hs.",
  },
];

export default function ContactoPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="border-b border-line bg-surface px-6 py-14 text-center">
          <h1 className="font-heading text-[34px] font-extrabold text-navy">
            Hablemos
          </h1>
          <p className="mx-auto mt-3 max-w-md font-heading text-base font-bold text-ink">
            ¿Tenés alguna pregunta sobre nuestros productos?
          </p>
          <p className="mt-1 text-sm text-ink-soft">Estamos para ayudarte.</p>
        </div>

        <div className="mx-auto grid max-w-[1080px] gap-10 px-6 py-12 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="font-heading text-lg font-bold text-navy">
              Formulario de contacto
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Completá el formulario y te respondemos a la brevedad.
            </p>
            <ContactForm />
          </div>

          <div className="h-fit rounded-[14px] border border-line bg-surface p-6">
            <p className="font-heading text-lg font-bold text-navy">
              Información de contacto
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              También podés comunicarte directamente con nosotros. Te
              respondemos dentro de nuestro horario de atención.
            </p>

            <div className="mt-5 flex flex-col gap-4">
              {infoRows.map((row) => (
                <div key={row.label}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-faint">
                    {row.label}
                  </p>
                  {row.href ? (
                    <a
                      href={row.href}
                      target={row.external ? "_blank" : undefined}
                      rel={row.external ? "noopener noreferrer" : undefined}
                      className="mt-0.5 block font-heading text-[15px] font-bold text-navy hover:underline"
                    >
                      {row.value}
                    </a>
                  ) : (
                    <p className="mt-0.5 font-heading text-[15px] font-bold text-ink">
                      {row.value}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
