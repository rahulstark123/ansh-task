import { PrismaClient } from "@prisma/client";

/** Bump when Prisma schema changes so dev hot-reload picks up a fresh client after generate. */
const PRISMA_SCHEMA_TOKEN = "project-due-optional-v1";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaToken?: string;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

/** Dev hot-reload can keep an old PrismaClient missing new models — recreate if needed. */
function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  const tokenMatches = globalForPrisma.prismaSchemaToken === PRISMA_SCHEMA_TOKEN;
  const hasTaskNotes = cached && "taskNote" in cached && typeof cached.taskNote?.findMany === "function";
  const hasPermissionSettings =
    cached &&
    "workspacePermissionSettings" in cached &&
    typeof cached.workspacePermissionSettings?.findUnique === "function";

  if (cached && (!tokenMatches || !hasTaskNotes || !hasPermissionSettings)) {
    void cached.$disconnect().catch(() => undefined);
    globalForPrisma.prisma = undefined;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
    globalForPrisma.prismaSchemaToken = PRISMA_SCHEMA_TOKEN;
  }

  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
