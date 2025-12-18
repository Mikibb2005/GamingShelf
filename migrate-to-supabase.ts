import { prisma } from "./src/lib/prisma";
import fs from "fs/promises";
import path from "path";

async function readJson(filename: string) {
    const filePath = path.join(process.cwd(), "migration_data", filename);
    try {
        const content = await fs.readFile(filePath, "utf-8");
        return JSON.parse(content);
    } catch (e) {
        return [];
    }
}

function convertDate(d: any) {
    if (!d) return null;
    return new Date(d);
}

function convertBool(b: any) {
    return b === 1 || b === true;
}

// Helper to chunk arrays
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

async function migrate() {
    console.log("🚀 Starting OPTIMIZED migration...");

    // 1. Users
    const users = await readJson("users.json");
    console.log(`- Migrating ${users.length} users...`);
    for (const u of users) {
        await prisma.user.upsert({
            where: { id: u.id },
            update: {
                username: u.username,
                email: u.email,
                password: u.password,
                createdAt: convertDate(u.createdAt),
                isProfilePublic: convertBool(u.isProfilePublic),
                isGamesListPublic: convertBool(u.isGamesListPublic),
            },
            create: {
                id: u.id,
                username: u.username,
                email: u.email,
                password: u.password,
                createdAt: convertDate(u.createdAt),
                isProfilePublic: convertBool(u.isProfilePublic),
                isGamesListPublic: convertBool(u.isGamesListPublic),
            }
        });
    }

    // 2. GameCatalog (CHUNKED)
    const catalog = await readJson("catalog.json");
    console.log(`- Migrating ${catalog.length} catalog items in chunks...`);
    const catalogChunks = chunkArray(catalog, 100);
    let done = 0;
    for (const chunk of catalogChunks) {
        const data = chunk.map(c => ({
            id: c.id,
            slug: c.slug,
            title: c.title,
            titleNormalized: c.titleNormalized,
            coverUrl: c.coverUrl,
            backgroundUrl: c.backgroundUrl,
            screenshots: c.screenshots,
            description: c.description,
            releaseDate: convertDate(c.releaseDate),
            releaseYear: c.releaseYear,
            developer: c.developer,
            publisher: c.publisher,
            genres: c.genres,
            platforms: c.platforms,
            metacritic: c.metacritic,
            opencriticId: c.opencriticId,
            opencriticScore: c.opencriticScore,
            igdbRating: Number(c.igdbRating) || null,
            igdbId: c.igdbId,
            rawgId: c.rawgId,
            steamAppId: c.steamAppId,
            createdAt: convertDate(c.createdAt),
            updatedAt: convertDate(c.updatedAt)
        }));

        await prisma.gameCatalog.createMany({
            data,
            skipDuplicates: true
        });
        done += chunk.length;
        if (done % 500 === 0 || done === catalog.length) console.log(`  Progress: ${done}/${catalog.length}`);
    }

    // 3. Games
    const games = await readJson("games.json");
    console.log(`- Migrating ${games.length} library games...`);
    for (const g of games) {
        await prisma.game.upsert({
            where: { id: g.id },
            update: {
                userId: g.userId, sourceId: g.sourceId, source: g.source, platform: g.platform,
                title: g.title, coverUrl: g.coverUrl, backgroundUrl: g.backgroundUrl,
                status: g.status, progress: g.progress, rating: g.rating,
                createdAt: convertDate(g.createdAt), updatedAt: convertDate(g.updatedAt)
            },
            create: {
                id: g.id, userId: g.userId, sourceId: g.sourceId, source: g.source, platform: g.platform,
                title: g.title, coverUrl: g.coverUrl, backgroundUrl: g.backgroundUrl,
                status: g.status, progress: g.progress, rating: g.rating,
                createdAt: convertDate(g.createdAt), updatedAt: convertDate(g.updatedAt)
            }
        });
    }

    // 4. Everything else (small tables)
    const tables = [
        { name: "LinkedAccount", file: "accounts.json", model: prisma.linkedAccount, id: "id" },
        { name: "SystemSettings", file: "settings.json", model: prisma.systemSettings, id: "key" },
        { name: "ForumCategory", file: "categories.json", model: prisma.forumCategory, id: "id" },
        { name: "IgnoredGame", file: "ignored.json", model: prisma.ignoredGame, id: "id" },
        { name: "ForumTopic", file: "topics.json", model: prisma.forumTopic, id: "id" },
        { name: "ForumReply", file: "replies.json", model: prisma.forumReply, id: "id" },
        { name: "Comment", file: "comments.json", model: prisma.comment, id: "id" }
    ];

    for (const t of tables) {
        const data = await readJson(t.file);
        console.log(`- Migrating ${data.length} records to ${t.name}...`);
        for (const item of data) {
            const { [t.id]: idValue, ...rest } = item;
            // Basic mapping for dates and bools
            if (rest.createdAt) rest.createdAt = convertDate(rest.createdAt);
            if (rest.updatedAt) rest.updatedAt = convertDate(rest.updatedAt);
            if (rest.isPinned !== undefined) rest.isPinned = convertBool(rest.isPinned);
            if (rest.isLocked !== undefined) rest.isLocked = convertBool(rest.isLocked);

            await (t.model as any).upsert({
                where: { [t.id]: idValue },
                update: rest,
                create: { [t.id]: idValue, ...rest }
            });
        }
    }

    // 5. Follows (Special primary key)
    const follows = await readJson("follows.json");
    console.log(`- Migrating ${follows.length} follows...`);
    for (const f of follows) {
        await prisma.follow.upsert({
            where: { followerId_followingId: { followerId: f.followerId, followingId: f.followingId } },
            update: {},
            create: { followerId: f.followerId, followingId: f.followingId }
        });
    }

    console.log("✅ Migration finished!");
}

migrate()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
