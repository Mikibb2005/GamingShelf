import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch single catalog item by ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const game = await prisma.gameCatalog.findUnique({
            where: { id }
        });

        if (!game) {
            // Try by slug if not UUID? (Optional, but useful for clean URLs if we used slugs)
            return NextResponse.json({ error: "Game not found" }, { status: 404 });
        }

        return NextResponse.json({
            ...game,
            platforms: game.platforms ? JSON.parse(game.platforms) : [],
            screenshots: game.screenshots ? JSON.parse(game.screenshots) : []
        });

    } catch (e) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
