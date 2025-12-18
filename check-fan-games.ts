
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const games = await prisma.gameCatalog.findMany({
        where: {
            OR: [
                { title: { contains: 'hack', mode: 'insensitive' } },
                { title: { contains: 'fan', mode: 'insensitive' } },
                { title: { contains: 'edition', mode: 'insensitive' } },
            ]
        },
        take: 10,
        select: { title: true, genres: true, igdbId: true }
    });
    console.log(JSON.stringify(games, null, 2));
    await prisma.$disconnect();
}

check();
