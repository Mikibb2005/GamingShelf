"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Category {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    _count: { topics: number };
}

interface Topic {
    id: string;
    title: string;
    author: { username: string };
    category: { name: string };
    createdAt: string;
    updatedAt: string;
    isPinned: boolean;
    _count: { replies: number };
}

export default function ForumPage() {
    const { data: session } = useSession();
    const [categories, setCategories] = useState<Category[]>([]);
    const [recentTopics, setRecentTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadForum() {
            try {
                const [catRes, topicsRes] = await Promise.all([
                    fetch("/api/forum/categories"),
                    fetch("/api/forum/topics")
                ]);

                if (catRes.ok) setCategories(await catRes.json());
                if (topicsRes.ok) setRecentTopics(await topicsRes.json());
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadForum();
    }, []);

    if (loading) {
        return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Cargando foro...</div>;
    }

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
                    <span className="title-gradient">Foro</span>
                </h1>
                {session?.user && categories.length > 0 && (
                    <Link href={`/forum/new?categoryId=${categories[0].id}`} className="btn-primary">
                        + Nuevo Tema
                    </Link>
                )}
            </header>

            {/* Categories */}
            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    Categorías
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                    {categories.map(cat => (
                        <Link
                            key={cat.id}
                            href={`/forum/category/${cat.id}`}
                            className="glass-panel"
                            style={{
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-md)',
                                textDecoration: 'none',
                                display: 'block'
                            }}
                        >
                            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{cat.icon || '💬'}</div>
                            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{cat.name}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{cat.description}</p>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                {cat._count.topics} temas
                            </div>
                        </Link>
                    ))}
                    {categories.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center', gridColumn: '1/-1' }}>
                            No hay categorías. Visita /api/forum/seed para crear categorías de ejemplo.
                        </div>
                    )}
                </div>
            </section>

            {/* Recent Topics */}
            <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    Temas Recientes
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {recentTopics.map(topic => (
                        <Link
                            key={topic.id}
                            href={`/forum/topic/${topic.id}`}
                            className="glass-panel"
                            style={{
                                padding: '1rem 1.5rem',
                                borderRadius: 'var(--radius-sm)',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}
                        >
                            {topic.isPinned && <span>📌</span>}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600 }}>{topic.title}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    por {topic.author.username} en {topic.category.name}
                                </div>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'right' }}>
                                💬 {topic._count.replies}
                            </div>
                        </Link>
                    ))}
                    {recentTopics.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>
                            No hay temas todavía. ¡Sé el primero en crear uno!
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
