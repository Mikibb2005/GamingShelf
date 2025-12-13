import { GameAdapter, UnifiedGame } from "./types";

export class RetroAchievementsAdapter implements GameAdapter {
    name = "RetroAchievements";
    isEnabled = true;

    async getGames(): Promise<UnifiedGame[]> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Hardcoded mock data simulating RA response
        return [
            {
                id: 'ra-1',
                sourceId: '1234',
                source: 'RetroAchievements',
                title: 'Super Metroid',
                platform: 'SNES',
                status: 'Completed',
                progress: 100,
                coverUrl: 'linear-gradient(135deg, #2b5876, #4e4376)',
                releaseYear: 1994,
                genres: ['Metroidvania'],
                achievements: { total: 10, unlocked: 10 }
            },
            {
                id: 'ra-2',
                sourceId: '5678',
                source: 'RetroAchievements',
                title: 'Castlevania: Symphony of the Night',
                platform: 'PlayStation',
                status: 'Playing',
                progress: 45,
                coverUrl: 'linear-gradient(135deg, #000000, #434343)',
                releaseYear: 1997,
                genres: ['Metroidvania', 'RPG'],
                achievements: { total: 50, unlocked: 22 }
            },
            {
                id: 'ra-3',
                sourceId: '9999',
                source: 'RetroAchievements',
                title: 'Super Mario World',
                platform: 'SNES',
                status: 'Backlog',
                progress: 0,
                coverUrl: 'linear-gradient(135deg, #ff9966, #ff5e62)',
                releaseYear: 1990,
                genres: ['Platformer'],
                achievements: { total: 30, unlocked: 0 }
            }
        ];
    }
}
