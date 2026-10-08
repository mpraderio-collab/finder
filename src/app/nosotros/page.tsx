import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StoreMain } from "@/components/store/StoreMain";
import { Reveal } from "@/components/store/Reveal";

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
      <StoreMain>
        <section className="mx-auto max-w-[1440px] px-6 pb-24 pt-14 md:px-16 md:pb-32 md:pt-24">
          <Reveal>
            <p className="t-stagger-line t-stagger-line--1 b-eyebrow">Nosotros</p>
            <h1 className="t-stagger-line t-stagger-line--2 mt-5 max-w-[900px] font-serif text-[44px]/[1.04] font-medium tracking-[-0.02em] md:text-[72px]/[1.02]">
              La luz correcta cambia cómo vivís tu casa.
            </h1>
          </Reveal>
          <Reveal className="mt-14 grid grid-cols-1 gap-10 border-t border-espresso pt-10 md:mt-20 md:grid-cols-3 md:gap-16">
            {paragraphs.map((text, i) => (
              <p
                key={text}
                className={`t-stagger-line t-stagger-line--${i + 1} text-[17px]/[1.7] text-taupe ${
                  i === 0 ? "font-serif text-[22px]/[1.45] text-espresso" : ""
                }`}
              >
                {text}
              </p>
            ))}
          </Reveal>
        </section>
      </StoreMain>
      <Footer />
    </>
  );
}
