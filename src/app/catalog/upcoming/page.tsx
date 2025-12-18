"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CatalogGameDetail from "@/components/CatalogGameDetail";

export default function UpcomingPage() {
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                // Fetch upcoming games specifically
                const res = await fetch('/api/catalog/search?sort=releaseDate&page=1');
                if (res.ok) {
                    const data = await res.json();

                    // Filter to only show future games and sort ascending
                    const now = new Date();
                    const list = data.results
                        .filter((g: any) => !g.releaseDate || new Date(g.releaseDate) >= now)
                        .sort((a: any, b: any) => {
                            if (!a.releaseDate) return 1;
                            if (!b.releaseDate) return -1;
                            return new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
                        });

                    setGames(list);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Helper to group by month
    const grouped = games.reduce((acc: any, game: any) => {
        const date = game.releaseDate ? new Date(game.releaseDate) : null;
        const key = date
            ? date.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
            : "Fecha por confirmar (TBD)";

        if (!acc[key]) acc[key] = [];
        acc[key].push(game);
        return acc;
    }, {});

    return (
        <div className="container" style={{ padding: '3rem 1rem' }}>
            <div style={{ marginBottom: '3rem' }}>
                <Link href="/" style={{ color: 'var(--primary)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
                    ← Volver a Portada
                </Link>
                <h1 className="title-gradient" style={{ fontSize: '3rem', fontWeight: 800 }}>
                    Calendario de Lanzamientos
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginTop: '0.5rem' }}>
                    Los juegos más esperados que están por llegar.
                </p>
            </div>

            {loading ? (
                <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Consultando el futuro...
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    {Object.keys(grouped).map(month => (
                        <section key={month}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                borderLeft: '4px solid var(--primary)',
                                paddingLeft: '1rem',
                                marginBottom: '1.5rem',
                                textTransform: 'capitalize'
                            }}>
                                {month}
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
                                {grouped[month].map((game: any) => (
                                    <div
                                        key={game.id}
                                        className="card game-card"
                                        onClick={() => setSelectedGameId(game.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div style={{
                                            aspectRatio: '3/4',
                                            background: `url(${game.coverUrl}) center/cover`,
                                            borderRadius: 'var(--radius-md) var(--radius-md) 0 0'
                                        }}></div>
                                        <div style={{ padding: '1rem' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{game.title}</h3>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                                                {game.releaseDate ? new Date(game.releaseDate).toLocaleDateString() : 'TBD'}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                {game.developer || 'Desarrollador desconocido'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {selectedGameId && (
                <CatalogGameDetail
                    id={selectedGameId}
                    onClose={() => setSelectedGameId(null)}
                />
            )}
        </div>
    );
}
