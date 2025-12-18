
import { NextResponse } from "next/server";
import { syncNewGamesFromIGDB } from "@/lib/igdb-sync";

export const dynamic = 'force-dynamic'; // No caching

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const force = searchParams.get('force') === 'true';

        // Run sync logic
        const result = await syncNewGamesFromIGDB(force);
        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
