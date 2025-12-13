"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import GameCard from "@/components/GameCard";

interface PopularGame {
  title: string;
  platform: string;
  coverUrl: string | null;
  playerCount: number;
}

interface RecentGame {
  id: string;
  title: string;
  platform: string;
  coverUrl: string | null;
  status: string;
  progress: number;
  user: { username: string };
}

export default function Home() {
  const { data: session } = useSession();
  const [popularGames, setPopularGames] = useState<PopularGame[]>([]);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [popularRes, recentRes] = await Promise.all([
          fetch('/api/games/popular'),
          fetch('/api/games/recent')
        ]);

        if (popularRes.ok) setPopularGames(await popularRes.json());
        if (recentRes.ok) setRecentGames(await recentRes.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const userName = session?.user?.name || "Jugador";

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>

      {/* Header */}
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
          Hola, <span className="title-gradient">{userName}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Bienvenido a G-TRACKER. Explora tu colección y descubre nuevos juegos.
        </p>
      </header>

      {/* Quick Actions */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/library" className="glass-panel" style={{
            padding: '1.5rem 2rem',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flex: 1,
            minWidth: '200px'
          }}>
            <span style={{ fontSize: '2rem' }}>🎮</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Mi Biblioteca</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ver todos tus juegos</div>
            </div>
          </Link>

          <Link href="/forum" className="glass-panel" style={{
            padding: '1.5rem 2rem',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flex: 1,
            minWidth: '200px'
          }}>
            <span style={{ fontSize: '2rem' }}>💬</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Foro</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Únete a la comunidad</div>
            </div>
          </Link>

          {session?.user && (
            <Link href="/settings" className="glass-panel" style={{
              padding: '1.5rem 2rem',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flex: 1,
              minWidth: '200px'
            }}>
              <span style={{ fontSize: '2rem' }}>🔗</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Vincular Cuentas</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Steam, RetroAchievements</div>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Popular Games */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>🔥 Juegos Populares</h3>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Cargando...</div>
        ) : popularGames.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '1.5rem'
          }}>
            {popularGames.slice(0, 8).map((game, i) => (
              <div key={i} className="glass-panel" style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <div style={{
                  aspectRatio: '3/4',
                  background: game.coverUrl ? `url(${game.coverUrl}) center/cover` : 'linear-gradient(135deg, var(--primary), var(--bg-subtle))',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '0.5rem'
                }} />
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{game.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{game.platform}</div>
                <div style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  👤 {game.playerCount} jugadores
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            No hay datos todavía. ¡Conecta tus cuentas para empezar!
          </div>
        )}
      </section>

      {/* Recent Activity */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>⚡ Actividad Reciente</h3>
          <Link href="/library" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>Ver todo</Link>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Cargando...</div>
        ) : recentGames.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '1.5rem'
          }}>
            {recentGames.slice(0, 8).map((game) => (
              <GameCard
                key={game.id}
                id={game.id}
                title={game.title}
                platform={game.platform}
                progress={game.progress}
                coverGradient={game.coverUrl || undefined}
                status={game.status}
              />
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            No hay actividad reciente
          </div>
        )}
      </section>

    </div>
  );
}
