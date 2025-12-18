
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    const { userId: targetUserId } = await params;
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUserId = session.user.id;

    // Fetch conversation
    const messages = await prisma.message.findMany({
        where: {
            OR: [
                { senderId: currentUserId, receiverId: targetUserId },
                { senderId: targetUserId, receiverId: currentUserId }
            ]
        },
        orderBy: { createdAt: 'asc' }
    });

    // Mark as read
    await prisma.message.updateMany({
        where: {
            senderId: targetUserId,
            receiverId: currentUserId,
            read: false
        },
        data: { read: true }
    });

    return NextResponse.json(messages);
}
