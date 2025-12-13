import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

// Xbox Live API uses OpenXBL (free tier available): https://xbl.io/

const OPENXBL_BASE = "https://xbl.io/api/v2";

// POST: Sync Xbox games and achievements
export async function POST() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Get linked Xbox account  
    const linkedAccount = await prisma.linkedAccount.findFirst({
        where: { userId: session.user.id, provider: "Xbox" }
    });

    if (!linkedAccount?.accountId) {
        return NextResponse.json({
            error: "Cuenta Xbox no vinculada. Vincula tu cuenta en Settings."
        }, { status: 400 });
    }

    // For backwards compatibility, check both new format (apiKey field) and old format (xuid|apikey in accountId)
    let xuid: string;
    let apiKey: string;

    if (linkedAccount.apiKey) {
        // New format: apiKey is encrypted in its own field
        xuid = linkedAccount.accountId;
        apiKey = decrypt(linkedAccount.apiKey);
    } else {
        // Legacy format: xuid|apikey combined in accountId
        const parts = linkedAccount.accountId.split("|");
        xuid = parts[0];
        apiKey = parts.length > 1 ? parts[1] : "";
    }

    if (!apiKey) {
        return NextResponse.json({ error: "API Key no configurada" }, { status: 400 });
    }

    try {
        // Fetch owned games/titles
        const gamesRes = await fetch(`${OPENXBL_BASE}/achievements/player/${xuid}`, {
            headers: {
                "X-Authorization": apiKey,
                "Accept": "application/json"
            }
        });

        if (!gamesRes.ok) {
            const errText = await gamesRes.text();
            console.error("Xbox API error:", errText);
            return NextResponse.json({ error: "Error al conectar con Xbox API" }, { status: 500 });
        }

        const data = await gamesRes.json();
        const titles = data.titles || [];

        // Pre-fetch DB state
        const existing = await prisma.game.findMany({
            where: { userId: session.user.id, source: "Xbox" },
            select: { sourceId: true, id: true }
        });
        const existingMap = new Map(existing.map((g: any) => [g.sourceId, g.id]));

        const ignored = await prisma.ignoredGame.findMany({
            where: { userId: session.user.id, source: "Xbox" },
            select: { sourceId: true }
        });
        const ignoredSet = new Set(ignored.map((g: any) => g.sourceId));

        const candidates: any[] = [];

        for (const title of titles) {
            const sourceId = `xbox-${title.titleId}`;
            const platform = "Xbox";
            let state = 'new';

            if (existingMap.has(sourceId)) {
                state = 'library';
            } else if (ignoredSet.has(sourceId)) {
                state = 'ignored';
            }

            candidates.push({
                source: "Xbox",
                sourceId,
                title: title.name,
                platform,
                coverUrl: title.displayImage,
                state,
                ownership: 'owned'
            });
        }

        return NextResponse.json({
            success: true,
            updated: 0,
            candidates,
            total: titles.length,
            message: `Escaneo completado. ${candidates.length} juegos encontrados.`
        });

    } catch (e: any) {
        console.error("Xbox sync error:", e);
        return NextResponse.json({
            error: "Error al sincronizar",
            details: e.message
        }, { status: 500 });
    }
}
