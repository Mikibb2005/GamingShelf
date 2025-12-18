import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/comments?gameId=...
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
        return NextResponse.json({ error: "Game ID required" }, { status: 400 });
    }

    try {
        const comments = await prisma.comment.findMany({
            where: { gameId },
            include: {
                user: {
                    select: { username: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(comments);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }
}

// POST /api/comments
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { content, gameId } = body;

        if (!content || !gameId) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Resolve user via session
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const comment = await prisma.comment.create({
            data: {
                content,
                gameId,
                userId: session.user.id
            },
            include: {
                user: {
                    select: { username: true }
                }
            }
        });

        return NextResponse.json(comment);
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
