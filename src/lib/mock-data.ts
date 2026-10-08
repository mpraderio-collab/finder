// TEMPORARY — design review fixtures. Enabled only with MOCK_DATA=1 (see
// lib/db.ts). Remove this file and the db.ts switch before merging.
const now = new Date("2026-01-01T00:00:00Z");

const promotion = {
  id: "promo-3x10",
  name: "10% OFF llevando 3",
  triggerType: "quantity",
  active: true,
  createdAt: now,
  updatedAt: now,
  tiers: [{ id: "tier-3", promotionId: "promo-3x10", threshold: 3, percentOff: 10 }],
  products: [
    { id: "p-lampara", name: "Lámpara de lectura LED carga USB", slug: "lampara-lectura-led" },
    { id: "p-rgb", name: "Luz Gradiente RGB con sensor de movimiento carga USB", slug: "luz-gradiente-rgb-sensor-movimiento" },
    { id: "p-escritorio", name: "Luz de escritorio LED magnética carga USB", slug: "luz-escritorio-magnetica" },
  ],
};

type Img = { url: string; isHero?: boolean; carousel?: boolean; focusX?: number; focusY?: number };

function images(productId: string, list: Img[]) {
  return list.map((img, position) => ({
    id: `${productId}-img-${position}`,
    url: img.url,
    type: "image",
    alt: "",
    position,
    isHero: Boolean(img.isHero),
    showInCarousel: Boolean(img.carousel),
    focusX: img.focusX ?? null,
    focusY: img.focusY ?? null,
    productId,
  }));
}

function reviews(productId: string, list: [string, number, string][]) {
  return list.map(([author, rating, text], i) => ({
    id: `${productId}-rev-${i}`,
    author,
    rating,
    text,
    photoUrl: null,
    approved: true,
    isMocked: true,
    createdAt: now,
    productId,
  }));
}

function texts(productId: string, list: string[]) {
  return list.map((text, position) => ({ id: `${productId}-feat-${position}`, text, position, productId }));
}

function specs(productId: string, list: [string, string][]) {
  return list.map(([label, value], position) => ({ id: `${productId}-spec-${position}`, label, value, position, productId }));
}

function variants(productId: string, list: [string, string, number, string | null][]) {
  return list.map(([name, swatch, stock, url], i) => ({
    id: `${productId}-var-${i}`,
    name,
    swatch,
    stock,
    productId,
    images: url ? [{ id: `${productId}-var-${i}-img`, url, type: "image", position: 0, variantId: `${productId}-var-${i}` }] : [],
  }));
}

const base = { costPrice: null, status: "active", createdAt: now, updatedAt: now, promotions: [promotion] };

export const mockProducts = [
  {
    ...base,
    id: "p-lampara",
    slug: "lampara-lectura-led",
    name: "Lámpara de lectura LED carga USB",
    tagline: "La luz que se apoya sobre la página, no sobre tus ojos",
    description:
      'Leé de noche sin despertar a nadie ni cansarte los ojos. Este panel liviano se apoya directo sobre la página y te da una luz pareja, sin reflejos ni sombras — la diferencia entre "aguanto un capítulo más" y quedarte dormido a mitad de frase.',
    price: 35000,
    stock: 20,
    images: images("p-lampara", [
      { url: "/products/lampara-led/hero.png", isHero: true },
      { url: "/products/lampara-led/gallery-1.png" },
      { url: "/products/lampara-led/gallery-2.png" },
      { url: "/products/lampara-led/gallery-3.png", carousel: true, focusX: 45, focusY: 50 },
    ]),
    variants: variants("p-lampara", [
      ["Blanco", "#F5F3EE", 8, "/products/lampara-led/hero.png"],
      ["Negro", "#232019", 8, null],
      ["Rosa", "#E8A9B0", 4, null],
    ]),
    features: texts("p-lampara", [
      "3 tonos de luz: cálido 3000K, neutro 4000K y frío 6500K",
      "3 niveles de brillo: 5, 24 y 40 lúmenes",
      "Hasta 35 horas de autonomía con una carga USB-C de 3 horas",
      "Temporizador de apagado de hasta 99 minutos",
      "Liviano, entra en cualquier cartera o mochila",
    ]),
    specs: specs("p-lampara", [
      ["Tonos de luz", "3000K / 4000K / 6500K"],
      ["Autonomía", "Hasta 35 horas"],
      ["Carga", "USB-C, 3 horas"],
      ["Temporizador", "Hasta 99 minutos"],
    ]),
    reviews: reviews("p-lampara", [
      ["Julieta R.", 5, "La uso todas las noches, no despierto a mi pareja y el brillo bajo es justo lo que necesitaba."],
      ["Nico F.", 5, "Es excelente! La compré para velador de mi bebé, la dejo toda la noche en el nivel más bajo."],
      ["Ceci M.", 4, "Muy buena luz."],
    ]),
  },
  {
    ...base,
    id: "p-rgb",
    slug: "luz-gradiente-rgb-sensor-movimiento",
    name: "Luz Gradiente RGB con sensor de movimiento carga USB",
    tagline: "Se enciende sola. Elige el color según el momento.",
    description:
      "Se enciende sola cuando pasás, y elige el color según el momento: 16 tonos de ambiente controlados por control remoto, para que cada rincón de tu casa tenga su propia luz.",
    price: 20000,
    stock: 15,
    images: images("p-rgb", [
      { url: "/products/luz-rgb-sensor/hero.jpg", isHero: true, carousel: true },
      { url: "/products/luz-rgb-sensor/gallery-1.jpg" },
      { url: "/products/luz-rgb-sensor/gallery-2.jpg" },
    ]),
    variants: [],
    features: texts("p-rgb", [
      "Sensor de movimiento PIR: se activa a 0-3 m y se apaga a los ~25 segundos",
      "16 colores RGB con control remoto incluido",
      "Batería recargable 1200mAh USB — bajo consumo (1.5W)",
      "Instalación magnética o atornillada, sin cableado",
    ]),
    specs: specs("p-rgb", [
      ["Sensor", "PIR, 0-3 m"],
      ["Colores", "16 tonos RGB"],
      ["Batería", "1200 mAh, USB"],
    ]),
    reviews: reviews("p-rgb", [
      ["Martín D.", 5, "La puse en el pasillo y es un golazo, se enciende justo a tiempo y el control remoto anda perfecto."],
      ["Sol A.", 5, "Los colores son mucho más lindos en persona. Quedó genial en el dormitorio."],
    ]),
  },
  {
    ...base,
    id: "p-escritorio",
    slug: "luz-escritorio-magnetica",
    name: "Luz de escritorio LED magnética carga USB",
    tagline: "Se pega donde la necesitás, sin cables sueltos",
    description:
      "Se pega donde la necesitás — bajo la repisa, sobre el escritorio, en el placard — y te da una luz pareja sin cables sueltos ni tornillos. Control táctil o remoto, para ajustar la temperatura de color sin levantarte del lugar.",
    price: 25000,
    stock: 6,
    images: images("p-escritorio", [
      { url: "/products/luz-escritorio-magnetica/hero.jpg", isHero: true },
      { url: "/products/luz-escritorio-magnetica/gallery-1.jpg", carousel: true },
    ]),
    variants: [],
    features: texts("p-escritorio", [
      "Temperatura de color ajustable de 3000K a 6000K",
      "Control táctil en el equipo o con control remoto incluido",
      "Fijación magnética, sin instalación",
      "Carga por USB, lista para usar al instante",
    ]),
    specs: specs("p-escritorio", [
      ["Temperatura", "3000K a 6000K"],
      ["Control", "Táctil y remoto"],
      ["Fijación", "Magnética"],
    ]),
    reviews: reviews("p-escritorio", [
      ["Fede L.", 4, "Excelente para el escritorio, se pega firme y el control táctil es cómodo."],
      ["Vale G.", 5, "La cambio de temperatura según la hora del día, se nota la diferencia trabajando de noche."],
    ]),
  },
];

type Where = { slug?: string; id?: string };

// Minimal stand-in for the Prisma client: product reads return the fixtures,
// every other model/method resolves to an empty result so writes (cart sync,
// analytics) are silently ignored.
function emptyModel(model: string) {
  return new Proxy(
    {},
    {
      get: (_t, method: string) => async (args?: { where?: Where; select?: Record<string, boolean> }) => {
        if (model === "product") {
          const where = args?.where ?? {};
          const match = (p: (typeof mockProducts)[number]) =>
            (!where.slug || p.slug === where.slug) && (!where.id || p.id === where.id);
          if (method === "findMany") {
            const list = mockProducts.filter(match);
            if (args?.select) {
              return list.map((p) =>
                Object.fromEntries(Object.keys(args.select!).map((k) => [k, p[k as keyof typeof p]])),
              );
            }
            return list;
          }
          if (method === "findUnique" || method === "findFirst") return mockProducts.find(match) ?? null;
        }
        if (method === "findMany") return [];
        if (method === "count") return 0;
        if (method.startsWith("find")) return null;
        return {};
      },
    },
  );
}

export const mockDb = new Proxy(
  {},
  {
    get: (_t, prop: string) => {
      if (prop === "$transaction") return async () => [];
      if (prop.startsWith("$")) return async () => undefined;
      return emptyModel(prop);
    },
  },
);
