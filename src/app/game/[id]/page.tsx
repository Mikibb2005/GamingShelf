"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function GameDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const [game, setGame] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);

    // Load Game & Comments
    useEffect(() => {
        async function init() {
            try {
                const [resGame, resComments] = await Promise.all([
                    fetch(`/api/games/${params.id}`),
                    fetch(`/api/comments?gameId=${params.id}`)
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
    }, [params.id]);

    const handlePostComment = async () => {
        if (!newComment.trim()) return;

        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newComment,
                    gameId: params.id,
                    username: 'Miki' // Mock Auth
                })
            });

            if (res.ok) {
                const savedComment = await res.json();
                setComments([savedComment, ...comments]);
                setNewComment("");
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Cargando...</div>;
    if (!game) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Juego no encontrado</div>;

    const bgStyle = {
        background: game.coverUrl || 'var(--bg-card)',
        height: '300px',
        borderRadius: 'var(--radius-lg)',
        position: 'relative' as const,
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '2rem',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>

            {/* Hero */}
            <div style={bgStyle}>
                <div style={{
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(10px)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    maxWidth: '600px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div className="title-gradient" style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        {game.platform}
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, marginBottom: '1rem' }}>
                        {game.title}
                    </h1>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ background: 'var(--primary)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                            {game.status}
                        </span>
                        <span>{game.progress}% Completado</span>
                        <span style={{
                            background: game.metacriticScore
                                ? (game.metacriticScore >= 75 ? '#66cc33' : game.metacriticScore >= 50 ? '#ffcc33' : '#ff3333')
                                : '#666',
                            color: game.metacriticScore ? 'black' : '#aaa',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 700,
                            fontSize: '0.9rem'
                        }}>
                            {game.metacriticScore || '-'}
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                {/* Main Column: Info & Comments */}
                <div>

                    {/* Description & Screenshots */}
                    {(game.description || (game.screenshots && game.screenshots.length > 0)) && (
                        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                            {game.description && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Sobre el juego</h3>
                                    <div dangerouslySetInnerHTML={{ __html: game.description }} style={{ lineHeight: 1.6, color: 'var(--text-secondary)' }} />
                                </div>
                            )}

                            {game.screenshots && game.screenshots.length > 0 && (
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Galería</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                                        {game.screenshots.slice(0, 6).map((ss: string, i: number) => (
                                            <img
                                                key={i}
                                                src={ss}
                                                alt="Screenshot"
                                                style={{ width: '100%', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'transform 0.2s' }}
                                                onClick={() => window.open(ss, '_blank')}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Comentarios de la Comunidad</h3>

                    {/* Post Box */}
                    <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', borderColor: 'var(--border-highlight)' }}>
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Escribe tu opinión sobre el juego..."
                            style={{
                                width: '100%',
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-main)',
                                padding: '1rem',
                                borderRadius: 'var(--radius-sm)',
                                minHeight: '100px',
                                marginBottom: '1rem',
                                resize: 'none'
                            }}
                        />
                        <div style={{ textAlign: 'right' }}>
                            <button className="btn-primary" onClick={handlePostComment}>
                                Publicar Comentario
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {comments.map((c: any) => (
                            <div key={c.id} style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{c.user.username}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        {new Date(c.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <p style={{ lineHeight: 1.5 }}>{c.content}</p>
                            </div>
                        ))}
                        {comments.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Sé el primero en comentar.</p>}
                    </div>
                </div>

                {/* Sidebar: Details */}
                <div>
                    <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Detalles</h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Desarrollador</div>
                                <div>{game.developer || 'Desconocido'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lanzamiento</div>
                                <div>{game.releaseYear || 'N/A'}</div>
                            </div>

                            {/* Detailed Info from Catalog */}
                            {game.developer && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Desarrollador</div>
                                    <div>{game.developer}</div>
                                </div>
                            )}
                            {game.publisher && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Publisher</div>
                                    <div>{game.publisher}</div>
                                </div>
                            )}
                            {game.metacritic && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Metacritic</div>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: 'var(--radius-sm)',
                                        background: game.metacritic >= 75 ? '#66cc33' : game.metacritic >= 50 ? '#ffcc33' : '#ff3333',
                                        color: 'black',
                                        fontWeight: 700
                                    }}>
                                        {game.metacritic}
                                    </span>
                                </div>
                            )}
                            {game.catalogGenres && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Géneros</div>
                                    <div>{game.catalogGenres}</div>
                                </div>
                            )}

                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fuente</div>
                                <div style={{ textTransform: 'capitalize' }}>{game.source}</div>
                            </div>
                        </div>
                    </div>

                    {/* Playtime Card */}
                    <PlaytimeCard gameId={id} initialMinutes={game.playtimeMinutes || 0} />

                    {/* Dates Card */}
                    <DatesCard gameId={id} startedAt={game.startedAt} finishedAt={game.finishedAt} />

                    {/* Achievements Card */}
                    {game.achievements && <AchievementsCard achievements={game.achievements} />}

                    {/* Danger Zone */}
                    <div className="card" style={{ padding: '1.5rem', marginTop: '1rem', border: '1px solid rgba(255,50,50,0.2)' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--error)' }}>
                            Zona de Peligro
                        </h4>
                        <DeleteGameButton gameId={id} title={game.title} />
                    </div>
                </div>

            </div>
        </div>
    );
}

function DeleteGameButton({ gameId, title }: { gameId: string; title: string }) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`¿Estás seguro de que quieres eliminar "${title}" de tu biblioteca? Esta acción no se puede deshacer.`)) {
            return;
        }

        setDeleting(true);
        try {
            const res = await fetch(`/api/games/${gameId}`, { method: 'DELETE' });
            if (res.ok) {
                router.push('/library');
            } else {
                alert("Error al eliminar el juego");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 50, 50, 0.1)',
                border: '1px solid var(--error)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--error)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--error)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 50, 50, 0.1)'}
            onMouseDown={(e) => e.currentTarget.style.background = 'darkred'}
        >
            {deleting ? 'Eliminando...' : '🗑️ Eliminar de la Biblioteca'}
        </button>
    );
}

function PlaytimeCard({ gameId, initialMinutes }: { gameId: string; initialMinutes: number }) {
    const [minutes, setMinutes] = useState(initialMinutes);
    const [editing, setEditing] = useState(false);
    const [inputHours, setInputHours] = useState(String(Math.floor(initialMinutes / 60)));
    const [inputMins, setInputMins] = useState(String(initialMinutes % 60));
    const [saving, setSaving] = useState(false);

    const formatPlaytime = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const handleSave = async () => {
        setSaving(true);
        const totalMinutes = (parseInt(inputHours) || 0) * 60 + (parseInt(inputMins) || 0);

        try {
            const res = await fetch(`/api/games/${gameId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playtimeMinutes: totalMinutes })
            });

            if (res.ok) {
                setMinutes(totalMinutes);
                setEditing(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="card" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                ⏱️ Tiempo de Juego
            </h4>

            {!editing ? (
                <div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                        {formatPlaytime(minutes)}
                    </div>
                    <button
                        onClick={() => setEditing(true)}
                        style={{
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer'
                        }}
                    >
                        ✏️ Editar
                    </button>
                </div>
            ) : (
                <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Horas</label>
                            <input
                                type="number"
                                min="0"
                                value={inputHours}
                                onChange={(e) => setInputHours(e.target.value)}
                                style={{
                                    width: '70px',
                                    padding: '0.5rem',
                                    background: 'var(--bg-subtle)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--text-main)',
                                    textAlign: 'center'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Min</label>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                value={inputMins}
                                onChange={(e) => setInputMins(e.target.value)}
                                style={{
                                    width: '70px',
                                    padding: '0.5rem',
                                    background: 'var(--bg-subtle)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--text-main)',
                                    textAlign: 'center'
                                }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? '...' : 'Guardar'}
                        </button>
                        <button onClick={() => setEditing(false)} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function AchievementsCard({ achievements }: { achievements: string }) {
    const [expanded, setExpanded] = useState(false);

    let data: { unlocked: number; total: number; list?: any[] } = { unlocked: 0, total: 0 };
    try {
        data = JSON.parse(achievements);
    } catch {
        return null;
    }

    const percentage = data.total > 0 ? Math.round((data.unlocked / data.total) * 100) : 0;

    return (
        <div className="card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                🏆 Logros
            </h4>

            {/* Progress */}
            <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{data.unlocked}/{data.total}</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{percentage}%</span>
                </div>
                <div style={{
                    height: '8px',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${percentage}%`,
                        background: 'linear-gradient(90deg, var(--primary), #ffd700)',
                        borderRadius: 'var(--radius-full)'
                    }} />
                </div>
            </div>

            {/* Achievement List */}
            {data.list && data.list.length > 0 && (
                <>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        style={{
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            width: '100%',
                            marginBottom: expanded ? '1rem' : 0
                        }}
                    >
                        {expanded ? '▲ Ocultar lista' : '▼ Ver todos los logros'}
                    </button>

                    {expanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                            {data.list.map((ach: any, i: number) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.5rem',
                                        background: ach.unlocked ? 'rgba(0,255,0,0.05)' : 'var(--bg-subtle)',
                                        borderRadius: 'var(--radius-sm)',
                                        border: `1px solid ${ach.unlocked ? 'var(--success)' : 'var(--border)'}`
                                    }}
                                >
                                    {ach.icon && (
                                        <img
                                            src={ach.icon}
                                            alt=""
                                            style={{ width: '32px', height: '32px', borderRadius: '4px', opacity: ach.unlocked ? 1 : 0.5 }}
                                        />
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontWeight: 600,
                                            fontSize: '0.85rem',
                                            opacity: ach.unlocked ? 1 : 0.6
                                        }}>
                                            {ach.unlocked ? '✓ ' : ''}{ach.title}
                                        </div>
                                        {ach.description && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {ach.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function DatesCard({ gameId, startedAt, finishedAt }: { gameId: string; startedAt: string | null; finishedAt: string | null }) {
    const [start, setStart] = useState(startedAt ? new Date(startedAt).toISOString().split('T')[0] : '');
    const [finish, setFinish] = useState(finishedAt ? new Date(finishedAt).toISOString().split('T')[0] : '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(`/api/games/${gameId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startedAt: start || null,
                    finishedAt: finish || null
                })
            });
            alert("Fechas guardadas");
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                📅 Fechas
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Inicio</label>
                    <input
                        type="date"
                        value={start}
                        onChange={e => setStart(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-main)',
                            colorScheme: 'dark'
                        }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Fin</label>
                    <input
                        type="date"
                        value={finish}
                        onChange={e => setFinish(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-main)',
                            colorScheme: 'dark'
                        }}
                    />
                </div>
                <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ width: '100%' }}>
                    {saving ? 'Guardando...' : 'Guardar Fechas'}
                </button>
            </div>
        </div>
    );
}
