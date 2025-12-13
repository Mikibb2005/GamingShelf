import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
        // Fetch owned games from Steam API
        const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v0001/?key=${steamAccount.apiKey}&steamid=${steamAccount.accountId}&format=json&include_appinfo=1&include_played_free_games=1`;

        const response = await fetch(url);

        if (!response.ok) {
            return NextResponse.json({ error: "Error al conectar con Steam" }, { status: 502 });
        }

        const data = await response.json();

        if (!data.response || !data.response.games) {
            return NextResponse.json({ error: "No se encontraron juegos o perfil privado" }, { status: 400 });
        }

        let imported = 0;

        for (const game of data.response.games) {
            // Check if game already exists
            const existing = await prisma.game.findFirst({
                where: {
                    userId: session.user.id,
                    sourceId: String(game.appid),
                    source: "Steam"
                }
            });

            // Calculate progress based on playtime (simple heuristic)
            const playtimeHours = Math.round(game.playtime_forever / 60);
            let status = "Backlog";
            let progress = 0;

            if (playtimeHours > 0) {
                status = "Playing";
                // Estimate progress based on playtime (cap at 100)
                progress = Math.min(Math.round(playtimeHours / 20 * 100), 100);
                if (progress >= 100) {
                    status = "Completed";
                }
            }

            if (!existing) {
                await prisma.game.create({
                    data: {
                        userId: session.user.id,
                        sourceId: String(game.appid),
                        source: "Steam",
                        platform: "PC",
                        title: game.name,
                        coverUrl: `https://steamcdn-a.akamaihd.net/steam/apps/${game.appid}/library_600x900_2x.jpg`,
                        status,
                        progress,
                        releaseYear: 2020 // Steam API doesn't provide release year easily
                    }
                });
                imported++;
            } else {
                // Update existing game
                await prisma.game.update({
                    where: { id: existing.id },
                    data: {
                        status,
                        progress
                    }
                });
            }
        }

        return NextResponse.json({
            success: true,
            imported,
            total: data.response.games.length
        });
    } catch (error) {
        console.error("Steam Sync error:", error);
        return NextResponse.json({ error: "Error al sincronizar" }, { status: 500 });
    }
}
