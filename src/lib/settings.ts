import { db } from "@/lib/db";
import { isMockData, mockSettings } from "@/lib/mock-data";

const SETTINGS_ID = "singleton";

export async function getSiteSettings() {
  if (isMockData()) return mockSettings;
  const settings = await db.siteSettings.findUnique({ where: { id: SETTINGS_ID } });
  return settings ?? { id: SETTINGS_ID, installments: 6, updatedAt: new Date() };
}

export { SETTINGS_ID };
