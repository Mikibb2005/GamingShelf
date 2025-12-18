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

const BATCH_SIZE = 100; // Increased batch size
const CONCURRENCY = 8; // Number of parallel requests
const MIN_DELAY = 100;
const MAX_DELAY = 500;

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

/**
 * Clean title by removing common edition suffixes
 */
function cleanTitle(title: string): string {
    return title
        .replace(/:? Game of the Year( Edition)?/i, '')
        .replace(/:? GOTY( Edition)?/i, '')
        .replace(/:? Complete( Edition)?/i, '')
        .replace(/:? Ultimate( Edition)?/i, '')
        .replace(/:? Deluxe( Edition)?/i, '')
        .replace(/:? Remastered/i, '')
        .replace(/:? Special Edition/i, '')
        .replace(/:? Anniversary Edition/i, '')
        .replace(/:? Director's Cut/i, '')
        .trim();
}

async function processGame(game: { id: string, title: string }, index: number, total: number) {
    // Add random delay to avoid pattern detection
    const delayTime = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1) + MIN_DELAY);
    await new Promise(r => setTimeout(r, delayTime));

    const progress = `[${index + 1}/${total}]`;

    try {
        let score = await fetchMetacriticScore(game.title);

        if (!score) {
            const cleaned = cleanTitle(game.title);
            if (cleaned !== game.title) {
                score = await fetchMetacriticScore(cleaned);
            }
        }

        if (score) {
            await prisma.gameCatalog.update({
                where: { id: game.id },
                data: { opencriticScore: score }
            });
            console.log(`${progress} ✓ ${game.title.substring(0, 30)}: ${score}`);
            return 'updated';
        } else {
            await prisma.gameCatalog.update({
                where: { id: game.id },
                data: { opencriticScore: -1 }
            });
            console.log(`${progress} ✗ ${game.title.substring(0, 30)}: Not Found`);
            return 'not_found';
        }
    } catch (e) {
        console.log(`${progress} ⚠ ${game.title.substring(0, 30)}: Error`);
        return 'error';
    }
}

async function main() {
    console.log("🎮 Metacritic Score Scraper - Turbo Mode (8x Parallel)\n");

    let totalUpdated = 0;
    let totalNotFound = 0;
    let totalErrors = 0;
    let round = 1;

    while (true) {
        console.log(`\n${"═".repeat(60)}`);
        console.log(`ROUND ${round}`);
        console.log(`${"═".repeat(60)}\n`);

        const games = await prisma.gameCatalog.findMany({
            where: { opencriticScore: null },
            orderBy: { metacritic: 'desc' },
            take: BATCH_SIZE,
            select: { id: true, title: true, metacritic: true }
        });

        if (games.length === 0) {
            console.log("✅ All games have been processed!");
            break;
        }

        console.log(`Processing ${games.length} games with concurrency ${CONCURRENCY}...`);

        // Process in chunks of CONCURRENCY
        for (let i = 0; i < games.length; i += CONCURRENCY) {
            const chunk = games.slice(i, i + CONCURRENCY);
            const promises = chunk.map((game, idx) => processGame(game, i + idx, games.length));

            const results = await Promise.all(promises);

            results.forEach(r => {
                if (r === 'updated') totalUpdated++;
                if (r === 'not_found') totalNotFound++;
                if (r === 'error') totalErrors++;
            });
        }

        round++;
        console.log(`Round stats: Updated ${totalUpdated}, Not Found ${totalNotFound}, Errors ${totalErrors} (Total)`);
    }

    console.log(`\n🎉 SCRAPING COMPLETE!`);
}

main()
    .catch(e => {
        console.error("Fatal error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
