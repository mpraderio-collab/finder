import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StoreMain } from "@/components/store/StoreMain";
import { ArrowRight } from "@/components/store/Icons";

export const metadata: Metadata = {
  title: "Página no encontrada — Finder",
};

export default function NotFound() {
  return (
    <>
      <Header />
      <StoreMain>
        <section className="mx-auto flex max-w-[1440px] flex-col items-start px-6 pb-28 pt-20 md:px-16 md:pb-40 md:pt-32">
          <p className="b-eyebrow">Error 404</p>
          <h1 className="mt-5 max-w-[760px] font-serif text-[44px]/[1.04] font-medium tracking-[-0.02em] md:text-[72px]/[1.02]">
            Esta página se quedó a oscuras.
          </h1>
          <p className="mt-6 max-w-[520px] text-[17px]/[1.6] text-taupe">
            El enlace puede estar roto o la página ya no existe. Volvé al inicio o mirá el catálogo.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/catalogo" className="b-btn b-btn-clay">
              Ver catálogo
              <ArrowRight size={16} className="b-arrow" />
            </Link>
            <Link href="/" className="b-btn b-btn-outline">
              Ir al inicio
            </Link>
          </div>
        </section>
      </StoreMain>
      <Footer />
    </>
  );
}
