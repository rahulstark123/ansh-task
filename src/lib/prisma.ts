import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

/** Dev hot-reload can keep an old PrismaClient missing new models — recreate if needed. */
function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  const hasTaskNotes = cached && "taskNote" in cached && typeof cached.taskNote?.findMany === "function";

  if (cached && !hasTaskNotes) {
    void cached.$disconnect().catch(() => undefined);
    globalForPrisma.prisma = undefined;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
