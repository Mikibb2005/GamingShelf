"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface GameDetails {
    id: string;
    title: string;
    coverUrl: string | null;
    description: string | null;
    developer: string | null;
    publisher: string | null;
    releaseYear: number | null;
    metacriticScore: number | null; // Mapped from opencriticScore
    genres: string | null;
    platforms: string[];
    screenshots: string[];
}

export default function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();

    const [game, setGame] = useState<GameDetails | null>(null);
    const [loading, setLoading] = useState(true);

    // Add Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState("");
    const [ownership, setOwnership] = useState("owned"); // wishlist | owned
    const [status, setStatus] = useState("unplayed");
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/catalog/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setGame({
                        ...data,
                        // Use scraped Metacritic score (opencriticScore)
                        metacriticScore: data.opencriticScore && data.opencriticScore > 0 ? data.opencriticScore : null
                    });
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    const handleAddGame = async () => {
        if (!game || !selectedPlatform) return;

        setAdding(true);
        try {
            const res = await fetch("/api/games", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceId: `catalog-${game.id}`,
                    source: "Catalog",
                    title: game.title,
                    platform: selectedPlatform,
                    coverUrl: game.coverUrl,
                    releaseYear: game.releaseYear,
                    genres: game.genres || "",
                    ownership: ownership,
                    status: ownership === "wishlist" ? "wishlist" : status
                })
            });

            if (res.ok) {
                const newGame = await res.json();
                router.push(`/game/${newGame.id}`);
            } else {
                alert("Error al añadir juego");
            }
        } catch (e) {
            alert("Error de conexión");
        } finally {
            setAdding(false);
        }
    };

    if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Cargando ficha...</div>;
    if (!game) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Juego no encontrado</div>;

    const bgStyle = {
        position: 'relative' as const,
        height: '250px',
        overflow: 'hidden',
        background: `linear-gradient(to bottom, rgba(0,0,0,0.3), var(--bg-main)), url(${game.screenshots[0] || game.coverUrl}) center/cover no-repeat`,
        borderRadius: 'var(--radius-lg)',
        marginBottom: '-100px' // Overlap
    };

    return (
        <div className="container" style={{ padding: '0 1rem 2rem' }}>
            {/* Hero */}
            <div style={bgStyle}>
                <button
                    onClick={() => router.back()}
                    style={{
                        position: 'absolute', top: '20px', left: '20px', zIndex: 10,
                        background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white',
                        cursor: 'pointer', fontSize: '0.9rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '8px 16px', borderRadius: '20px',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    ← Volver
                </button>
            </div>

            <div style={{ padding: '0 2rem', position: 'relative', display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                {/* Cover */}
                <div style={{ flexShrink: 0 }}>
                    <img
                        src={game.coverUrl || "/placeholder.jpg"}
                        alt="Cover"
                        style={{
                            width: '200px',
                            height: '300px',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-lg)',
                            border: '4px solid var(--bg-card)'
                        }}
                    />
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{game.title}</h1>
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', alignItems: 'center' }}>
                        <span>{game.releaseYear}</span>
                        <span>•</span>
                        <span>{game.developer}</span>
                        <span style={{
                            background: game.metacriticScore
                                ? (game.metacriticScore >= 75 ? '#66cc33' : game.metacriticScore >= 50 ? '#ffcc33' : '#ff3333')
                                : '#666',
                            color: game.metacriticScore ? 'black' : '#aaa',
                            fontWeight: 700, padding: '2px 8px', borderRadius: '4px'
                        }}>
                            {game.metacriticScore || '-'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-primary"
                            style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}
                        >
                            + Añadir a mi Colección
                        </button>
                    </div>

                    {/* Genres & Platforms */}
                    <div style={{ marginBottom: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <div style={{ marginBottom: '0.5rem' }}><strong>Generos:</strong> {game.genres}</div>
                        <div><strong>Plataformas:</strong> {game.platforms.join(", ")}</div>
                    </div>

                    {/* Description */}
                    {game.description && (
                        <div style={{ lineHeight: 1.6, maxWidth: '800px', background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Sinopsis</h3>
                            <p>{game.description}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Screenshots Grid */}
            {game.screenshots.length > 0 && (
                <div style={{ marginTop: '4rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Galería</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {game.screenshots.map((s, i) => (
                            <img
                                key={i}
                                src={s}
                                alt=""
                                style={{ width: '100%', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                                onClick={() => window.open(s, '_blank')}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ background: 'var(--bg-main)', padding: '2rem', borderRadius: 'var(--radius-md)', width: '90%', maxWidth: '500px', border: '1px solid var(--border)' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Añadir Juego</h2>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Plataforma</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {game.platforms.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setSelectedPlatform(p)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: 'var(--radius-sm)',
                                            border: selectedPlatform === p ? '2px solid var(--primary)' : '1px solid var(--border)',
                                            background: selectedPlatform === p ? 'var(--primary)' : 'transparent',
                                            color: selectedPlatform === p ? 'white' : 'var(--text-main)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Ownership Toggle */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tipo</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setOwnership("wishlist")}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        border: ownership === "wishlist" ? '2px solid var(--primary)' : '1px solid var(--border)',
                                        background: ownership === "wishlist" ? 'var(--primary)' : 'transparent',
                                        color: ownership === "wishlist" ? 'white' : 'var(--text-main)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ❤️ WishList
                                </button>
                                <button
                                    onClick={() => setOwnership("owned")}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        border: ownership === "owned" ? '2px solid var(--primary)' : '1px solid var(--border)',
                                        background: ownership === "owned" ? 'var(--primary)' : 'transparent',
                                        color: ownership === "owned" ? 'white' : 'var(--text-main)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ✅ Lo Tengo
                                </button>
                            </div>
                        </div>

                        {/* Status (only if owned) */}
                        {ownership === "owned" && (
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Estado</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', color: 'white', border: '1px solid var(--border)' }}
                                >
                                    <option value="unplayed">Sin Jugar</option>
                                    <option value="playing">Jugando</option>
                                    <option value="paused">Pausado</option>
                                    <option value="completed">Terminado</option>
                                    <option value="dropped">Abandonado</option>
                                    <option value="platinum">Platinando (100%)</option>
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                            <button onClick={handleAddGame} className="btn-primary" disabled={!selectedPlatform || adding}>
                                {adding ? 'Guardando...' : 'Guardar en Colección'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
