/**
 * Normalize text for accent-insensitive search.
 * Removes accents and converts to lowercase.
 */
export function normalizeText(text: string): string {
    return text
        .normalize("NFD") // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritical marks
        .toLowerCase()
        .trim();
}
