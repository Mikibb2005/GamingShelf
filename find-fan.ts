
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function findFanGames() {
    const games = await prisma.gameCatalog.findMany({
        where: {
            OR: [
                { title: { contains: 'Unbound', mode: 'insensitive' } },
                { title: { contains: 'Fusion', mode: 'insensitive' } },
                { title: { contains: 'Xenoverse', mode: 'insensitive' } }
            ]
        }
    });
    console.log(JSON.stringify(games, null, 2));
    await prisma.$disconnect();
}

findFanGames();
