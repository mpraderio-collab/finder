import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { PremiumCarousel, type CarouselSlide } from "@/components/home/PremiumCarousel";
import { formatPrice, getActiveProducts, getHeroImageUrl } from "@/lib/products";

export const metadata = {
  title: "Finder — Demo del nuevo home",
  robots: { index: false, follow: false },
};

const EYEBROWS = ["Para leer sin cansar la vista", "Para trabajar con foco", "Para ambientar cada rincón", "Para tu mesa de luz"];

// Demo, no es la home real: el nombre largo del producto no entra en un
// título de 68px, así que se corta antes de "con"/"carga".
function shortTitle(name: string) {
  return name.split(/ con | carga /)[0];
}

export default async function DemoHome() {
  const products = await getActiveProducts();

  const slides: CarouselSlide[] = products
    .map((p) => ({ p, imageUrl: getHeroImageUrl(p) }))
    .filter((x): x is { p: (typeof products)[number]; imageUrl: string } => Boolean(x.imageUrl))
    .slice(0, 4)
    .map(({ p, imageUrl }, i) => ({
      slug: p.slug,
      eyebrow: EYEBROWS[i % EYEBROWS.length],
      title: shortTitle(p.name),
      text: p.tagline,
      imageUrl,
      price: formatPrice(p.price),
    }));

  return (
    <>
      <Header />
      <main className="flex-1">
        {slides.length > 0 && <PremiumCarousel slides={slides} />}

        <section className="bg-[#061f33] text-[#fff4dc]">
          <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-14 sm:grid-cols-3 md:px-12 lg:px-20">
            {[
              ["Envío a todo el país", "Despachamos con Correo Argentino a donde estés."],
              ["Pagá como quieras", "Tarjeta, cuotas o dinero en cuenta con Mercado Pago."],
              ["Diseño que dura", "Materiales pensados para el uso diario, no para la primera semana."],
            ].map(([title, text]) => (
              <div key={title} className="border-t border-amber/70 pt-5">
                <p className="font-heading text-base font-bold">{title}</p>
                <p className="mt-2 text-sm/[1.6] text-[#fff4dc]/60">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-heading text-[36px] font-extrabold tracking-[-0.03em] text-navy">
              Nuestros productos
            </h2>
            <Link href="/catalogo" className="font-heading text-sm font-bold text-blue hover:text-navy">
              Ver todos →
            </Link>
          </div>
          <div className="mt-10 grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
