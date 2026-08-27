import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/lib/products";

const valueProps = [
  {
    title: "Envío a todo el país",
    text: "Recibí tu pedido en la puerta de tu casa, estés donde estés.",
  },
  {
    title: "Pagá con Mercado Pago",
    text: "Tarjeta, cuotas o dinero en cuenta, como más te guste.",
  },
  {
    title: "Diseño que dura",
    text: "Materiales pensados para el uso diario, no para la primera semana.",
  },
];

export default function Home() {
  const featured = products[0];

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col gap-6">
            <span className="w-fit rounded-full bg-coral-soft px-4 py-1 text-sm font-semibold text-coral">
              Iluminación moderna
            </span>
            <h1 className="font-heading text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
              La luz que hace que tu casa se sienta mejor
            </h1>
            <p className="max-w-md text-lg text-ink-soft">
              Importamos lámparas y luces pensadas para leer, trabajar y
              ambientar cada rincón — sin cables sueltos ni instalaciones
              complicadas.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/catalogo"
                className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-amber-dark"
              >
                Ver catálogo
              </Link>
              <Link
                href={`/catalogo/${featured.slug}`}
                className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink"
              >
                Conocé la lámpara de lectura
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-cream-soft">
            <Image
              src={featured.images.hero}
              alt={featured.name}
              fill
              priority
              className="object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>
        </section>

        <section className="border-y border-line bg-card">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
            {valueProps.map((item) => (
              <div key={item.title}>
                <p className="font-heading text-lg font-bold text-ink">
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-ink-soft">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-heading text-3xl font-extrabold text-ink">
              Nuestros productos
            </h2>
            <Link
              href="/catalogo"
              className="text-sm font-semibold text-amber-dark hover:underline"
            >
              Ver todos →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
