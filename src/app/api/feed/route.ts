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

    // Get recent games and posts from followed users in parallel
    const [games, posts] = await Promise.all([
        prisma.game.findMany({
            where: { userId: { in: followingIds } },
            include: { user: { select: { username: true } } },
            orderBy: { updatedAt: 'desc' },
            take: 25
        }),
        prisma.post.findMany({
            where: { userId: { in: followingIds } },
            include: { user: { select: { username: true } } },
            orderBy: { createdAt: 'desc' },
            take: 25
        })
    ]);

    // Combine and sort by date
    const feed = [
        ...games.map(g => ({ ...g, type: 'game_update', date: g.updatedAt })),
        ...posts.map(p => ({ ...p, type: 'social_post', date: p.createdAt }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(feed);
}
