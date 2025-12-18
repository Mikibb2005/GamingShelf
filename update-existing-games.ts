
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function update() {
    console.log("Updating existing games to not be fan games by default...");
    const result = await prisma.gameCatalog.updateMany({
        where: { isFanGame: { equals: undefined as any } }, // This might not work if field doesn't exist yet
        data: { isFanGame: false }
    });
    console.log(`Updated ${result.count} games.`);
    await prisma.$disconnect();
}

update().catch(console.error);
