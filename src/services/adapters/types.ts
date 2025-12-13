export type UnifiedGame = {
    id: string;
    sourceId: string; // ID from the external service (e.g. Steam AppID)
    source: 'Local' | 'RetroAchievements' | 'Steam' | 'PSN' | 'Xbox';
    title: string;
    platform: string; // "PlayStation 5", "PC", "SNES", etc.
    coverUrl: string; // URL or Gradient fallback
    backdropUrl?: string;

    // Progress
    status: 'Playing' | 'Backlog' | 'Completed' | 'Dropped' | 'Wishlist';
    progress: number; // 0-100
    playtimeMinutes?: number;
    lastPlayed?: Date;

    // Metadata
    releaseYear?: number;
    developer?: string;
    genres: string[];

    // Achievements
    achievements?: {
        total: number;
        unlocked: number;
        list?: Achievement[];
    };
};

export type Achievement = {
    id: string;
    title: string;
    description: string;
    iconUrl: string;
    unlocked: boolean;
    unlockedDate?: Date;
};

export interface GameAdapter {
    name: string;
    isEnabled: boolean;

    // Core methods
    getGames(): Promise<UnifiedGame[]>;
    getGameDetails?(gameId: string): Promise<UnifiedGame>;
}
