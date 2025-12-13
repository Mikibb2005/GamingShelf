import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const xuid = linkedAccount.accountId;
    // API key stored in accountId field as "xuid|apikey"
    const parts = linkedAccount.accountId.split("|");
    const apiKey = parts.length > 1 ? parts[1] : "";

    if (!apiKey) {
        return NextResponse.json({ error: "API Key no configurada" }, { status: 400 });
    }

    try {
        // Fetch owned games/titles
        const gamesRes = await fetch(`${OPENXBL_BASE}/achievements/player/${parts[0]}`, {
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

        let synced = 0;

        for (const title of titles) {
            const sourceId = `xbox-${title.titleId}`;
            const platform = "Xbox";

            const unlocked = title.currentAchievements || 0;
            const total = title.totalAchievements || 0;
            const progress = total > 0 ? Math.round((unlocked / total) * 100) : 0;

            let status = "Backlog";
            if (progress >= 100) status = "Completed";
            else if (progress > 0) status = "Playing";

            const achievementsJson = JSON.stringify({ unlocked, total });

            // Find existing game
            const existing = await prisma.game.findFirst({
                where: { userId: session.user.id, sourceId, platform }
            });

            if (existing) {
                await prisma.game.update({
                    where: { id: existing.id },
                    data: {
                        title: title.name,
                        coverUrl: title.displayImage,
                        progress,
                        status,
                        achievements: achievementsJson,
                        playtimeMinutes: title.totalMinutesPlayed || 0
                    }
                });
            } else {
                await prisma.game.create({
                    data: {
                        userId: session.user.id,
                        sourceId,
                        source: "Xbox",
                        platform,
                        title: title.name,
                        coverUrl: title.displayImage,
                        progress,
                        status,
                        achievements: achievementsJson,
                        playtimeMinutes: title.totalMinutesPlayed || 0
                    }
                });
            }

            synced++;
        }

        return NextResponse.json({
            success: true,
            synced,
            message: `Sincronizados ${synced} juegos de Xbox`
        });

    } catch (e) {
        console.error("Xbox sync error:", e);
        return NextResponse.json({ error: "Error de sincronización" }, { status: 500 });
    }
}
