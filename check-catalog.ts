import { prisma } from "./src/lib/prisma";

async function check() {
    try {
        const count = await prisma.gameCatalog.count();
        const latest = await prisma.gameCatalog.findFirst({ orderBy: { createdAt: 'desc' } });
        console.log(`Total games in catalog: ${count}`);
        if (latest) console.log(`Latest game added: ${latest.title}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
