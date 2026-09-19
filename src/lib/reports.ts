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

// Divide un rango [from, to] en como máximo `maxBuckets` intervalos iguales
// — de a un día si el rango es corto, agrupando de a más días si es largo —
// para graficar la evolución de un informe sin importar qué rango se eligió.
export function dateBuckets(
  from: Date,
  to: Date,
  maxBuckets = 10,
): { start: Date; end: Date; label: string }[] {
  const totalDays = Math.max(1, Math.floor((to.getTime() - from.getTime()) / 86_400_000) + 1);
  const daysPerBucket = Math.max(1, Math.ceil(totalDays / maxBuckets));
  const buckets: { start: Date; end: Date; label: string }[] = [];
  let cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (cursor <= to) {
    const start = new Date(cursor);
    const end = new Date(cursor);
    end.setDate(end.getDate() + daysPerBucket);
    const label =
      daysPerBucket === 1
        ? `${start.getDate()}/${start.getMonth() + 1}`
        : `${start.getDate()}/${start.getMonth() + 1}–${new Date(end.getTime() - 86_400_000).getDate()}/${new Date(end.getTime() - 86_400_000).getMonth() + 1}`;
    buckets.push({ start, end, label });
    cursor = end;
  }
  return buckets;
}
