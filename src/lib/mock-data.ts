// TEMPORARY — design review fixtures. Only active with MOCK_DATA=1.
// Remove this file and its call sites (revert the "chore(mock)" commit)
// once the design is approved.
import type { Prisma } from "@prisma/client";

type MockProduct = Prisma.ProductGetPayload<{
  include: {
    images: true;
    variants: { include: { images: true } };
    features: true;
    specs: true;
    reviews: true;
    promotions: { include: { tiers: true; products: { select: { id: true; name: true; slug: true } } } };
  };
}>;

export const MOCK_DATA = process.env.MOCK_DATA === "1";

const now = new Date("2026-01-01T00:00:00Z");

const promo = {
  id: "mock-promo",
  name: "Llevá 3, 10% off",
  triggerType: "quantity",
  active: true,
  createdAt: now,
  updatedAt: now,
  tiers: [{ id: "mock-tier", promotionId: "mock-promo", threshold: 3, percentOff: 10 }],
  products: [
    { id: "p-lampara", name: "Lámpara de lectura LED carga USB", slug: "lampara-lectura-led" },
    { id: "p-rgb", name: "Luz Gradiente RGB con sensor de movimiento", slug: "luz-gradiente-rgb-sensor-movimiento" },
    { id: "p-escritorio", name: "Luz de escritorio LED magnética", slug: "luz-escritorio-magnetica" },
  ],
};

type Seed = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  // Fotos "de ambiente" que el admin marca para el carrusel.
  ambience: number[];
  variants: { name: string; swatch: string; stock: number }[];
  features: string[];
  specs: [string, string][];
  reviews: { author: string; rating: number; text: string }[];
};

const seeds: Seed[] = [
  {
    id: "p-lampara",
    slug: "lampara-lectura-led",
    name: "Lámpara de lectura LED carga USB",
    tagline: "La luz que se apoya sobre la página, no sobre tus ojos",
    description:
      'Leé de noche sin despertar a nadie ni cansarte los ojos. Este panel liviano se apoya directo sobre la página y te da una luz pareja, sin reflejos ni sombras — la diferencia entre "aguanto un capítulo más" y quedarte dormido a mitad de frase.',
    price: 35000,
    stock: 20,
    images: [
      "/products/lampara-led/hero.png",
      "/products/lampara-led/gallery-1.png",
      "/products/lampara-led/gallery-2.png",
      "/products/lampara-led/gallery-3.png",
    ],
    ambience: [3],
    variants: [
      { name: "Blanco", swatch: "#F5F3EE", stock: 8 },
      { name: "Negro", swatch: "#232019", stock: 8 },
      { name: "Rosa", swatch: "#E8A9B0", stock: 4 },
    ],
    features: [
      "3 tonos de luz: cálido 3000K, neutro 4000K y frío 6500K",
      "3 niveles de brillo: 5, 24 y 40 lúmenes",
      "Hasta 35 horas de autonomía con una carga USB-C de 3 horas",
      "Temporizador de apagado de hasta 99 minutos",
      "Liviano, entra en cualquier cartera o mochila",
    ],
    specs: [
      ["Batería", "1200 mAh"],
      ["Carga", "USB-C, 3 horas"],
      ["Autonomía", "Hasta 35 horas"],
    ],
    reviews: [
      { author: "Julieta R.", rating: 5, text: "La uso todas las noches, no despierto a mi pareja y el brillo bajo es justo lo que necesitaba." },
      { author: "Nico F.", rating: 5, text: "Se carga rápido y dura muchísimo. La llevo en la mochila al trabajo." },
      { author: "Ceci M.", rating: 4, text: "Muy buena luz, me hubiese gustado que sea un poco más ancha para libros grandes." },
    ],
  },
  {
    id: "p-rgb",
    slug: "luz-gradiente-rgb-sensor-movimiento",
    name: "Luz Gradiente RGB con sensor de movimiento",
    tagline: "Se enciende sola. Elige el color según el momento.",
    description:
      "Se enciende sola cuando pasás, y elige el color según el momento: 16 tonos de ambiente controlados por control remoto, para que cada rincón de tu casa tenga su propia luz.",
    price: 20000,
    stock: 15,
    images: [
      "/products/luz-rgb-sensor/hero.jpg",
      "/products/luz-rgb-sensor/gallery-1.jpg",
      "/products/luz-rgb-sensor/gallery-2.jpg",
    ],
    ambience: [0],
    variants: [],
    features: [
      "Sensor de movimiento PIR: se activa a 0-3 m y se apaga a los ~25 segundos",
      "16 colores RGB con control remoto incluido",
      "Batería recargable 1200mAh USB — bajo consumo (1.5W)",
      "Instalación magnética o atornillada, sin cableado",
    ],
    specs: [
      ["Sensor", "PIR, 0-3 m"],
      ["Colores", "16 RGB"],
    ],
    reviews: [
      { author: "Martín D.", rating: 5, text: "La puse en el pasillo y es un golazo, se enciende justo a tiempo y el control remoto anda perfecto." },
      { author: "Sol A.", rating: 5, text: "Los colores son mucho más lindos en persona. Quedó genial en el dormitorio." },
    ],
  },
  {
    id: "p-escritorio",
    slug: "luz-escritorio-magnetica",
    name: "Luz de escritorio LED magnética",
    tagline: "Se pega donde la necesitás, sin cables sueltos",
    description:
      "Se pega donde la necesitás — bajo la repisa, sobre el escritorio, en el placard — y te da una luz pareja sin cables sueltos ni tornillos. Control táctil o remoto, para ajustar la temperatura de color sin levantarte del lugar.",
    price: 25000,
    stock: 10,
    images: [
      "/products/luz-escritorio-magnetica/hero.jpg",
      "/products/luz-escritorio-magnetica/gallery-1.jpg",
    ],
    ambience: [1],
    variants: [],
    features: [
      "Temperatura de color ajustable de 3000K a 6000K",
      "Control táctil en el equipo o con control remoto incluido",
      "Fijación magnética, sin instalación",
      "Carga por USB, lista para usar al instante",
    ],
    specs: [["Temperatura", "3000K a 6000K"]],
    reviews: [
      { author: "Fede L.", rating: 4, text: "Excelente para el escritorio, se pega firme y el control táctil es cómodo." },
      { author: "Vale G.", rating: 5, text: "La cambio de temperatura según la hora del día, se nota la diferencia trabajando de noche." },
    ],
  },
];

export const mockProducts: MockProduct[] = seeds.map((s) => ({
  id: s.id,
  slug: s.slug,
  name: s.name,
  tagline: s.tagline,
  description: s.description,
  price: s.price,
  costPrice: null,
  stock: s.stock,
  status: "active",
  createdAt: now,
  updatedAt: now,
  images: s.images.map((url, i) => ({
    id: `${s.id}-img-${i}`,
    url,
    type: "image",
    alt: "",
    position: i,
    isHero: i === 0,
    showInCarousel: s.ambience.includes(i),
    focusX: null,
    focusY: null,
    productId: s.id,
  })),
  variants: s.variants.map((v, i) => ({
    id: `${s.id}-var-${i}`,
    ...v,
    productId: s.id,
    images: [],
  })),
  features: s.features.map((text, i) => ({ id: `${s.id}-feat-${i}`, text, position: i, productId: s.id })),
  specs: s.specs.map(([label, value], i) => ({ id: `${s.id}-spec-${i}`, label, value, position: i, productId: s.id })),
  reviews: s.reviews.map((r, i) => ({
    id: `${s.id}-rev-${i}`,
    ...r,
    photoUrl: null,
    approved: true,
    isMocked: true,
    createdAt: now,
    productId: s.id,
  })),
  promotions: [promo],
}));
