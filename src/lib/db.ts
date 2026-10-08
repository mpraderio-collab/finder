import { PrismaClient } from "@prisma/client";
import { mockDb } from "@/lib/mock-data";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// TEMPORARY — MOCK_DATA=1 serves fixtures from lib/mock-data.ts so the
// storefront can be reviewed without a database. Remove before merging.
const useMock = process.env.MOCK_DATA === "1";

export const db: PrismaClient = useMock
  ? (mockDb as unknown as PrismaClient)
  : (globalForPrisma.prisma ?? new PrismaClient());

if (!useMock && process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
