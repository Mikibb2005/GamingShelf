
import { prisma } from "../src/lib/prisma";
import { igdbFetch } from "../src/lib/igdb";

// Helper to delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log("Starting Mass Game Catalog Import...");
    console.log("Target: Top ~50,000 games");

    // Configuration
    const BATCH_SIZE = 50;
    const TOTAL_GAMES_TARGET = 50000;
    const MAX_ERRORS = 50;

    // Limits: 4 requests/sec max. We do 1 req/sec to be super safe and stable.
    const DELAY_MS = 1000;

    const totalPages = Math.ceil(TOTAL_GAMES_TARGET / BATCH_SIZE);

    let importedCount = 0;
    let errorCount = 0;
    let offset = 0;

    // Optional: Start from existing count if resuming
    const existingCount = await prisma.gameCatalog.count();
    console.log(`Current catalog size: ${existingCount} games`);

    // Calculate offset based on goal? 
    // We want to fetch popularity sort.
    // Ideally we should "upsert" so starting from 0 is fine, updates existing.
    // If we want to "resume" we'd need to skip offset only if order is deterministic.
    // Sort by rating count is deterministic enough.

    // Optimization: Skip pages we likely have? 
    // If we have 2000 games and sort by popularity, the first 2000 are likely the ones we have.
    // But to be safe and update data, let's start from 0.

    console.log(`Will process approx ${totalPages} batches...`);

    for (let i = 0; i < totalPages; i++) {
        try {
            // Safe query
            const query = `
                fields name, slug, cover.url, screenshots.url, summary, first_release_date, total_rating, 
                genres.name, platforms.name;
                where cover != null & total_rating != null & total_rating_count > 5; 
                sort total_rating_count desc;
                limit ${BATCH_SIZE};
                offset ${offset};
            `;

            process.stdout.write(`Batch ${i + 1}/${totalPages}: Fetching offset ${offset}... `);

            const games = await igdbFetch("games", query);

            if (!games || games.length === 0) {
                console.log("No more games found.");
                break;
            }

            for (const g of games) {
                try {
                    const coverUrl = g.cover?.url ? `https:${g.cover.url.replace("t_thumb", "t_cover_big")}` : null;
                    const screenshots = g.screenshots?.map((s: any) => `https:${s.url.replace("t_thumb", "t_screenshot_med")}`) || [];
                    const genres = g.genres?.map((x: any) => x.name).join(",") || null;
                    const platforms = JSON.stringify(g.platforms?.map((p: any) => p.name) || []);
                    const releaseYear = g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : null;
                    const releaseDate = g.first_release_date ? new Date(g.first_release_date * 1000) : null;
                    const slug = g.slug || `igdb-${g.id}`;

                    await prisma.gameCatalog.upsert({
                        where: { slug },
                        update: {
                            title: g.name,
                            coverUrl,
                            description: g.summary,
                            releaseDate,
                            releaseYear,
                            developer: g.involved_companies?.[0]?.company?.name || null, // Simplified
                            publisher: null,
                            genres,
                            platforms,
                            metacritic: Math.round(g.total_rating || 0),
                            igdbId: g.id,
                            screenshots: JSON.stringify(screenshots)
                        },
                        create: {
                            slug,
                            title: g.name,
                            coverUrl,
                            description: g.summary,
                            releaseDate,
                            releaseYear,
                            developer: g.involved_companies?.[0]?.company?.name || null,
                            publisher: null,
                            genres,
                            platforms,
                            metacritic: Math.round(g.total_rating || 0),
                            igdbId: g.id,
                            screenshots: JSON.stringify(screenshots)
                        }
                    });
                    importedCount++;
                } catch (e) {
                    // Ignore dupes or small errors
                    errorCount++;
                }
            }

            console.log(`OK (${games.length} processed)`);
            offset += BATCH_SIZE;

            if (errorCount > MAX_ERRORS) {
                console.log("Too many errors, aborting.");
                break;
            }

            await delay(DELAY_MS);

        } catch (e) {
            console.error("\nBatch failed:", e);
            errorCount++;
            await delay(5000); // Backoff
        }
    }

    console.log(`\nDone! Imported/Updated: ${importedCount} games.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
