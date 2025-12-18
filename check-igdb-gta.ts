import "dotenv/config";
import { igdbFetch } from "./src/lib/igdb";

async function run() {
    const query = 'fields name, hypes, follows, first_release_date, category, cover; where hypes > 50; sort hypes desc; limit 10;';
    const games = await igdbFetch("games", query);
    console.log("IGDB Data for GTA VI:", games);
}

run();
