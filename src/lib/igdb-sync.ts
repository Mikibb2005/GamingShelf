
import { prisma } from "@/lib/prisma";
import { igdbFetch } from "./igdb";
import { normalizeText } from "./normalize";

const SYNC_INTERVAL_MS = 48 * 60 * 60 * 1000; // 48 hours
const MAX_GAMES_PER_SYNC = 50;

/**
 * Syncs new games from IGDB if 48h have passed since last sync.
 * Returns status object.
 */
export async function syncNewGamesFromIGDB(force = false) {
    try {
        // 1. Check last sync time
        let lastSyncSetting = await prisma.systemSettings.findUnique({
            where: { key: "last_igdb_sync" }
        });

        const now = Date.now();
        const lastSyncTime = lastSyncSetting?.updatedAt.getTime() || 0;

        // If synced recently, skip (unless forced)
        if (!force && lastSyncSetting && (now - lastSyncTime < SYNC_INTERVAL_MS)) {
            return { skipped: true, reason: "Synced recently", nextSyncDiff: SYNC_INTERVAL_MS - (now - lastSyncTime) };
        }

        console.log("[IGDB Sync] Starting sync for new games...");

        // 2. Determine query start date
        const catalogCount = await prisma.gameCatalog.count();
        const isCatalogEmpty = catalogCount === 0;

        // If never synced or catalog is empty, default to 1 year ago for first-time population
        const defaultStart = Math.floor((now - (365 * 24 * 60 * 60 * 1000)) / 1000);
        const startTime = (lastSyncSetting && !isCatalogEmpty) ? Math.floor(lastSyncTime / 1000) : defaultStart;

        console.log(`[IGDB Sync] Catalog count: ${catalogCount}. Querying games released after: ${new Date(startTime * 1000).toLocaleDateString()}`);

        // 3. Fetch from IGDB
        // categories: 0=Main, 8=Remake, 9=Remaster
        const query = `
            fields name, slug, cover.url, first_release_date, summary, total_rating,
                   genres.name, platforms.name, involved_companies.company.name, involved_companies.developer, involved_companies.publisher;
            where first_release_date > ${startTime} & category = (0, 8, 9) & cover != null;
            sort first_release_date desc;
            limit ${MAX_GAMES_PER_SYNC};
        `;

        const games = await igdbFetch("games", query);

        if (!games || !Array.isArray(games) || games.length === 0) {
            const clientId = process.env.TV_CLIENT_ID ? "Configured" : "Missing";
            const clientSecret = process.env.TV_CLIENT_SECRET ? "Configured" : "Missing";

            console.log("[IGDB Sync] No games found. ENV Check:", { clientId, clientSecret });

            return {
                success: true,
                count: 0,
                message: "No se encontraron juegos en IGDB",
                debug: {
                    env: { clientId, clientSecret },
                    startTime,
                    startTimeDate: new Date(startTime * 1000).toISOString(),
                    query: query.trim()
                }
            };
        }

        console.log(`[IGDB Sync] Found ${games.length} new games.`);

        // 4. Upsert games
        let addedCount = 0;
        for (const g of games) {
            // Process data similar to import route
            const developers = g.involved_companies
                ?.filter((c: any) => c.developer)
                .map((c: any) => c.company.name)
                .join(", ") || null;

            const publishers = g.involved_companies
                ?.filter((c: any) => c.publisher)
                .map((c: any) => c.company.name)
                .join(", ") || null;

            const platforms = g.platforms?.map((p: any) => p.name) || [];
            const genres = g.genres?.map((gen: any) => gen.name).join(", ") || null;

            const coverUrl = g.cover?.url
                ? g.cover.url.replace("t_thumb", "t_cover_big").startsWith("//")
                    ? `https:${g.cover.url.replace("t_thumb", "t_cover_big")}`
                    : g.cover.url.replace("t_thumb", "t_cover_big")
                : null;

            // Strip accents
            const titleNormalized = normalizeText(g.name);

            await prisma.gameCatalog.upsert({
                where: { slug: g.slug },
                update: {
                    title: g.name,
                    titleNormalized,
                    coverUrl,
                    description: g.summary,
                    releaseDate: g.first_release_date ? new Date(g.first_release_date * 1000) : null,
                    releaseYear: g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : null,
                    developer: developers,
                    publisher: publishers,
                    platforms: JSON.stringify(platforms),
                    genres,
                    metacritic: g.total_rating ? Math.round(g.total_rating) : null,
                    igdbId: g.id,
                },
                create: {
                    slug: g.slug,
                    title: g.name,
                    titleNormalized,
                    coverUrl,
                    description: g.summary,
                    releaseDate: g.first_release_date ? new Date(g.first_release_date * 1000) : null,
                    releaseYear: g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : null,
                    developer: developers,
                    publisher: publishers,
                    platforms: JSON.stringify(platforms),
                    genres,
                    metacritic: g.total_rating ? Math.round(g.total_rating) : null,
                    igdbId: g.id,
                }
            });
            addedCount++;
        }

        // 5. Update last sync time
        await updateLastSyncTime();

        return { success: true, count: addedCount };

    } catch (e) {
        console.error("[IGDB Sync] Error:", e);
        return { success: false, error: String(e) };
    }
}

async function updateLastSyncTime() {
    await prisma.systemSettings.upsert({
        where: { key: "last_igdb_sync" },
        update: { value: "done", updatedAt: new Date() },
        create: { key: "last_igdb_sync", value: "done" }
    });
}
