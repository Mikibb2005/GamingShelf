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

    // Bitácora states
    const [personalComments, setPersonalComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [deleting, setDeleting] = useState(false);

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

                    // Fetch personal comments if in library mode
                    if (variant === 'library') {
                        const resComments = await fetch(`/api/comments?gameId=${id}`);
                        if (resComments.ok) setPersonalComments(await resComments.json());
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

    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newComment,
                    gameId: id
                })
            });

            if (res.ok) {
                const savedComment = await res.json();
                setPersonalComments([savedComment, ...personalComments]);
                setNewComment("");
            }
        } catch (e) { console.error(e); }
    };

    const handleDelete = async () => {
        if (!game) return;
        if (!confirm(`¿Eliminar "${game.title}" de tu biblioteca?`)) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/games/${id}`, { method: 'DELETE' });
            if (res.ok) router.push('/library');
        } catch { alert("Error"); }
        finally { setDeleting(false); }
    };

    if (loading) return (
        <div style={{ padding: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
            <div className="loader">Cargando detalles...</div>
        </div>
    );

    if (!game) return <div style={{ padding: '4rem', textAlign: 'center' }}>Juego no encontrado</div>;

    const mainScreenshot = game.screenshots?.[0] || game.coverUrl;
    const isModal = !!onClose || !!onCloseRedirect;

    const containerStyle: React.CSSProperties = {
        position: isModal ? 'fixed' : 'relative',
        inset: isModal ? 0 : 'auto',
        zIndex: isModal ? 900 : 1,
        display: 'flex',
        justifyContent: 'center',
        overflowY: isModal ? 'auto' : 'visible',
        padding: isModal ? '2rem 1rem' : '2rem 0',
        backdropFilter: isModal ? 'blur(10px)' : 'none',
        background: isModal ? 'rgba(0,0,0,0.4)' : 'transparent',
    };

    return (
        <div style={containerStyle} onClick={(e) => isModal && e.target === e.currentTarget && handleClose()}>
            {/* Background Blur Hero */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: -1,
                backgroundImage: `url(${mainScreenshot})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(50px) brightness(0.2)',
                transform: 'scale(1.15)'
            }} />

            <div className="glass-panel" style={{
                width: '100%', maxWidth: '1100px',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                background: 'rgba(15, 15, 18, 0.85)',
                border: '1px solid rgba(255,255,255,0.08)',
                height: 'fit-content',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9)',
                margin: '0 auto',
                animation: 'fadeIn 0.5s ease-out'
            }}>
                {/* Hero section */}
                <div style={{ position: 'relative', height: '450px', overflow: 'hidden' }}>
                    <Image
                        src={mainScreenshot || ""}
                        alt="Hero" fill
                        style={{ objectFit: 'cover' }}
                        priority
                    />
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to bottom, transparent, rgba(15, 15, 18, 1))'
                    }} />

                    {isModal && (
                        <button onClick={handleClose} style={{
                            position: 'absolute', top: '1.5rem', right: '1.5rem',
                            background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white',
                            width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', zIndex: 10,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                        }}>✕</button>
                    )}
                </div>

                <div style={{ padding: '0 3rem 4rem', marginTop: '-180px', position: 'relative', zIndex: 2 }}>
                    <div className="game-header-grid" style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: '3rem', alignItems: 'flex-end' }}>
                        {/* Cover Column */}
                        <div style={{ flexShrink: 0 }}>
                            <div style={{
                                width: '260px', height: '360px', position: 'relative',
                                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                                boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
                                border: '1px solid rgba(255,255,255,0.15)'
                            }}>
                                <Image src={game.coverUrl || ""} alt="Cover" fill style={{ objectFit: 'cover' }} />
                            </div>
                        </div>

                        {/* Center Info */}
                        <div style={{ paddingBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
                                {(game.platforms || []).slice(0, 4).map(p => (
                                    <span key={p} style={{
                                        background: 'rgba(255,255,255,0.08)', padding: '4px 12px',
                                        borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                                        color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.1)'
                                    }}>{p}</span>
                                ))}
                            </div>
                            <h1 style={{ fontSize: '3.8rem', fontWeight: 900, color: 'white', marginBottom: '0.75rem', textShadow: '0 4px 30px rgba(0,0,0,0.8)', lineHeight: 1.05, letterSpacing: '-1px' }}>
                                {game.title}
                            </h1>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '1.2rem', color: 'rgba(255,255,255,0.6)' }}>
                                <span style={{ fontWeight: 700, color: 'white' }}>{game.releaseYear}</span>
                                <span style={{ opacity: 0.3 }}>•</span>
                                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{game.developer}</span>
                                {game.metacriticScore && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ opacity: 0.3 }}>•</span>
                                        <span style={{
                                            background: game.metacriticScore >= 80 ? '#4caf50' : game.metacriticScore >= 60 ? '#ffb300' : '#f44336',
                                            color: 'white', padding: '3px 10px', borderRadius: '6px', fontWeight: 900, fontSize: '0.95rem',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
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
                            padding: '1.8rem', borderRadius: 'var(--radius-xl)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            display: 'flex', flexDirection: 'column', gap: '1.2rem',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 15px 35px rgba(0,0,0,0.4)'
                        }}>
                            {variant === 'library' || game.inLibrary ? (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '0.6rem', letterSpacing: '1.5px' }}>EN TU BIBLIOTECA</div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'white' }}>{(game.userGameStatus || 'Propio').toUpperCase()}</div>

                                    {variant === 'catalog' && (
                                        <Link href={`/game/${game.userGameId}`} className="btn-primary" style={{ display: 'flex', marginTop: '1.2rem', textDecoration: 'none', width: '100%' }}>
                                            Ver mi Progreso
                                        </Link>
                                    )}

                                    {variant === 'library' && (
                                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.2rem' }}>
                                                <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>PROGRESO</span>
                                                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white' }}>{game.progress || 0}%</span>
                                            </div>
                                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${game.progress || 0}%`, background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />
                                            </div>

                                            <button
                                                onClick={handleDelete}
                                                disabled={deleting}
                                                style={{
                                                    marginTop: '1.5rem', background: 'rgba(255,80,80,0.08)', color: '#ff6b6b',
                                                    border: '1px solid rgba(255,80,80,0.2)', padding: '0.8rem', borderRadius: '10px',
                                                    fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                                                }}
                                            >
                                                {deleting ? 'ELIMINANDO...' : 'QUITAR DE BIBLIOTECA'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ width: '100%', padding: '1.4rem', fontWeight: 900, fontSize: '1.1rem', borderRadius: '14px' }}>
                                    + AÑADIR A COLECCIÓN
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Main Content Sections */}
                    <div className="game-content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '5rem', marginTop: '5rem' }}>
                        <div>
                            {variant === 'library' && (
                                <section style={{ marginBottom: '5rem' }}>
                                    <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(124, 58, 237, 0.2)', background: 'rgba(124, 58, 237, 0.03)' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Tiempo Total</div>
                                                <div style={{ fontSize: '2.4rem', fontWeight: 950, color: 'white' }}>{Math.floor((game.playtimeMinutes || 0) / 60)}<span style={{ opacity: 0.3, fontSize: '1.2rem', marginLeft: '4px' }}>h</span> {(game.playtimeMinutes || 0) % 60}<span style={{ opacity: 0.3, fontSize: '1.2rem', marginLeft: '4px' }}>m</span></div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Calificación</div>
                                                <div style={{ fontSize: '2.4rem', fontWeight: 950, color: 'var(--primary)' }}>{game.userGameRating ? `${game.userGameRating}/10` : '—'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            <section style={{ marginBottom: '5rem' }}>
                                <h3 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '2rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Acerca de</h3>
                                <div style={{ fontSize: '1.2rem', lineHeight: 2, color: 'rgba(255,255,255,0.75)', textAlign: 'justify' }}
                                    dangerouslySetInnerHTML={{ __html: game.description || "No hay descripción disponible para este título." }} />
                            </section>

                            {/* Versions / Remakes */}
                            {(game.versions || []).length > 0 && (
                                <section style={{ marginBottom: '5rem' }}>
                                    <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '2rem', fontWeight: 800 }}>Versiones Relacionadas</h3>
                                    <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1.5rem' }}>
                                        {game.versions.map(v => (
                                            <Link key={v.id} href={`/catalog/${v.id}`} className="hover-scale" style={{ width: '140px', flexShrink: 0, textDecoration: 'none' }}>
                                                <div style={{ aspectRatio: '3/4', position: 'relative', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
                                                    <Image src={v.coverUrl || ""} alt={v.title} fill style={{ objectFit: 'cover' }} />
                                                    <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--primary)', padding: '3px 8px', borderRadius: '5px', fontSize: '0.65rem', fontWeight: 900, boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{v.type}</div>
                                                </div>
                                                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{v.releaseYear}</div>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Screenshots */}
                            {(game.screenshots || []).length > 0 && (
                                <section style={{ marginBottom: '5rem' }}>
                                    <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '2rem', fontWeight: 800 }}>Capturas de pantalla</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                        {game.screenshots.map((s, i) => (
                                            <div key={i} style={{ borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', height: '200px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }} onClick={() => setSelectedImage(i)}>
                                                <Image src={s} alt="screenshot" fill style={{ objectFit: 'cover' }} className="hover-scale" />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Library bitácora if in library mode */}
                            {variant === 'library' && (
                                <section style={{ marginBottom: '5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                                        <h3 style={{ color: 'white', fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Tu Bitácora</h3>
                                        <div style={{ padding: '0.5rem 1rem', borderRadius: '20px', background: 'rgba(124, 58, 237, 0.1)', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 800 }}>{personalComments.length} ANOTACIONES</div>
                                    </div>

                                    <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '3.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="¿Algún hito hoy? ¿Algo que destacar del gameplay?"
                                            style={{
                                                width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)',
                                                borderRadius: '18px', padding: '1.5rem', color: 'white', minHeight: '140px',
                                                marginBottom: '1.5rem', resize: 'none', fontSize: '1.1rem', lineHeight: 1.7,
                                                outline: 'none', transition: 'border-color 0.2s'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <button className="btn-primary" onClick={handlePostComment} style={{ padding: '1rem 2.5rem', fontWeight: 900, fontSize: '1rem', borderRadius: '14px' }}>GUARDAR EN MI HISTORIAL</button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        {personalComments.length > 0 ? personalComments.map(c => (
                                            <div key={c.id} className="glass-panel" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '0.9rem', letterSpacing: '1px' }}>{c.user.username.toUpperCase()}</span>
                                                    <span style={{ fontSize: '0.85rem', opacity: 0.4, fontWeight: 600 }}>{new Date(c.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                </div>
                                                <p style={{ margin: 0, lineHeight: 1.8, opacity: 0.9, fontSize: '1.15rem', color: 'white' }}>{c.content}</p>
                                            </div>
                                        )) : (
                                            <div style={{ textAlign: 'center', padding: '5rem 2rem', border: '2px dashed rgba(255,255,255,0.08)', borderRadius: '30px', color: 'rgba(255,255,255,0.25)' }}>
                                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✍️</div>
                                                <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Aún no has escrito nada sobre este juego.</p>
                                                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Tus notas aparecerán aquí cronológicamente.</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Right Column: Metadata & Collections */}
                        <aside>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', position: 'sticky', top: '2rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.6rem', fontWeight: 800 }}>Desarrollador</div>
                                        <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.2rem' }}>{game.developer}</div>
                                    </div>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.6rem', fontWeight: 800 }}>Editor</div>
                                        <div style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>{game.publisher}</div>
                                    </div>
                                    {game.director && (
                                        <div style={{ marginBottom: '2rem' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.6rem', fontWeight: 800 }}>Director</div>
                                            <div style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>{game.director}</div>
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.6rem', fontWeight: 800 }}>Géneros</div>
                                        <div style={{ color: 'white', fontSize: '1rem', fontWeight: 600, opacity: 0.9, lineHeight: 1.5 }}>{game.genres || game.catalogGenres}</div>
                                    </div>
                                </div>

                                {/* Saga Collection */}
                                {(game.sagaId) && (
                                    <div style={{ background: 'rgba(124, 58, 237, 0.05)', padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(124, 58, 237, 0.15)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                            <h4 style={{ color: 'white', margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>Saga {game.sagaName}</h4>
                                            <Link href={`/catalog?sagaId=${game.sagaId}`} style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 900, letterSpacing: '1px' }}>VER TODO</Link>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                            {(game.sagaGames || []).map(sg => (
                                                <Link key={sg.id} href={`/catalog/${sg.id}`} style={{ display: 'flex', gap: '1.2rem', textDecoration: 'none', alignItems: 'center' }} className="hover-link">
                                                    <div style={{ width: '55px', height: '75px', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
                                                        <Image src={sg.coverUrl || ""} alt={sg.title} fill style={{ objectFit: 'cover' }} />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '0.95rem', color: 'white', fontWeight: 800, marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sg.title}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{sg.releaseYear}</div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Community Reviews */}
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '2.5rem' }}>
                                    <h4 style={{ color: 'white', marginBottom: '2rem', fontSize: '1.3rem', fontWeight: 900 }}>Reseñas</h4>
                                    {(game.reviews || []).length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            {game.reviews.map(r => (
                                                <div key={r.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '1rem' }}>
                                                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--primary), #ab83f7)', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, color: 'white' }}>
                                                            {r.user.username[0].toUpperCase()}
                                                        </div>
                                                        <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{r.user.username}</span>
                                                    </div>
                                                    <p style={{ fontSize: '1rem', margin: 0, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', lineHeight: 1.6 }}>"{r.content.substring(0, 140)}..."</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '1rem', textAlign: 'center', padding: '2rem', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '20px' }}>No hay reseñas aún.</div>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {selectedImage !== null && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(20px)' }} onClick={() => setSelectedImage(null)}>
                    <div style={{ position: 'relative', width: '85vw', height: '85vh' }}>
                        <Image src={game.screenshots[selectedImage]} alt="Gallery Large" fill style={{ objectFit: 'contain' }} />
                    </div>
                    <button style={{ position: 'absolute', top: '2.5rem', right: '2.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
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
