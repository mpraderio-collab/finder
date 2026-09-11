import type { Prisma, PrismaClient } from "@prisma/client";

type Tx = PrismaClient | Prisma.TransactionClient;

type CustomerInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  zip?: string | null;
};

// Ventas web siempre traen email, así que ese es el identificador estable:
// la misma persona comprando dos veces actualiza un solo registro. Ventas
// manuales suelen no tener email, así que ahí se matchea por nombre (sin
// distinguir mayúsculas) para que el desplegable del form no duplique
// clientes por typos de mayúscula/minúscula.
export async function upsertCustomerFromOrder(
  tx: Tx,
  data: CustomerInput,
): Promise<string> {
  const name = data.name.trim();
  const email = data.email?.trim().toLowerCase() || null;
  const patch = {
    name,
    phone: data.phone?.trim() || null,
    address: data.address?.trim() || null,
    city: data.city?.trim() || null,
    province: data.province?.trim() || null,
    zip: data.zip?.trim() || null,
  };

  if (email) {
    const customer = await tx.customer.upsert({
      where: { email },
      update: patch,
      create: { ...patch, email },
    });
    return customer.id;
  }

  const existing = await tx.customer.findFirst({
    where: { email: null, name: { equals: name, mode: "insensitive" } },
  });
  if (existing) {
    await tx.customer.update({ where: { id: existing.id }, data: patch });
    return existing.id;
  }

  const created = await tx.customer.create({ data: patch });
  return created.id;
}

// Dos Customer distintos pueden compartir nombre (p.ej. uno con email de una
// compra web y otro sin email de una venta manual) — se muestran como una
// sola opción en el desplegable para no confundir con "duplicados".
export function dedupeCustomersByName<T extends { name: string; phone: string | null }>(
  customers: T[],
): T[] {
  const seen = new Map<string, T>();
  for (const c of customers) {
    const key = c.name.trim().toLowerCase();
    if (!seen.has(key)) seen.set(key, c);
  }
  return [...seen.values()];
}
