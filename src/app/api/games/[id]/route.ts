import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/normalize";

// GET: Get game details
export const GET = auth(async function GET(req, context: any) {
    try {
        const { id } = await context.params;

        const game = await prisma.game.findUnique({
            where: { id },
            include: {
                user: { select: { username: true } }
            }
        });

        if (!game) {
            return NextResponse.json({ error: "Juego no encontrado" }, { status: 404 });
        }

        // Attempt to find matching Catalog entry for rich data
        let catalogData: any = null;

        if (game.source === "Catalog" && game.sourceId.startsWith("catalog-")) {
            // Direct catalog link
            const catalogId = game.sourceId.replace("catalog-", "");
            catalogData = await prisma.gameCatalog.findUnique({ where: { id: catalogId } });
        } else if (game.source === "Steam" && game.sourceId.startsWith("steam-")) {
            // Match by Steam AppID
            const steamId = parseInt(game.sourceId.replace("steam-", ""));
            if (!isNaN(steamId)) {
                catalogData = await prisma.gameCatalog.findFirst({ where: { steamAppId: steamId } });
            }
        }

        // Fallback: Match by normalized title for any source (RA, Xbox, Manual, etc.)
        if (!catalogData && game.title) {
            const normalizedTitle = normalizeText(game.title);
            catalogData = await prisma.gameCatalog.findFirst({
                where: { titleNormalized: normalizedTitle }
            });
        }

        // Fetch extra info in parallel if catalog data found
        let sagaGames: any[] = [];
        let versions: any[] = [];
        let reviews: any[] = [];
        let screenshots: string[] = [];

        if (catalogData) {
            screenshots = catalogData.screenshots ? JSON.parse(catalogData.screenshots) : [];

            const [sg, vs, revs] = await Promise.all([
                catalogData.sagaId ? (prisma.gameCatalog as any).findMany({
                    where: { sagaId: catalogData.sagaId, id: { not: catalogData.id } },
                    take: 5,
                    select: { id: true, title: true, coverUrl: true, releaseYear: true }
                }) : Promise.resolve([]),

                (prisma.gameCatalog as any).findMany({
                    where: {
                        OR: [
                            { parentGameId: catalogData.igdbId || -1 },
                            { igdbId: catalogData.parentGameId || -1 }
                        ],
                        id: { not: catalogData.id }
                    },
                    take: 5,
                    select: { id: true, title: true, coverUrl: true, releaseYear: true, category: true }
                }),

                prisma.comment.findMany({
                    where: { game: { title: game.title } },
                    take: 3,
                    include: { user: { select: { username: true } } },
                    orderBy: { createdAt: 'desc' }
                })
            ]);
            sagaGames = sg;
            versions = vs.map((v: any) => ({
                ...v,
                type: v.category === 8 ? 'Remake' : v.category === 9 ? 'Remaster' : v.category === 11 ? 'Port' : 'Version'
            }));
            reviews = revs;
        }

        const responseData = {
            ...game,
            description: catalogData?.description || null,
            screenshots,
            backgroundUrl: catalogData?.backgroundUrl || game.backgroundUrl,
            coverUrl: catalogData?.coverUrl || game.coverUrl,
            developer: catalogData?.developer || null,
            publisher: catalogData?.publisher || null,
            director: catalogData?.director || null,
            metacriticScore: catalogData?.opencriticScore && catalogData.opencriticScore > 0 ? catalogData.opencriticScore : null,
            catalogGenres: catalogData?.genres || null,
            platforms: catalogData?.platforms ? JSON.parse(catalogData.platforms) : [game.platform],
            sagaGames,
            sagaId: catalogData?.sagaId,
            sagaName: catalogData?.sagaName,
            timeToBeat: catalogData?.timeToBeat || null,
            versions,
            reviews
        };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error("GET /api/games/[id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
});

// PATCH: Update game (playtime, progress, status, rating)
export const PATCH = auth(async function PATCH(req, context: any) {
    try {
        const { id } = await context.params;
        const userId = req.auth?.user?.id;

        if (!userId) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        // Check ownership
        const game = await prisma.game.findUnique({
            where: { id }
        });

        if (!game) {
            return NextResponse.json({ error: "Juego no encontrado" }, { status: 404 });
        }

        if (game.userId !== userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { playtimeMinutes, progress, status, rating, startedAt, finishedAt } = await req.json();

        const updatedGame = await prisma.game.update({
            where: { id },
            data: {
                ...(playtimeMinutes !== undefined && { playtimeMinutes }),
                ...(progress !== undefined && { progress }),
                ...(status !== undefined && { status }),
                ...(rating !== undefined && { rating }),
                ...(startedAt !== undefined && { startedAt: startedAt ? new Date(startedAt) : null }),
                ...(finishedAt !== undefined && { finishedAt: finishedAt ? new Date(finishedAt) : null })
            }
        });

        return NextResponse.json(updatedGame);
    } catch (error) {
        console.error("PATCH /api/games/[id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
});

// DELETE: Remove game from library
export const DELETE = auth(async function DELETE(req, context: any) {
    try {
        const { id } = await context.params;
        const userId = req.auth?.user?.id;

        if (!userId) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        // Check ownership
        const game = await prisma.game.findUnique({
            where: { id }
        });

        if (!game) {
            return NextResponse.json({ error: "Juego no encontrado" }, { status: 404 });
        }

        if (game.userId !== userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        await prisma.game.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/games/[id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
});

