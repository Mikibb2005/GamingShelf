import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await auth();

        // 1. Featured (Recent Hits)
        // Released in last 90 days, sorted by score, then date
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const featured = await prisma.gameCatalog.findMany({
            where: {
                releaseDate: {
                    gte: threeMonthsAgo,
                    lte: new Date()
                },
                opencriticScore: { not: null }
            },
            orderBy: [
                { opencriticScore: 'desc' },
                { releaseDate: 'desc' }
            ],
            take: 10
        });

        // 2. Upcoming (Newer than today)
        const upcoming = await prisma.gameCatalog.findMany({
            where: {
                releaseDate: { gt: new Date() }
            },
            orderBy: { releaseDate: 'asc' },
            take: 10
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

        // Fallback: If no featured recent games, get any top rated
        if (featured.length < 5) {
            const existingIds = featured.map(g => g.id);
            const extra = await prisma.gameCatalog.findMany({
                where: {
                    opencriticScore: { gt: 85 },
                    id: { notIn: existingIds }
                },
                orderBy: { releaseDate: 'desc' },
                take: 10 - featured.length
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
