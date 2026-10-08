import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/store/PageTransition";

export const metadata: Metadata = {
  title: "Página no encontrada — Finder",
};

export default function NotFound() {
  return (
    <>
      <Header />
      <PageTransition>
        <main className="flex flex-1 flex-col justify-center bg-e-bg text-e-ink">
          <section className="flex flex-col gap-6 px-4 py-24 md:px-8 md:py-32">
            <span className="e-mono">Error 404</span>
            <h1 className="max-w-[900px] text-[44px] font-medium leading-[1.02] tracking-[-0.03em] md:text-[80px]">
              Esta página se quedó sin luz
            </h1>
            <p className="max-w-[520px] text-[16px]/[1.5] text-e-muted">
              El enlace no existe o el producto ya no está disponible.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/catalogo" className="e-pill e-pill--dark">
                Ver catálogo
              </Link>
              <Link href="/" className="e-pill e-pill--outline">
                Ir al inicio
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </PageTransition>
    </>
  );
}
