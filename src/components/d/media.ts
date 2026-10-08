// Cómo encaja una foto en su cuadro. Las fotos de ambiente (las marcadas para
// el carrusel desde el admin) llenan el cuadro; el resto son fotos de producto
// o infografías sobre fondo claro, que recortadas pierden el texto: se muestran
// enteras y el blanco del fondo se funde con el tono del cuadro.
export const FIT_SCENE = "object-cover";
export const FIT_PRODUCT = "object-contain p-[6%] mix-blend-multiply";

export function mediaFit(image?: { showInCarousel?: boolean | null } | null) {
  return image?.showInCarousel ? FIT_SCENE : FIT_PRODUCT;
}
