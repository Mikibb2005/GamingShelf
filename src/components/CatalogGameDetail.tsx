"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface GameDetails {
    id: string;
    title: string;
    coverUrl: string | null;
    description: string | null;
    developer: string | null;
    publisher: string | null;
    director: string | null;
    releaseYear: number | null;
    metacriticScore: number | null;
    genres: string | null;
    platforms: string[];
    screenshots: string[];
    sagaId: number | null;
    sagaName: string | null;
    sagaGames: any[];
    versions: any[];
    inLibrary: boolean;
    userGameId: string | null;
    userGameStatus: string | null;
    userGameRating: number | null;
    reviews: any[];
}

interface Props {
    id: string;
    onClose?: () => void;
    onCloseRedirect?: string;
}

export default function CatalogGameDetail({ id, onClose, onCloseRedirect }: Props) {
    const router = useRouter();

    const [game, setGame] = useState<GameDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState("");
    const [ownership, setOwnership] = useState("owned");
    const [status, setStatus] = useState("unplayed");
    const [selectedImage, setSelectedImage] = useState<number | null>(null);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
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
        async function load() {
            setLoading(true);
            try {
                const res = await fetch(`/api/catalog/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setGame(data);
                    if (data.platforms?.length > 0) setSelectedPlatform(data.platforms[0]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    const handleClose = () => {
        if (onCloseRedirect) {
            router.push(onCloseRedirect);
        } else if (onClose) {
            onClose();
        }
    };

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

            if (res.status === 401) {
                // User is not logged in, redirect to login
                router.push("/login?callback=" + encodeURIComponent(window.location.pathname + window.location.search));
                return;
            }

            if (res.ok) {
                const newGame = await res.json();
                handleClose();
                router.push(`/game/${newGame.id}`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAdding(false);
        }
    };

    if (loading) return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="loader">Cargando detalles...</div>
        </div>
    );

    if (!game) return null;

    const mainScreenshot = game.screenshots[0] || game.coverUrl;

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 900,
                display: 'flex', justifyContent: 'center',
                overflowY: 'auto', padding: '2rem 1rem',
                backdropFilter: 'blur(10px)',
                background: 'rgba(0,0,0,0.4)'
            }}
            onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
            {/* Background Blur Hero */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: -1,
                backgroundImage: `url(${mainScreenshot})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(40px) brightness(0.3)',
                transform: 'scale(1.1)'
            }} />

            <div className="glass-panel" style={{
                width: '100%', maxWidth: '1100px',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                background: 'rgba(20, 20, 25, 0.85)',
                border: '1px solid rgba(255,255,255,0.1)',
                height: 'fit-content',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            }}>
                {/* Hero section */}
                <div style={{ position: 'relative', height: '350px' }}>
                    <Image
                        src={mainScreenshot || ""}
                        alt="Hero" fill
                        style={{ objectFit: 'cover' }}
                        priority
                    />
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to bottom, transparent, rgba(20, 20, 25, 1))'
                    }} />

                    <button onClick={handleClose} style={{
                        position: 'absolute', top: '1.5rem', right: '1.5rem',
                        background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white',
                        width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer'
                    }}>✕</button>
                </div>

                <div style={{ padding: '0 2rem 3rem', marginTop: '-120px', position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 280px', gap: '2.5rem', alignItems: 'flex-end' }}>
                        {/* Cover Column */}
                        <div style={{ flexShrink: 0 }}>
                            <div style={{
                                width: '220px', height: '310px', position: 'relative',
                                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                                boxShadow: '0 20px 30px rgba(0,0,0,0.5)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <Image src={game.coverUrl || ""} alt="Cover" fill style={{ objectFit: 'cover' }} />
                            </div>
                        </div>

                        {/* Center Info */}
                        <div style={{ paddingBottom: '1rem' }}>
                            <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'white', marginBottom: '0.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                                {game.title}
                            </h1>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)' }}>
                                <span>{game.releaseYear}</span>
                                <span>•</span>
                                <span className="hover-link" style={{ color: 'var(--primary)', cursor: 'pointer' }}>{game.developer}</span>
                                {game.metacriticScore && (
                                    <span style={{
                                        background: game.metacriticScore >= 80 ? '#4caf50' : game.metacriticScore >= 60 ? '#ffb300' : '#f44336',
                                        color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 800
                                    }}>
                                        {game.metacriticScore}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions Sidebar */}
                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: '1.5rem', borderRadius: 'var(--radius-lg)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', flexDirection: 'column', gap: '1rem'
                        }}>
                            {game.inLibrary ? (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.5rem' }}>EN TU BIBLIOTECA</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{game.userGameStatus?.toUpperCase()}</div>
                                    <Link href={`/game/${game.userGameId}`} className="btn-primary" style={{ display: 'block', marginTop: '1rem', textDecoration: 'none' }}>
                                        Ir a mi Página
                                    </Link>
                                </div>
                            ) : (
                                <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ width: '100%', padding: '1rem' }}>
                                    + Añadir a Colección
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Main Content Sections */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '3rem', marginTop: '3rem' }}>
                        <div>
                            <section style={{ marginBottom: '3rem' }}>
                                <h3 style={{ color: 'white', fontSize: '1.4rem', marginBottom: '1rem' }}>Sobre el juego</h3>
                                <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.8)', textAlign: 'justify' }}>
                                    {game.description}
                                </p>
                            </section>

                            {/* Versions / Remakes */}
                            {game.versions?.length > 0 && (
                                <section style={{ marginBottom: '3rem' }}>
                                    <h3 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '1rem', opacity: 0.8 }}>Otras Versiones y Ediciones</h3>
                                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                                        {game.versions.map(v => (
                                            <Link key={v.id} href={`/catalog?gameId=${v.id}`} className="hover-scale" style={{ width: '120px', flexShrink: 0, textDecoration: 'none' }}>
                                                <div style={{ aspectRatio: '3/4', position: 'relative', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                                                    <Image src={v.coverUrl || ""} alt={v.title} fill style={{ objectFit: 'cover' }} />
                                                </div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{v.releaseYear}</div>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Screenshots */}
                            <section style={{ marginBottom: '3rem' }}>
                                <h3 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '1.2rem', opacity: 0.8 }}>Galería</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                    {game.screenshots.map((s, i) => (
                                        <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }} onClick={() => setSelectedImage(i)}>
                                            <img src={s} alt="screenshot" style={{ width: '100%', height: '150px', objectFit: 'cover' }} className="hover-scale" />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Metadata & Collections */}
                        <div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px' }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Desarrollador</div>
                                        <div style={{ color: 'var(--primary)', fontWeight: 600 }}>{game.developer}</div>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Editor</div>
                                        <div style={{ color: 'white' }}>{game.publisher}</div>
                                    </div>
                                    {game.director && (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Director</div>
                                            <div style={{ color: 'white' }}>{game.director}</div>
                                        </div>
                                    )}
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Géneros</div>
                                        <div style={{ color: 'white', fontSize: '0.9rem' }}>{game.genres}</div>
                                    </div>
                                </div>

                                {/* Saga Collection */}
                                {game.sagaId && (
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h4 style={{ color: 'white', margin: 0 }}>Saga {game.sagaName}</h4>
                                            <Link href={`/catalog?sagaId=${game.sagaId}`} style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}>Ver todo</Link>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {game.sagaGames.map(sg => (
                                                <Link key={sg.id} href={`/catalog?gameId=${sg.id}`} style={{ display: 'flex', gap: '0.75rem', textDecoration: 'none', alignItems: 'center' }}>
                                                    <div style={{ width: '40px', height: '55px', position: 'relative', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <Image src={sg.coverUrl || ""} alt={sg.title} fill style={{ objectFit: 'cover' }} />
                                                    </div>
                                                    <div style={{ flex: 1, fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{sg.title}</div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* User Reviews */}
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                                    <h4 style={{ color: 'white', marginBottom: '1rem' }}>Reseñas de la Comunidad</h4>
                                    {game.reviews?.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {game.reviews.map(r => (
                                                <div key={r.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {r.user.username[0]}
                                                        </div>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{r.user.username}</span>
                                                    </div>
                                                    <p style={{ fontSize: '0.85rem', margin: 0, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>"{r.content.substring(0, 100)}..."</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Nadie ha reseñando este juego aún.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {selectedImage !== null && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedImage(null)}>
                    <img src={game.screenshots[selectedImage]} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px' }} />
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddModal(false)}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem', borderRadius: '20px' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Añadir a mi Colección</h2>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.7 }}>Plataforma</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {game.platforms.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setSelectedPlatform(p)}
                                        style={{
                                            padding: '0.5rem 1rem', borderRadius: '8px',
                                            border: selectedPlatform === p ? '2px solid var(--primary)' : '1px solid var(--border)',
                                            background: selectedPlatform === p ? 'var(--primary)' : 'transparent',
                                            color: 'white', cursor: 'pointer'
                                        }}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.7 }}>Estado</label>
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border)' }}
                            >
                                <option value="unplayed">Sin Jugar</option>
                                <option value="playing">Jugando</option>
                                <option value="completed">Terminado</option>
                                <option value="backlog">En Backlog</option>
                            </select>
                        </div>

                        <button onClick={handleAddGame} disabled={adding} className="btn-primary" style={{ width: '100%', padding: '1rem' }}>
                            {adding ? 'Añadiendo...' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
