"use client";

import { useState, useEffect } from "react";
import { UnifiedGame } from "@/services/adapters/types";
import GameCard from "@/components/GameCard";
import FilterBar from "@/components/library/FilterBar";
import ViewToggle from "@/components/library/ViewToggle";
import { getAllPlatformsSorted } from "@/lib/platforms";
import ProgressBar from "@/components/ProgressBar";

export default function LibraryPage() {
    const [games, setGames] = useState<UnifiedGame[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPlatform, setSelectedPlatform] = useState<string>("All");
    const [selectedStatus, setSelectedStatus] = useState<string>("All");
    const [selectedOwnership, setSelectedOwnership] = useState<string>("All"); // All, wishlist, owned
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        async function loadGames() {
            try {
                const response = await fetch('/api/games');
                if (!response.ok) throw new Error('Failed to fetch');

                const dbGames = await response.json();

                // Map DB Game (Prisma) to UnifiedGame - API already parses achievements
                const unifiedGames: UnifiedGame[] = dbGames.map((g: any) => ({
                    id: g.id,
                    sourceId: g.sourceId,
                    source: g.source,
                    title: g.title,
                    platform: g.platform,
                    coverUrl: g.coverUrl, // Already fused from catalog
                    status: g.status,
                    progress: g.progress,
                    rating: g.rating,
                    releaseYear: g.releaseYear,
                    genres: g.genres ? g.genres.split(',') : [],
                    achievements: g.achievements, // Already parsed by API
                    ownership: g.ownership || 'owned',
                    metacritic: g.metacritic // Fused from catalog
                }));

                setGames(unifiedGames);
            } catch (error) {
                console.error("Error loading games:", error);
            } finally {
                setLoading(false);
            }
        }
        loadGames();
    }, []);

    // Filter Logic
    const filteredGames = games.filter(game => {
        const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlatform = selectedPlatform === "All" || game.platform === selectedPlatform;
        const matchesStatus = selectedStatus === "All" || game.status === selectedStatus;
        const matchesOwnership = selectedOwnership === "All" || (game as any).ownership === selectedOwnership;
        return matchesSearch && matchesPlatform && matchesStatus && matchesOwnership;
    });

    // Show ALL platforms, not just those with games
    const availablePlatforms = getAllPlatformsSorted();

    if (loading) return <ProgressBar />;

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>

            <header style={{
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                        Tu <span className="title-gradient">Colección</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {filteredGames.length} juegos guardados en el sistema
                    </p>
                </div>
                <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
            </header>

            {/* Ownership Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {[{ value: 'All', label: 'Todo' }, { value: 'wishlist', label: '❤️ WishList' }, { value: 'owned', label: '✅ Lo Tengo' }].map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setSelectedOwnership(tab.value)}
                        style={{
                            padding: '0.5rem 1.2rem',
                            borderRadius: 'var(--radius-lg)',
                            border: selectedOwnership === tab.value ? '2px solid var(--primary)' : '1px solid var(--border)',
                            background: selectedOwnership === tab.value ? 'var(--primary)' : 'transparent',
                            color: selectedOwnership === tab.value ? 'white' : 'var(--text-main)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedPlatform={selectedPlatform}
                onPlatformChange={setSelectedPlatform}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                availablePlatforms={availablePlatforms}
            />

            {filteredGames.length > 0 ? (
                <div
                    className={viewMode === 'grid' ? 'game-grid' : ''}
                    style={{
                        display: viewMode === 'list' ? 'flex' : undefined,
                        flexDirection: viewMode === 'list' ? 'column' : undefined,
                        gap: '1.2rem'
                    }}
                >
                    {filteredGames.map(game => (
                        <GameCard
                            key={game.id}
                            id={game.id}
                            title={game.title}
                            platform={game.platform}
                            status={game.status}
                            progress={game.progress}
                            coverGradient={game.coverUrl}
                            releaseYear={game.releaseYear}
                            achievements={game.achievements}
                            layout={viewMode}
                        />
                    ))}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem',
                    color: 'var(--text-muted)',
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--radius-md)'
                }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Colección Vacía</h3>
                    <p>Visita /api/seed para cargar datos de prueba o añade juegos manualmente.</p>
                </div>
            )}
        </div>
    );
}
