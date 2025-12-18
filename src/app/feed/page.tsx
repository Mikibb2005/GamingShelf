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
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // New Post State
    const [newPostImage, setNewPostImage] = useState("");
    const [newPostCaption, setNewPostCaption] = useState("");
    const [creatingPost, setCreatingPost] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        async function loadFeed() {
            if (!session?.user) return;

            try {
                const [resGames, resPosts] = await Promise.all([
                    fetch("/api/feed"),
                    fetch("/api/posts")
                ]);

                if (resGames.ok) setGames(await resGames.json());
                if (resPosts.ok) setPosts(await resPosts.json());
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadFeed();
    }, [session]);

    const handleCreatePost = async () => {
        if (!newPostImage) return;
        setCreatingPost(true);
        try {
            const res = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: newPostImage, caption: newPostCaption })
            });

            if (res.ok) {
                const post = await res.json();
                setPosts([post, ...posts]);
                setNewPostImage("");
                setNewPostCaption("");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setCreatingPost(false);
        }
    };

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
                    Actividad y publicaciones de usuarios que sigues
                </p>
            </header>

            {/* Create Post */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>📷 Nueva Publicación</h3>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <input
                        type="text"
                        placeholder="URL de la imagen..."
                        value={newPostImage}
                        onChange={(e) => setNewPostImage(e.target.value)}
                        style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Escribe un pie de foto..."
                        value={newPostCaption}
                        onChange={(e) => setNewPostCaption(e.target.value)}
                        style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }}
                    />
                    <button
                        className="btn-primary"
                        onClick={handleCreatePost}
                        disabled={!newPostImage || creatingPost}
                    >
                        {creatingPost ? 'Publicando...' : 'Publicar'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Posts Section */}
                {posts.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {posts.map(post => (
                            <div key={post.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                                <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-subtle)',
                                        backgroundImage: post.user.avatarUrl ? `url(${post.user.avatarUrl})` : undefined,
                                        backgroundSize: 'cover'
                                    }} />
                                    <div style={{ fontWeight: 600 }}>{post.user.username}</div>
                                </div>
                                <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src={post.imageUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    {post.caption && <p style={{ marginBottom: '0.5rem' }}><span style={{ fontWeight: 600 }}>{post.user.username}</span> {post.caption}</p>}
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(post.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Game Activity Section */}
                {games.length > 0 && (
                    <div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Actividad Reciente</h3>
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
                    </div>
                )}

                {games.length === 0 && posts.length === 0 && (
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
        </div>
    );
}
