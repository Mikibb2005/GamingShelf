import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Check if current user follows this user
export async function GET(
    request: Request,
    context: { params: Promise<{ username: string }> }
) {
    const { username } = await context.params;
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ following: false });
    }

    const targetUser = await prisma.user.findUnique({
        where: { username }
    });

    if (!targetUser) {
        return NextResponse.json({ following: false });
    }

    const follow = await prisma.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId: session.user.id,
                followingId: targetUser.id
            }
        }
    });

    return NextResponse.json({ following: !!follow });
}

// POST: Follow user
export async function POST(
    request: Request,
    context: { params: Promise<{ username: string }> }
) {
    const { username } = await context.params;
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const targetUser = await prisma.user.findUnique({
        where: { username }
    });

    if (!targetUser) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (targetUser.id === session.user.id) {
        return NextResponse.json({ error: "No puedes seguirte a ti mismo" }, { status: 400 });
    }

    try {
        await prisma.follow.create({
            data: {
                followerId: session.user.id,
                followingId: targetUser.id
            }
        });
        return NextResponse.json({ success: true });
    } catch (e: any) {
        if (e.code === "P2002") {
            return NextResponse.json({ error: "Ya sigues a este usuario" }, { status: 400 });
        }
        throw e;
    }
}

// DELETE: Unfollow user
export async function DELETE(
    request: Request,
    context: { params: Promise<{ username: string }> }
) {
    const { username } = await context.params;
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const targetUser = await prisma.user.findUnique({
        where: { username }
    });

    if (!targetUser) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    await prisma.follow.deleteMany({
        where: {
            followerId: session.user.id,
            followingId: targetUser.id
        }
    });

    return NextResponse.json({ success: true });
}
