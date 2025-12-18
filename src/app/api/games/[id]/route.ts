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

        const responseData = {
            ...game,
            description: catalogData?.description || null,
            screenshots: catalogData?.screenshots ? JSON.parse(catalogData.screenshots) : [],
            backgroundUrl: catalogData?.backgroundUrl || game.backgroundUrl,
            coverUrl: catalogData?.coverUrl || game.coverUrl, // Use catalog cover if available
            developer: catalogData?.developer || null,
            publisher: catalogData?.publisher || null,
            // Only show scraped Metacritic score (no IGDB fallback)
            metacriticScore: catalogData?.opencriticScore && catalogData.opencriticScore > 0 ? catalogData.opencriticScore : null,
            catalogGenres: catalogData?.genres || null,
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

