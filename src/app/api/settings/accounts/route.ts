import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

// GET: Fetch linked accounts for current user
export async function GET() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    try {
        const accounts = await prisma.linkedAccount.findMany({
            where: { userId: session.user.id },
            select: {
                id: true,
                provider: true,
                accountId: true,
                createdAt: true
                // Note: apiKey is NOT returned for security
            }
        });
        return NextResponse.json(accounts);
    } catch (e) {
        return NextResponse.json({ error: "Error al obtener cuentas" }, { status: 500 });
    }
}

// POST: Link a new account
export async function POST(request: Request) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    try {
        const { provider, accountId, apiKey } = await request.json();

        if (!provider || !accountId) {
            return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
        }

        // Encrypt the API key before storing
        const encryptedApiKey = apiKey ? encrypt(apiKey) : undefined;

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
                    ...(encryptedApiKey && { apiKey: encryptedApiKey })
                }
            });
        } else {
            await prisma.linkedAccount.create({
                data: {
                    userId: session.user.id,
                    provider,
                    accountId,
                    ...(encryptedApiKey && { apiKey: encryptedApiKey })
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Link Account Error:", e);
        return NextResponse.json({
            error: "Error al vincular cuenta",
            details: e.message
        }, { status: 500 });
    }
}
