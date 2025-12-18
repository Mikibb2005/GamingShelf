import { syncNewGamesFromIGDB } from "./src/lib/igdb-sync";

async function run() {
    process.env.NODE_ENV = "development"; // Bypass security check if needed locally
    console.log("🚀 Iniciando sincronización manual de grandes lanzamientos...");
    const result = await syncNewGamesFromIGDB(true);
    console.log("Resultado:", JSON.stringify(result, null, 2));
}

run();
