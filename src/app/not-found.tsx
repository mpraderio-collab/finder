import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CtaLink } from "@/components/d/CtaLink";

export const metadata: Metadata = {
  title: "Página no encontrada — Finder",
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="d-store flex-1 px-5 pb-24 pt-16 md:px-10">
        <div className="max-w-[620px] border-t border-d-ink pt-3">
          <p className="text-sm text-d-muted">Error 404</p>
          <h1 className="mt-6 font-d-serif text-[40px] leading-[1.1] md:text-[48px]">
            Esta página no existe
          </h1>
          <p className="mt-4 text-[18px] leading-[1.4]">
            Puede que el link esté mal escrito o que el producto ya no esté a la venta.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Link href="/catalogo" className="d-btn">
              Ver el catálogo
            </Link>
            <CtaLink href="/">Volver al inicio</CtaLink>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
