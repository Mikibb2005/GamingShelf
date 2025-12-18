"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface GameDetails {
    id: string;
    title: string;
    coverUrl: string | null;
    description: string | null;
    developer: string | null;
    publisher: string | null;
    releaseYear: number | null;
    metacriticScore: number | null;
    genres: string | null;
    platforms: string[];
    screenshots: string[];
}

interface Props {
    id: string;
    onClose: () => void;
}

export default function CatalogGameDetail({ id, onClose }: Props) {
    const router = useRouter();

    const [game, setGame] = useState<GameDetails | null>(null);
    const [loading, setLoading] = useState(true);

    // Add Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState("");
    const [ownership, setOwnership] = useState("owned"); // wishlist | owned
    const [status, setStatus] = useState("unplayed");
    const [selectedImage, setSelectedImage] = useState<number | null>(null);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        // Prevent body scroll and handle layout shift
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.body.style.paddingRight = `${scrollbarWidth}px`;

        return () => {
            document.body.style.overflow = "auto";
            document.documentElement.style.overflow = "auto";
            document.body.style.paddingRight = "0px";
        };
    }, []);

    useEffect(() => {
        if (selectedImage === null) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSelectedImage(null);
            if (e.key === "ArrowLeft") setSelectedImage(prev => (prev !== null && prev > 0 ? prev - 1 : prev!));
            if (e.key === "ArrowRight") setSelectedImage(prev => (prev !== null && game && prev < game.screenshots.length - 1 ? prev + 1 : prev!));
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedImage, game]);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/catalog/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setGame({
                        ...data,
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
                onClose();
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

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <>
            {/* Main Detail Modal */}
            <div
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', zIndex: 900,
                    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
                    overflowY: 'auto', padding: '2rem 1rem',
                    backdropFilter: 'blur(5px)',
                    overscrollBehavior: 'contain'
                }}
                onClick={handleBackdropClick}
            >
                <div style={{
                    background: 'var(--bg-app)',
                    width: '100%', maxWidth: '1000px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    position: 'relative',
                    minHeight: '500px',
                    marginTop: '2rem',
                    marginBottom: '2rem',
                    boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                }} onClick={e => e.stopPropagation()}>

                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: '1rem', right: '1rem',
                            zIndex: 10,
                            background: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            width: '32px', height: '32px',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.2rem'
                        }}
                    >
                        ✕
                    </button>

                    {loading ? (
                        <div style={{ padding: '4rem', textAlign: 'center' }}>Cargando ficha...</div>
                    ) : !game ? (
                        <div style={{ padding: '4rem', textAlign: 'center' }}>Juego no encontrado</div>
                    ) : (
                        <>
                            <div style={{
                                position: 'relative',
                                height: '250px',
                                overflow: 'hidden',
                                borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                            }}>
                                <Image
                                    src={game.screenshots[0] || game.coverUrl || ""}
                                    alt="Hero"
                                    fill
                                    priority
                                    style={{ objectFit: 'cover' }}
                                    className="skeleton"
                                />
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), var(--bg-app))',
                                    zIndex: 1
                                }}></div>
                            </div>

                            <div style={{ padding: '0 1.5rem 1.5rem', marginTop: '-60px', position: 'relative' }}>
                                <div style={{
                                    display: 'flex',
                                    gap: '1.5rem',
                                    alignItems: 'flex-start',
                                    flexDirection: 'row',
                                    flexWrap: 'wrap'
                                }}>

                                    <div style={{ flexShrink: 0, margin: '0 auto', position: 'relative', width: '180px', height: '260px' }}>
                                        <Image
                                            src={game.coverUrl || "/placeholder.jpg"}
                                            alt="Cover"
                                            fill
                                            sizes="180px"
                                            style={{
                                                objectFit: 'cover',
                                                borderRadius: 'var(--radius-md)',
                                                boxShadow: 'var(--shadow-lg)',
                                                border: '4px solid var(--bg-card)'
                                            }}
                                            className="skeleton"
                                        />
                                    </div>

                                    <div style={{ flex: 1, minWidth: '260px' }}>
                                        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'inherit' }}>{game.title}</h1>
                                        <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span>{game.releaseYear}</span>
                                            <span>•</span>
                                            <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.developer}</span>
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

                                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => setShowAddModal(true)}
                                                className="btn-primary"
                                                style={{ fontSize: '1rem', padding: '0.75rem 1.5rem', width: '100%', maxWidth: '300px' }}
                                            >
                                                + Añadir a mi Colección
                                            </button>
                                        </div>

                                        {game.description && (
                                            <div style={{ lineHeight: 1.6, maxWidth: '800px', background: 'var(--bg-card)', padding: '1.2rem', borderRadius: 'var(--radius-md)', fontSize: '0.95rem' }}>
                                                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>Sinopsis</h3>
                                                <p>{game.description}</p>
                                            </div>
                                        )}

                                        <div style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            <div style={{ marginBottom: '0.4rem' }}><strong>Generos:</strong> {game.genres}</div>
                                            <div><strong>Plataformas:</strong> {game.platforms.join(", ")}</div>
                                        </div>
                                    </div>
                                </div>

                                {game.screenshots.length > 0 && (
                                    <div style={{ marginTop: '3rem' }}>
                                        <h2 style={{ fontSize: '1.3rem', marginBottom: '1.2rem' }}>Galería</h2>
                                        <div className="game-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                                            {game.screenshots.map((s, i) => (
                                                <img
                                                    key={i}
                                                    src={s}
                                                    alt=""
                                                    style={{ width: '100%', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'transform 0.2s' }}
                                                    onClick={() => setSelectedImage(i)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Lightbox Modal (Outside main container to avoid backdrop-filter issues) */}
            {selectedImage !== null && game && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.95)', zIndex: 2000,
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        backdropFilter: 'none'
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        style={{
                            position: 'absolute', top: '2rem', right: '2rem', color: 'white', fontSize: '2rem', zIndex: 2010
                        }}
                    >
                        ✕
                    </button>

                    {selectedImage > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedImage(selectedImage - 1); }}
                            style={{
                                position: 'absolute', left: '2rem', color: 'white', fontSize: '3rem', zIndex: 2010,
                                background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '60px', height: '60px'
                            }}
                        >
                            ‹
                        </button>
                    )}

                    <img
                        src={game.screenshots[selectedImage]}
                        alt=""
                        style={{
                            maxHeight: '90vh', maxWidth: '90vw', objectFit: 'contain',
                            borderRadius: 'var(--radius-sm)',
                            boxShadow: '0 0 50px rgba(0,0,0,0.8)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />

                    {selectedImage < game.screenshots.length - 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedImage(selectedImage + 1); }}
                            style={{
                                position: 'absolute', right: '2rem', color: 'white', fontSize: '3rem', zIndex: 2010,
                                background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '60px', height: '60px'
                            }}
                        >
                            ›
                        </button>
                    )}

                    <div style={{
                        position: 'absolute', bottom: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem'
                    }}>
                        {selectedImage + 1} / {game.screenshots.length}
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && game && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }} onClick={(e) => { e.stopPropagation(); }}>
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
                            <button onClick={() => setShowAddModal(false)} className="btn-secondary">Cancelar</button>
                            <button onClick={handleAddGame} className="btn-primary" disabled={!selectedPlatform || adding}>
                                {adding ? 'Guardando...' : 'Guardar en Colección'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
