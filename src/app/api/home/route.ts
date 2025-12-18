import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getFeaturedGames, getRecentReviews, getUpcomingCatalog } from "@/lib/data-service";

export async function GET(req: Request) {
    try {
        const session = await auth();

        // 1. Featured (Using cache)
        const featured = await getFeaturedGames();

        // 2. Upcoming (Using cache, take 15)
        const allUpcoming = await getUpcomingCatalog();
        const upcoming = allUpcoming.slice(0, 15);

        // 3. Playing (User-specific, keep dynamic)
        let playing: any[] = [];
        if (session?.user?.id) {
            playing = await prisma.game.findMany({
                where: {
                    userId: session.user.id,
                    status: 'playing'
                },
                orderBy: { updatedAt: 'desc' },
                take: 10
            });
        }

        // 4. Recent Reviews (Using cache)
        const reviews = await getRecentReviews();


        return NextResponse.json({
            featured,
            upcoming,
            playing,
            reviews
        });
    } catch (e) {
        console.error("Home API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
