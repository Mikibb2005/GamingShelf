
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            realName: true,
            bio: true,
            avatarUrl: true,
            socialLinks: true,
            favoritePlatforms: true
        }
    });

    return NextResponse.json(user);
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { realName, bio, avatarUrl, socialLinks, favoritePlatforms } = body;

    const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
            realName,
            bio,
            avatarUrl,
            socialLinks: typeof socialLinks === 'object' ? JSON.stringify(socialLinks) : socialLinks,
            favoritePlatforms: Array.isArray(favoritePlatforms) ? JSON.stringify(favoritePlatforms) : favoritePlatforms
        }
    });

    return NextResponse.json(updatedUser);
}
