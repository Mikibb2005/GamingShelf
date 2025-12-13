export type Platform = 'Steam' | 'PS5' | 'Xbox' | 'Switch' | 'Retro';
export type PlayStatus = 'Playing' | 'Backlog' | 'Completed' | 'Dropped' | 'Wishlist';

export interface Game {
    id: string;
    title: string;
    platform: Platform;
    status: PlayStatus;
    progress: number; // 0-100
    rating?: number; // 0-5
    releaseYear: number;
    achievements: {
        unlocked: number;
        total: number;
    };
    image: string; // URL or placeholder color gradient
    tags: string[];
}

export const mockGames: Game[] = [
    {
        id: '1',
        title: 'Cyberpunk 2077',
        // Wait, let's fix the type in the mock data to match the type definition
        platform: 'Steam',
        status: 'Playing',
        progress: 45,
        rating: 5,
        releaseYear: 2020,
        achievements: { unlocked: 15, total: 45 },
        image: 'linear-gradient(135deg, #fce38a, #f38181)', // Placeholder gradient
        tags: ['RPG', 'Sci-Fi', 'Open World']
    },
    {
        id: '2',
        title: 'The Legend of Zelda: Tears of the Kingdom',
        platform: 'Switch',
        status: 'Completed',
        progress: 100,
        rating: 5,
        releaseYear: 2023,
        achievements: { unlocked: 0, total: 0 }, // Nintendo...
        image: 'linear-gradient(135deg, #55efc4, #00b894)',
        tags: ['Adventure', 'Open World']
    },
    {
        id: '3',
        title: 'Elden Ring',
        platform: 'PS5',
        status: 'Backlog',
        progress: 12,
        rating: 0,
        releaseYear: 2022,
        achievements: { unlocked: 4, total: 42 },
        image: 'linear-gradient(135deg, #a8e063, #56ab2f)',
        tags: ['RPG', 'Soulslike', 'Hard']
    },
    {
        id: '4',
        title: 'Super Metroid',
        platform: 'Retro',
        status: 'Completed',
        progress: 100,
        rating: 5,
        releaseYear: 1994,
        achievements: { unlocked: 35, total: 35 }, // RetroAchievements style
        image: 'linear-gradient(135deg, #2b5876, #4e4376)',
        tags: ['Metroidvania', 'Classic']
    },
    {
        id: '5',
        title: 'Halo Infinite',
        platform: 'Xbox',
        status: 'Dropped',
        progress: 30,
        rating: 3,
        releaseYear: 2021,
        achievements: { unlocked: 20, total: 100 },
        image: 'linear-gradient(135deg, #232526, #414345)',
        tags: ['FPS', 'Shooter']
    },
    {
        id: '6',
        title: 'Hades',
        platform: 'Steam',
        status: 'Completed',
        progress: 100,
        rating: 5,
        releaseYear: 2020,
        achievements: { unlocked: 49, total: 49 },
        image: 'linear-gradient(135deg, #e52d27, #b31217)',
        tags: ['Roguelike', 'Indie']
    },
    {
        id: '7',
        title: 'Final Fantasy VII Rebirth',
        platform: 'PS5',
        status: 'Wishlist',
        progress: 0,
        releaseYear: 2024,
        achievements: { unlocked: 0, total: 50 },
        image: 'linear-gradient(135deg, #00c6ff, #0072ff)',
        tags: ['RPG', 'Story Rich']
    },
    {
        id: '8',
        title: 'Stardew Valley',
        platform: 'Steam',
        status: 'Playing',
        progress: 60,
        rating: 5,
        releaseYear: 2016,
        achievements: { unlocked: 20, total: 40 },
        image: 'linear-gradient(135deg, #FDC830, #F37335)',
        tags: ['Farming', 'Relaxing']
    }
];
