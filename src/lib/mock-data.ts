// TEMPORARY — design review fixtures. Remove this file and every
// `isMockData()` short-circuit before merging (see "chore(mock)" commit).

export function isMockData() {
  return process.env.MOCK_DATA === "1";
}

const now = new Date("2026-01-01T12:00:00Z");

const promo = {
  id: "mock-promo-3x10",
  name: "10% off llevando 3",
  triggerType: "quantity",
  active: true,
  createdAt: now,
  updatedAt: now,
  tiers: [{ id: "mock-tier-3", promotionId: "mock-promo-3x10", threshold: 3, percentOff: 10 }],
  products: [
    { id: "mock-lampara", name: "Lámpara de lectura LED", slug: "lampara-lectura-led" },
    { id: "mock-rgb", name: "Luz LED RGB con sensor de movimiento", slug: "luz-rgb-sensor-movimiento" },
    { id: "mock-escritorio", name: "Luz de escritorio LED magnética", slug: "luz-escritorio-magnetica" },
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
  features: string[];
  specs: [string, string][];
  variants: { name: string; swatch: string; stock: number; imageUrl: string | null }[];
  images: { url: string; isHero: boolean; showInCarousel?: boolean }[];
  reviews: { author: string; rating: number; text: string }[];
};

const seeds: Seed[] = [
  {
    id: "mock-lampara",
    slug: "lampara-lectura-led",
    name: "Lámpara de lectura LED",
    tagline: "La luz que se apoya sobre la página, no sobre tus ojos",
    price: 35000,
    stock: 20,
    description:
      'Leé de noche sin despertar a nadie ni cansarte los ojos. Este panel liviano se apoya directo sobre la página y te da una luz pareja, sin reflejos ni sombras — la diferencia entre "aguanto un capítulo más" y quedarte dormido a mitad de frase.',
    features: [
      "3 tonos de luz: cálido 3000K, neutro 4000K y frío 6500K",
      "3 niveles de brillo: 5, 24 y 40 lúmenes",
      "Hasta 35 horas de autonomía con una carga USB-C de 3 horas",
      "Temporizador de apagado de hasta 99 minutos",
      "Liviano, entra en cualquier cartera o mochila",
    ],
    specs: [
      ["Tonos de luz", "3000K / 4000K / 6500K"],
      ["Autonomía", "Hasta 35 horas"],
      ["Carga", "USB-C, 3 horas"],
      ["Temporizador", "Hasta 99 minutos"],
    ],
    variants: [
      { name: "Blanco", swatch: "#F5F3EE", stock: 8, imageUrl: "/products/lampara-led/hero.png" },
      { name: "Negro", swatch: "#232019", stock: 8, imageUrl: null },
      { name: "Rosa", swatch: "#E8A9B0", stock: 4, imageUrl: null },
    ],
    images: [
      { url: "/products/lampara-led/hero.png", isHero: true },
      { url: "/products/lampara-led/gallery-1.png", isHero: false },
      { url: "/products/lampara-led/gallery-2.png", isHero: false },
      { url: "/products/lampara-led/gallery-3.png", isHero: false, showInCarousel: true },
    ],
    reviews: [
      { author: "Julieta R.", rating: 5, text: "La uso todas las noches, no despierto a mi pareja y el brillo bajo es justo lo que necesitaba." },
      { author: "Nico F.", rating: 5, text: "Se carga rápido y dura muchísimo. La llevo en la mochila al trabajo." },
      { author: "Ceci M.", rating: 4, text: "Muy buena luz, me hubiese gustado que sea un poco más ancha para libros grandes." },
    ],
  },
  {
    id: "mock-rgb",
    slug: "luz-rgb-sensor-movimiento",
    name: "Luz LED RGB con sensor de movimiento",
    tagline: "Se enciende sola. Elige el color según el momento.",
    price: 25000,
    stock: 15,
    description:
      "Se enciende sola cuando pasás, y elige el color según el momento: 16 tonos de ambiente controlados por control remoto, para que cada rincón de tu casa tenga su propia luz.",
    features: [
      "Sensor de movimiento PIR: se activa a 0-3 m y se apaga a los ~25 segundos",
      "16 colores RGB con control remoto incluido",
      "Batería recargable 1200mAh USB — bajo consumo (1.5W)",
      "Instalación magnética o atornillada, sin cableado",
      "Ideal para pasillos, escaleras, baños y dormitorios",
    ],
    specs: [
      ["Sensor", "PIR, 0-3 m"],
      ["Colores", "16 RGB"],
      ["Batería", "1200 mAh"],
    ],
    variants: [],
    images: [
      { url: "/products/luz-rgb-sensor/hero.jpg", isHero: true, showInCarousel: true },
      { url: "/products/luz-rgb-sensor/gallery-1.jpg", isHero: false },
      { url: "/products/luz-rgb-sensor/gallery-2.jpg", isHero: false },
    ],
    reviews: [
      { author: "Martín D.", rating: 5, text: "La puse en el pasillo y es un golazo, se enciende justo a tiempo y el control remoto anda perfecto." },
      { author: "Sol A.", rating: 5, text: "Los colores son mucho más lindos en persona. Quedó genial en el dormitorio." },
    ],
  },
  {
    id: "mock-escritorio",
    slug: "luz-escritorio-magnetica",
    name: "Luz de escritorio LED magnética",
    tagline: "Se pega donde la necesitás, sin cables sueltos",
    price: 29500,
    stock: 6,
    description:
      "Se pega donde la necesitás — bajo la repisa, sobre el escritorio, en el placard — y te da una luz pareja sin cables sueltos ni tornillos. Control táctil o remoto, para ajustar la temperatura de color sin levantarte del lugar.",
    features: [
      "Temperatura de color ajustable de 3000K a 6000K",
      "Control táctil en el equipo o con control remoto incluido",
      "Fijación magnética, sin instalación",
      "Carga por USB, lista para usar al instante",
    ],
    specs: [
      ["Temperatura", "3000K a 6000K"],
      ["Control", "Táctil y remoto"],
      ["Fijación", "Magnética"],
    ],
    variants: [],
    images: [
      { url: "/products/luz-escritorio-magnetica/hero.jpg", isHero: true },
      { url: "/products/luz-escritorio-magnetica/gallery-1.jpg", isHero: false, showInCarousel: true },
    ],
    reviews: [
      { author: "Fede L.", rating: 4, text: "Excelente para el escritorio, se pega firme y el control táctil es cómodo." },
      { author: "Vale G.", rating: 5, text: "La cambio de temperatura según la hora del día, se nota la diferencia trabajando de noche." },
    ],
  },
];

function build(seed: Seed, index: number) {
  return {
    id: seed.id,
    slug: seed.slug,
    name: seed.name,
    tagline: seed.tagline,
    description: seed.description,
    price: seed.price,
    costPrice: null,
    stock: seed.stock,
    status: "active",
    createdAt: new Date(now.getTime() + index * 1000),
    updatedAt: now,
    images: seed.images.map((img, position) => ({
      id: `${seed.id}-img-${position}`,
      url: img.url,
      type: "image",
      alt: "",
      position,
      isHero: img.isHero,
      showInCarousel: img.showInCarousel ?? false,
      focusX: null,
      focusY: null,
      productId: seed.id,
    })),
    variants: seed.variants.map((v, i) => ({
      id: `${seed.id}-var-${i}`,
      name: v.name,
      swatch: v.swatch,
      stock: v.stock,
      productId: seed.id,
      images: v.imageUrl
        ? [{ id: `${seed.id}-var-${i}-img`, url: v.imageUrl, type: "image", position: 0, variantId: `${seed.id}-var-${i}` }]
        : [],
    })),
    features: seed.features.map((text, position) => ({
      id: `${seed.id}-feat-${position}`,
      text,
      position,
      productId: seed.id,
    })),
    specs: seed.specs.map(([label, value], position) => ({
      id: `${seed.id}-spec-${position}`,
      label,
      value,
      position,
      productId: seed.id,
    })),
    reviews: seed.reviews.map((r, i) => ({
      id: `${seed.id}-rev-${i}`,
      author: r.author,
      rating: r.rating,
      text: r.text,
      photoUrl: null,
      approved: true,
      isMocked: true,
      createdAt: now,
      productId: seed.id,
    })),
    promotions: [promo],
  };
}

export const mockProducts = seeds.map(build);

export const mockSettings = { id: "singleton", installments: 6, updatedAt: now };
