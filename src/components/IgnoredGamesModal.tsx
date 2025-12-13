import { useState, useEffect } from 'react';

interface IgnoredGame {
    id: string; // Database ID
    source: string;
    sourceId: string;
    title: string;
    createdAt: string;
}

interface IgnoredGamesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function IgnoredGamesModal({ isOpen, onClose }: IgnoredGamesModalProps) {
    const [games, setGames] = useState<IgnoredGame[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        if (!isOpen) return;

        async function load() {
            setLoading(true);
            try {
                const res = await fetch("/api/games/ignore");
                if (res.ok) {
                    setGames(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [isOpen, refreshTrigger]);

    if (!isOpen) return null;

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleRestore = async () => {
        if (selectedIds.size === 0) return;
        setLoading(true);
        try {
            const res = await fetch("/api/games/ignore", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });
            if (res.ok) {
                setSelectedIds(new Set());
                setRefreshTrigger(prev => prev + 1); // Reload list
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
        }}>
            <div className="glass-panel" style={{
                width: '100%', maxWidth: '600px', maxHeight: '80vh',
                background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        Juegos Ignorados
                    </h2>
                    <button onClick={onClose} style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>&times;</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    {loading && games.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando...</div>
                    ) : games.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No hay juegos ignorados.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {games.map(game => (
                                <div key={game.id}
                                    onClick={() => toggleSelection(game.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                        background: selectedIds.has(game.id) ? 'var(--bg-subtle)' : 'transparent',
                                        border: `1px solid ${selectedIds.has(game.id) ? 'var(--primary)' : 'var(--border)'}`,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{
                                        width: '20px', height: '20px', borderRadius: '4px',
                                        border: '2px solid var(--text-muted)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: selectedIds.has(game.id) ? 'var(--primary)' : 'transparent',
                                        borderColor: selectedIds.has(game.id) ? 'var(--primary)' : 'var(--text-muted)'
                                    }}>
                                        {selectedIds.has(game.id) && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600 }}>{game.title || `Game ${game.sourceId}`}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {game.source} • Ignorado el {new Date(game.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button onClick={onClose} className="btn-secondary">Cerrar</button>
                    <button
                        onClick={handleRestore}
                        className="btn-primary"
                        disabled={selectedIds.size === 0 || loading}
                    >
                        Recuperar ({selectedIds.size})
                    </button>
                </div>
            </div>
        </div>
    );
}
