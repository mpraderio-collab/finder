import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/store/PageTransition";
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
        <main className="flex-1 bg-e-bg text-e-ink">
          <section className="flex flex-col gap-4 px-4 pb-10 pt-14 md:px-8 md:pt-20">
            <span className="e-mono">Contacto</span>
            <h1 className="text-[44px] font-medium leading-none tracking-[-0.03em] md:text-[80px]">Hablemos</h1>
            <p className="max-w-md text-[16px]/[1.5] text-e-muted">
              ¿Tenés alguna pregunta sobre nuestros productos? Estamos para ayudarte.
            </p>
          </section>

          <div className="grid gap-12 border-t border-e-line px-4 py-12 md:px-8 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="max-w-[720px]">
              <p className="e-mono">Formulario de contacto</p>
              <p className="mt-2 text-[14px] text-e-muted">
                Completá el formulario y te respondemos a la brevedad.
              </p>
              <ContactForm />
            </div>

            <aside className="flex h-fit flex-col gap-6 bg-e-tile p-6">
              <p className="e-mono">Información de contacto</p>
              <p className="text-[14px] text-e-muted">
                También podés comunicarte directamente con nosotros. Te respondemos dentro de nuestro
                horario de atención.
              </p>
              <dl className="flex flex-col divide-y divide-e-line">
                {infoRows.map((row) => (
                  <div key={row.label} className="flex flex-col gap-1 py-3 first:pt-0">
                    <dt className="e-mono text-e-muted">{row.label}</dt>
                    <dd>
                      {row.href ? (
                        <a
                          href={row.href}
                          target={row.external ? "_blank" : undefined}
                          rel={row.external ? "noopener noreferrer" : undefined}
                          className="text-[15px] underline-offset-4 hover:underline"
                        >
                          {row.value}
                        </a>
                      ) : (
                        <span className="text-[15px]">{row.value}</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>
        </main>
        <Footer />
      </PageTransition>
    </>
  );
}
