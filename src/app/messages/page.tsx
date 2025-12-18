
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function MessagesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [threads, setThreads] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingChat, setLoadingChat] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        async function init() {
            const currentThreads = await loadThreads();
            const urlParams = new URLSearchParams(window.location.search);
            const userId = urlParams.get('userId');
            if (userId) {
                const existing = currentThreads.find((t: any) => t.user.id === userId);
                if (existing) {
                    setSelectedUser(existing.user);
                } else {
                    // Fetch user info for target
                    const res = await fetch(`/api/users/id/${userId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setSelectedUser(data);
                    }
                }
                loadConversation(userId);
            }
        }
        init();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const loadThreads = async () => {
        try {
            const res = await fetch("/api/messages");
            if (res.ok) {
                const data = await res.json();
                setThreads(data);
                return data;
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
        return [];
    };

    const loadConversation = async (userId: string) => {
        setLoadingChat(true);
        setSelectedUserId(userId);
        try {
            const res = await fetch(`/api/messages/${userId}`);
            if (res.ok) {
                setMessages(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingChat(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage || !selectedUserId) return;

        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ receiverId: selectedUserId, content: newMessage })
            });

            if (res.ok) {
                const msg = await res.json();
                setMessages([...messages, msg]);
                setNewMessage("");
                loadThreads(); // Update thread list preview
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (status === "loading" || loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Cargando mensajes...</div>;

    return (
        <div className="container" style={{ padding: '2rem 1rem', height: 'calc(100vh - 100px)', display: 'flex', gap: '1.5rem' }}>
            {/* Sidebar: Threads */}
            <div className="card" style={{ width: '300px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Mensajes</h2>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {threads.map(thread => (
                        <div
                            key={thread.user.id}
                            onClick={() => { setSelectedUser(thread.user); loadConversation(thread.user.id); }}
                            style={{
                                padding: '1rem',
                                borderBottom: '1px solid var(--border)',
                                cursor: 'pointer',
                                background: selectedUserId === thread.user.id ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                                transition: 'background 0.2s'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-subtle)',
                                    backgroundImage: thread.user.avatarUrl ? `url(${thread.user.avatarUrl})` : undefined,
                                    backgroundSize: 'cover'
                                }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{thread.user.username}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {thread.lastMessage}
                                    </div>
                                </div>
                                {thread.unread && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} />}
                            </div>
                        </div>
                    ))}
                    {threads.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            No tienes conversaciones activas.
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                {selectedUserId ? (
                    <>
                        {/* Header */}
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ fontWeight: 600 }}>Chat con {selectedUser?.username || 'Cargando...'}</div>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                        >
                            {loadingChat ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando conversación...</div>
                            ) : (
                                <>
                                    {messages.map(msg => (
                                        <div
                                            key={msg.id}
                                            style={{
                                                maxWidth: '70%',
                                                padding: '0.75rem 1rem',
                                                borderRadius: 'var(--radius-md)',
                                                alignSelf: msg.senderId === session?.user?.id ? 'flex-end' : 'flex-start',
                                                background: msg.senderId === session?.user?.id ? 'var(--primary)' : 'var(--bg-subtle)',
                                                color: msg.senderId === session?.user?.id ? 'white' : 'var(--text-main)',
                                                boxShadow: 'var(--shadow-sm)'
                                            }}
                                        >
                                            <div style={{ fontSize: '0.95rem' }}>{msg.content}</div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.7, textAlign: 'right', marginTop: '0.25rem' }}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ))}
                                    {messages.length === 0 && (
                                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
                                            No hay mensajes aún. ¡Di hola!
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Input Area */}
                        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Escribe un mensaje..."
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1rem',
                                    background: 'var(--bg-subtle)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-full)',
                                    color: 'var(--text-main)'
                                }}
                            />
                            <button
                                className="btn-primary"
                                onClick={handleSendMessage}
                                disabled={!newMessage}
                                style={{ borderRadius: 'var(--radius-full)', padding: '0 1.5rem' }}
                            >
                                Enviar
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        Selecciona una conversación para empezar a chatear.
                    </div>
                )}
            </div>
        </div>
    );
}
