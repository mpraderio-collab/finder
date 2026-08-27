import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Contacto — Finder",
  description: "Escribinos por cualquier consulta sobre tu pedido.",
};

export default function ContactoPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="font-heading text-4xl font-extrabold text-ink">
            Contacto
          </h1>
          <p className="mt-4 text-lg text-ink-soft">
            ¿Tenés una consulta sobre un pedido, un producto o un envío?
            Escribinos y te respondemos a la brevedad.
          </p>
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-line bg-card p-6">
            <div>
              <p className="text-sm font-semibold text-ink">Email</p>
              <a
                href="mailto:hola@findertecno.com"
                className="text-ink-soft hover:text-amber-dark"
              >
                hola@findertecno.com
              </a>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Instagram</p>
              <a
                href="https://instagram.com/findertecno"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-soft hover:text-amber-dark"
              >
                @findertecno
              </a>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Envíos</p>
              <p className="text-ink-soft">A todo el país por Correo Argentino / OCA.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
