import { NextResponse } from "next/server";
import { getCatalogGame } from "@/lib/data-service";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch single catalog item by ID
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await auth();

        const game = await getCatalogGame(id);

        if (!game) {
            return NextResponse.json({ error: "Game not found" }, { status: 404 });
        }

        // Fetch extra info in parallel
        const [sagaGames, versions, userGame, reviews] = await Promise.all([
            game.sagaId ? prisma.gameCatalog.findMany({
                where: { sagaId: game.sagaId, id: { not: game.id } },
                take: 5,
                select: { id: true, title: true, coverUrl: true, releaseYear: true }
            }) : Promise.resolve([]),

            prisma.gameCatalog.findMany({
                where: {
                    OR: [
                        { parentGameId: game.igdbId || -1 },
                        { igdbId: game.parentGameId || -1 }
                    ],
                    id: { not: game.id }
                },
                take: 5,
                select: { id: true, title: true, coverUrl: true, releaseYear: true, category: true }
            }),

            session?.user?.id ? prisma.game.findFirst({
                where: { userId: session.user.id, title: game.title }, // Simple match by title for cross-check
            }) : Promise.resolve(null),

            prisma.comment.findMany({
                where: { game: { title: game.title } }, // Match reviews for this game title across catalog
                take: 3,
                include: { user: { select: { username: true, avatarUrl: true } } },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        return NextResponse.json({
            ...game,
            sagaGames,
            versions: versions.map(v => ({
                ...v,
                type: v.category === 8 ? 'Remake' : v.category === 9 ? 'Remaster' : v.category === 11 ? 'Port' : 'Version'
            })),
            inLibrary: !!userGame,
            userGameId: userGame?.id || null,
            userGameStatus: userGame?.status || null,
            userGameRating: userGame?.rating || null,
            reviews
        });
    } catch (e) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
