/**
 * Script to populate OpenCritic scores for games in the catalog.
 * Run with: npx tsx scripts/populate-opencritic.ts
 * 
 * Note: Free tier limit is 25-200 requests/day. Run incrementally!
 */

import { prisma } from "../src/lib/prisma";
import { getOpenCriticScore } from "../src/lib/opencritic";

const BATCH_SIZE = 20; // Stay within daily limits

async function main() {
    console.log("Populating OpenCritic scores...\n");

    if (!process.env.RAPIDAPI_KEY) {
        console.error("ERROR: RAPIDAPI_KEY not set in .env");
        console.log("Get a free key at: https://rapidapi.com/opencritic/api/opencritic");
        process.exit(1);
    }

    // Get games without OpenCritic scores, prioritizing popular ones
    const games = await prisma.gameCatalog.findMany({
        where: {
            opencriticScore: null,
            metacritic: { gte: 70 } // Focus on well-rated games first
        },
        orderBy: { metacritic: 'desc' },
        take: BATCH_SIZE,
        select: { id: true, title: true }
    });

    console.log(`Found ${games.length} games to process\n`);

    let updated = 0;
    let failed = 0;

    for (const game of games) {
        console.log(`Searching: ${game.title}...`);

        const result = await getOpenCriticScore(game.title);

        if (result) {
            await prisma.gameCatalog.update({
                where: { id: game.id },
                data: {
                    opencriticId: result.id,
                    opencriticScore: result.score
                }
            });
            console.log(`  ✓ Score: ${result.score}`);
            updated++;
        } else {
            console.log(`  ✗ Not found on OpenCritic`);
            failed++;
        }

        // Rate limit: 4 req/sec max
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`\nDone! Updated: ${updated}, Not found: ${failed}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => { await prisma.$disconnect(); });
