import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Nosotros — Finder",
  description: "Quiénes somos e importamos la iluminación de Finder.",
};

const paragraphs = [
  "Finder nace de una idea simple: la luz correcta cambia cómo vivís tu casa. Importamos iluminación moderna pensada para momentos concretos — leer antes de dormir, trabajar de noche, darle otro clima a un ambiente — sin instalaciones complicadas ni cables sueltos.",
  "Elegimos cada producto probándolo nosotros primero. Si no lo usaríamos en nuestra propia casa, no lo vendemos.",
  "Somos un equipo chico en Argentina, así que cada pedido lo seguimos de cerca — si algo no te cierra, escribinos y lo resolvemos.",
];

export default function NosotrosPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-[960px] px-6 pb-9 pt-[52px]">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-amber-ink">
            Nosotros
          </span>
          <h1 className="mt-2 max-w-[760px] font-heading text-[44px] font-extrabold leading-[1.1] text-navy">
            La luz correcta cambia cómo vivís tu casa
          </h1>
          <span className="mt-[22px] block h-1 w-16 rounded-full bg-amber" />
          <div className="mt-8 grid gap-7 sm:grid-cols-3">
            {paragraphs.map((text) => (
              <p key={text} className="text-[15px]/[1.7] text-ink-soft">
                {text}
              </p>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
