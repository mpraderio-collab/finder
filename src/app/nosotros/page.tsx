import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Nosotros — Finder",
  description: "Quiénes somos e importamos la iluminación de Finder.",
};

export default function NosotrosPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="font-heading text-4xl font-extrabold text-ink">
            Nosotros
          </h1>
          <div className="mt-6 flex flex-col gap-4 text-lg text-ink-soft">
            <p>
              Finder nace de una idea simple: la luz correcta cambia cómo
              vivís tu casa. Importamos iluminación moderna pensada para
              momentos concretos — leer antes de dormir, trabajar de noche,
              darle otro clima a un ambiente — sin instalaciones complicadas
              ni cables sueltos.
            </p>
            <p>
              Elegimos cada producto probándolo nosotros primero. Si no lo
              usaríamos en nuestra propia casa, no lo vendemos.
            </p>
            <p>
              Somos un equipo chico en Argentina, así que cada pedido lo
              seguimos de cerca — si algo no te cierra, escribinos y lo
              resolvemos.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
