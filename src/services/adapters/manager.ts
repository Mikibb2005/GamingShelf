import { GameAdapter, UnifiedGame } from "./types";
import { RetroAchievementsAdapter } from "./retroachievements";
import { SteamAdapter } from "./steam";

class AdapterManagerService {
    private adapters: GameAdapter[] = [];

    constructor() {
        // Register adapters
        this.adapters.push(new RetroAchievementsAdapter());
        this.adapters.push(new SteamAdapter());
    }

    async getAllGames(): Promise<UnifiedGame[]> {
        const promises = this.adapters
            .filter(a => a.isEnabled)
            .map(async adapter => {
                try {
                    const games = await adapter.getGames();
                    return games;
                } catch (error) {
                    console.error(`Error fetching games from ${adapter.name}:`, error);
                    return [];
                }
            });

        const results = await Promise.all(promises);
        return results.flat();
    }
}

export const AdapterManager = new AdapterManagerService();
