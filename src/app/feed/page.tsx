"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import ProgressBar from "@/components/ProgressBar";
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
    const [feedItems, setFeedItems] = useState<any[]>([]);
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

    const loadFeed = async () => {
        if (!session?.user) return;
        try {
            const res = await fetch("/api/feed");
            if (res.ok) setFeedItems(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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
                setNewPostImage("");
                setNewPostCaption("");
                loadFeed(); // Refresh feed
            }
        } catch (e) {
            console.error(e);
        } finally {
            setCreatingPost(false);
        }
    };

    if (status === "loading" || loading) {
        return <ProgressBar />;
    }

    if (!session?.user) return null;

    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '700px' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                    <span className="title-gradient">Comunidad</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    Descubre qué están jugando tus amigos
                </p>
            </header>

            {/* Create Post Card */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem', borderRadius: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>📸</span> Comparte un momento
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="URL de la imagen (Screenshot o Foto)..."
                        value={newPostImage}
                        onChange={(e) => setNewPostImage(e.target.value)}
                        style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                    />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            type="text"
                            placeholder="¿Qué estás pensando?"
                            value={newPostCaption}
                            onChange={(e) => setNewPostCaption(e.target.value)}
                            style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                        />
                        <button
                            className="btn-primary"
                            onClick={handleCreatePost}
                            disabled={!newPostImage || creatingPost}
                            style={{ padding: '0 2rem', borderRadius: '12px', fontWeight: 800 }}
                        >
                            {creatingPost ? '...' : 'Publicar'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Feed Chronological List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                {feedItems.map((item, idx) => {
                    const isPost = item.type === 'social_post';

                    if (isPost) {
                        return (
                            <article key={`post-${item.id}`} className="glass-panel" style={{ padding: '0', overflow: 'hidden', borderRadius: '24px' }}>
                                <div style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <Link href={`/profile/${item.user.username}`} style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: 'linear-gradient(45deg, var(--primary), #ab83f7)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 900, color: 'white', textDecoration: 'none'
                                    }}>
                                        {item.user.username[0].toUpperCase()}
                                    </Link>
                                    <div>
                                        <Link href={`/profile/${item.user.username}`} style={{ fontWeight: 800, color: 'white', textDecoration: 'none' }}>{item.user.username}</Link>
                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Hace poco</div>
                                    </div>
                                </div>
                                <div style={{ width: '100%', aspectRatio: '4/3', background: '#000', overflow: 'hidden', position: 'relative', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <img src={item.imageUrl} alt="Post content" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '1.5rem' }}>
                                        <span>❤️</span> <span>💬</span> <span>✈️</span>
                                    </div>
                                    {item.caption && (
                                        <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                                            <span style={{ fontWeight: 800, marginRight: '0.6rem' }}>{item.user.username}</span>
                                            {item.caption}
                                        </p>
                                    )}
                                </div>
                            </article>
                        );
                    } else {
                        // Game Update
                        return (
                            <div key={`game-${item.id}`} className="glass-panel" style={{
                                padding: '1.5rem',
                                borderRadius: '24px',
                                display: 'flex',
                                gap: '1.5rem',
                                alignItems: 'center',
                                borderLeft: '4px solid var(--primary)'
                            }}>
                                <div style={{ width: '60px', height: '80px', position: 'relative', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
                                    <img src={item.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                        <Link href={`/profile/${item.user.username}`} style={{ fontWeight: 800, color: 'white', textDecoration: 'none', borderBottom: '1px solid var(--primary)' }}>
                                            {item.user.username}
                                        </Link>
                                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>actualizó su progreso</span>
                                    </div>
                                    <Link href={`/game/${item.id}`} style={{
                                        fontSize: '1.2rem',
                                        fontWeight: 900,
                                        color: 'white',
                                        textDecoration: 'none',
                                        display: 'block',
                                        marginBottom: '0.5rem'
                                    }}>
                                        {item.title}
                                    </Link>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{item.platform}</span>
                                        <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${item.progress}%`, background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />
                                        </div>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--primary)' }}>{item.progress}%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                })}

                {feedItems.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '6rem 2rem', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '32px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🛰️</div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Feed Solitario</h3>
                        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Comienza a seguir a otros gamers para ver su actividad aquí.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
