import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;

    try {
        const user = await prisma.user.findUnique({
            where: { username },
            include: {
                games: {
                    orderBy: { updatedAt: 'desc' },
                    take: 5 // Get top 5 recent games for profile summary
                },
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        games: true
                    }
                },
                showcases: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Fetch all user games to resolve showcases
        const allUserGames = await prisma.game.findMany({
            where: { userId: user.id }
        });

        const resolvedShowcases = user.showcases.map(s => {
            const gameIds = JSON.parse(s.content || "[]");
            const games = gameIds.map((id: string) => allUserGames.find(g => g.id === id)).filter(Boolean);
            return { ...s, games };
        });

        // Transform for privacy/security (don't send email publicly)
        const profileData = {
            id: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
            realName: user.realName,
            bio: user.bio,
            socialLinks: user.socialLinks ? JSON.parse(user.socialLinks) : {},
            favoritePlatforms: user.favoritePlatforms ? JSON.parse(user.favoritePlatforms) : [],
            showcases: resolvedShowcases,
            joinedAt: user.createdAt,
            stats: {
                totalGames: user._count.games,
                followers: user._count.followers,
                following: user._count.following
            },
            recentGames: user.games
        };

        return NextResponse.json(profileData);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
