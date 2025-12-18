
import { NextResponse } from "next/server";
import { syncNewGamesFromIGDB } from "@/lib/igdb-sync";

export const dynamic = 'force-dynamic'; // No caching

export async function GET(request: Request) {
    // Basic security for Cron Jobs
    const authHeader = request.headers.get('authorization');
    const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    // Also allow manual sync via URL if authorized (optional, for convenience)
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('key') === process.env.CRON_SECRET;

    if (!isVercelCron && !isAdmin && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const force = searchParams.get('force') === 'true';

        // Run sync logic
        const result = await syncNewGamesFromIGDB(force);
        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
