import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/d/PageTransition";
import { Reveal } from "@/components/d/Reveal";

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
      <PageTransition>
        <main className="d-store flex-1">
          <Reveal as="header" className="px-5 pb-16 pt-16 md:px-10 md:pt-24">
            <h1 className="t-stagger-line max-w-[1000px] font-d-serif text-[40px] leading-[1.1] md:text-[64px]">
              La luz correcta cambia cómo vivís tu casa
            </h1>
          </Reveal>
          <section className="grid gap-8 border-t border-d-ink px-5 pb-24 pt-3 md:grid-cols-[330px_1fr] md:px-10">
            <p className="text-sm">Nosotros</p>
            <Reveal className="flex max-w-[820px] flex-col gap-6">
              {paragraphs.map((text, i) => (
                <p
                  key={text}
                  className={`t-stagger-line t-stagger-line--${Math.min(i + 1, 4)} text-[20px] leading-[1.35] md:text-[24px]`}
                >
                  {text}
                </p>
              ))}
            </Reveal>
          </section>
        </main>
      </PageTransition>
      <Footer />
    </>
  );
}
