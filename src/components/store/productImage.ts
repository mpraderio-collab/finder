// Las fotos de producto llegan de dos tipos: fotos de ambiente (marcadas para
// el carrusel) y tomas de producto o infografías sobre fondo blanco. Recortar
// las segundas con `object-cover` corta el producto y el texto de la
// infografía, así que se muestran enteras: `contain` con aire alrededor y
// `multiply`, que funde el blanco de la toma con el fondo arena del marco.
export const packshotFit = "object-contain p-[7%] mix-blend-multiply";
export const packshotThumbFit = "object-contain p-1 mix-blend-multiply";

export function productImageFit(isAmbience: boolean | undefined) {
  return isAmbience ? "object-cover" : packshotFit;
}

export function isAmbienceImage(
  images: { url: string; showInCarousel?: boolean | null }[],
  url: string | undefined,
) {
  return Boolean(url && images.find((img) => img.url === url)?.showInCarousel);
}
