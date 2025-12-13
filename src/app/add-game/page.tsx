"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SearchResult {
    id: string;
    slug: string;
    title: string;
    coverUrl: string | null;
    releaseYear: number | null;
    metacritic: number | null;
    platforms: string[];
    genres: string | null;
    screenshots: string[];
    developer: string | null;
    description: string | null;
}

export default function AddGamePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedGame, setSelectedGame] = useState<SearchResult | null>(null);
    const [selectedPlatform, setSelectedPlatform] = useState("");
    const [adding, setAdding] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setResults([]);
        setSelectedGame(null);

        try {
            const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data.results);
            } else {
                const err = await res.json();
                setMessage(err.error || "Error en la búsqueda");
            }
        } catch (e) {
            setMessage("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const handleAddGame = async () => {
        if (!selectedGame || !selectedPlatform) return;

        setAdding(true);
        setMessage("");

        try {
            const res = await fetch("/api/games", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceId: `catalog-${selectedGame.id}`,
                    source: "Catalog",
                    title: selectedGame.title,
                    platform: selectedPlatform,
                    coverUrl: selectedGame.coverUrl,
                    releaseYear: selectedGame.releaseYear,
                    genres: selectedGame.genres || "",
                    status: "Backlog"
                })
            });

            if (res.ok) {
                const game = await res.json();
                router.push(`/game/${game.id}`);
            } else {
                setMessage("Error al añadir el juego");
            }
        } catch (e) {
            setMessage("Error de conexión");
        } finally {
            setAdding(false);
        }
    };

    if (status === "loading") {
        return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Cargando...</div>;
    }

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '900px' }}>
            <div style={{ marginBottom: '1rem' }}>
                <Link href="/library" style={{ color: 'var(--text-muted)' }}>← Volver a la biblioteca</Link>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>
                <span className="title-gradient">Añadir Juego</span>
            </h1>

            {message && (
                <div style={{ padding: '1rem', background: 'rgba(255,0,0,0.1)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', color: 'var(--error)' }}>
                    {message}
                </div>
            )}

            {/* Search Form */}
            <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar juego por nombre..."
                        style={{
                            flex: 1,
                            padding: '1rem',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-main)',
                            fontSize: '1rem'
                        }}
                    />
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? '...' : '🔍 Buscar'}
                    </button>
                </div>
            </form>

            {/* Selected Game Details */}
            {selectedGame && (
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        {selectedGame.coverUrl && (
                            <img
                                src={selectedGame.coverUrl}
                                alt={selectedGame.title}
                                style={{ width: '150px', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                            />
                        )}
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{selectedGame.title}</h2>
                            <div style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                {selectedGame.releaseYear && <span>{selectedGame.releaseYear} · </span>}
                                {selectedGame.genres || ""}
                            </div>

                            {/* Platform Selection */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Selecciona plataforma:
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {selectedGame.platforms.map(platform => (
                                        <button
                                            key={platform}
                                            type="button"
                                            onClick={() => setSelectedPlatform(platform)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: 'var(--radius-sm)',
                                                border: selectedPlatform === platform ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                background: selectedPlatform === platform ? 'var(--primary)' : 'var(--bg-subtle)',
                                                color: selectedPlatform === platform ? 'white' : 'var(--text-main)',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            {platform}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleAddGame}
                                className="btn-primary"
                                disabled={!selectedPlatform || adding}
                            >
                                {adding ? 'Añadiendo...' : '+ Añadir a mi biblioteca'}
                            </button>
                        </div>
                    </div>

                    {/* Screenshots */}
                    {selectedGame.screenshots.length > 0 && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Screenshots:</div>
                            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                {selectedGame.screenshots.slice(0, 5).map((ss, i) => (
                                    <img
                                        key={i}
                                        src={ss}
                                        alt=""
                                        style={{ height: '80px', borderRadius: 'var(--radius-sm)' }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Search Results */}
            {results.length > 0 && !selectedGame && (
                <div>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Resultados ({results.length})</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                        {results.map(game => (
                            <div
                                key={game.id}
                                onClick={() => setSelectedGame(game)}
                                className="glass-panel"
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{
                                    aspectRatio: '3/4',
                                    background: game.coverUrl ? `url(${game.coverUrl}) center/cover` : 'var(--bg-subtle)',
                                    borderRadius: 'var(--radius-sm)',
                                    marginBottom: '0.5rem'
                                }} />
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{game.title}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{game.releaseYear || 'N/A'}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {loading && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Buscando juegos...
                </div>
            )}

            {!loading && results.length === 0 && query && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No se encontraron juegos. Prueba con otro término.
                </div>
            )}
        </div>
    );
}
