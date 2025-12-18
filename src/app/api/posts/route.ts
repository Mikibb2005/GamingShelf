
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get posts from self and followed users
    // First get following IDs
    const following = await prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true }
    });

    const followingIds = following.map(f => f.followingId);
    followingIds.push(session.user.id); // Include self

    const posts = await prisma.post.findMany({
        where: {
            userId: { in: followingIds }
        },
        include: {
            user: {
                select: { username: true, avatarUrl: true }
            },
            _count: {
                select: { comments: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    return NextResponse.json(posts);
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { imageUrl, caption } = await req.json();

        if (!imageUrl) {
            return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
        }

        const post = await prisma.post.create({
            data: {
                userId: session.user.id,
                imageUrl,
                caption
            },
            include: {
                user: {
                    select: { username: true, avatarUrl: true }
                }
            }
        });

        return NextResponse.json(post);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
