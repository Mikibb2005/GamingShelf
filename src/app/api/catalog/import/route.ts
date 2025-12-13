import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { igdbFetch } from "@/lib/igdb";
import { normalizeText } from "@/lib/normalize";

// POST: Import games from IGDB to local catalog
export async function POST(request: Request) {
    const { pages = 1, limit = 50 } = await request.json();

    if (!process.env.TV_CLIENT_ID || !process.env.TV_CLIENT_SECRET) {
        return NextResponse.json({ error: "IGDB credentials not configured" }, { status: 500 });
    }

    let imported = 0;
    let errors = 0;
    let offset = 0; // Or keep track based on last imported

    try {
        // Determine offset? For now start fresh or random? 
        // Better to fetch popular/top rated games first

        for (let i = 0; i < pages; i++) {
            // Safe query for production
            const query = `
            fields name, slug, cover.url, screenshots.url, summary, first_release_date, total_rating, 
            genres.name, platforms.name;
            where cover != null & total_rating != null; 
            sort total_rating desc;
            limit ${limit};
            offset ${offset};
        `;

            console.log("Querying IGDB (Safe) with offset", offset);
            console.log("Fetching IGDB games...");
            const games = await igdbFetch("games", query);
            console.log(`Fetched ${games.length} games`);

            for (const g of games) {
                try {
                    // Process fields
                    const coverUrl = g.cover?.url ? `https:${g.cover.url.replace("t_thumb", "t_cover_big")}` : null;
                    const screenshots = g.screenshots?.map((s: any) => `https:${s.url.replace("t_thumb", "t_screenshot_med")}`) || [];

                    const developer = g.involved_companies?.find((c: any) => c.developer)?.company?.name || null;
                    const publisher = g.involved_companies?.find((c: any) => c.publisher)?.company?.name || null;

                    const genres = g.genres?.map((x: any) => x.name).join(",") || null;
                    const platforms = JSON.stringify(g.platforms?.map((p: any) => p.name) || []);

                    const releaseYear = g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : null;
                    const releaseDate = g.first_release_date ? new Date(g.first_release_date * 1000) : null;

                    const slug = g.slug || `igdb-${g.id}`;
                    const titleNormalized = normalizeText(g.name);

                    await prisma.gameCatalog.upsert({
                        where: { slug },
                        update: {
                            title: g.name,
                            titleNormalized,
                            coverUrl,
                            description: g.summary,
                            releaseDate,
                            releaseYear,
                            developer,
                            publisher,
                            genres,
                            platforms,
                            metacritic: Math.round(g.total_rating || 0),
                            igdbId: g.id,
                            screenshots: JSON.stringify(screenshots)
                        },
                        create: {
                            slug,
                            title: g.name,
                            titleNormalized,
                            coverUrl,
                            description: g.summary,
                            releaseDate,
                            releaseYear,
                            developer,
                            publisher,
                            genres,
                            platforms,
                            metacritic: Math.round(g.total_rating || 0),
                            igdbId: g.id,
                            screenshots: JSON.stringify(screenshots)
                        }
                    });
                    imported++;
                } catch (e) {
                    console.error("Error importing game:", g.name, e);
                    errors++;
                }
            }

            offset += limit;
            // Rate limiting handled by igdbFetch somewhat, but safe to sleep a bit
            await new Promise(resolve => setTimeout(resolve, 250));
        }

        return NextResponse.json({
            success: true,
            imported,
            errors,
            message: `Imported ${imported} games from IGDB`
        });

    } catch (e: any) {
        console.error("IGDB Import Error:", e);
        return NextResponse.json({ error: e.message || "Import failed" }, { status: 500 });
    }
}

// GET: Check catalog stats
export async function GET() {
    const count = await prisma.gameCatalog.count();
    const recentGames = await prisma.gameCatalog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { title: true, releaseYear: true, igdbId: true }
    });

    return NextResponse.json({
        totalGames: count,
        recentlyAdded: recentGames
    });
}
