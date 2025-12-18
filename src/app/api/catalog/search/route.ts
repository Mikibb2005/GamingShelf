import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/normalize";

// GET: Search local game catalog
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1");
    const sort = searchParams.get("sort") || "title"; // title, releaseYear, metacritic
    const platform = searchParams.get("platform"); // Platform filter
    const upcomingOnly = searchParams.get("upcoming") === "true";
    const pageSize = 50;

    // Build where clause
    const normalizedQuery = query ? normalizeText(query) : null;
    const where: any = {};

    if (normalizedQuery) {
        where.titleNormalized = { contains: normalizedQuery };
    }

    if (upcomingOnly) {
        const now = new Date();
        where.OR = [
            { releaseDate: { gte: now } },
            { releaseDate: null, igdbId: { not: null } } // Anticipated TBD
        ];
    }

    // Platform filter - search in JSON array string
    if (platform && platform !== "All") {
        where.platforms = { contains: platform };
    }

    // Determine orderBy based on sort param
    let orderBy: any = { title: 'asc' };
    if (sort === 'releaseDate') {
        // Sort by full release date (most recent first)
        orderBy = { releaseDate: { sort: 'desc', nulls: 'last' } };
    } else if (sort === 'rating') {
        // Explicit rating sort
        orderBy = [
            { opencriticScore: { sort: 'desc', nulls: 'last' } },
            { metacritic: { sort: 'desc', nulls: 'last' } }
        ];
    } else if (sort === 'relevance') {
        // Relevance: High Score (Scraped) > High Score (IGDB) > Recent
        orderBy = [
            { opencriticScore: { sort: 'desc', nulls: 'last' } },
            { metacritic: { sort: 'desc', nulls: 'last' } },
            { releaseDate: { sort: 'desc', nulls: 'last' } }
        ];
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
                releaseDate: true,
                metacritic: true,
                opencriticScore: true,
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
            screenshots: g.screenshots ? JSON.parse(g.screenshots) : [],
            // Use best available score
            metacriticScore: (g.opencriticScore && g.opencriticScore > 0) ? g.opencriticScore : (g.metacritic || null)
        })),
        total,
        page,
        totalPages: Math.ceil(total / pageSize)
    });
}
