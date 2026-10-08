import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StoreMain } from "@/components/store/StoreMain";
import { Reveal } from "@/components/store/Reveal";
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
      <StoreMain>
        <section className="mx-auto max-w-[1440px] px-6 pb-24 pt-14 md:px-16 md:pb-32 md:pt-24">
          <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="t-stagger-line t-stagger-line--1 b-eyebrow">Contacto</p>
              <h1 className="t-stagger-line t-stagger-line--2 mt-5 font-serif text-[44px]/[1.02] font-medium tracking-[-0.02em] md:text-[72px]/[1]">
                Hablemos
              </h1>
            </div>
            <p className="t-stagger-line t-stagger-line--3 max-w-[400px] text-[17px]/[1.6] text-taupe">
              ¿Tenés alguna pregunta sobre nuestros productos? Estamos para
              ayudarte.
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-14 border-t border-espresso pt-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-24">
            <div>
              <p className="font-serif text-2xl">Escribinos</p>
              <p className="mt-2 text-[15px] text-taupe">
                Completá el formulario y te respondemos a la brevedad.
              </p>
              <ContactForm />
            </div>

            <aside className="h-fit">
              <p className="font-serif text-2xl">También por acá</p>
              <p className="mt-2 text-[15px]/[1.6] text-taupe">
                Te respondemos dentro de nuestro horario de atención.
              </p>
              <dl className="mt-8 border-t border-linen">
                {infoRows.map((row) => (
                  <div key={row.label} className="border-b border-linen py-5">
                    <dt className="text-[13px] text-taupe">{row.label}</dt>
                    <dd className="mt-1">
                      {row.href ? (
                        <a
                          href={row.href}
                          target={row.external ? "_blank" : undefined}
                          rel={row.external ? "noopener noreferrer" : undefined}
                          className="b-link font-serif text-xl"
                        >
                          {row.value}
                        </a>
                      ) : (
                        <span className="font-serif text-xl">{row.value}</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>
        </section>
      </StoreMain>
      <Footer />
    </>
  );
}
