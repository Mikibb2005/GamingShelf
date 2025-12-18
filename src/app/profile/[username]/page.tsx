"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import GameCard from "@/components/GameCard";
import { UnifiedGame } from "@/services/adapters/types";

interface UserProfile {
    id: string;
    username: string;
    joinedAt: string;
    avatarUrl?: string;
    realName?: string;
    bio?: string;
    socialLinks?: { twitter?: string; instagram?: string };
    favoritePlatforms?: string[];
    showcases: any[];
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
    const router = useRouter();

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
            if (!session?.user || isOwnProfile) return;
            try {
                const res = await fetch(`/api/users/${username}/follow`);
                if (res.ok) {
                    const data = await res.json();
                    setIsFollowing(data.following);
                }
            } catch (e) {
                console.error(e);
            }
        }
        checkFollowStatus();
    }, [username, session, isOwnProfile]);

    const handleFollowToggle = async () => {
        if (!session?.user) return;
        setFollowLoading(true);

        try {
            const method = isFollowing ? "DELETE" : "POST";
            const res = await fetch(`/api/users/${username}/follow`, { method });

            if (res.ok) {
                setIsFollowing(!isFollowing);
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

    const handleMessage = () => {
        router.push(`/messages?userId=${profile?.id}`);
    };

    if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Cargando perfil...</div>;
    if (!profile) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Usuario no encontrado</div>;

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            {/* Header Profile */}
            <div className="glass-panel" style={{
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                background: 'linear-gradient(rgba(18,18,18,0.9), rgba(18,18,18,0.7)), var(--primary-glow)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: 'var(--bg-subtle)',
                        backgroundImage: profile.avatarUrl ? `url(${profile.avatarUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                        fontWeight: 800,
                        color: 'white',
                        border: '4px solid rgba(255,255,255,0.1)',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        {!profile.avatarUrl && profile.username.charAt(0).toUpperCase()}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>{profile.username}</h1>
                            {profile.realName && <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>({profile.realName})</span>}
                        </div>

                        <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            <div><strong style={{ color: 'var(--text-main)' }}>{profile.stats.totalGames}</strong> Juegos</div>
                            <div><strong style={{ color: 'var(--text-main)' }}>{profile.stats.followers}</strong> Seguidores</div>
                            <div><strong style={{ color: 'var(--text-main)' }}>{profile.stats.following}</strong> Siguiendo</div>
                        </div>

                        {profile.favoritePlatforms && profile.favoritePlatforms.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {profile.favoritePlatforms.map(p => (
                                    <span key={p} style={{
                                        padding: '4px 12px',
                                        background: 'rgba(var(--primary-rgb), 0.1)',
                                        color: 'var(--primary)',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        border: '1px solid rgba(var(--primary-rgb), 0.2)'
                                    }}>
                                        {p}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {!isOwnProfile && session?.user && (
                            <>
                                <button className="btn-primary" onClick={handleMessage}>💬 Mensaje</button>
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
                            </>
                        )}
                        {isOwnProfile && (
                            <button className="btn-primary" onClick={() => router.push('/settings')}>⚙️ Editar Perfil</button>
                        )}
                    </div>
                </div>

                {profile.bio && (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        lineHeight: 1.6
                    }}>
                        {profile.bio}
                    </div>
                )}

                {Object.keys(profile.socialLinks || {}).length > 0 && (
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        {profile.socialLinks?.twitter && (
                            <a href={`https://twitter.com/${profile.socialLinks.twitter.replace('@', '')}`} target="_blank" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                𝕏 {profile.socialLinks.twitter}
                            </a>
                        )}
                        {profile.socialLinks?.instagram && (
                            <a href={`https://instagram.com/${profile.socialLinks.instagram.replace('@', '')}`} target="_blank" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                📸 {profile.socialLinks.instagram}
                            </a>
                        )}
                    </div>
                )}
            </div>

            {/* Showcases */}
            {profile.showcases.map(showcase => (
                <div key={showcase.id} style={{ marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ✨ {showcase.title}
                    </h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '1rem'
                    }}>
                        {showcase.games.map((game: any) => (
                            <GameCard
                                key={game.id}
                                id={game.id}
                                title={game.title}
                                platform={game.platform}
                                status={game.status}
                                progress={game.progress}
                                coverGradient={game.coverUrl}
                                releaseYear={game.releaseYear}
                                achievements={game.achievements ? JSON.parse(game.achievements) : undefined}
                            />
                        ))}
                    </div>
                    {showcase.games.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Este showcase está vacío.</div>
                    )}
                </div>
            ))}

            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Actividad Reciente</h2>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1.5rem'
            }}>
                {profile.recentGames.map((game: any) => (
                    <GameCard
                        key={game.id}
                        id={game.id}
                        title={game.title}
                        platform={game.platform}
                        status={game.status}
                        progress={game.progress}
                        coverGradient={game.coverUrl}
                        releaseYear={game.releaseYear}
                        achievements={game.achievements ? JSON.parse(game.achievements) : undefined}
                    />
                ))}
            </div>
        </div>
    );
}
