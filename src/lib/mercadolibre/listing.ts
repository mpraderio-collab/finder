// Normaliza el id de una publicación: acepta "MLA1234567890", "mla-1234567890"
// o el link de la publicación, y devuelve "MLA1234567890" (o null si no es válido).
export function normalizeMlItemId(input: string): string | null {
  const match = input.toUpperCase().match(/MLA-?(\d{6,})/);
  return match ? `MLA${match[1]}` : null;
}
