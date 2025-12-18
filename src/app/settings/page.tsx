"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import ProgressBar from "@/components/ProgressBar";
import { useRouter } from "next/navigation";
import SyncModal from "@/components/SyncModal";
import IgnoredGamesModal from "@/components/IgnoredGamesModal";
import ProfileEditSection from "@/components/settings/ProfileEditSection";
import ShowcaseManager from "@/components/settings/ShowcaseManager";

export default function SettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [raUsername, setRaUsername] = useState("");
    const [raApiKey, setRaApiKey] = useState("");
    const [steamId, setSteamId] = useState("");
    const [steamApiKey, setSteamApiKey] = useState("");
    const [xboxXuid, setXboxXuid] = useState("");
    const [xboxApiKey, setXboxApiKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState("");
    const [message, setMessage] = useState("");
    const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);

    // Manual Sync State
    const [showModal, setShowModal] = useState(false);
    const [showIgnoredModal, setShowIgnoredModal] = useState(false);
    const [candidates, setCandidates] = useState<any[]>([]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        loadLinkedAccounts();
    }, []);

    const loadLinkedAccounts = async () => {
        try {
            const res = await fetch("/api/settings/accounts");
            if (res.ok) {
                const data = await res.json();
                setLinkedAccounts(data);

                const ra = data.find((a: any) => a.provider === "RetroAchievements");
                if (ra) setRaUsername(ra.accountId);

                const steam = data.find((a: any) => a.provider === "Steam");
                if (steam) setSteamId(steam.accountId);

                const xbox = data.find((a: any) => a.provider === "Xbox");
                if (xbox) setXboxXuid(xbox.accountId);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleLinkAccount = async (provider: string, accountId: string, apiKey: string) => {
        setLoading(true);
        setMessage("");

        try {
            let resolvedAccountId = accountId;

            // If Steam and not a 64-bit ID, try to resolve vanity URL
            if (provider === "Steam" && !/^\d{17}$/.test(accountId)) {
                const resolveRes = await fetch("/api/integrations/steam/resolve", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ vanityUrl: accountId, apiKey })
                });
                const resolveData = await resolveRes.json();

                if (resolveData.steamId) {
                    resolvedAccountId = resolveData.steamId;
                    setSteamId(resolvedAccountId); // Update the input with resolved ID
                } else {
                    setMessage("❌ No se pudo encontrar el perfil de Steam");
                    setLoading(false);
                    return;
                }
            }

            // If Xbox, verify Gamertag and get accounts details first
            if (provider === "Xbox") {
                // If accountId contains |, it means we already combined it in the form
                const parts = accountId.split("|");
                const gamertag = parts[0];
                const key = parts[1];

                const res = await fetch("/api/integrations/xbox/link", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ gamertag, apiKey: key })
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Error vinculando Xbox");
                }

                const data = await res.json();
                loadLinkedAccounts();
                setMessage(`Cuenta Xbox vinculada: ${data.username}`);
                setLoading(false);
                return; // Stop here, API handled saving
            }

            // Save other providers
            const res = await fetch("/api/settings/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider, accountId: resolvedAccountId, apiKey })
            });

            if (res.ok) {
                setMessage(`✅ Cuenta de ${provider} vinculada`);
                if (provider === "RetroAchievements") setRaApiKey("");
                if (provider === "Steam") setSteamApiKey("");
                loadLinkedAccounts();
            } else {
                const data = await res.json();
                setMessage(`❌ ${data.error}`);
            }
        } catch (e) {
            setMessage("❌ Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async (provider: string, endpoint: string) => {
        setSyncing(provider);
        setMessage("");

        try {
            const res = await fetch(endpoint, { method: "POST" });
            const data = await res.json();

            if (res.ok) {
                if (data.candidates && data.candidates.length > 0) {
                    setCandidates(data.candidates);
                    setShowModal(true);
                } else {
                    setMessage(`✅ ${data.message || 'Sincronización completada'}`);
                }
            } else {
                setMessage(`❌ ${data.error}${data.details ? `: ${data.details}` : ''}`);
            }
        } catch (e: any) {
            setMessage(`❌ Error al conectar: ${e.message || 'Desconocido'}`);
            console.error(e);
        } finally {
            setSyncing("");
        }
    };

    const handleConfirmSync = async (selected: any[], ignored: any[]) => {
        setShowModal(false);
        setLoading(true);
        setMessage("Guardando selección...");

        try {
            // Batch Add
            if (selected.length > 0) {
                await fetch("/api/games/batch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ games: selected })
                });
            }

            // Batch Ignore
            if (ignored.length > 0) {
                await fetch("/api/games/ignore", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ games: ignored })
                });
            }

            setMessage(`✅ ${selected.length} juegos añadidos. ${ignored.length} ignorados.`);
        } catch (e) {
            setMessage("❌ Error al guardar selección");
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading") {
        return <ProgressBar />;
    }

    const hasRA = linkedAccounts.some(a => a.provider === "RetroAchievements");
    const hasSteam = linkedAccounts.some(a => a.provider === "Steam");
    const hasXbox = linkedAccounts.some(a => a.provider === "Xbox");

    const inputStyle = {
        width: '100%',
        padding: '0.75rem 1rem',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--text-main)'
    };

    const syncBtnStyle = {
        padding: '0.75rem 1.5rem',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--primary)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--primary)',
        cursor: 'pointer',
        fontWeight: 600
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '600px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>
                <span className="title-gradient">Configuración</span>
            </h1>

            {message && (
                <div style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1.5rem',
                    background: message.startsWith('✅') ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
                    border: `1px solid ${message.startsWith('✅') ? 'var(--success)' : 'var(--error)'}`,
                }}>
                    {message}
                </div>
            )}

            {/* RetroAchievements */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🎮 RetroAchievements
                    {hasRA && <span style={{ fontSize: '0.75rem', background: 'var(--success)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>✓</span>}
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <a href="https://retroachievements.org/controlpanel.php" target="_blank" style={{ color: 'var(--primary)' }}>Obtener API Key</a>
                </p>
                <form onSubmit={(e) => { e.preventDefault(); handleLinkAccount("RetroAchievements", raUsername, raApiKey); }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Usuario</label>
                        <input type="text" value={raUsername} onChange={(e) => setRaUsername(e.target.value)} required style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>API Key</label>
                        <input type="password" value={raApiKey} onChange={(e) => setRaApiKey(e.target.value)} required placeholder={hasRA ? "(Introduce para actualizar)" : ""} style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn-primary" disabled={loading}>{hasRA ? 'Actualizar' : 'Vincular'}</button>
                        {hasRA && <button type="button" onClick={() => handleSync("RetroAchievements", "/api/integrations/retroachievements")} disabled={!!syncing} style={syncBtnStyle}>{syncing === "RetroAchievements" ? '...' : '🔄 Sync'}</button>}
                    </div>
                </form>
            </div>

            {/* Steam */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🎯 Steam
                    {hasSteam && <span style={{ fontSize: '0.75rem', background: 'var(--success)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>✓</span>}
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <a href="https://steamcommunity.com/dev/apikey" target="_blank" style={{ color: 'var(--primary)' }}>Obtener API Key</a>
                    {' · '}
                    <a href="https://steamid.io/" target="_blank" style={{ color: 'var(--primary)' }}>Encontrar tu Steam ID</a>
                </p>
                <form onSubmit={(e) => { e.preventDefault(); handleLinkAccount("Steam", steamId, steamApiKey); }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Steam ID o nombre de perfil</label>
                        <input type="text" value={steamId} onChange={(e) => setSteamId(e.target.value)} required placeholder="76561198... o tu_nombre_perfil" style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>API Key</label>
                        <input type="password" value={steamApiKey} onChange={(e) => setSteamApiKey(e.target.value)} required placeholder={hasSteam ? "(Introduce para actualizar)" : ""} style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn-primary" disabled={loading}>{hasSteam ? 'Actualizar' : 'Vincular'}</button>
                        {hasSteam && <button type="button" onClick={() => handleSync("Steam", "/api/integrations/steam")} disabled={!!syncing} style={syncBtnStyle}>{syncing === "Steam" ? '...' : '🔄 Sync'}</button>}
                    </div>
                </form>
            </div>

            {/* Xbox */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '2rem' }}>🎮</span>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Xbox</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Sincroniza tus juegos y logros de Xbox Live
                        </p>
                        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                            <a href="https://xbl.io/profile" target="_blank" style={{ color: 'var(--primary)' }}>Obtener API Key (OpenXBL)</a>
                        </p>
                    </div>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleLinkAccount("Xbox", `${xboxXuid}|${xboxApiKey}`, ""); }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                            Gamertag
                        </label>
                        <input type="text" value={xboxXuid} onChange={(e) => setXboxXuid(e.target.value)} required placeholder="Ej: MajorNelson" style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                            API Key (OpenXBL)
                        </label>
                        <input type="password" value={xboxApiKey} onChange={(e) => setXboxApiKey(e.target.value)} required placeholder={hasXbox ? "(Introduce para actualizar)" : ""} style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn-primary" disabled={loading}>{hasXbox ? 'Actualizar' : 'Vincular'}</button>
                        {hasXbox && <button type="button" onClick={() => handleSync("Xbox", "/api/integrations/xbox")} disabled={!!syncing} style={syncBtnStyle}>{syncing === "Xbox" ? '...' : '🔄 Sync'}</button>}
                    </div>
                </form>
            </div>

            {/* Profile Section */}
            <ProfileEditSection setMessage={setMessage} />

            {/* Showcases */}
            <ShowcaseManager setMessage={setMessage} />

            {/* Privacy Section */}
            <PrivacySection linkedAccounts={linkedAccounts} setMessage={setMessage} />

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button onClick={() => setShowIgnoredModal(true)} style={{ color: 'var(--text-muted)', textDecoration: 'underline', fontSize: '0.9rem' }}>
                    Gestionar juegos ignorados
                </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <a href="/library" style={{ color: 'var(--primary)' }}>← Volver a la biblioteca</a>
            </div>

            <SyncModal
                isOpen={showModal}
                candidates={candidates}
                onConfirm={handleConfirmSync}
                onCancel={() => setShowModal(false)}
            />

            <IgnoredGamesModal
                isOpen={showIgnoredModal}
                onClose={() => setShowIgnoredModal(false)}
            />
        </div>
    );
}

function PrivacySection({ linkedAccounts, setMessage }: { linkedAccounts: any[], setMessage: (msg: string) => void }) {
    const [isProfilePublic, setIsProfilePublic] = useState(true);
    const [isGamesListPublic, setIsGamesListPublic] = useState(true);
    const [hiddenProviders, setHiddenProviders] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadPrivacy() {
            try {
                const res = await fetch("/api/settings/privacy");
                if (res.ok) {
                    const data = await res.json();
                    setIsProfilePublic(data.isProfilePublic);
                    setIsGamesListPublic(data.isGamesListPublic);
                    setHiddenProviders(data.hiddenProviders || []);
                }
            } catch (e) {
                console.error(e);
            }
        }
        loadPrivacy();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/settings/privacy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isProfilePublic, isGamesListPublic, hiddenProviders })
            });
            if (res.ok) {
                setMessage("✅ Configuración de privacidad guardada");
            }
        } catch (e) {
            setMessage("❌ Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const toggleProvider = (provider: string) => {
        if (hiddenProviders.includes(provider)) {
            setHiddenProviders(hiddenProviders.filter(p => p !== provider));
        } else {
            setHiddenProviders([...hiddenProviders, provider]);
        }
    };

    const providers = [...new Set(linkedAccounts.map(a => a.provider))];

    const toggleStyle = {
        width: '50px',
        height: '26px',
        borderRadius: '13px',
        position: 'relative' as const,
        cursor: 'pointer',
        transition: 'background 0.2s'
    };

    const toggleKnobStyle = (active: boolean) => ({
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        background: 'white',
        position: 'absolute' as const,
        top: '2px',
        left: active ? '26px' : '2px',
        transition: 'left 0.2s'
    });

    return (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
                🔒 Privacidad
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontWeight: 600 }}>Perfil público</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Otros usuarios pueden ver tu perfil</div>
                    </div>
                    <div
                        onClick={() => setIsProfilePublic(!isProfilePublic)}
                        style={{ ...toggleStyle, background: isProfilePublic ? 'var(--primary)' : 'var(--bg-subtle)' }}
                    >
                        <div style={toggleKnobStyle(isProfilePublic)} />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontWeight: 600 }}>Lista de juegos pública</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Mostrar tu colección en tu perfil</div>
                    </div>
                    <div
                        onClick={() => setIsGamesListPublic(!isGamesListPublic)}
                        style={{ ...toggleStyle, background: isGamesListPublic ? 'var(--primary)' : 'var(--bg-subtle)' }}
                    >
                        <div style={toggleKnobStyle(isGamesListPublic)} />
                    </div>
                </div>

                {providers.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Ocultar juegos de:</div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {providers.map(provider => (
                                <button
                                    key={provider}
                                    onClick={() => toggleProvider(provider)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border)',
                                        background: hiddenProviders.includes(provider) ? 'var(--error)' : 'var(--bg-subtle)',
                                        color: hiddenProviders.includes(provider) ? 'white' : 'var(--text-main)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {hiddenProviders.includes(provider) ? '🙈' : '👁️'} {provider}
                                </button>
                            ))}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                            Los juegos de plataformas ocultas no aparecerán en tu perfil público
                        </div>
                    </div>
                )}

                <button
                    onClick={handleSave}
                    className="btn-primary"
                    disabled={saving}
                    style={{ marginTop: '1rem' }}
                >
                    {saving ? 'Guardando...' : 'Guardar Privacidad'}
                </button>
            </div>
        </div>
    );
}


