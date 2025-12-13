import { useState, useEffect } from 'react';

interface CandidateGame {
    source: string;
    sourceId: string;
    title: string;
    platform: string;
    coverUrl?: string;
    state?: 'library' | 'ignored' | 'new';
}

interface SyncModalProps {
    isOpen: boolean;
    candidates: CandidateGame[];
    onConfirm: (selected: CandidateGame[], ignored: CandidateGame[]) => void;
    onCancel: () => void;
}

export default function SyncModal({ isOpen, candidates, onConfirm, onCancel }: SyncModalProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            // Select Library and New games by default
            const toSelect = candidates
                .filter(c => c.state !== 'ignored')
                .map(c => c.sourceId);
            setSelectedIds(new Set(toSelect));
        }
    }, [isOpen, candidates]);

    if (!isOpen) return null;

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleAll = () => {
        if (selectedIds.size === candidates.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(candidates.map(c => c.sourceId)));
        }
    };

    const handleConfirm = () => {
        const selected = candidates.filter(c => selectedIds.has(c.sourceId));
        const ignored = candidates.filter(c => !selectedIds.has(c.sourceId));
        onConfirm(selected, ignored);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem'
        }}>
            <div className="glass-panel" style={{
                width: '100%', maxWidth: '900px', height: '85vh',
                background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.7)',
                border: '1px solid var(--border)'
            }}>
                {/* Header */}
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                                Sincronización ({candidates.length})
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                Selecciona los juegos de {candidates[0]?.source} que quieres añadir a tu colección.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{selectedIds.size}</span> seleccionados
                            </div>
                            <button onClick={toggleAll} className="btn-secondary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                                {selectedIds.size === candidates.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grid Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: 'var(--bg-subtle)' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {candidates.map(game => {
                            const isSelected = selectedIds.has(game.sourceId);
                            const badgeColor = game.state === 'library' ? 'var(--primary)' :
                                game.state === 'new' ? 'var(--accent)' : 'var(--text-muted)';
                            const badgeText = game.state === 'library' ? 'Biblioteca' :
                                game.state === 'new' ? 'Nuevo' : 'Ignorado';

                            return (
                                <div key={game.sourceId}
                                    onClick={() => toggleSelection(game.sourceId)}
                                    style={{
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                    }}
                                >
                                    {/* Cover Image Container */}
                                    <div style={{
                                        position: 'relative',
                                        aspectRatio: '2/3',
                                        borderRadius: 'var(--radius-md)',
                                        overflow: 'hidden',
                                        boxShadow: isSelected ? '0 0 0 3px var(--primary)' : '0 4px 6px rgba(0,0,0,0.3)',
                                        border: isSelected ? 'none' : '1px solid var(--border)'
                                    }}>
                                        {game.coverUrl ? (
                                            <img src={game.coverUrl} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                                                {game.platform}
                                            </div>
                                        )}

                                        {/* Selection Overlay */}
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: isSelected ? 'rgba(var(--primary-rgb), 0.2)' : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'background 0.2s'
                                        }}>
                                            {isSelected && (
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '50%',
                                                    background: 'var(--primary)', color: 'white',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '24px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                                                }}>✓</div>
                                            )}
                                        </div>

                                        {/* Status Badge */}
                                        <div style={{
                                            position: 'absolute', top: '8px', right: '8px',
                                            background: badgeColor, color: game.state === 'new' ? 'black' : 'white',
                                            padding: '2px 8px', borderRadius: '4px',
                                            fontSize: '0.7rem', fontWeight: 700,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                        }}>
                                            {badgeText}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                                        <div style={{
                                            fontWeight: 600, fontSize: '0.9rem',
                                            overflow: 'hidden', display: '-webkit-box',
                                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                            lineHeight: '1.2'
                                        }}>
                                            {game.title}
                                        </div>
                                        {game.source === 'RetroAchievements' && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {game.platform}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1.5rem 2rem', borderTop: '1px solid var(--border)',
                    background: 'var(--bg-main)',
                    display: 'flex', justifyContent: 'flex-end', gap: '1rem'
                }}>
                    <button onClick={onCancel} className="btn-secondary" style={{ minWidth: '120px' }}>
                        Cancelar
                    </button>
                    <button onClick={handleConfirm} className="btn-primary" style={{ minWidth: '150px' }}>
                        Confirmar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
}
