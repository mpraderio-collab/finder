// Las tres escenas de la dirección B. Cada producto cae en una escena según
// su nombre/slug; los que no matchean ninguna se muestran aparte ("Más luces")
// para que un producto nuevo nunca desaparezca de la tienda.
export type SceneId = "leer" | "trabajar" | "ambientar";

export type Scene = {
  id: SceneId;
  number: string;
  name: string;
  title: string;
  line: string;
  match: RegExp;
};

export const SCENES: Scene[] = [
  {
    id: "leer",
    number: "01",
    name: "Leer",
    title: "Para leer sin cansar la vista",
    line: "Para leer sin cansar la vista",
    match: /lectura|leer|libro/i,
  },
  {
    id: "trabajar",
    number: "02",
    name: "Trabajar",
    title: "Tu escritorio, sin cables sueltos",
    line: "Tu escritorio, sin cables sueltos",
    match: /escritorio|trabaj|magn[eé]tica/i,
  },
  {
    id: "ambientar",
    number: "03",
    name: "Ambientar",
    title: "Que la casa cambie de clima",
    line: "Que la casa cambie de clima",
    match: /rgb|ambient|gradiente|sensor/i,
  },
];

export function sceneFor(product: { slug: string; name: string }): Scene | undefined {
  return SCENES.find((s) => s.match.test(product.slug) || s.match.test(product.name));
}

// Agrupa los productos por escena (el primero que matchea cada una) y deja
// el resto en `others`.
export function groupByScene<T extends { slug: string; name: string }>(products: T[]) {
  const scenes: { scene: Scene; product: T }[] = [];
  const used = new Set<string>();
  for (const scene of SCENES) {
    const product = products.find((p) => !used.has(p.slug) && sceneFor(p)?.id === scene.id);
    if (!product) continue;
    used.add(product.slug);
    scenes.push({ scene, product });
  }
  const others = products.filter((p) => !used.has(p.slug));
  return { scenes, others };
}

type ContextImage = {
  url: string;
  type: string;
  isHero: boolean;
  showInCarousel: boolean;
  focusX: number | null;
  focusY: number | null;
};

// Foto "en uso" de un producto: la que el admin marcó para el carrusel (son
// las de ambiente; las infografías con texto no se marcan). Si no hay
// ninguna marcada, la primera que no sea la principal.
export function contextImage<T extends ContextImage>(product: { images: T[] }): T | undefined {
  const photos = product.images.filter((img) => img.type !== "video");
  return (
    photos.find((img) => img.showInCarousel && !img.isHero) ??
    photos.find((img) => img.showInCarousel) ??
    photos.find((img) => !img.isHero) ??
    photos[0]
  );
}

export function contextPhoto(product: { images: ContextImage[] }): string | undefined {
  return contextImage(product)?.url;
}

// Nombre del ViewTransition compartido entre la tarjeta/panel del catálogo
// y la foto principal de la ficha.
export function productTransitionName(slug: string) {
  return `product-${slug}`;
}
