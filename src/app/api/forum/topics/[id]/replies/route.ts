import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Get topic with replies
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const topic = await prisma.forumTopic.findUnique({
        where: { id },
        include: {
            author: { select: { username: true } },
            category: { select: { id: true, name: true } },
            replies: {
                include: {
                    author: { select: { username: true } }
                },
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    if (!topic) {
        return NextResponse.json({ error: "Tema no encontrado" }, { status: 404 });
    }

    return NextResponse.json(topic);
}

// POST: Add reply to topic
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content) {
        return NextResponse.json({ error: "Contenido requerido" }, { status: 400 });
    }

    // Check if topic exists and is not locked
    const topic = await prisma.forumTopic.findUnique({
        where: { id }
    });

    if (!topic) {
        return NextResponse.json({ error: "Tema no encontrado" }, { status: 404 });
    }

    if (topic.isLocked) {
        return NextResponse.json({ error: "Este tema está cerrado" }, { status: 403 });
    }

    const reply = await prisma.forumReply.create({
        data: {
            content,
            topicId: id,
            authorId: session.user.id
        },
        include: {
            author: { select: { username: true } }
        }
    });

    // Update topic's updatedAt
    await prisma.forumTopic.update({
        where: { id },
        data: { updatedAt: new Date() }
    });

    return NextResponse.json(reply);
}
