import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { games } = await req.json();
        // games: Array of { source, sourceId, title }

        if (!Array.isArray(games)) {
            return NextResponse.json({ count: 0 });
        }

        let count = 0;
        for (const g of games) {
            try {
                await prisma.ignoredGame.create({
                    data: {
                        userId: session.user.id,
                        source: g.source,
                        sourceId: g.sourceId,
                        title: g.title
                    }
                });
            } catch (e) {
                // Already ignored
            }

            // Ensure removed from library
            await prisma.game.deleteMany({
                where: { userId: session.user.id, source: g.source, sourceId: g.sourceId }
            }).catch(() => { });

            count++;
        }

        return NextResponse.json({ count });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Error ignoring games" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const ignored = await prisma.ignoredGame.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(ignored);
    } catch (e) {
        return NextResponse.json({ error: "Error fetching ignored" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { ids } = await req.json();
        if (!Array.isArray(ids)) return NextResponse.json({ count: 0 });

        const res = await prisma.ignoredGame.deleteMany({
            where: {
                userId: session.user.id,
                id: { in: ids }
            }
        });

        return NextResponse.json({ count: res.count });
    } catch (e) {
        return NextResponse.json({ error: "Error deleting ignored" }, { status: 500 });
    }
}
