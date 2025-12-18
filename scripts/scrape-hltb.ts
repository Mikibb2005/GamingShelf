
import { prisma } from "../src/lib/prisma";
import { HowLongToBeatService, HowLongToBeatEntry } from 'howlongtobeat';

// Initialize HLTB Service
const hltbService = new HowLongToBeatService();

const BATCH_SIZE = 50;
const DELAY_MS = 1000;

async function main() {
    console.log("⏳ HowLongToBeat Scraper - Starting...");

    let offset = 0;
    while (true) {
        const games = await prisma.gameCatalog.findMany({
            where: { timeToBeat: null },
            take: BATCH_SIZE,
            skip: offset
        });

        if (games.length === 0) break;

        console.log(`Processing batch of ${games.length}...`);

        for (const game of games) {
            try {
                // Search HLTB
                const results = await hltbService.search(game.title);

                // Find best match (exact name or close enough)
                const match = results.find(r => r.name.toLowerCase() === game.title.toLowerCase()) || results[0];

                if (match) {
                    // Use Main Story or Main + Extra depending on preference. 
                    // Let's us "Main + Extra" as a balanced "Time To Beat".
                    // match.gameplayMain, match.gameplayMainExtra, match.gameplayCompletionist

                    const time = Math.round(match.gameplayMainExtra || match.gameplayMain || 0);

                    if (time > 0) {
                        await prisma.gameCatalog.update({
                            where: { id: game.id },
                            data: { timeToBeat: time * 60 } // Store in minutes
                        });
                        console.log(`✓ ${game.title}: ${time}h`);
                    } else {
                        console.log(`- ${game.title}: No time data`);
                        // Mark as checked to avoid re-check? We don't have a "checked" flag for HLTB yet.
                        // Maybe set -1.
                        await prisma.gameCatalog.update({
                            where: { id: game.id },
                            data: { timeToBeat: -1 }
                        });
                    }
                } else {
                    console.log(`✗ ${game.title}: Not found`);
                    await prisma.gameCatalog.update({
                        where: { id: game.id },
                        data: { timeToBeat: -1 }
                    });
                }
            } catch (e) {
                console.error(`Error processing ${game.title}:`, e);
            }

            // Rate limit
            await new Promise(r => setTimeout(r, DELAY_MS));
        }

        // Since we are updating 'timeToBeat', the query 'where timeToBeat: null' will naturally exclude them next time.
        // So we don't need to increment offset unless we failed to update.
        // But if we set -1, they count as updated.
        // So offset remains 0!
        // offset += BATCH_SIZE; 
    }

    console.log("Done!");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
