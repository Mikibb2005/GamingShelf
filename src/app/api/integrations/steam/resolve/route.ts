import { NextResponse } from "next/server";

const STEAM_API_BASE = "https://api.steampowered.com";

// Changed from GET to POST to avoid API key in URL/logs
export async function POST(request: Request) {
    try {
        const { vanityUrl, apiKey } = await request.json();

        if (!vanityUrl || !apiKey) {
            return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
        }

        // Call Steam API to resolve vanity URL
        const url = `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v0001/?key=${apiKey}&vanityurl=${vanityUrl}`;

        const response = await fetch(url);

        if (!response.ok) {
            return NextResponse.json({ error: "Error al conectar con Steam" }, { status: 502 });
        }

        const data = await response.json();

        if (data.response?.success === 1 && data.response?.steamid) {
            return NextResponse.json({ steamId: data.response.steamid });
        } else {
            // Vanity URL not found - maybe it's already a Steam ID
            if (/^\d{17}$/.test(vanityUrl)) {
                return NextResponse.json({ steamId: vanityUrl });
            }
            return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
        }
    } catch (error) {
        console.error("Steam resolve error:", error);
        return NextResponse.json({ error: "Error al resolver" }, { status: 500 });
    }
}
