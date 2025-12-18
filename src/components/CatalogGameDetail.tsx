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
    catalogGenres?: string | null;
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
    progress?: number;
    playtimeMinutes?: number;
    reviews: any[];
}

interface Props {
    id: string;
    variant?: 'catalog' | 'library';
    onClose?: () => void;
    onCloseRedirect?: string;
}

export default function CatalogGameDetail({ id, variant = 'catalog', onClose, onCloseRedirect }: Props) {
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
        if (!onClose && !onCloseRedirect) return; // Not a modal

        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.body.style.paddingRight = `${scrollbarWidth}px`;

        return () => {
            document.body.style.overflow = "auto";
            document.documentElement.style.overflow = "auto";
            document.body.style.paddingRight = "0px";
        };
    }, [onClose, onCloseRedirect]);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const endpoint = variant === 'library' ? `/api/games/${id}` : `/api/catalog/${id}`;
                const res = await fetch(endpoint);
                if (res.ok) {
                    const data = await res.json();
                    setGame(data);
                    if (data.platforms?.length > 0) {
                        setSelectedPlatform(data.platform || data.platforms[0]);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id, variant]);

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
                router.push("/login?callback=" + encodeURIComponent(window.location.pathname + window.location.search));
                return;
            }

            if (res.ok) {
                const newGame = await res.json();
                if (onClose || onCloseRedirect) handleClose();
                router.push(`/game/${newGame.id}`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAdding(false);
        }
    };

    if (loading) return (
        <div style={{ padding: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
            <div className="loader">Cargando detalles...</div>
        </div>
    );

    if (!game) return <div style={{ padding: '4rem', textAlign: 'center' }}>Juego no encontrado</div>;

    const mainScreenshot = game.screenshots?.[0] || game.coverUrl;
    const isModal = !!onClose || !!onCloseRedirect;

    const containerStyle: React.CSSProperties = isModal ? {
        position: 'fixed', inset: 0, zIndex: 900,
        display: 'flex', justifyContent: 'center',
        overflowY: 'auto', padding: '2rem 1rem',
        backdropFilter: 'blur(10px)',
        background: 'rgba(0,0,0,0.4)'
    } : {
        position: 'relative', minHeight: '100vh', padding: '2rem 1rem'
    };

    return (
        <div style={containerStyle} onClick={(e) => isModal && e.target === e.currentTarget && handleClose()}>
            {/* Background Blur Hero */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: -1,
                backgroundImage: `url(${mainScreenshot})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(40px) brightness(0.25)',
                transform: 'scale(1.1)'
            }} />

            <div className={isModal ? "glass-panel" : ""} style={{
                width: '100%', maxWidth: '1100px',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                background: isModal ? 'rgba(20, 20, 25, 0.85)' : 'transparent',
                border: isModal ? '1px solid rgba(255,255,255,0.1)' : 'none',
                height: 'fit-content',
                boxShadow: isModal ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : 'none',
                margin: '0 auto'
            }}>
                {/* Hero section */}
                <div style={{ position: 'relative', height: '400px', borderRadius: isModal ? '0' : 'var(--radius-xl)', overflow: 'hidden' }}>
                    <Image
                        src={mainScreenshot || ""}
                        alt="Hero" fill
                        style={{ objectFit: 'cover' }}
                        priority
                    />
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to bottom, transparent, rgba(5, 5, 5, 1))'
                    }} />

                    {isModal && (
                        <button onClick={handleClose} style={{
                            position: 'absolute', top: '1.5rem', right: '1.5rem',
                            background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white',
                            width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', zIndex: 10
                        }}>✕</button>
                    )}
                </div>

                <div style={{ padding: '0 2rem 3rem', marginTop: '-150px', position: 'relative', zIndex: 2 }}>
                    <div className="game-header-grid" style={{ display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: '2.5rem', alignItems: 'flex-end' }}>
                        {/* Cover Column */}
                        <div style={{ flexShrink: 0 }}>
                            <div style={{
                                width: '240px', height: '340px', position: 'relative',
                                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <Image src={game.coverUrl || ""} alt="Cover" fill style={{ objectFit: 'cover' }} />
                            </div>
                        </div>

                        {/* Center Info */}
                        <div style={{ paddingBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                                {(game.platforms || []).slice(0, 3).map(p => (
                                    <span key={p} style={{
                                        background: 'rgba(255,255,255,0.1)', padding: '2px 10px',
                                        borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600,
                                        color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)'
                                    }}>{p}</span>
                                ))}
                            </div>
                            <h1 style={{ fontSize: '3.5rem', fontWeight: 900, color: 'white', marginBottom: '0.5rem', textShadow: '0 4px 20px rgba(0,0,0,0.6)', lineHeight: 1.1 }}>
                                {game.title}
                            </h1>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)' }}>
                                <span style={{ fontWeight: 600 }}>{game.releaseYear}</span>
                                <span>•</span>
                                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{game.developer}</span>
                                {game.metacriticScore && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>•</span>
                                        <span style={{
                                            background: game.metacriticScore >= 80 ? '#4caf50' : game.metacriticScore >= 60 ? '#ffb300' : '#f44336',
                                            color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '0.9rem'
                                        }}>
                                            {game.metacriticScore}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions Sidebar */}
                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: '1.5rem', borderRadius: 'var(--radius-lg)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', flexDirection: 'column', gap: '1rem',
                            backdropFilter: 'blur(10px)'
                        }}>
                            {variant === 'library' || game.inLibrary ? (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '1px' }}>EN TU BIBLIOTECA</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{(game.userGameStatus || 'Completado').toUpperCase()}</div>
                                    {variant === 'catalog' && (
                                        <Link href={`/game/${game.userGameId}`} className="btn-primary" style={{ display: 'block', marginTop: '1rem', textDecoration: 'none' }}>
                                            Ver mi Progreso
                                        </Link>
                                    )}
                                    {variant === 'library' && (
                                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{game.progress || 0}%</div>
                                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${game.progress || 0}%`, background: 'var(--primary)' }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ width: '100%', padding: '1.2rem', fontWeight: 800, fontSize: '1rem' }}>
                                    + AÑADIR A COLECCIÓN
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Main Content Sections */}
                    <div className="game-content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '4rem', marginTop: '4rem' }}>
                        <div>
                            {variant === 'library' && (
                                <section style={{ marginBottom: '4rem' }}>
                                    <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--primary-low)' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Tiempo de Juego</div>
                                                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{Math.floor((game.playtimeMinutes || 0) / 60)}h {(game.playtimeMinutes || 0) % 60}m</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Estado Colección</div>
                                                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>{game.userGameStatus}</div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            <section style={{ marginBottom: '4rem' }}>
                                <h3 style={{ color: 'white', fontSize: '1.6rem', marginBottom: '1.5rem', fontWeight: 800 }}>Sobre el juego</h3>
                                <div style={{ fontSize: '1.15rem', lineHeight: 1.9, color: 'rgba(255,255,255,0.7)', textAlign: 'justify' }}
                                    dangerouslySetInnerHTML={{ __html: game.description || "" }} />
                            </section>

                            {/* Versions / Remakes */}
                            {(game.versions || []).length > 0 && (
                                <section style={{ marginBottom: '4rem' }}>
                                    <h3 style={{ color: 'white', fontSize: '1.3rem', marginBottom: '1.5rem', opacity: 0.9, fontWeight: 700 }}>Otras Versiones y Ediciones</h3>
                                    <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                                        {game.versions.map(v => (
                                            <Link key={v.id} href={`/catalog/${v.id}`} className="hover-scale" style={{ width: '130px', flexShrink: 0, textDecoration: 'none' }}>
                                                <div style={{ aspectRatio: '3/4', position: 'relative', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <Image src={v.coverUrl || ""} alt={v.title} fill style={{ objectFit: 'cover' }} />
                                                    <div style={{ position: 'absolute', top: 5, right: 5, background: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 800 }}>{v.type}</div>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{v.releaseYear}</div>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Screenshots */}
                            {(game.screenshots || []).length > 0 && (
                                <section style={{ marginBottom: '4rem' }}>
                                    <h3 style={{ color: 'white', fontSize: '1.3rem', marginBottom: '1.5rem', opacity: 0.9, fontWeight: 700 }}>Galería</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                        {game.screenshots.map((s, i) => (
                                            <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', height: '180px', position: 'relative' }} onClick={() => setSelectedImage(i)}>
                                                <Image src={s} alt="screenshot" fill style={{ objectFit: 'cover' }} className="hover-scale" />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Library bitácora if in library mode */}
                            {variant === 'library' && (
                                <section style={{ marginBottom: '4rem' }}>
                                    <h3 style={{ color: 'white', fontSize: '1.6rem', marginBottom: '1.5rem', fontWeight: 800 }}>Tu Bitácora</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>Gestiona tus comentarios y notas desde la página de progreso.</p>
                                    {/* We could embed the comment list here too */}
                                </section>
                            )}
                        </div>

                        {/* Right Column: Metadata & Collections */}
                        <aside>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.5rem' }}>Desarrollador</div>
                                        <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem' }}>{game.developer}</div>
                                    </div>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.5rem' }}>Editor</div>
                                        <div style={{ color: 'white', fontWeight: 600 }}>{game.publisher}</div>
                                    </div>
                                    {game.director && (
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.5rem' }}>Director</div>
                                            <div style={{ color: 'white', fontWeight: 600 }}>{game.director}</div>
                                        </div>
                                    )}
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.5rem' }}>Géneros</div>
                                        <div style={{ color: 'white', fontSize: '0.95rem', fontWeight: 500, opacity: 0.9 }}>{game.genres || game.catalogGenres}</div>
                                    </div>
                                </div>

                                {/* Saga Collection */}
                                {(game.sagaId) && (
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <h4 style={{ color: 'white', margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Colección {game.sagaName}</h4>
                                            <Link href={`/catalog?sagaId=${game.sagaId}`} style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>VER TODA</Link>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {(game.sagaGames || []).map(sg => (
                                                <Link key={sg.id} href={`/catalog/${sg.id}`} style={{ display: 'flex', gap: '1rem', textDecoration: 'none', alignItems: 'center' }} className="hover-link">
                                                    <div style={{ width: '45px', height: '60px', position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                        <Image src={sg.coverUrl || ""} alt={sg.title} fill style={{ objectFit: 'cover' }} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: 700, marginBottom: '2px' }}>{sg.title}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{sg.releaseYear}</div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* User Reviews */}
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                                    <h4 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 800 }}>Críticas de la Comunidad</h4>
                                    {(game.reviews || []).length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                            {game.reviews.map(r => (
                                                <div key={r.id} style={{ background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--primary), #813df1)', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                                                            {r.user.username[0]}
                                                        </div>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{r.user.username}</span>
                                                    </div>
                                                    <p style={{ fontSize: '0.9rem', margin: 0, color: 'rgba(255,255,255,0.65)', fontStyle: 'italic', lineHeight: 1.5 }}>"{r.content.substring(0, 120)}..."</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>No hay reseñas aún.</div>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {selectedImage !== null && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedImage(null)}>
                    <div style={{ position: 'relative', width: '90vw', height: '90vh' }}>
                        <Image src={game.screenshots[selectedImage]} alt="Gallery Large" fill style={{ objectFit: 'contain' }} />
                    </div>
                    <button style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }} onClick={() => setShowAddModal(false)}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', fontWeight: 900 }}>Añadir a mi Colección</h2>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Plataforma</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                {(game.platforms || []).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setSelectedPlatform(p)}
                                        style={{
                                            padding: '0.6rem 1.2rem', borderRadius: '10px', fontWeight: 700,
                                            border: selectedPlatform === p ? '2px solid var(--primary)' : '1px solid var(--border)',
                                            background: selectedPlatform === p ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                            color: 'white', cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '2.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Estado Inicial</label>
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                                style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontSize: '1rem', cursor: 'pointer' }}
                            >
                                <option value="unplayed">Sin Jugar</option>
                                <option value="playing">Jugando</option>
                                <option value="completed">Terminado</option>
                                <option value="backlog">En Backlog</option>
                            </select>
                        </div>

                        <button onClick={handleAddGame} disabled={adding} className="btn-primary" style={{ width: '100%', padding: '1.2rem', borderRadius: '14px', fontSize: '1.1rem', fontWeight: 800, boxShadow: '0 10px 20px -5px var(--primary-low)' }}>
                            {adding ? 'Guardando...' : 'CONFIRMAR'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
