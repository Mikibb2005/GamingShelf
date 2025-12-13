import { GameAdapter, UnifiedGame } from "./types";

export class SteamAdapter implements GameAdapter {
    name = "Steam";
    isEnabled = true;

    async getGames(): Promise<UnifiedGame[]> {
        await new Promise(resolve => setTimeout(resolve, 500));

        return [
            {
                id: 'steam-1',
                sourceId: '1091500',
                source: 'Steam',
                title: 'Cyberpunk 2077',
                platform: 'PC',
                status: 'Playing',
                progress: 45,
                coverUrl: 'linear-gradient(135deg, #fce38a, #f38181)',
                achievements: { total: 45, unlocked: 15 },
                genres: ['RPG'],
                releaseYear: 2020
            },
            {
                id: 'steam-2',
                sourceId: '1145360',
                source: 'Steam',
                title: 'Hades',
                platform: 'PC',
                status: 'Completed',
                progress: 100,
                coverUrl: 'linear-gradient(135deg, #e52d27, #b31217)',
                achievements: { total: 49, unlocked: 49 },
                genres: ['Roguelike'],
                releaseYear: 2020
            }
        ];
    }
}
