import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/normalize";

// GET: Search local game catalog
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1");
    const sort = searchParams.get("sort") || "title"; // title, releaseYear, metacritic
    const pageSize = 20;

    // Use normalized search for accent-insensitive matching
    const normalizedQuery = query ? normalizeText(query) : null;
    const where = normalizedQuery
        ? { titleNormalized: { contains: normalizedQuery } }
        : {};

    // Determine orderBy based on sort param
    let orderBy: any = { title: 'asc' };
    if (sort === 'releaseYear') {
        orderBy = { releaseYear: 'desc' };
    } else if (sort === 'metacritic') {
        orderBy = { metacritic: 'desc' };
    }

    const [games, total] = await Promise.all([
        prisma.gameCatalog.findMany({
            where,
            take: pageSize,
            skip: (page - 1) * pageSize,
            orderBy,
            select: {
                id: true,
                slug: true,
                title: true,
                coverUrl: true,
                releaseYear: true,
                metacritic: true,
                genres: true,
                platforms: true,
                screenshots: true,
                developer: true,
                publisher: true,
                description: true
            }
        }),
        prisma.gameCatalog.count({ where })
    ]);

    return NextResponse.json({
        results: games.map(g => ({
            ...g,
            platforms: g.platforms ? JSON.parse(g.platforms) : [],
            screenshots: g.screenshots ? JSON.parse(g.screenshots) : []
        })),
        total,
        page,
        totalPages: Math.ceil(total / pageSize)
    });
}
