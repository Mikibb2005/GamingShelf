"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";
import CatalogGameDetail from "@/components/CatalogGameDetail";

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

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-app)' }}>
            <div className="loader">Sincronizando biblioteca...</div>
        </div>
    );

    if (!game) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Juego no encontrado</div>;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
            {/* The Unified Premium Component in 'library' mode */}
            <CatalogGameDetail id={id} variant="library" />

            {/* User-Specific Controls & Comments (Integrated below the Hero) */}
            <div className="container" style={{ position: 'relative', zIndex: 10, marginTop: '-2rem', paddingBottom: '5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '4rem' }}>
                    <div style={{ maxWidth: '710px' }}>
                        {/* Bitácora Section */}
                        <section style={{ marginTop: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Tu Bitácora</h3>
                                <Link href="/library" style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>← Volver a Biblioteca</Link>
                            </div>

                            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="¿Algún hito hoy? ¿Algo que destacar del gameplay?"
                                    style={{
                                        width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '16px', padding: '1.25rem', color: 'white', minHeight: '120px',
                                        marginBottom: '1.5rem', resize: 'none', fontSize: '1.05rem', lineHeight: 1.6
                                    }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button className="btn-primary" onClick={handlePostComment} style={{ padding: '0.8rem 2rem', fontWeight: 700 }}>Guardar en mi Historial</button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {comments.length > 0 ? comments.map(c => (
                                    <div key={c.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <span style={{ fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.5px' }}>{c.user.username}</span>
                                            <span style={{ fontSize: '0.8rem', opacity: 0.4 }}>{new Date(c.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </div>
                                        <p style={{ margin: 0, lineHeight: 1.7, opacity: 0.85, fontSize: '1.05rem' }}>{c.content}</p>
                                    </div>
                                )) : (
                                    <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '20px', color: 'rgba(255,255,255,0.2)' }}>
                                        Aún no has escrito nada sobre este juego.
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    <aside>
                        {/* Danger Zone */}
                        <div style={{ marginTop: '2rem' }}>
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
            width: '100%', padding: '1rem', background: 'rgba(255,50,50,0.05)',
            border: '1px solid rgba(255,50,50,0.2)', borderRadius: '12px', color: '#ff6666',
            fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
        }} className="hover-red">{deleting ? 'Eliminando...' : 'Eliminar de Biblioteca'}</button>
    );
}
