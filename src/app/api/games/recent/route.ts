import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Get recently added or updated games across all users
export async function GET() {
    const games = await prisma.game.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 12,
        distinct: ['title'],
        select: {
            id: true,
            title: true,
            platform: true,
            coverUrl: true,
            status: true,
            progress: true,
            releaseYear: true,
            user: { select: { username: true } }
        }
    });

    return NextResponse.json(games);
}
