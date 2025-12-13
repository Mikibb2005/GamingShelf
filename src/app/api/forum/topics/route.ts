import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: List topics (optionally by category)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    const where = categoryId ? { categoryId } : {};

    const topics = await prisma.forumTopic.findMany({
        where,
        include: {
            author: { select: { username: true } },
            category: { select: { name: true } },
            _count: { select: { replies: true } }
        },
        orderBy: [
            { isPinned: 'desc' },
            { updatedAt: 'desc' }
        ],
        take: 50
    });

    return NextResponse.json(topics);
}

// POST: Create a new topic
export async function POST(request: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { title, content, categoryId } = await request.json();

    if (!title || !content || !categoryId) {
        return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const topic = await prisma.forumTopic.create({
        data: {
            title,
            content,
            categoryId,
            authorId: session.user.id
        },
        include: {
            author: { select: { username: true } }
        }
    });

    return NextResponse.json(topic);
}
