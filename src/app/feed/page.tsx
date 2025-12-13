"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GameCard from "@/components/GameCard";

interface FeedGame {
    id: string;
    title: string;
    platform: string;
    status: string;
    progress: number;
    coverUrl: string;
    releaseYear: number;
    achievements: string | null;
    user: {
        username: string;
    };
    updatedAt: string;
}

export default function FeedPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [games, setGames] = useState<FeedGame[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        async function loadFeed() {
            if (!session?.user) return;

            try {
                const res = await fetch("/api/feed");
                if (res.ok) {
                    const data = await res.json();
                    setGames(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadFeed();
    }, [session]);

    if (status === "loading" || loading) {
        return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Cargando feed...</div>;
    }

    if (!session?.user) {
        return null;
    }

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    <span className="title-gradient">Tu Feed</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Actividad de usuarios que sigues
                </p>
            </header>

            {games.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {games.map(game => (
                        <div key={game.id} className="glass-panel" style={{
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'center'
                        }}>
                            <Link href={`/profile/${game.user.username}`} style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                color: 'white',
                                textDecoration: 'none',
                                flexShrink: 0
                            }}>
                                {game.user.username.charAt(0).toUpperCase()}
                            </Link>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <Link href={`/profile/${game.user.username}`} style={{
                                        fontWeight: 600,
                                        color: 'var(--text-main)',
                                        textDecoration: 'none'
                                    }}>
                                        {game.user.username}
                                    </Link>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        está jugando
                                    </span>
                                </div>
                                <Link href={`/game/${game.id}`} style={{
                                    color: 'var(--primary)',
                                    fontWeight: 600,
                                    textDecoration: 'none'
                                }}>
                                    {game.title}
                                </Link>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                                    {game.platform} • {game.progress}%
                                </span>
                            </div>

                            {game.achievements && (
                                <div style={{
                                    background: 'var(--bg-subtle)',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.85rem'
                                }}>
                                    🏆 {JSON.parse(game.achievements).unlocked}/{JSON.parse(game.achievements).total}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem',
                    color: 'var(--text-muted)',
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--radius-md)'
                }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Feed vacío</h3>
                    <p>Sigue a otros usuarios para ver su actividad aquí</p>
                </div>
            )}
        </div>
    );
}
