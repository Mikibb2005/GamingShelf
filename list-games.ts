
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function list() {
    const games = await prisma.gameCatalog.findMany({ take: 5 });
    console.log(JSON.stringify(games, null, 2));
    await prisma.$disconnect();
}

list();
