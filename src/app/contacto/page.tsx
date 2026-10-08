import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/d/PageTransition";
import { Reveal } from "@/components/d/Reveal";
import { ContactForm } from "./ContactForm";
import { getWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contacto — Finder",
  description: "Escribinos por cualquier consulta sobre tu pedido.",
};

const infoRows = [
  {
    label: "Email",
    value: "ventas@findertecno.com",
    href: "mailto:ventas@findertecno.com",
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
      <PageTransition>
        <main className="d-store flex-1">
          <Reveal as="header" className="px-5 pb-16 pt-16 md:px-10 md:pt-24">
            <h1 className="t-stagger-line font-d-serif text-[48px] leading-none md:text-[64px]">Hablemos</h1>
            <p className="t-stagger-line t-stagger-line--2 mt-6 max-w-[620px] text-[20px] leading-[1.35] md:text-[24px]">
              ¿Tenés alguna pregunta sobre nuestros productos? Estamos para ayudarte.
            </p>
          </Reveal>

          <section className="grid border-t border-d-ink md:grid-cols-[minmax(0,1fr)_480px]">
            <div className="px-5 pb-16 pt-3 md:border-r md:border-d-ink md:px-10">
              <p className="text-sm">Formulario de contacto</p>
              <p className="mt-1 text-sm text-d-muted">Completá el formulario y te respondemos a la brevedad.</p>
              <ContactForm />
            </div>

            <div className="bg-d-surface px-5 py-8 md:px-10">
              <p className="text-sm">Información de contacto</p>
              <p className="mt-1 text-sm text-d-muted">
                También podés comunicarte directamente con nosotros. Te respondemos dentro de nuestro horario de
                atención.
              </p>
              <dl className="mt-6">
                {infoRows.map((row) => (
                  <div key={row.label} className="flex justify-between gap-4 border-t border-d-line py-3 text-sm">
                    <dt className="text-d-muted">{row.label}</dt>
                    <dd className="text-right">
                      {row.href ? (
                        <a
                          href={row.href}
                          target={row.external ? "_blank" : undefined}
                          rel={row.external ? "noopener noreferrer" : undefined}
                          className="d-fade"
                        >
                          {row.value}
                        </a>
                      ) : (
                        row.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
