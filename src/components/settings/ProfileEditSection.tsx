
"use client";
import { useState, useEffect } from "react";

export default function ProfileEditSection({ setMessage }: { setMessage: (msg: string) => void }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        realName: "",
        bio: "",
        avatarUrl: "",
        twitter: "",
        instagram: "",
        platforms: ""
    });

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/settings/profile");
                if (res.ok) {
                    const data = await res.json();
                    let social = { twitter: "", instagram: "" };
                    try { social = JSON.parse(data.socialLinks || '{}'); } catch { }

                    let platforms = "";
                    try {
                        const p = JSON.parse(data.favoritePlatforms || '[]');
                        platforms = Array.isArray(p) ? p.join(", ") : p;
                    } catch { }

                    setFormData({
                        realName: data.realName || "",
                        bio: data.bio || "",
                        avatarUrl: data.avatarUrl || "",
                        twitter: social.twitter || "",
                        instagram: social.instagram || "",
                        platforms: platforms || ""
                    });
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const socialLinks = {
                twitter: formData.twitter,
                instagram: formData.instagram
            };
            const favoritePlatforms = formData.platforms.split(",").map(s => s.trim()).filter(Boolean);

            const res = await fetch("/api/settings/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    realName: formData.realName,
                    bio: formData.bio,
                    avatarUrl: formData.avatarUrl,
                    socialLinks,
                    favoritePlatforms
                })
            });

            if (res.ok) {
                setMessage("✅ Perfil actualizado");
            } else {
                setMessage("❌ Error al guardar perfil");
            }
        } catch (e) {
            setMessage("❌ Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) return null;

    return (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
                👤 Perfil
            </h2>

            <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Nombre Real</label>
                    <input type="text" value={formData.realName} onChange={e => handleChange('realName', e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }} />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Avatar URL</label>
                    <input type="text" value={formData.avatarUrl} onChange={e => handleChange('avatarUrl', e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }} />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Bio</label>
                    <textarea value={formData.bio} onChange={e => handleChange('bio', e.target.value)} rows={3} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Twitter / X</label>
                        <input type="text" value={formData.twitter} onChange={e => handleChange('twitter', e.target.value)} placeholder="@usuario" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Instagram</label>
                        <input type="text" value={formData.instagram} onChange={e => handleChange('instagram', e.target.value)} placeholder="@usuario" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }} />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Plataformas Favoritas (separadas por coma)</label>
                    <input type="text" value={formData.platforms} onChange={e => handleChange('platforms', e.target.value)} placeholder="PC, PS5, Switch..." style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }} />
                </div>

                <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: '0.5rem' }}>
                    {saving ? 'Guardando...' : 'Guardar Perfil'}
                </button>
            </div>
        </div>
    );
}
