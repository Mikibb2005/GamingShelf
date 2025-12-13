"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Category {
    id: string;
    name: string;
}

function NewTopicForm() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultCategoryId = searchParams.get("categoryId") || "";

    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryId, setCategoryId] = useState(defaultCategoryId);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        async function loadCategories() {
            const res = await fetch("/api/forum/categories");
            if (res.ok) {
                const cats = await res.json();
                setCategories(cats);
                if (!categoryId && cats.length > 0) {
                    setCategoryId(cats[0].id);
                }
            }
        }
        loadCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/forum/topics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content, categoryId })
            });

            if (res.ok) {
                const topic = await res.json();
                router.push(`/forum/topic/${topic.id}`);
            } else {
                const data = await res.json();
                setError(data.error || "Error al crear tema");
            }
        } catch (e) {
            setError("Error de conexión");
        } finally {
            setSubmitting(false);
        }
    };

    if (status === "loading") {
        return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Cargando...</div>;
    }

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '700px' }}>
            <div style={{ marginBottom: '1rem' }}>
                <Link href="/forum" style={{ color: 'var(--text-muted)' }}>← Volver al foro</Link>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>
                <span className="title-gradient">Nuevo Tema</span>
            </h1>

            {error && (
                <div style={{ padding: '1rem', background: 'rgba(255,0,0,0.1)', border: '1px solid var(--error)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', color: 'var(--error)' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Categoría</label>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        required
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-main)'
                        }}
                    >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Título</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        maxLength={200}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-main)'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Contenido</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        rows={8}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-main)',
                            resize: 'vertical'
                        }}
                    />
                </div>

                <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Creando...' : 'Crear Tema'}
                </button>
            </form>
        </div>
    );
}

export default function NewTopicPage() {
    return (
        <Suspense fallback={<div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Cargando...</div>}>
            <NewTopicForm />
        </Suspense>
    );
}
