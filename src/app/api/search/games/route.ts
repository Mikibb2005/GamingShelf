import { NextResponse } from "next/server";

const RAWG_API_KEY = process.env.RAWG_API_KEY || "";
const RAWG_BASE = "https://api.rawg.io/api";

// GET: Search games using RAWG API
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const page = searchParams.get("page") || "1";

    if (!query) {
        return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    if (!RAWG_API_KEY) {
        return NextResponse.json({ error: "RAWG_API_KEY not configured" }, { status: 500 });
    }

    try {
        const res = await fetch(
            `${RAWG_BASE}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=20&page=${page}`
        );

        if (!res.ok) {
            return NextResponse.json({ error: "RAWG API error" }, { status: 500 });
        }

        const data = await res.json();

        // Transform to our format
        const games = data.results.map((g: any) => ({
            sourceId: `rawg-${g.id}`,
            source: "RAWG",
            title: g.name,
            coverUrl: g.background_image,
            releaseYear: g.released ? new Date(g.released).getFullYear() : null,
            rating: g.metacritic,
            platforms: g.platforms?.map((p: any) => p.platform.name) || [],
            genres: g.genres?.map((genre: any) => genre.name) || [],
            screenshots: g.short_screenshots?.map((s: any) => s.image) || []
        }));

        return NextResponse.json({
            results: games,
            count: data.count,
            next: data.next ? true : false
        });
    } catch (e) {
        console.error("RAWG search error:", e);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
