"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import GameCard from "@/components/GameCard";
import { UnifiedGame } from "@/services/adapters/types";

interface UserProfile {
    id: string;
    username: string;
    joinedAt: string;
    stats: {
        totalGames: number;
        followers: number;
        following: number;
    };
    recentGames: any[];
}

export default function ProfilePage() {
    const params = useParams();
    const username = params?.username as string;
    const { data: session } = useSession();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const isOwnProfile = session?.user?.name === username;

    useEffect(() => {
        async function loadProfile() {
            try {
                const res = await fetch(`/api/users/${username}`);
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [username]);

    useEffect(() => {
        async function checkFollowStatus() {
            if (!session?.user) return;
            try {
                const res = await fetch(`/api/users/${username}/follow`);
                const data = await res.json();
                setIsFollowing(data.following);
            } catch (e) {
                console.error(e);
            }
        }
        checkFollowStatus();
    }, [username, session]);

    const handleFollowToggle = async () => {
        if (!session?.user) return;
        setFollowLoading(true);

        try {
            const method = isFollowing ? "DELETE" : "POST";
            const res = await fetch(`/api/users/${username}/follow`, { method });

            if (res.ok) {
                setIsFollowing(!isFollowing);
                // Update follower count
                if (profile) {
                    setProfile({
                        ...profile,
                        stats: {
                            ...profile.stats,
                            followers: profile.stats.followers + (isFollowing ? -1 : 1)
                        }
                    });
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Cargando perfil...</div>;
    if (!profile) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Usuario no encontrado</div>;

    const games: UnifiedGame[] = profile.recentGames.map((g: any) => ({
        id: g.id,
        sourceId: g.sourceId,
        source: g.source,
        title: g.title,
        platform: g.platform,
        coverUrl: g.coverUrl,
        status: g.status,
        progress: g.progress,
        rating: g.rating,
        releaseYear: g.releaseYear,
        genres: g.genres ? g.genres.split(',') : [],
        achievements: g.achievements ? JSON.parse(g.achievements) : undefined
    }));

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            {/* Header Profile */}
            <div className="glass-panel" style={{
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                background: 'linear-gradient(rgba(18,18,18,0.9), rgba(18,18,18,0.7)), var(--primary-glow)'
            }}>
                <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    color: 'white'
                }}>
                    {profile.username.charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{profile.username}</h1>
                    <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)' }}>
                        <div><strong style={{ color: 'var(--text-main)' }}>{profile.stats.totalGames}</strong> Juegos</div>
                        <div><strong style={{ color: 'var(--text-main)' }}>{profile.stats.followers}</strong> Seguidores</div>
                        <div><strong style={{ color: 'var(--text-main)' }}>{profile.stats.following}</strong> Siguiendo</div>
                    </div>
                </div>

                {!isOwnProfile && session?.user && (
                    <button
                        className={isFollowing ? "" : "btn-primary"}
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                        style={isFollowing ? {
                            padding: '0.75rem 1.5rem',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer'
                        } : undefined}
                    >
                        {followLoading ? '...' : (isFollowing ? 'Siguiendo ✓' : 'Seguir +')}
                    </button>
                )}
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Actividad Reciente</h2>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1.5rem'
            }}>
                {games.map(game => (
                    <GameCard
                        key={game.id}
                        id={game.id}
                        title={game.title}
                        platform={game.platform}
                        status={game.status}
                        progress={game.progress}
                        coverGradient={game.coverUrl}
                        releaseYear={game.releaseYear}
                        achievements={game.achievements}
                    />
                ))}
            </div>
        </div>
    );
}
