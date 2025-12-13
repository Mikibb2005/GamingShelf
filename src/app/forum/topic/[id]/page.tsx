"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Reply {
    id: string;
    content: string;
    author: { username: string };
    createdAt: string;
}

interface Topic {
    id: string;
    title: string;
    content: string;
    author: { username: string };
    category: { id: string; name: string };
    createdAt: string;
    isLocked: boolean;
    replies: Reply[];
}

export default function TopicPage() {
    const params = useParams();
    const topicId = params?.id as string;
    const { data: session } = useSession();

    const [topic, setTopic] = useState<Topic | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const loadTopic = async () => {
        try {
            const res = await fetch(`/api/forum/topics/${topicId}/replies`);
            if (res.ok) setTopic(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTopic();
    }, [topicId]);

    const handleSubmitReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/forum/topics/${topicId}/replies`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: replyContent })
            });

            if (res.ok) {
                setReplyContent("");
                loadTopic();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Cargando...</div>;
    if (!topic) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Tema no encontrado</div>;

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px' }}>
            <div style={{ marginBottom: '1rem' }}>
                <Link href={`/forum/category/${topic.category.id}`} style={{ color: 'var(--text-muted)' }}>
                    ← {topic.category.name}
                </Link>
            </div>

            {/* Topic */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>{topic.title}</h1>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    por <strong>{topic.author.username}</strong> · {new Date(topic.createdAt).toLocaleDateString('es')}
                </div>
                <div style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{topic.content}</div>
            </div>

            {/* Replies */}
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                {topic.replies.length} respuestas
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {topic.replies.map(reply => (
                    <div key={reply.id} className="card" style={{ padding: '1rem' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                            <strong>{reply.author.username}</strong> · {new Date(reply.createdAt).toLocaleDateString('es')}
                        </div>
                        <div style={{ lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{reply.content}</div>
                    </div>
                ))}
            </div>

            {/* Reply Form */}
            {session?.user && !topic.isLocked ? (
                <form onSubmit={handleSubmitReply} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Responder</h3>
                    <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Escribe tu respuesta..."
                        required
                        rows={4}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-main)',
                            resize: 'vertical',
                            marginBottom: '1rem'
                        }}
                    />
                    <button type="submit" className="btn-primary" disabled={submitting}>
                        {submitting ? 'Enviando...' : 'Enviar Respuesta'}
                    </button>
                </form>
            ) : topic.isLocked ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                    🔒 Este tema está cerrado
                </div>
            ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                    <Link href="/login" style={{ color: 'var(--primary)' }}>Inicia sesión</Link> para responder
                </div>
            )}
        </div>
    );
}
