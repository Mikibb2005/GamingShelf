import styles from "./FilterBar.module.css";

interface FilterBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedPlatform: string | "All";
    onPlatformChange: (platform: string | "All") => void;
    selectedStatus: string | "All";
    onStatusChange: (status: string | "All") => void;
    availablePlatforms?: string[];
}

export default function FilterBar({
    searchQuery,
    onSearchChange,
    selectedPlatform,
    onPlatformChange,
    selectedStatus,
    onStatusChange,
    availablePlatforms = []
}: FilterBarProps) {
    return (
        <div className={styles.container}>
            <div className={styles.searchWrapper}>
                <input
                    type="text"
                    placeholder="Buscar en tu colección..."
                    className={styles.searchInput}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <select
                value={selectedPlatform}
                onChange={(e) => onPlatformChange(e.target.value)}
                className={styles.select}
            >
                <option value="All">Todas las Plataformas</option>
                {availablePlatforms.map(p => (
                    <option key={p} value={p}>{p}</option>
                ))}
            </select>

            <select
                value={selectedStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                className={styles.select}
            >
                <option value="All">Todos los Estados</option>
                <option value="Playing">Jugando</option>
                <option value="Backlog">Backlog</option>
                <option value="Completed">Completado</option>
                <option value="Wishlist">Wishlist</option>
                <option value="Dropped">Abandonado</option>
            </select>
        </div>
    );
}
