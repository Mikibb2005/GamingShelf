import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    context: { params: Promise<{ username: string }> }
) {
    const { username } = await context.params;
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform") || "All";
    const status = searchParams.get("status") || "All";

    try {
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true, isProfilePublic: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const where: any = { userId: user.id };
        if (platform !== "All") where.platform = platform;
        if (status !== "All") where.status = status;

        const games = await prisma.game.findMany({
            where,
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json(games);
    } catch (error) {
        console.error("Error fetching user library:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
