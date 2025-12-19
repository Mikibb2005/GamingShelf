"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import GameCard from "@/components/GameCard";
import { UnifiedGame } from "@/services/adapters/types";
import ProgressBar from "@/components/ProgressBar";

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
    topRatedGames?: any[];
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

    if (loading) return <ProgressBar />;
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
                            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                {profile.favoritePlatforms.slice(0, 10).map(p => (
                                    <span key={p} style={{
                                        padding: '6px 14px',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'rgba(255,255,255,0.8)',
                                        borderRadius: '10px',
                                        fontSize: '0.8rem',
                                        fontWeight: 800,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
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
            {profile.showcases.length > 0 && (
                <div style={{ marginBottom: '4rem' }}>
                    {profile.showcases.map(showcase => (
                        <div key={showcase.id} style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ color: 'var(--primary)' }}>✨</span> {showcase.title}
                            </h2>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                gap: '1.5rem'
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
                        </div>
                    ))}
                </div>
            )}

            {/* Ranking Top 10 */}
            {(profile.topRatedGames || []).length > 0 && (
                <div style={{ marginBottom: '4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>🏆 Mi Top 10</h2>
                        <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Basado en mis valoraciones</span>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '1rem'
                    }}>
                        {(profile.topRatedGames || []).map((game: any, index: number) => (
                            <Link key={game.id} href={`/game/${game.id}`} style={{ textDecoration: 'none' }}>
                                <div className="glass-panel hover-lift" style={{
                                    display: 'flex', gap: '1rem', padding: '1rem', alignItems: 'center',
                                    borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'transform 0.2s',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        position: 'absolute', top: '-10px', left: '-10px',
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        background: index === 0 ? 'gold' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'rgba(255,255,255,0.1)',
                                        color: index < 3 ? 'black' : 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 900, fontSize: '0.9rem', zIndex: 2,
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                                    }}>
                                        {index + 1}
                                    </div>
                                    <div style={{ width: '50px', height: '70px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                                        <img src={game.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ color: 'white', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{game.title}</div>
                                        <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '1.2rem' }}>{game.rating}/100</div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Actividad Reciente</h2>
                <Link href={`/profile/${username}/library`} style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'none', fontSize: '0.9rem', letterSpacing: '1px' }}>
                    VER BIBLIOTECA COMPLETA →
                </Link>
            </div>

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
