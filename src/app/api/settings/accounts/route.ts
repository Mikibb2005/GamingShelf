import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Fetch linked accounts for current user
export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const accounts = await prisma.linkedAccount.findMany({
        where: { userId: session.user.id },
        select: {
            id: true,
            provider: true,
            accountId: true,
            createdAt: true
        }
    });

    return NextResponse.json(accounts);
}

// POST: Link a new account
export async function POST(request: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { provider, accountId, apiKey } = await request.json();

    if (!provider || !accountId) {
        return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Find existing or create new
    const existing = await prisma.linkedAccount.findFirst({
        where: {
            userId: session.user.id,
            provider
        }
    });

    if (existing) {
        await prisma.linkedAccount.update({
            where: { id: existing.id },
            data: {
                accountId,
                ...(apiKey && { apiKey })
            }
        });
    } else {
        await prisma.linkedAccount.create({
            data: {
                userId: session.user.id,
                provider,
                accountId,
                ...(apiKey && { apiKey })
            }
        });
    }

    return NextResponse.json({ success: true });
}
