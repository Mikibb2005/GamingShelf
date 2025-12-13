/**
 * Metacritic Score Scraper
 * Scrapes Metacritic to get real critic scores for games in the catalog.
 * 
 * Run with: npx tsx scripts/scrape-metacritic.ts
 * 
 * IMPORTANT: This is for personal/educational use only.
 * Be respectful of rate limits - this script has built-in delays.
 */

import { prisma } from "../src/lib/prisma";
import * as cheerio from "cheerio";

const BATCH_SIZE = 50; // Process 50 games at a time
const DELAY_MS = 1500; // 1.5 seconds between requests to be polite

// User agent to mimic a browser
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
};

/**
 * Convert game title to Metacritic URL slug
 */
function toSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/['']/g, '') // Remove apostrophes
        .replace(/&/g, 'and') // Replace & with and
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Spaces to hyphens
        .replace(/-+/g, '-') // Multiple hyphens to single
        .trim();
}

/**
 * Try to fetch Metacritic score for a game
 */
async function fetchMetacriticScore(title: string): Promise<number | null> {
    const slug = toSlug(title);

    // Try PC first, then PS5, then PS4, then Switch
    const platforms = ['pc', 'playstation-5', 'playstation-4', 'switch', 'xbox-series-x'];

    for (const platform of platforms) {
        try {
            const url = `https://www.metacritic.com/game/${slug}/`;
            const response = await fetch(url, { headers: HEADERS });

            if (!response.ok) continue;

            const html = await response.text();
            const $ = cheerio.load(html);

            // Try multiple selectors for the score
            let score: number | null = null;

            // New Metacritic layout - look for the metascore
            const metascoreEl = $('[data-v-4cdca868]').first();
            if (metascoreEl.length) {
                const scoreText = metascoreEl.text().trim();
                const parsed = parseInt(scoreText);
                if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                    score = parsed;
                }
            }

            // Alternative: look for score in title or specific class
            if (!score) {
                const titleEl = $('title').text();
                const match = titleEl.match(/(\d{1,3})\s*\/\s*100/);
                if (match) {
                    score = parseInt(match[1]);
                }
            }

            // Try finding score in JSON-LD
            if (!score) {
                $('script[type="application/ld+json"]').each((_, el) => {
                    try {
                        const json = JSON.parse($(el).html() || '');
                        if (json.aggregateRating?.ratingValue) {
                            const val = parseFloat(json.aggregateRating.ratingValue);
                            if (val >= 0 && val <= 100) {
                                score = Math.round(val);
                            } else if (val >= 0 && val <= 10) {
                                score = Math.round(val * 10); // Convert 10-scale to 100
                            }
                        }
                    } catch { /* ignore JSON parse errors */ }
                });
            }

            if (score && score >= 0 && score <= 100) {
                return score;
            }

        } catch (e) {
            // Continue to next platform
        }
    }

    return null;
}

async function main() {
    console.log("🎮 Metacritic Score Scraper - Full Run\n");

    let totalUpdated = 0;
    let totalNotFound = 0;
    let totalErrors = 0;
    let round = 1;

    while (true) {
        console.log(`\n${"═".repeat(60)}`);
        console.log(`ROUND ${round}`);
        console.log(`${"═".repeat(60)}\n`);

        // Get games that don't have a scraped Metacritic score yet
        const games = await prisma.gameCatalog.findMany({
            where: {
                opencriticScore: null
            },
            orderBy: { metacritic: 'desc' },
            take: BATCH_SIZE,
            select: { id: true, title: true, metacritic: true }
        });

        if (games.length === 0) {
            console.log("✅ All games have been processed!");
            break;
        }

        console.log(`Found ${games.length} games to process\n`);
        console.log("─".repeat(60));

        let updated = 0;
        let notFound = 0;
        let errors = 0;

        for (let i = 0; i < games.length; i++) {
            const game = games[i];
            const progress = `[${i + 1}/${games.length}]`;

            process.stdout.write(`${progress} ${game.title.substring(0, 40).padEnd(40)} `);

            try {
                const score = await fetchMetacriticScore(game.title);

                if (score) {
                    await prisma.gameCatalog.update({
                        where: { id: game.id },
                        data: { opencriticScore: score }
                    });
                    console.log(`✓ Score: ${score}`);
                    updated++;
                } else {
                    // Mark as checked (set to -1) so we don't retry
                    await prisma.gameCatalog.update({
                        where: { id: game.id },
                        data: { opencriticScore: -1 }
                    });
                    console.log(`✗ Not found`);
                    notFound++;
                }
            } catch (e) {
                console.log(`⚠ Error`);
                errors++;
            }

            // Rate limit
            if (i < games.length - 1) {
                await new Promise(resolve => setTimeout(resolve, DELAY_MS));
            }
        }

        totalUpdated += updated;
        totalNotFound += notFound;
        totalErrors += errors;
        round++;

        console.log(`\nRound complete: Updated ${updated}, Not found ${notFound}, Errors ${errors}`);
    }

    console.log("\n" + "═".repeat(60));
    console.log(`\n🎉 SCRAPING COMPLETE!`);
    console.log(`   Total Updated: ${totalUpdated}`);
    console.log(`   Total Not Found: ${totalNotFound}`);
    console.log(`   Total Errors: ${totalErrors}`);
}

main()
    .catch(e => {
        console.error("Fatal error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
