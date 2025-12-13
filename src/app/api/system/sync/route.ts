
import { NextResponse } from "next/server";
import { syncNewGamesFromIGDB } from "@/lib/igdb-sync";

export const dynamic = 'force-dynamic'; // No caching

export async function GET() {
    try {
        // Run sync logic
        const result = await syncNewGamesFromIGDB();
        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
