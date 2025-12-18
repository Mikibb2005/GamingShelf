import { NextResponse } from "next/server";
import { getCatalogGame } from "@/lib/data-service";

// GET: Fetch single catalog item by ID
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        const game = await getCatalogGame(id);

        if (!game) {
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
