import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Blog — Finder",
  description: "Notas sobre iluminación, lectura y ambientes.",
};

export default function BlogPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="max-w-md text-center">
          <h1 className="font-heading text-3xl font-extrabold text-ink">
            El blog está en camino
          </h1>
          <p className="mt-3 text-ink-soft">
            Muy pronto vamos a compartir acá notas sobre iluminación, hábitos
            de lectura y cómo armar el rincón perfecto en tu casa.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
