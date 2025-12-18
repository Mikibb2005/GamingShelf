
"use client";
import { useState, useEffect } from "react";

export default function ShowcaseManager({ setMessage }: { setMessage: (msg: string) => void }) {
    const [showcases, setShowcases] = useState<any[]>([]);
    const [myGames, setMyGames] = useState<any[]>([]);
    const [newTitle, setNewTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const [editingShowcaseId, setEditingShowcaseId] = useState<string | null>(null);

    useEffect(() => {
        loadShowcases();
        loadGames();
    }, []);

    const loadShowcases = async () => {
        try {
            const res = await fetch("/api/settings/showcases");
            if (res.ok) {
                setShowcases(await res.json());
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadGames = async () => {
        try {
            const res = await fetch("/api/library"); // Assuming this returns user's library
            if (res.ok) {
                setMyGames(await res.json());
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreate = async () => {
        if (!newTitle) return;
        setLoading(true);
        try {
            const res = await fetch("/api/settings/showcases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newTitle,
                    type: "list",
                    content: []
                })
            });

            if (res.ok) {
                setMessage("✅ Showcase creado");
                setNewTitle("");
                loadShowcases();
            } else {
                setMessage("❌ Error al crear");
            }
        } catch (e) {
            setMessage("❌ Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este showcase?")) return;
        try {
            await fetch(`/api/settings/showcases?id=${id}`, { method: "DELETE" });
            loadShowcases();
            setMessage("🗑️ Showcase eliminado");
        } catch (e) {
            setMessage("❌ Error al eliminar");
        }
    };

    const toggleGameInShowcase = async (showcase: any, gameId: string) => {
        const content = JSON.parse(showcase.content || "[]");
        let newContent;
        if (content.includes(gameId)) {
            newContent = content.filter((id: string) => id !== gameId);
        } else {
            newContent = [...content, gameId];
        }

        try {
            const res = await fetch("/api/settings/showcases", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: showcase.id,
                    content: newContent
                })
            });
            if (res.ok) {
                loadShowcases();
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
                ✨ Showcases
            </h2>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Nuevo Showcase (ej: Top 10 RPGs)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }}
                />
                <button className="btn-primary" onClick={handleCreate} disabled={loading || !newTitle}>
                    Crear
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {showcases.map(s => {
                    const isEditing = editingShowcaseId === s.id;
                    const selectedIds = JSON.parse(s.content || "[]");

                    return (
                        <div key={s.id} style={{
                            padding: '1rem',
                            background: 'var(--bg-subtle)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isEditing ? '1rem' : 0 }}>
                                <span style={{ fontWeight: 600 }}>{s.title} ({selectedIds.length})</span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => setEditingShowcaseId(isEditing ? null : s.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                                    >
                                        {isEditing ? 'Cerrar' : 'Configurar ⚙️'}
                                    </button>
                                    <button onClick={() => handleDelete(s.id)} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            {isEditing && (
                                <div style={{
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                    gap: '0.5rem',
                                    padding: '0.5rem',
                                    background: 'rgba(0,0,0,0.1)',
                                    borderRadius: 'var(--radius-sm)'
                                }}>
                                    {myGames.map(game => {
                                        const isSelected = selectedIds.includes(game.id);
                                        return (
                                            <div
                                                key={game.id}
                                                onClick={() => toggleGameInShowcase(s, game.id)}
                                                style={{
                                                    padding: '0.5rem',
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer',
                                                    borderRadius: 'var(--radius-sm)',
                                                    background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                                                    color: isSelected ? 'white' : 'var(--text-main)',
                                                    border: '1px solid var(--border)',
                                                    textAlign: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {game.title}
                                            </div>
                                        );
                                    })}
                                    {myGames.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>Cargando juegos...</div>}
                                </div>
                            )}
                        </div>
                    );
                })}
                {showcases.length === 0 && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center' }}>
                        No tienes showcases activos.
                    </div>
                )}
            </div>
        </div>
    );
}
