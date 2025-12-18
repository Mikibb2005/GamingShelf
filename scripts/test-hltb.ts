
import { prisma } from "../src/lib/prisma";

const BATCH_SIZE = 20;
const DELAY_MS = 3000; // Be more gentle

async function searchHLTB(title: string) {
    try {
        const url = "https://howlongtobeat.com/api/search";
        // To get the real key, we usually have to fetch the main page and find the script.
        // But some users found that just sending proper headers might work or there's a default key.
        // If it's too complex, let's try the direct search page and scrape.

        // Actually, let's try to use the 'howlongtobeat' library but with a different strategy if possible?
        // No, the library is hardcoded.

        // Let's try to fetch the search PAGE and scrape with Cheerio.
        const searchUrl = `https://howlongtobeat.com/?q=${encodeURIComponent(title)}`;
        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://howlongtobeat.com/'
            }
        });

        if (!response.ok) {
            console.error(`HLTB Error ${response.status} for ${title}`);
            return null;
        }

        const html = await response.text();
        // Since HLTB is a SPA, the results might not be in the HTML.
        // It uses a JS fetch to /api/search.

        // IF we can't crack HLTB easily, let's check if there's an alternative source.
        // IGDB also has time to beat data in some cases (via HLTB integration).

        return null; // Placeholder for now
    } catch (e) {
        console.error(e);
        return null;
    }
}

async function main() {
    console.log("⏳ HLTB Scraper - Manual approach test...");
    // For now, let's just test one game.
    const test = await searchHLTB("The Legend of Zelda: Breath of the Wild");
    console.log("Test result:", test);
}

main();
