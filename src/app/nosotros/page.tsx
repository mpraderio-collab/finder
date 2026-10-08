import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/store/PageTransition";

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
        <main className="flex-1 bg-e-bg text-e-ink">
          <section className="flex flex-col gap-8 px-4 pb-16 pt-14 md:px-8 md:pt-20">
            <span className="e-mono">Nosotros</span>
            <h1 className="max-w-[1100px] text-[44px] font-medium leading-[1.02] tracking-[-0.03em] md:text-[80px]">
              La luz correcta cambia cómo vivís tu casa
            </h1>
          </section>
          <section className="grid gap-8 border-t border-e-line px-4 py-12 sm:grid-cols-3 md:px-8">
            {paragraphs.map((text, i) => (
              <div key={text} className="flex flex-col gap-3">
                <span className="e-mono text-e-muted">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-[16px]/[1.6]">{text}</p>
              </div>
            ))}
          </section>
        </main>
        <Footer />
      </PageTransition>
    </>
  );
}
