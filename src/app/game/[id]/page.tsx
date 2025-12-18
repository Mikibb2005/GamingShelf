"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";

export default function GameDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [game, setGame] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function init() {
            try {
                const [resGame, resComments] = await Promise.all([
                    fetch(`/api/games/${id}`),
                    fetch(`/api/comments?gameId=${id}`)
                ]);

                if (resGame.ok) setGame(await resGame.json());
                if (resComments.ok) setComments(await resComments.json());

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [id]);

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
                setComments([savedComment, ...comments]);
                setNewComment("");
            }
        } catch (e) { console.error(e); }
    };

    if (loading) return <ProgressBar />;
    if (!game) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Juego no encontrado</div>;

    const mainScreenshot = game.screenshots?.[0] || game.coverUrl;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-app)', color: 'white' }}>
            {/* Background Blur Hero */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0,
                backgroundImage: `url(${mainScreenshot})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(40px) brightness(0.25)',
                transform: 'scale(1.1)'
            }} />

            <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '3rem', paddingBottom: '5rem' }}>
                {/* Header Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 300px', gap: '3rem', alignItems: 'flex-end', marginBottom: '3rem' }}>
                    <div style={{
                        width: '220px', height: '310px', position: 'relative',
                        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <Image src={game.coverUrl || ""} alt="Cover" fill style={{ objectFit: 'cover' }} />
                    </div>

                    <div style={{ paddingBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <span style={{
                                background: 'var(--primary)', padding: '4px 12px',
                                borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700,
                                textTransform: 'uppercase'
                            }}>{game.platform}</span>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{game.releaseYear}</span>
                        </div>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1rem', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                            {game.title}
                        </h1>
                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Estado</span>
                                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>{game.status?.toUpperCase()}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Progreso</span>
                                <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{game.progress}%</span>
                            </div>
                            {game.metacriticScore && (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Crítica</span>
                                    <span style={{
                                        color: game.metacriticScore >= 80 ? '#4caf50' : '#ffb300',
                                        fontSize: '1.2rem', fontWeight: 800
                                    }}>{game.metacriticScore}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Link href="/library" style={{
                            padding: '1rem', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            textAlign: 'center', color: 'white', textDecoration: 'none',
                            fontWeight: 600
                        }}>← Volver a Biblioteca</Link>
                    </div>
                </div>

                {/* Grid Content */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem' }}>
                    <div>
                        {/* Progress Bar Visual */}
                        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem', borderRadius: 'var(--radius-xl)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Tu Progreso</h3>
                                <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.5rem' }}>{game.progress}%</span>
                            </div>
                            <div style={{ height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${game.progress}%`, background: 'var(--primary)', boxShadow: '0 0 20px var(--primary)' }} />
                            </div>
                        </div>

                        {/* Description */}
                        {game.description && (
                            <section style={{ marginBottom: '4rem' }}>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', opacity: 0.9 }}>Sobre el juego</h3>
                                <div style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.7)', textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: game.description }} />
                            </section>
                        )}

                        {/* Comments */}
                        <section>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', opacity: 0.9 }}>Tu Bitácora y Comentarios</h3>
                            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: 'var(--radius-lg)' }}>
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="¿Qué te ha parecido la sesión de hoy?"
                                    style={{
                                        width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px', padding: '1rem', color: 'white', minHeight: '100px',
                                        marginBottom: '1rem', resize: 'none'
                                    }}
                                />
                                <div style={{ textAlign: 'right' }}>
                                    <button className="btn-primary" onClick={handlePostComment}>Guardar Comentario</button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {comments.map(c => (
                                    <div key={c.id} className="glass-panel" style={{ padding: '1.2rem', borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{c.user.username}</span>
                                            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p style={{ margin: 0, lineHeight: 1.6, opacity: 0.9 }}>{c.content}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
                            <h4 style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '1px' }}>Estadísticas</h4>

                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{Math.floor((game.playtimeMinutes || 0) / 60)}h {(game.playtimeMinutes || 0) % 60}m</div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.5 }}>Tiempo total de juego</div>
                            </div>

                            {game.achievements && (
                                <div style={{ marginBottom: '2rem' }}>
                                    {(() => {
                                        try {
                                            const a = (typeof game.achievements === 'string') ? JSON.parse(game.achievements) : game.achievements;
                                            return (
                                                <>
                                                    <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>🏆 {a.unlocked}/{a.total}</div>
                                                    <div style={{ fontSize: '0.9rem', opacity: 0.5 }}>Logros obtenidos</div>
                                                </>
                                            );
                                        } catch { return null; }
                                    })()}
                                </div>
                            )}

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.4 }}>DESARROLLADOR</div>
                                    <div style={{ fontWeight: 600 }}>{game.developer}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.4 }}>GENEROS</div>
                                    <div style={{ fontSize: '0.9rem' }}>{game.catalogGenres}</div>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div style={{
                            padding: '1.5rem', borderRadius: '12px',
                            background: 'rgba(255,50,50,0.05)', border: '1px solid rgba(255,50,50,0.2)'
                        }}>
                            <DeleteGameButton gameId={id} title={game.title} />
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

function DeleteGameButton({ gameId, title }: { gameId: string; title: string }) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const handleDelete = async () => {
        if (!confirm(`¿Eliminar "${title}" de tu biblioteca?`)) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/games/${gameId}`, { method: 'DELETE' });
            if (res.ok) router.push('/library');
        } catch { alert("Error"); }
        finally { setDeleting(false); }
    };
    return (
        <button onClick={handleDelete} disabled={deleting} style={{
            width: '100%', padding: '0.8rem', background: 'transparent',
            border: '1px solid #ff4444', borderRadius: '8px', color: '#ff4444',
            fontWeight: 700, cursor: 'pointer'
        }}>{deleting ? '...' : 'Eliminar de biblioteca'}</button>
    );
}
