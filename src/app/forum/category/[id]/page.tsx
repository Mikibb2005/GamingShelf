"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";

interface Topic {
    id: string;
    title: string;
    author: { username: string };
    createdAt: string;
    isPinned: boolean;
    _count: { replies: number };
}

interface Category {
    id: string;
    name: string;
    description: string | null;
}

export default function CategoryPage() {
    const params = useParams();
    const categoryId = params?.id as string;
    const { data: session } = useSession();

    const [category, setCategory] = useState<Category | null>(null);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadCategory() {
            try {
                const [catRes, topicsRes] = await Promise.all([
                    fetch("/api/forum/categories"),
                    fetch(`/api/forum/topics?categoryId=${categoryId}`)
                ]);

                if (catRes.ok) {
                    const cats = await catRes.json();
                    setCategory(cats.find((c: any) => c.id === categoryId) || null);
                }
                if (topicsRes.ok) setTopics(await topicsRes.json());
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        loadCategory();
    }, [categoryId]);

    if (loading) return <ProgressBar />;
    if (!category) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Categoría no encontrada</div>;

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
                <Link href="/forum" style={{ color: 'var(--text-muted)' }}>← Volver al foro</Link>
            </div>

            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{category.name}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>{category.description}</p>
                </div>
                {session?.user && (
                    <Link href={`/forum/new?categoryId=${categoryId}`} className="btn-primary">
                        + Nuevo Tema
                    </Link>
                )}
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {topics.map(topic => (
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
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{topic.title}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                por {topic.author.username}
                            </div>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            💬 {topic._count.replies}
                        </div>
                    </Link>
                ))}
                {topics.length === 0 && (
                    <div style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>
                        No hay temas en esta categoría. ¡Sé el primero!
                    </div>
                )}
            </div>
        </div>
    );
}
