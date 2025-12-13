"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const username = formData.get("username") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Error al registrar");
                setLoading(false);
                return;
            }

            router.push("/login?registered=true");
        } catch (err) {
            setError("Error de conexión");
            setLoading(false);
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
                    <span className="title-gradient">Crear Cuenta</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
                    Únete a G-TRACKER
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
                            Nombre de usuario
                        </label>
                        <input
                            type="text"
                            name="username"
                            required
                            minLength={3}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-main)',
                                fontSize: '1rem'
                            }}
                            placeholder="TuNombre"
                        />
                    </div>

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
                            minLength={6}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-main)',
                                fontSize: '1rem'
                            }}
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
                    >
                        {loading ? 'Registrando...' : 'Crear Cuenta'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
                    ¿Ya tienes cuenta?{' '}
                    <Link href="/login" style={{ color: 'var(--primary)' }}>
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}
