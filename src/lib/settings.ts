import { db } from "@/lib/db";

const SETTINGS_ID = "singleton";

export async function getSiteSettings() {
  const settings = await db.siteSettings.findUnique({ where: { id: SETTINGS_ID } });
  return settings ?? { id: SETTINGS_ID, installments: 6, mlTaxPercent: 5, updatedAt: new Date() };
}

export { SETTINGS_ID };
