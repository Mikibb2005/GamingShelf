"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        setLoading(false);

        if (result?.error) {
            setError("Email o contraseña incorrectos");
        } else {
            router.push("/library");
            router.refresh();
        }
    };

    return (
        <div className="container" style={{
            padding: '4rem 1rem',
            maxWidth: '400px',
            margin: '0 auto'
        }}>
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>
                    <span className="title-gradient">Iniciar Sesión</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
                    Todo tu juego en un lugar
                </p>

                {error && (
                    <div style={{
                        background: 'rgba(255,0,0,0.1)',
                        border: '1px solid var(--error)',
                        padding: '1rem',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '1rem',
                        color: 'var(--error)'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-main)',
                                fontSize: '1rem'
                            }}
                            placeholder="tu@email.com"
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                            Contraseña
                        </label>
                        <input
                            type="password"
                            name="password"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-main)',
                                fontSize: '1rem'
                            }}
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
                    ¿No tienes cuenta?{' '}
                    <Link href="/register" style={{ color: 'var(--primary)' }}>
                        Regístrate
                    </Link>
                </p>
            </div>
        </div>
    );
}
