"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CatalogPage() {
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortBy, setSortBy] = useState("title");

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch games
    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const res = await fetch(`/api/catalog/search?page=${page}&q=${encodeURIComponent(debouncedSearch)}&sort=${sortBy}`);
                if (res.ok) {
                    const data = await res.json();
                    setGames(data.results);
                    setTotalPages(data.totalPages);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [page, debouncedSearch, sortBy]);

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="title-gradient" style={{ fontSize: '2.5rem', fontWeight: 800 }}>
                    Catálogo
                </h1>
                <Link href="/add-game" className="btn-primary">
                    + Añadir Juego
                </Link>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '2rem' }}>
                <input
                    type="text"
                    placeholder="Buscar juego..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }} // Reset page on search
                    style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1.2rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-main)',
                        boxShadow: 'var(--shadow-md)'
                    }}
                />
            </div>

            {/* Sort Controls */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer'
                    }}
                >
                    <option value="title">Alfabético (A-Z)</option>
                    <option value="releaseYear">Fecha (Reciente)</option>
                    <option value="metacritic">Metacritic (Mayor)</option>
                </select>
            </div>

            {/* Grid */}
            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center' }}>Cargando catálogo...</div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
                        {games.map(game => (
                            <Link href={`/catalog/${game.id}`} key={game.id} className="card game-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div style={{
                                    aspectRatio: '3/4',
                                    background: game.coverUrl ? `url(${game.coverUrl}) center/cover` : 'var(--bg-subtle)',
                                    borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                                    position: 'relative'
                                }}>
                                    {game.metacritic && (
                                        <div style={{
                                            position: 'absolute', top: 5, right: 5,
                                            background: game.metacritic >= 75 ? '#66cc33' : '#ffcc33',
                                            color: 'black', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem'
                                        }}>
                                            {game.metacritic}
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {game.title}
                                    </h3>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                        {game.releaseYear || 'N/A'}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '3rem' }}>
                        <button
                            className="btn-secondary"
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                        >
                            Anterior
                        </button>
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                            Página {page} de {totalPages}
                        </span>
                        <button
                            className="btn-secondary"
                            disabled={page >= totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            Siguiente
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
