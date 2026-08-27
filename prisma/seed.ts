import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const products = [
  {
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
    variants: [
      { name: "Blanco", swatch: "#F5F3EE", stock: 8, imageUrl: "/products/lampara-led/hero.png" },
      { name: "Negro", swatch: "#232019", stock: 8, imageUrl: null },
      { name: "Rosa", swatch: "#E8A9B0", stock: 4, imageUrl: null },
    ],
    images: [
      { url: "/products/lampara-led/hero.png", isHero: true, position: 0 },
      { url: "/products/lampara-led/gallery-1.png", isHero: false, position: 1 },
      { url: "/products/lampara-led/gallery-2.png", isHero: false, position: 2 },
      { url: "/products/lampara-led/gallery-3.png", isHero: false, position: 3 },
    ],
    reviews: [
      { author: "Julieta R.", rating: 5, text: "La uso todas las noches, no despierto a mi pareja y el brillo bajo es justo lo que necesitaba." },
      { author: "Nico F.", rating: 5, text: "Se carga rápido y dura muchísimo. La llevo en la mochila al trabajo." },
      { author: "Ceci M.", rating: 4, text: "Muy buena luz, me hubiese gustado que sea un poco más ancha para libros grandes." },
    ],
  },
  {
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
    variants: [],
    images: [
      { url: "/products/luz-rgb-sensor/hero.jpg", isHero: true, position: 0 },
      { url: "/products/luz-rgb-sensor/gallery-1.jpg", isHero: false, position: 1 },
      { url: "/products/luz-rgb-sensor/gallery-2.jpg", isHero: false, position: 2 },
    ],
    reviews: [
      { author: "Martín D.", rating: 5, text: "La puse en el pasillo y es un golazo, se enciende justo a tiempo y el control remoto anda perfecto." },
      { author: "Sol A.", rating: 5, text: "Los colores son mucho más lindos en persona. Quedó genial en el dormitorio." },
    ],
  },
  {
    slug: "luz-escritorio-magnetica",
    name: "Luz de escritorio LED magnética",
    tagline: "Se pega donde la necesitás, sin cables sueltos",
    price: 29500,
    stock: 0,
    description:
      "Se pega donde la necesitás — bajo la repisa, sobre el escritorio, en el placard — y te da una luz pareja sin cables sueltos ni tornillos. Control táctil o remoto, para ajustar la temperatura de color sin levantarte del lugar.",
    features: [
      "Temperatura de color ajustable de 3000K a 6000K",
      "Control táctil en el equipo o con control remoto incluido",
      "Fijación magnética, sin instalación",
      "Carga por USB, lista para usar al instante",
    ],
    variants: [],
    images: [
      { url: "/products/luz-escritorio-magnetica/hero.jpg", isHero: true, position: 0 },
      { url: "/products/luz-escritorio-magnetica/gallery-1.jpg", isHero: false, position: 1 },
    ],
    reviews: [
      { author: "Fede L.", rating: 4, text: "Excelente para el escritorio, se pega firme y el control táctil es cómodo." },
      { author: "Vale G.", rating: 5, text: "La cambio de temperatura según la hora del día, se nota la diferencia trabajando de noche." },
    ],
  },
];

async function main() {
  for (const p of products) {
    await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        tagline: p.tagline,
        price: p.price,
        stock: p.stock,
        description: p.description,
        features: { create: p.features.map((text, position) => ({ text, position })) },
        variants: { create: p.variants },
        images: { create: p.images },
        reviews: { create: p.reviews.map((r) => ({ ...r, isMocked: true })) },
      },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  if (adminEmail && adminPasswordHash) {
    await db.adminUser.upsert({
      where: { email: adminEmail },
      update: { passwordHash: adminPasswordHash },
      create: { email: adminEmail, passwordHash: adminPasswordHash },
    });
  }

  console.log("Seed completo:", products.length, "productos.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
