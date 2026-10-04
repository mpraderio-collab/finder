export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function startOfYear(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), 0, 1);
}

// Fecha local en formato "YYYY-MM-DD" para un <input type="date"> — a
// propósito NO usa toISOString() (que convierte a UTC y puede correr la
// fecha un día para adelante o atrás según el huso horario del servidor).
export function toDateInputValue(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const MONTH_NAMES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Un intervalo por cada mes calendario que toca el rango [from, to], de
// punta a punta del mes (el filtro del rango ya recorta los extremos en la
// consulta, no hace falta recortarlos acá).
export function monthBuckets(from: Date, to: Date): { start: Date; end: Date; label: string }[] {
  const buckets: { start: Date; end: Date; label: string }[] = [];
  let cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  while (cursor <= to) {
    const start = new Date(cursor);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    buckets.push({
      start,
      end,
      label: `${MONTH_NAMES[start.getMonth()]} ${String(start.getFullYear()).slice(2)}`,
    });
    cursor = end;
  }
  return buckets;
}
