import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
    return new PrismaClient();
};

declare global {
    var prismaMiki: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaMiki ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
    globalThis.prismaMiki = prisma;
}
