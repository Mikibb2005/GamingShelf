import { syncNewGamesFromIGDB } from "./src/lib/igdb-sync.ts";

async function run() {
    console.log("🚀 Iniciando sincronización manual de grandes lanzamientos...");
    const result = await syncNewGamesFromIGDB(true);
    console.log("Resultado:", JSON.stringify(result, null, 2));
}

run();
