declare global {
  var prisma: any;
}

let prismaModule: any;

if (process.env.PRISMA_CLIENT_TARGET === "sqlite") {
  prismaModule = await import("../../generated/sqlite-client/index.js");
} else {
  prismaModule = await import("@prisma/client");
}

const PrismaClient = prismaModule.PrismaClient as any;

const createPrismaClient = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

export const prisma: any =
  global.prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
