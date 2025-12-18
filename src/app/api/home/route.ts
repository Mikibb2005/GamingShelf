import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await auth();

        // 1. Featured (Recent Hits)
        // Released in last 6 months, sorted by score, then date
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const featured = await prisma.gameCatalog.findMany({
            where: {
                releaseDate: {
                    gte: sixMonthsAgo,
                    lte: new Date()
                }
            },
            orderBy: [
                { opencriticScore: { sort: 'desc', nulls: 'last' } },
                { metacritic: { sort: 'desc', nulls: 'last' } },
                { releaseDate: 'desc' }
            ],
            take: 12
        });

        // 2. Upcoming (Newer than today or TBD but anticipated)
        const upcoming = await prisma.gameCatalog.findMany({
            where: {
                OR: [
                    { releaseDate: { gt: new Date() } },
                    { releaseDate: null, releaseYear: { gte: new Date().getFullYear() } },
                    { releaseDate: null, releaseYear: null } // Games like GTA VI often start without any date
                ],
                igdbId: { not: null } // Ensure it's a real synced game
            },
            orderBy: [
                { releaseDate: { sort: 'asc', nulls: 'last' } },
                { releaseYear: { sort: 'asc', nulls: 'last' } }
            ],
            take: 15
        });

        // 3. Playing (User)
        let playing: any[] = [];
        if (session?.user?.id) {
            playing = await prisma.game.findMany({
                where: {
                    userId: session.user.id,
                    status: 'playing'
                },
                orderBy: { updatedAt: 'desc' },
                take: 10
            });
        }

        // 4. Recent Reviews
        const reviews = await prisma.comment.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                user: { select: { username: true, id: true, isProfilePublic: true } },
                game: { select: { title: true, coverUrl: true, id: true } }
            }
        });

        // Fallback: If no featured recent games, get any top rated (already released)
        if (featured.length < 6) {
            const existingIds = featured.map(g => g.id);
            const extra = await prisma.gameCatalog.findMany({
                where: {
                    opencriticScore: { gt: 85 },
                    releaseDate: { lte: new Date() }, // Only released games
                    id: { notIn: existingIds }
                },
                orderBy: { releaseDate: 'desc' },
                take: 12 - featured.length
            });
            featured.push(...extra);
        }

        return NextResponse.json({
            featured,
            upcoming,
            playing,
            reviews
        });
    } catch (e) {
        console.error("Home API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
