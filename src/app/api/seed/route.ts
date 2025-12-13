import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Upsert User
        const user = await prisma.user.upsert({
            where: { username: 'Miki' },
            update: {},
            create: {
                username: 'Miki',
                email: 'miki@example.com',
            },
        });

        const gamesData = [
            {
                title: 'Cyberpunk 2077',
                sourceId: '1091500',
                source: 'Steam',
                platform: 'PC',
                status: 'Playing',
                progress: 45,
                rating: 5,
                releaseYear: 2020,
                coverUrl: 'linear-gradient(135deg, #fce38a, #f38181)',
                genres: 'RPG, Sci-Fi',
                achievements: JSON.stringify({ unlocked: 15, total: 45 }),
                userId: user.id
            },
            {
                title: 'The Legend of Zelda: Tears of the Kingdom',
                sourceId: 'totk-switch',
                source: 'Local',
                platform: 'Switch',
                status: 'Completed',
                progress: 100,
                rating: 5,
                releaseYear: 2023,
                coverUrl: 'linear-gradient(135deg, #55efc4, #00b894)',
                genres: 'Adventure',
                achievements: JSON.stringify({ unlocked: 0, total: 0 }),
                userId: user.id
            },
            {
                title: 'Super Metroid',
                sourceId: '1234',
                source: 'RetroAchievements',
                platform: 'SNES',
                status: 'Completed',
                progress: 100,
                rating: 5,
                releaseYear: 1994,
                coverUrl: 'linear-gradient(135deg, #2b5876, #4e4376)',
                genres: 'Metroidvania',
                achievements: JSON.stringify({ unlocked: 10, total: 10 }),
                userId: user.id
            },
            {
                title: 'Elden Ring',
                sourceId: 'elden-ps5',
                source: 'PSN',
                platform: 'PlayStation 5',
                status: 'Backlog',
                progress: 12,
                releaseYear: 2022,
                coverUrl: 'linear-gradient(135deg, #a8e063, #56ab2f)',
                genres: 'Soulslike',
                achievements: JSON.stringify({ unlocked: 4, total: 42 }),
                userId: user.id
            }
        ];

        for (const g of gamesData) {
            // Check if exists to avoid duplicates on refresh
            const exists = await prisma.game.findFirst({ where: { sourceId: g.sourceId, userId: g.userId } });
            if (!exists) {
                await prisma.game.create({ data: g });
            }
        }

        return NextResponse.json({ success: true, message: "Database seeded!" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Seeding failed" }, { status: 500 });
    }
}
