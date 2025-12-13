/**
 * OpenCritic API Helper
 * Uses RapidAPI for accessing OpenCritic data
 * Free tier: 25-200 requests/day
 */

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; // User needs to set this
const OPENCRITIC_BASE = 'https://opencritic-api.p.rapidapi.com';

interface OpenCriticGame {
    id: number;
    name: string;
    topCriticScore: number; // Main critic score (0-100)
    percentRecommended: number;
    tier: string; // "Mighty", "Strong", "Fair", "Weak"
}

/**
 * Search for a game by name on OpenCritic
 */
export async function searchOpenCritic(gameName: string): Promise<OpenCriticGame[] | null> {
    if (!RAPIDAPI_KEY) {
        console.warn('RAPIDAPI_KEY not set - OpenCritic disabled');
        return null;
    }

    try {
        const res = await fetch(`${OPENCRITIC_BASE}/game/search?criteria=${encodeURIComponent(gameName)}`, {
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'opencritic-api.p.rapidapi.com'
            }
        });

        if (!res.ok) {
            console.error('OpenCritic search failed:', res.status);
            return null;
        }

        return await res.json();
    } catch (e) {
        console.error('OpenCritic error:', e);
        return null;
    }
}

/**
 * Get game details by OpenCritic ID
 */
export async function getOpenCriticGame(id: number): Promise<OpenCriticGame | null> {
    if (!RAPIDAPI_KEY) return null;

    try {
        const res = await fetch(`${OPENCRITIC_BASE}/game/${id}`, {
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'opencritic-api.p.rapidapi.com'
            }
        });

        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error('OpenCritic error:', e);
        return null;
    }
}

/**
 * Search and get the best matching game score
 */
export async function getOpenCriticScore(gameName: string): Promise<{ id: number; score: number } | null> {
    const results = await searchOpenCritic(gameName);
    if (!results || results.length === 0) return null;

    // Return first match's score
    const best = results[0];
    return {
        id: best.id,
        score: Math.round(best.topCriticScore)
    };
}
