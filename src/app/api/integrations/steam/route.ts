import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

const STEAM_API_BASE = "https://api.steampowered.com";

export async function POST() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Get linked Steam account
    const steamAccount = await prisma.linkedAccount.findFirst({
        where: {
            userId: session.user.id,
            provider: "Steam"
        }
    });

    if (!steamAccount || !steamAccount.apiKey) {
        return NextResponse.json({ error: "Cuenta de Steam no vinculada" }, { status: 400 });
    }

    try {
        // Decrypt the API key
        const apiKey = decrypt(steamAccount.apiKey);

        if (!apiKey) {
            return NextResponse.json({ error: "Error al descifrar credenciales de Steam" }, { status: 500 });
        }

        // Fetch owned games from Steam API
        const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamAccount.accountId}&format=json&include_appinfo=1&include_played_free_games=1`;

        const response = await fetch(url);

        if (!response.ok) {
            return NextResponse.json({ error: "Error al conectar con Steam" }, { status: 502 });
        }

        const data = await response.json();

        if (!data.response || !data.response.games) {
            return NextResponse.json({ error: "No se encontraron juegos o perfil privado" }, { status: 400 });
        }

        const existing = await prisma.game.findMany({
            where: { userId: session.user.id, source: "Steam" },
            select: { sourceId: true, id: true }
        });
        const existingMap = new Map(existing.map((g: any) => [g.sourceId, g.id]));

        const ignored = await prisma.ignoredGame.findMany({
            where: { userId: session.user.id, source: "Steam" },
            select: { sourceId: true }
        });
        const ignoredSet = new Set(ignored.map((g: any) => g.sourceId));

        const candidates: any[] = [];

        // Scan only (Read-only)
        for (const game of data.response.games) {
            const sid = String(game.appid);
            let state = 'new';

            if (existingMap.has(sid)) {
                state = 'library';
            } else if (ignoredSet.has(sid)) {
                state = 'ignored';
            }

            candidates.push({
                source: "Steam",
                sourceId: sid,
                title: game.name,
                platform: "PC",
                coverUrl: `https://steamcdn-a.akamaihd.net/steam/apps/${game.appid}/library_600x900_2x.jpg`,
                state // 'library', 'ignored', 'new'
            });
        }

        return NextResponse.json({
            success: true,
            updated: 0, // No auto-updates
            candidates,
            total: data.response.games.length,
            message: `Escaneo completado. ${candidates.length} juegos encontrados.`
        });
    } catch (error: any) {
        console.error("Steam Sync error:", error);
        return NextResponse.json({
            error: "Error al sincronizar",
            details: error.message
        }, { status: 500 });
    }
}
