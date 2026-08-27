export type ProductVariant = {
  name: string;
  swatch: string;
};

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  price: number;
  description: string;
  features: string[];
  variants?: ProductVariant[];
  images: {
    hero: string;
    gallery: string[];
  };
};

export const products: Product[] = [
  {
    slug: "lampara-lectura-led",
    name: "Lámpara de lectura LED",
    tagline: "La luz que se apoya sobre la página, no sobre tus ojos",
    price: 35000,
    description:
      "Leé de noche sin despertar a nadie ni cansarte los ojos. Este panel liviano se apoya directo sobre la página y te da una luz pareja, sin reflejos ni sombras — la diferencia entre \"aguanto un capítulo más\" y quedarte dormido a mitad de frase.",
    features: [
      "3 tonos de luz: cálido 3000K, neutro 4000K y frío 6500K",
      "3 niveles de brillo: 5, 24 y 40 lúmenes",
      "Hasta 35 horas de autonomía con una carga USB-C de 3 horas",
      "Temporizador de apagado de hasta 99 minutos",
      "Liviano, entra en cualquier cartera o mochila",
    ],
    variants: [
      { name: "Blanco", swatch: "#F5F3EE" },
      { name: "Negro", swatch: "#232019" },
      { name: "Rosa", swatch: "#E8A9B0" },
    ],
    images: {
      hero: "/products/lampara-led/hero-uso-nocturno.jpg",
      gallery: [
        "/products/lampara-led/en-libro.jpg",
        "/products/lampara-led/detalle-controles.jpg",
        "/products/lampara-led/dimensiones.jpg",
      ],
    },
  },
  {
    slug: "luz-rgb-sensor-movimiento",
    name: "Luz LED RGB con sensor de movimiento",
    tagline: "Se enciende sola. Elige el color según el momento.",
    price: 25000,
    description:
      "Se enciende sola cuando pasás, y elige el color según el momento: 16 tonos de ambiente controlados por control remoto, para que cada rincón de tu casa tenga su propia luz.",
    features: [
      "Sensor de movimiento PIR: se activa a 0-3 m y se apaga a los ~25 segundos",
      "16 colores RGB con control remoto incluido",
      "Batería recargable 1200mAh USB — bajo consumo (1.5W)",
      "Instalación magnética o atornillada, sin cableado",
      "Ideal para pasillos, escaleras, baños y dormitorios",
    ],
    images: {
      hero: "/products/luz-rgb-sensor/hero-ambiente-exterior.jpg",
      gallery: [
        "/products/luz-rgb-sensor/colores-disponibles.jpg",
        "/products/luz-rgb-sensor/usos-ambientes.jpg",
        "/products/luz-rgb-sensor/control-remoto.jpg",
      ],
    },
  },
  {
    slug: "luz-escritorio-magnetica",
    name: "Luz de escritorio LED magnética",
    tagline: "Se pega donde la necesitás, sin cables sueltos",
    price: 29500,
    description:
      "Se pega donde la necesitás — bajo la repisa, sobre el escritorio, en el placard — y te da una luz pareja sin cables sueltos ni tornillos. Control táctil o remoto, para ajustar la temperatura de color sin levantarte del lugar.",
    features: [
      "Temperatura de color ajustable de 3000K a 6000K",
      "Control táctil en el equipo o con control remoto incluido",
      "Fijación magnética, sin instalación",
      "Carga por USB, lista para usar al instante",
    ],
    images: {
      hero: "/products/luz-escritorio-magnetica/hero-uso-escritorio.jpg",
      gallery: ["/products/luz-escritorio-magnetica/contenido-caja.jpg"],
    },
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(price);
}
