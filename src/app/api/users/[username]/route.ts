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
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Transform for privacy/security (don't send email publicly)
        const profileData = {
            id: user.id,
            username: user.username,
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
