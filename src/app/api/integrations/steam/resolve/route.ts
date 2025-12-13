import { NextResponse } from "next/server";

const STEAM_API_BASE = "https://api.steampowered.com";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const vanityUrl = searchParams.get("vanityUrl");
    const apiKey = searchParams.get("apiKey");

    if (!vanityUrl || !apiKey) {
        return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    try {
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
