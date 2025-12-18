import { prisma } from "./prisma";
import { unstable_cache } from "next/cache";

/**
 * CATALOG QUERIES (Shared for all users, highly cacheable)
 */

export const getFeaturedGames = unstable_cache(
    async () => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        return prisma.gameCatalog.findMany({
            where: {
                releaseDate: {
                    gte: sixMonthsAgo,
                    lte: new Date()
                }
            },
            orderBy: [
                { opencriticScore: { sort: 'desc', nulls: 'last' } },
                { metacritic: { sort: 'desc', nulls: 'last' } },
                { releaseDate: 'desc' }
            ],
            take: 12
        });
    },
    ["featured-games-v1"],
    { revalidate: 3600, tags: ["catalog", "featured"] }
);

export const getUpcomingCatalog = unstable_cache(
    async () => {
        return prisma.gameCatalog.findMany({
            where: {
                OR: [
                    { releaseDate: { gt: new Date() } },
                    { releaseDate: null, releaseYear: { gte: new Date().getFullYear() } },
                    { releaseDate: null, releaseYear: null }
                ],
                igdbId: { not: null }
            },
            orderBy: [
                { releaseDate: { sort: 'asc', nulls: 'last' } },
                { releaseYear: { sort: 'asc', nulls: 'last' } }
            ],
            take: 100
        });
    },
    ["upcoming-catalog-v1"],
    { revalidate: 3600, tags: ["catalog", "upcoming"] }
);

export const getRecentReviews = unstable_cache(
    async () => {
        return prisma.comment.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                user: { select: { username: true, id: true, isProfilePublic: true } },
                game: { select: { title: true, coverUrl: true, id: true } }
            }
        });
    },
    ["recent-reviews-v1"],
    { revalidate: 300, tags: ["community", "reviews"] }
);

export const getCatalogGame = unstable_cache(
    async (id: string) => {
        return prisma.gameCatalog.findUnique({
            where: { id }
        });
    },
    ["catalog-game-detail"],
    { revalidate: 86400, tags: ["catalog", "game-detail"] } // Cache per 24h
);
