
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const showcases = await prisma.showcase.findMany({
        where: { userId: session.user.id },
        orderBy: { order: 'asc' }
    });

    return NextResponse.json(showcases);
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, type, content } = await req.json();

    const showcase = await prisma.showcase.create({
        data: {
            userId: session.user.id,
            title,
            type,
            content: JSON.stringify(content) // Expecting array of game IDs
        }
    });

    return NextResponse.json(showcase);
}

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.showcase.deleteMany({
        where: {
            id,
            userId: session.user.id
        }
    });

    return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, title, type, content, order } = await req.json();

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const showcase = await prisma.showcase.updateMany({
        where: {
            id,
            userId: session.user.id
        },
        data: {
            title,
            type,
            content: content ? JSON.stringify(content) : undefined,
            order
        }
    });

    return NextResponse.json(showcase);
}

