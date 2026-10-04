import sharp from "sharp";

// Punto de la foto donde está la luz, en % desde la esquina superior
// izquierda: promedio de posiciones de los píxeles más brillantes (el 3%
// superior), ponderado por brillo. Devuelve null si no se pudo leer la
// imagen — en ese caso el carrusel centra la foto entera.
export async function detectLightFocus(url: string): Promise<{ x: number; y: number } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const input = Buffer.from(await res.arrayBuffer());

    const size = 64;
    const { data, info } = await sharp(input)
      .resize(size, size, { fit: "fill" })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = Array.from(data);
    const sorted = [...pixels].sort((a, b) => b - a);
    const threshold = sorted[Math.floor(sorted.length * 0.03)];

    let sumW = 0;
    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < pixels.length; i++) {
      const v = pixels[i];
      if (v < threshold) continue;
      const w = v * v;
      sumW += w;
      sumX += w * (i % info.width);
      sumY += w * Math.floor(i / info.width);
    }
    if (sumW === 0) return null;

    return {
      x: Math.round((sumX / sumW / (info.width - 1)) * 100),
      y: Math.round((sumY / sumW / (info.height - 1)) * 100),
    };
  } catch {
    return null;
  }
}
