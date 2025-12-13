import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RA_API_BASE = "https://retroachievements.org/API";

// Platform mapping for RA console IDs to readable names
const CONSOLE_MAP: Record<number, { name: string; releaseYear: number }> = {
    1: { name: "Genesis/Mega Drive", releaseYear: 1988 },
    2: { name: "Nintendo 64", releaseYear: 1996 },
    3: { name: "SNES", releaseYear: 1990 },
    4: { name: "Game Boy", releaseYear: 1989 },
    5: { name: "Game Boy Advance", releaseYear: 2001 },
    6: { name: "Game Boy Color", releaseYear: 1998 },
    7: { name: "NES", releaseYear: 1983 },
    8: { name: "PC Engine", releaseYear: 1987 },
    9: { name: "Sega CD", releaseYear: 1991 },
    10: { name: "Sega 32X", releaseYear: 1994 },
    11: { name: "Master System", releaseYear: 1985 },
    12: { name: "PlayStation", releaseYear: 1994 },
    13: { name: "Atari Lynx", releaseYear: 1989 },
    14: { name: "Neo Geo Pocket", releaseYear: 1998 },
    15: { name: "Game Gear", releaseYear: 1990 },
    17: { name: "Atari Jaguar", releaseYear: 1993 },
    18: { name: "Nintendo DS", releaseYear: 2004 },
    21: { name: "PlayStation 2", releaseYear: 2000 },
    25: { name: "Atari 2600", releaseYear: 1977 },
    27: { name: "Arcade", releaseYear: 1970 },
    28: { name: "Virtual Boy", releaseYear: 1995 },
    29: { name: "MSX", releaseYear: 1983 },
    33: { name: "SG-1000", releaseYear: 1983 },
    37: { name: "Amstrad CPC", releaseYear: 1984 },
    38: { name: "Apple II", releaseYear: 1977 },
    39: { name: "Saturn", releaseYear: 1994 },
    40: { name: "Dreamcast", releaseYear: 1998 },
    41: { name: "PlayStation Portable", releaseYear: 2004 },
    43: { name: "3DO", releaseYear: 1993 },
    44: { name: "ColecoVision", releaseYear: 1982 },
    45: { name: "Intellivision", releaseYear: 1979 },
    46: { name: "Vectrex", releaseYear: 1982 },
    47: { name: "PC-8000/8800", releaseYear: 1979 },
    49: { name: "PC-FX", releaseYear: 1994 },
    51: { name: "Atari 7800", releaseYear: 1986 },
    53: { name: "WonderSwan", releaseYear: 1999 },
    56: { name: "Neo Geo CD", releaseYear: 1994 },
    57: { name: "Fairchild Channel F", releaseYear: 1976 },
    63: { name: "Watara Supervision", releaseYear: 1992 },
    69: { name: "Mega Duck", releaseYear: 1993 },
    71: { name: "Arduboy", releaseYear: 2015 },
    72: { name: "WASM-4", releaseYear: 2021 },
    76: { name: "PC Engine CD", releaseYear: 1988 },
    77: { name: "Atari Jaguar CD", releaseYear: 1995 },
    78: { name: "Nintendo DSi", releaseYear: 2008 },
    80: { name: "Uzebox", releaseYear: 2008 }
};

export async function POST() {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Get linked RA account
    const raAccount = await prisma.linkedAccount.findFirst({
        where: {
            userId: session.user.id,
            provider: "RetroAchievements"
        }
    });

    if (!raAccount || !raAccount.apiKey) {
        return NextResponse.json({ error: "Cuenta de RetroAchievements no vinculada" }, { status: 400 });
    }

    try {
        // Fetch user's games from RA API
        const url = `${RA_API_BASE}/API_GetUserCompletionProgress.php?z=${raAccount.accountId}&y=${raAccount.apiKey}&u=${raAccount.accountId}`;

        const response = await fetch(url);

        if (!response.ok) {
            return NextResponse.json({ error: "Error al conectar con RetroAchievements" }, { status: 502 });
        }

        const data = await response.json();

        if (!data.Results || !Array.isArray(data.Results)) {
            return NextResponse.json({ error: "Respuesta inválida de RetroAchievements" }, { status: 502 });
        }

        let imported = 0;

        for (const game of data.Results) {
            const consoleInfo = CONSOLE_MAP[game.ConsoleID] || { name: `Console ${game.ConsoleID}`, releaseYear: 1990 };

            // Check if game already exists
            const existing = await prisma.game.findFirst({
                where: {
                    userId: session.user.id,
                    sourceId: String(game.GameID),
                    source: "RetroAchievements"
                }
            });

            if (!existing) {
                await prisma.game.create({
                    data: {
                        userId: session.user.id,
                        sourceId: String(game.GameID),
                        source: "RetroAchievements",
                        platform: consoleInfo.name,
                        title: game.Title,
                        coverUrl: `https://retroachievements.org${game.ImageIcon}`,
                        status: game.NumAwardedHardcore === game.MaxPossible ? "Completed" : "Playing",
                        progress: game.MaxPossible > 0
                            ? Math.round((game.NumAwardedHardcore / game.MaxPossible) * 100)
                            : 0,
                        achievements: JSON.stringify({
                            unlocked: game.NumAwardedHardcore || 0,
                            total: game.MaxPossible || 0
                        }),
                        releaseYear: consoleInfo.releaseYear
                    }
                });
                imported++;
            } else {
                // Update existing game
                await prisma.game.update({
                    where: { id: existing.id },
                    data: {
                        status: game.NumAwardedHardcore === game.MaxPossible ? "Completed" : "Playing",
                        progress: game.MaxPossible > 0
                            ? Math.round((game.NumAwardedHardcore / game.MaxPossible) * 100)
                            : 0,
                        achievements: JSON.stringify({
                            unlocked: game.NumAwardedHardcore || 0,
                            total: game.MaxPossible || 0
                        })
                    }
                });
            }
        }

        return NextResponse.json({
            success: true,
            imported,
            total: data.Results.length
        });
    } catch (error) {
        console.error("RA Sync error:", error);
        return NextResponse.json({ error: "Error al sincronizar" }, { status: 500 });
    }
}
