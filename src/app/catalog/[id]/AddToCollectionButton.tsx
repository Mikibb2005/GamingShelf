"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
    gameId: string;
    platforms: string[];
    gameTitle: string;
    coverUrl: string | null;
    releaseYear: number | null;
    genres: string | null;
}

export default function AddToCollectionButton({ gameId, platforms, gameTitle, coverUrl, releaseYear, genres }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState("");
    const [ownership, setOwnership] = useState("owned");
    const [status, setStatus] = useState("unplayed");
    const [adding, setAdding] = useState(false);
    const router = useRouter();

    const handleAddGame = async () => {
        if (!selectedPlatform) return;
        setAdding(true);
        try {
            const res = await fetch("/api/games", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceId: `catalog-${gameId}`,
                    source: "Catalog",
                    title: gameTitle,
                    platform: selectedPlatform,
                    coverUrl: coverUrl,
                    releaseYear: releaseYear,
                    genres: genres || "",
                    ownership: ownership,
                    status: ownership === "wishlist" ? "wishlist" : status
                })
            });

            if (res.ok) {
                const newGame = await res.json();
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

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
                style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}
            >
                + Añadir a mi Colección
            </button>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ background: 'var(--bg-main)', padding: '2rem', borderRadius: 'var(--radius-md)', width: '90%', maxWidth: '500px', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Añadir Juego</h2>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Plataforma</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {platforms.map(p => (
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
                                        flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)',
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
                                        flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)',
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
                            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
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
