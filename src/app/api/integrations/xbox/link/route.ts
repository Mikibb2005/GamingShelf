import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const OPENXBL_BASE = "https://xbl.io/api/v2";

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { gamertag, apiKey } = await request.json();
    if (!gamertag || !apiKey) {
        return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    try {
        // Search for gamertag to get XUID
        const res = await fetch(`${OPENXBL_BASE}/search/${encodeURIComponent(gamertag)}`, {
            headers: {
                "X-Authorization": apiKey,
                "Accept": "application/json"
            }
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Error al buscar Gamertag en Xbox Live" }, { status: 500 });
        }

        const data = await res.json();
        // Verify we found exact match or take first result
        const user = data.people?.find((p: any) => p.gamertag.toLowerCase() === gamertag.toLowerCase()) || data.people?.[0];

        if (!user) {
            return NextResponse.json({ error: "Gamertag no encontrado" }, { status: 404 });
        }

        const xuid = user.xuid;

        // Save linked account
        await prisma.linkedAccount.upsert({
            where: {
                userId_provider: {
                    userId: session.user.id,
                    provider: "Xbox"
                }
            },
            update: {
                accountId: `${xuid}|${apiKey}`,
                username: user.gamertag,
                apiKey: "" // We store it combined in accountId for consistency
            },
            create: {
                userId: session.user.id,
                provider: "Xbox",
                accountId: `${xuid}|${apiKey}`,
                username: user.gamertag,
                apiKey: ""
            }
        });

        return NextResponse.json({ success: true, username: user.gamertag });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
    }
}
