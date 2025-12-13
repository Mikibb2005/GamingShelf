// Platform release years for ordering (newest first)
export const PLATFORM_RELEASE_YEARS: Record<string, number> = {
    // Modern
    "PlayStation 5": 2020,
    "Xbox Series X": 2020,
    "Switch": 2017,
    "PlayStation 4": 2013,
    "Xbox One": 2013,
    "Wii U": 2012,
    "PlayStation Vita": 2011,
    "3DS": 2011,
    "Wii": 2006,
    "PlayStation 3": 2006,
    "Xbox 360": 2005,
    "PSP": 2004,
    "DS": 2004,
    "Nintendo DS": 2004,
    "Nintendo DSi": 2008,
    "Game Boy Advance": 2001,
    "GameCube": 2001,
    "PlayStation 2": 2000,
    "Dreamcast": 1998,
    "Game Boy Color": 1998,
    "Nintendo 64": 1996,
    "Saturn": 1994,
    "PlayStation": 1994,
    "PlayStation Portable": 2004,
    "3DO": 1993,
    "Atari Jaguar": 1993,
    "Atari Jaguar CD": 1995,
    "Virtual Boy": 1995,

    // 16-bit era
    "SNES": 1990,
    "Genesis/Mega Drive": 1988,
    "PC Engine": 1987,
    "PC Engine CD": 1988,
    "Sega CD": 1991,
    "Sega 32X": 1994,
    "Neo Geo Pocket": 1998,
    "Neo Geo CD": 1994,
    "WonderSwan": 1999,

    // 8-bit era
    "NES": 1983,
    "Master System": 1985,
    "Game Boy": 1989,
    "Game Gear": 1990,
    "Atari Lynx": 1989,

    // Classic
    "Atari 7800": 1986,
    "Atari 2600": 1977,
    "ColecoVision": 1982,
    "Intellivision": 1979,
    "Vectrex": 1982,
    "SG-1000": 1983,
    "Fairchild Channel F": 1976,

    // Computers
    "PC": 1981,
    "MSX": 1983,
    "Amstrad CPC": 1984,
    "Apple II": 1977,
    "PC-8000/8800": 1979,
    "PC-FX": 1994,

    // Other
    "Arcade": 1970,
    "Arduboy": 2015,
    "WASM-4": 2021,
    "Uzebox": 2008,
    "Watara Supervision": 1992,
    "Mega Duck": 1993,
};

export function sortPlatformsByReleaseDate(platforms: string[]): string[] {
    return [...platforms].sort((a, b) => {
        const yearA = PLATFORM_RELEASE_YEARS[a] || 1990;
        const yearB = PLATFORM_RELEASE_YEARS[b] || 1990;
        return yearB - yearA; // Newest first
    });
}

export function getAllPlatformsSorted(): string[] {
    return Object.keys(PLATFORM_RELEASE_YEARS).sort((a, b) => {
        return PLATFORM_RELEASE_YEARS[b] - PLATFORM_RELEASE_YEARS[a]; // Newest first
    });
}
