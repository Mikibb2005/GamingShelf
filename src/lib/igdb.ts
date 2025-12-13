
const TWITCH_AUTH_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_BASE_URL = "https://api.igdb.com/v4";

// Token caching
let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getIGDBToken() {
    const clientId = process.env.TV_CLIENT_ID;
    const clientSecret = process.env.TV_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("IGDB credentials not configured (TV_CLIENT_ID, TV_CLIENT_SECRET)");
    }

    // Use cached token if valid (with 60s buffer)
    if (cachedToken && Date.now() < tokenExpiry - 60000) {
        return cachedToken;
    }

    // Request new token
    const res = await fetch(
        `${TWITCH_AUTH_URL}?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
        { method: "POST" }
    );

    if (!res.ok) {
        throw new Error(`Failed to get IGDB token: ${res.statusText}`);
    }

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);

    return cachedToken;
}

export async function igdbFetch(endpoint: string, query: string) {
    const token = await getIGDBToken();
    const clientId = process.env.TV_CLIENT_ID!;

    const res = await fetch(`${IGDB_BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: {
            "Client-ID": clientId,
            "Authorization": `Bearer ${token}`,
            "Content-Type": "text/plain"
        },
        body: query
    });

    if (!res.ok) {
        throw new Error(`IGDB API Error: ${res.statusText}`);
    }

    return res.json();
}
