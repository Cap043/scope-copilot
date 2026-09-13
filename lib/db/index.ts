import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

// Prisma 7 requires a database driver adapter.
// PrismaPg connects Prisma Client to our Neon PostgreSQL database.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

// During development, Next.js can hot-reload modules.
// Reusing the same Prisma client prevents unnecessary
// database connection pools from being created.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Reuse the existing client when possible.
// Otherwise create a new Prisma client using our PostgreSQL adapter.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

// Keep the client globally available during development
// so hot reloads don't create multiple Prisma instances.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}