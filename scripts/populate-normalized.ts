import { prisma } from "../src/lib/prisma";
import { normalizeText } from "../src/lib/normalize";

async function main() {
    console.log("Populating titleNormalized for existing catalog entries...");

    const games = await prisma.gameCatalog.findMany({
        where: { titleNormalized: null },
        select: { id: true, title: true }
    });

    console.log(`Found ${games.length} games without normalized titles`);

    let updated = 0;
    for (const g of games) {
        await prisma.gameCatalog.update({
            where: { id: g.id },
            data: { titleNormalized: normalizeText(g.title) }
        });
        updated++;
        if (updated % 1000 === 0) {
            console.log(`Updated ${updated}/${games.length}...`);
        }
    }

    console.log(`Done! Updated ${updated} games.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => { await prisma.$disconnect(); });
