
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// List all chat threads (unique counterparts)
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    // Fetch all messages where user is sender or receiver
    const messages = await prisma.message.findMany({
        where: {
            OR: [
                { senderId: userId },
                { receiverId: userId }
            ]
        },
        include: {
            sender: { select: { id: true, username: true, avatarUrl: true } },
            receiver: { select: { id: true, username: true, avatarUrl: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Group by counterparty
    const threadsMap = new Map();
    messages.forEach(msg => {
        const counterparty = msg.senderId === userId ? msg.receiver : msg.sender;
        if (!threadsMap.has(counterparty.id)) {
            threadsMap.set(counterparty.id, {
                user: counterparty,
                lastMessage: msg.content,
                createdAt: msg.createdAt,
                unread: msg.receiverId === userId && !msg.read
            });
        }
    });

    return NextResponse.json(Array.from(threadsMap.values()));
}

// Send a message
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { receiverId, content } = await req.json();

        if (!receiverId || !content) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const message = await prisma.message.create({
            data: {
                senderId: session.user.id,
                receiverId,
                content
            }
        });

        return NextResponse.json(message);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
