import type { Prisma, PrismaClient } from "@prisma/client";

type Tx = PrismaClient | Prisma.TransactionClient;

// Igual que el matching de clientes por nombre (ver lib/customers.ts): no
// hay un identificador estable como el email, así que se matchea por
// nombre sin distinguir mayúsculas para que el desplegable no duplique
// proveedores por typos de capitalización.
export async function upsertSupplierByName(
  tx: Tx,
  name: string,
  extra?: { phone?: string | null; email?: string | null },
): Promise<string> {
  const trimmed = name.trim();
  const existing = await tx.supplier.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
  });

  if (existing) {
    if (extra?.phone || extra?.email) {
      await tx.supplier.update({
        where: { id: existing.id },
        data: {
          phone: extra.phone || existing.phone,
          email: extra.email || existing.email,
        },
      });
    }
    return existing.id;
  }

  const created = await tx.supplier.create({
    data: { name: trimmed, phone: extra?.phone || null, email: extra?.email || null },
  });
  return created.id;
}

export function dedupeSuppliersByName<T extends { name: string }>(suppliers: T[]): T[] {
  const seen = new Map<string, T>();
  for (const s of suppliers) {
    const key = s.name.trim().toLowerCase();
    if (!seen.has(key)) seen.set(key, s);
  }
  return [...seen.values()];
}
