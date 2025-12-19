"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import GameCard from "@/components/GameCard";
import ProgressBar from "@/components/ProgressBar";
import Link from "next/link";

export default function UserLibraryPage() {
    const params = useParams();
    const username = params?.username as string;
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [platform, setPlatform] = useState("All");
    const [status, setStatus] = useState("All");

    useEffect(() => {
        async function fetchLibrary() {
            setLoading(true);
            try {
                const res = await fetch(`/api/users/${username}/library?platform=${platform}&status=${status}`);
                if (res.ok) {
                    setGames(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchLibrary();
    }, [username, platform, status]);

    if (loading && games.length === 0) return <ProgressBar />;

    return (
        <div className="container" style={{ padding: '4rem 1rem' }}>
            <header style={{ marginBottom: '3rem' }}>
                <Link href={`/profile/${username}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    ← Volver al Perfil
                </Link>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                    Biblioteca de <span className="title-gradient">{username}</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>{games.length} juegos en total</p>
            </header>

            {/* Filters */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', borderRadius: '16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>Plataforma:</span>
                        <select
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-subtle)', color: 'white', border: '1px solid var(--border)' }}
                        >
                            <option value="All">Todas</option>
                            <option value="PC">PC</option>
                            <option value="PlayStation 5">PS5</option>
                            <option value="Xbox Series X">Xbox Series X</option>
                            <option value="Switch">Switch</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>Estado:</span>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-subtle)', color: 'white', border: '1px solid var(--border)' }}
                        >
                            <option value="All">Todos</option>
                            <option value="playing">Jugando</option>
                            <option value="completed">Terminados</option>
                            <option value="unplayed">Sin jugar</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>Filtrando...</div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '2rem'
                }}>
                    {games.map(game => (
                        <GameCard
                            key={game.id}
                            id={game.id}
                            title={game.title}
                            platform={game.platform}
                            status={game.status}
                            progress={game.progress}
                            coverGradient={game.coverUrl}
                            releaseYear={game.releaseYear}
                            achievements={game.achievements ? JSON.parse(game.achievements) : undefined}
                        />
                    ))}
                </div>
            )}

            {!loading && games.length === 0 && (
                <div style={{ textAlign: 'center', padding: '6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🏜️</div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>No se encontraron juegos</h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)' }}>Intenta cambiar los filtros o vuelve más tarde.</p>
                </div>
            )}
        </div>
    );
}
