"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import CatalogGameDetail from "@/components/CatalogGameDetail";

export default function CatalogPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);

    // Get state from URL
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("q") || "";
    const sortBy = searchParams.get("sort") || "relevance";
    const selectedPlatform = searchParams.get("platform") || "All";
    const includeFanGames = searchParams.get("includeFanGames") === "true";
    const selectedGameId = searchParams.get("gameId");

    // Relation Filters
    const sagaId = searchParams.get("sagaId");
    const developer = searchParams.get("developer");
    const publisher = searchParams.get("publisher");

    const updateQuery = (newParams: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(newParams).forEach(([key, value]) => {
            if (value === null) params.delete(key);
            else params.set(key, value);
        });
        router.push(`/catalog?${params.toString()}`);
    };

    // Fetch games
    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const query = new URLSearchParams({
                    page: page.toString(),
                    q: search,
                    sort: sortBy,
                    platform: selectedPlatform,
                    includeFanGames: includeFanGames.toString()
                });
                if (sagaId) query.set("sagaId", sagaId);
                if (developer) query.set("developer", developer);
                if (publisher) query.set("publisher", publisher);

                const res = await fetch(`/api/catalog/search?${query.toString()}`);
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
    }, [page, search, sortBy, selectedPlatform, includeFanGames, sagaId, developer, publisher]);

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
                    onChange={(e) => updateQuery({ q: e.target.value, page: "1" })}
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

            {/* Filters Row */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {(sagaId || developer || publisher) && (
                    <button onClick={() => updateQuery({ sagaId: null, developer: null, publisher: null, page: "1" })} style={{ marginRight: 'auto' }} className="btn-secondary">
                        ✕ Limpiar Filtros Especiales
                    </button>
                )}

                {/* Platform Filter */}
                <select
                    value={selectedPlatform}
                    onChange={(e) => updateQuery({ platform: e.target.value, page: "1" })}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        maxWidth: '200px'
                    }}
                >
                    <option value="All">Todas las Plataformas</option>
                    <option value="PC">PC</option>
                    <option value="PlayStation 5">PlayStation 5</option>
                    <option value="PlayStation 4">PlayStation 4</option>
                    <option value="Switch">Nintendo Switch</option>
                    <option value="Xbox Series X">Xbox Series X</option>
                    <option value="Xbox One">Xbox One</option>
                </select>

                <select
                    value={sortBy}
                    onChange={(e) => updateQuery({ sort: e.target.value, page: "1" })}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer'
                    }}
                >
                    <option value="relevance">Relevancia (Top)</option>
                    <option value="title">Alfabético (A-Z)</option>
                    <option value="releaseDate">Fecha (Reciente)</option>
                    <option value="rating">Nota (Metacritic)</option>
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'var(--bg-subtle)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                    onClick={() => updateQuery({ includeFanGames: (!includeFanGames).toString(), page: "1" })}>
                    <input type="checkbox" checked={includeFanGames} readOnly style={{ cursor: 'pointer' }} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', userSelect: 'none' }}>Mostrar Fan Games / Hacks</span>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center' }}>
                    <div className="game-grid">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                            <div key={n} className="skeleton" style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-md)' }}></div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {sagaId && <div style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 600 }}>Mostrando juegos de la Saga</div>}
                    {developer && <div style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 600 }}>Mostrando juegos de {developer}</div>}

                    <div className="game-grid">
                        {games.map(game => (
                            <div
                                key={game.id}
                                className="card game-card"
                                style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                                onClick={() => updateQuery({ gameId: game.id })}
                            >
                                <div style={{
                                    aspectRatio: '3/4',
                                    borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {game.coverUrl && (
                                        <Image
                                            src={game.coverUrl}
                                            alt={game.title}
                                            fill
                                            sizes="(max-width: 480px) 140px, 160px"
                                            style={{ objectFit: 'cover' }}
                                            className="skeleton"
                                        />
                                    )}
                                    {(game.opencriticScore || game.metacriticScore) && (
                                        <div style={{
                                            position: 'absolute', top: 5, right: 5,
                                            background: (game.opencriticScore || game.metacriticScore) >= 75 ? '#66cc33' : (game.opencriticScore || game.metacriticScore) >= 50 ? '#ffcc33' : '#ff3333',
                                            color: 'black', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem',
                                            zIndex: 1
                                        }}>
                                            {game.opencriticScore || game.metacriticScore}
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
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '3rem', flexWrap: 'wrap' }}>
                            <button
                                className="btn-secondary"
                                disabled={page <= 1}
                                onClick={() => {
                                    updateQuery({ page: (page - 1).toString() });
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            >
                                ← Prev
                            </button>

                            {/* Page Numbers */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let p = page;
                                if (page < 3) p = 1 + i;
                                else if (page > totalPages - 2) p = totalPages - 4 + i;
                                else p = page - 2 + i;
                                if (p < 1) p = 1 + i;
                                if (p > totalPages) return null;

                                return (
                                    <button
                                        key={p}
                                        onClick={() => {
                                            updateQuery({ page: p.toString() });
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        style={{
                                            width: '40px', height: '40px',
                                            borderRadius: 'var(--radius-sm)',
                                            background: p === page ? 'var(--primary)' : 'var(--bg-subtle)',
                                            color: p === page ? 'white' : 'var(--text-main)',
                                            border: p === page ? 'none' : '1px solid var(--border)',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {p}
                                    </button>
                                );
                            })}

                            <button
                                className="btn-secondary"
                                disabled={page >= totalPages}
                                onClick={() => {
                                    updateQuery({ page: (page + 1).toString() });
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
            {/* Detail Modal */}
            {selectedGameId && (
                <CatalogGameDetail
                    id={selectedGameId}
                    onClose={() => updateQuery({ gameId: null })}
                />
            )}
        </div>
    );
}
