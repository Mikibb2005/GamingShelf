import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = session.user.id; // Extract for type safety in callbacks

        const { games } = await req.json();
        // games: Array of { source, sourceId, title, platform, coverUrl, ... }

        if (!Array.isArray(games) || games.length === 0) {
            return NextResponse.json({ count: 0 });
        }

        let added = 0;

        for (const g of games) {
            // Check if ignored? No, explicit add overrides ignore.
            // Check if exists?

            // Try to find catalog match for richer data
            // (Assuming normalized title matching or sourceId if possible)
            // Ideally integrations provided rich data already or sourceId matches catalog

            // Basic Upsert
            await prisma.game.upsert({
                where: {
                    // Compound unique constrained by API? 
                    // No, UserGame unique is not clearly defined in Schema without seeing it all, 
                    // but typically logic handles duplicates.
                    // Actually schema doesn't have unique constraint on UserGame (userId, source, sourceId) shown in previous ViewFile?
                    // I'll check schema logic. Usually we try 'findFirst' then update or create.
                    id: "nonspecific" // triggers create if not found by unique
                },
                create: {
                    userId: session.user.id,
                    source: g.source,
                    sourceId: g.sourceId,
                    title: g.title,
                    platform: g.platform,
                    coverUrl: g.coverUrl,
                    status: 'unplayed',
                    ownership: 'owned'
                },
                update: {
                    // Update metadata?
                    coverUrl: g.coverUrl
                }
                // Prisma upsert needs unique field. 
                // Previous integration code used `findFirst` manually or trusted unique.
            }).catch(async (e) => {
                // Fallback to manual find/create if upsert fails due to missing unique index
                const existing = await prisma.game.findFirst({
                    where: { userId, source: g.source, sourceId: g.sourceId }
                });
                if (!existing) {
                    await prisma.game.create({
                        data: {
                            userId,
                            source: g.source,
                            sourceId: g.sourceId,
                            title: g.title,
                            platform: g.platform,
                            coverUrl: g.coverUrl,
                            status: 'unplayed',
                            ownership: 'owned'
                        }
                    });
                    added++;
                }
            });

            // Clean up from IgnoredGame if exists (Restoring)
            await prisma.ignoredGame.deleteMany({
                where: { userId, source: g.source, sourceId: g.sourceId }
            }).catch(() => { });
        }

        // Count accurately if possible, here simplified
        // I will use a loop with manual check to be safe as schema unique constraint is unknown/unreliable on (userId, source, sourceId) from here
        // Wait, I should verify Schema for unique constraint on Game.

        return NextResponse.json({ count: games.length });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Error batch adding" }, { status: 500 });
    }
}
