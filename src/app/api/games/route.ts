import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/normalize";
import { auth } from "@/lib/auth";

// GET /api/games - Fetch all games with catalog fusion
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const games = await prisma.game.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: 'desc' }
        });

        // Enhance each game with catalog data
        const enhancedGames = await Promise.all(games.map(async (game) => {
            let catalogData = null;

            // Try to find matching catalog entry
            if (game.source === "Catalog" && game.sourceId.startsWith("catalog-")) {
                const catalogId = game.sourceId.replace("catalog-", "");
                catalogData = await prisma.gameCatalog.findUnique({ where: { id: catalogId } });
            } else if (game.source === "Steam" && game.sourceId.startsWith("steam-")) {
                const steamId = parseInt(game.sourceId.replace("steam-", ""));
                if (!isNaN(steamId)) {
                    catalogData = await prisma.gameCatalog.findFirst({ where: { steamAppId: steamId } });
                }
            }

            // Fallback: Match by normalized title
            if (!catalogData && game.title) {
                const normalizedTitle = normalizeText(game.title);
                catalogData = await prisma.gameCatalog.findFirst({
                    where: { titleNormalized: normalizedTitle }
                });
            }

            // Parse achievements
            let achievements = null;
            if (game.achievements) {
                try {
                    achievements = JSON.parse(game.achievements);
                } catch (e) { /* ignore parse errors */ }
            }

            return {
                ...game,
                // Fused catalog data
                coverUrl: catalogData?.coverUrl || game.coverUrl,
                // Only use scraped Metacritic score (no IGDB fallback)
                metacriticScore: catalogData?.opencriticScore && catalogData.opencriticScore > 0 ? catalogData.opencriticScore : null,
                developer: catalogData?.developer || null,
                publisher: catalogData?.publisher || null,
                catalogGenres: catalogData?.genres || null,
                // Parsed achievements
                achievements
            };
        }));

        return NextResponse.json(enhancedGames);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
    }
}

// POST /api/games - Add a new game
export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Basic validation could go here

        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const game = await prisma.game.create({
            data: {
                ...body,
                userId: session.user.id
            }
        });

        return NextResponse.json(game);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
    }
}
