import { db } from "@/lib/db";
import { MOCK_DATA } from "@/lib/mock-data";

const SETTINGS_ID = "singleton";

export async function getSiteSettings() {
  if (MOCK_DATA) return { id: SETTINGS_ID, installments: 6, updatedAt: new Date() };
  const settings = await db.siteSettings.findUnique({ where: { id: SETTINGS_ID } });
  return settings ?? { id: SETTINGS_ID, installments: 6, updatedAt: new Date() };
}

export { SETTINGS_ID };
