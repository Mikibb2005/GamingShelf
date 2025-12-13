import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Get current user's privacy settings
export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            isProfilePublic: true,
            isGamesListPublic: true,
            hiddenProviders: true
        }
    });

    return NextResponse.json({
        isProfilePublic: user?.isProfilePublic ?? true,
        isGamesListPublic: user?.isGamesListPublic ?? true,
        hiddenProviders: user?.hiddenProviders ? JSON.parse(user.hiddenProviders) : []
    });
}

// POST: Update privacy settings
export async function POST(request: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { isProfilePublic, isGamesListPublic, hiddenProviders } = await request.json();

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            isProfilePublic: isProfilePublic ?? true,
            isGamesListPublic: isGamesListPublic ?? true,
            hiddenProviders: hiddenProviders ? JSON.stringify(hiddenProviders) : null
        }
    });

    return NextResponse.json({ success: true });
}
