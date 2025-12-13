import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Get popular games (most users playing)
export async function GET() {
    // Get games with most occurrences across users
    const games = await prisma.game.groupBy({
        by: ['title', 'platform', 'coverUrl'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 12
    });

    return NextResponse.json(games.map(g => ({
        title: g.title,
        platform: g.platform,
        coverUrl: g.coverUrl,
        playerCount: g._count.id
    })));
}
