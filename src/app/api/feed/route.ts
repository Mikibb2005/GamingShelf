import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Get users that current user follows
    const following = await prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true }
    });

    const followingIds = following.map(f => f.followingId);

    if (followingIds.length === 0) {
        return NextResponse.json([]);
    }

    // Get recent games from followed users
    const games = await prisma.game.findMany({
        where: {
            userId: { in: followingIds }
        },
        include: {
            user: {
                select: { username: true }
            }
        },
        orderBy: { updatedAt: 'desc' },
        take: 50
    });

    return NextResponse.json(games);
}
