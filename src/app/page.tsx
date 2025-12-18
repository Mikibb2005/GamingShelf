import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import GameCard from "@/components/GameCard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inicio | GamingShelf",
};

export default async function Home() {
  const session = await auth();

  // 1. Featured (Recent Hits)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const featured = await prisma.gameCatalog.findMany({
    where: {
      releaseDate: {
        gte: sixMonthsAgo,
        lte: new Date()
      }
    },
    orderBy: [
      { opencriticScore: { sort: 'desc', nulls: 'last' } },
      { metacritic: { sort: 'desc', nulls: 'last' } },
      { releaseDate: 'desc' }
    ],
    take: 12
  });

  // 2. Upcoming
  const upcoming = await prisma.gameCatalog.findMany({
    where: {
      OR: [
        { releaseDate: { gt: new Date() } },
        { releaseDate: null, releaseYear: { gte: new Date().getFullYear() } },
        { releaseDate: null, releaseYear: null }
      ],
      igdbId: { not: null }
    },
    orderBy: [
      { releaseDate: { sort: 'asc', nulls: 'last' } },
      { releaseYear: { sort: 'asc', nulls: 'last' } }
    ],
    take: 15
  });

  // 3. Playing (User)
  let playing: any[] = [];
  if (session?.user?.id) {
    playing = await prisma.game.findMany({
      where: {
        userId: session.user.id,
        status: 'playing'
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });
  }

  // 4. Recent Reviews
  const reviews = await prisma.comment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: { select: { username: true, id: true, isProfilePublic: true } },
      game: { select: { title: true, coverUrl: true, id: true } }
    }
  });

  const userName = session?.user?.name || "Jugador";

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>

      {/* Header */}
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>
            Hola, <span className="title-gradient">{userName}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
            ¿A qué jugamos hoy?
          </p>
        </div>
        {!session && (
          <Link href="/login" className="btn-primary">Iniciar Sesión</Link>
        )}
      </header>

      {/* 1. NEW RELEASES & TRENDING */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span>🔥</span> Tendencias y Novedades
        </h2>
        <div style={{
          display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem',
          scrollbarWidth: 'none', msOverflowStyle: 'none'
        }}>
          {featured.map((game: any, index: number) => (
            <Link href={`/catalog/${game.id}`} key={game.id} style={{
              minWidth: '220px', width: '220px', textDecoration: 'none', color: 'inherit',
              flexShrink: 0
            }}>
              <div style={{
                aspectRatio: '3/4',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                marginBottom: '0.75rem',
                boxShadow: 'var(--shadow-md)',
                position: 'relative'
              }}>
                <Image
                  src={game.coverUrl}
                  alt={game.title}
                  fill
                  sizes="220px"
                  style={{ objectFit: 'cover' }}
                  priority={index < 4}
                  className="skeleton"
                />
                {(game.opencriticScore || game.metacritic) && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: (game.opencriticScore || game.metacritic) >= 80 ? '#66cc33' : '#ffcc33',
                    color: 'black', fontWeight: 800, padding: '4px 8px', borderRadius: '4px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                    fontSize: '0.9rem',
                    zIndex: 1
                  }}>
                    {game.opencriticScore || game.metacritic}
                  </div>
                )}
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{game.title}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>{game.releaseDate ? new Date(game.releaseDate).getFullYear() : 'N/A'}</span>
                <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.developer}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 1b. UPCOMING */}
      <section style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span>📅</span> Próximos Lanzamientos
          </h2>
          <Link href="/catalog/upcoming" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', fontSize: '1rem' }}>
            Ver calendario completo →
          </Link>
        </div>
        <div style={{
          display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem',
          scrollbarWidth: 'none', msOverflowStyle: 'none'
        }}>
          {upcoming.map((game: any) => (
            <Link href={`/catalog/${game.id}`} key={game.id} style={{
              minWidth: '220px', width: '220px', textDecoration: 'none', color: 'inherit',
              flexShrink: 0
            }}>
              <div style={{
                aspectRatio: '3/4',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                marginBottom: '0.75rem',
                boxShadow: 'var(--shadow-md)',
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <Image
                  src={game.coverUrl}
                  alt={game.title}
                  fill
                  sizes="220px"
                  style={{ objectFit: 'cover' }}
                  className="skeleton"
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.3))',
                  zIndex: 1
                }}></div>
                <div style={{
                  background: 'rgba(0,0,0,0.7)',
                  border: '1px solid var(--primary)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  textTransform: 'uppercase',
                  zIndex: 2,
                  backdropFilter: 'blur(4px)'
                }}>
                  {game.releaseDate ? new Date(game.releaseDate).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : 'TBD'}
                </div>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{game.title}</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Lanzamiento: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{game.releaseDate ? new Date(game.releaseDate).toLocaleDateString() : 'TBD'}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. PLAYING NOW */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🕹️ Jugando Ahora
        </h2>
        {playing.length > 0 ? (
          <div className="game-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {playing.map((game: any) => (
              <GameCard
                key={game.id}
                id={game.id}
                title={game.title}
                coverGradient={game.coverUrl}
                platform={game.platform}
                progress={game.progress}
                status={game.status}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              No estás jugando a nada actualmente.
            </p>
            <Link href="/library" className="btn-primary">
              Ir a Biblioteca y marcar juego como "Jugando"
            </Link>
          </div>
        )}
      </section>

      {/* 3. RECENT REVIEWS */}
      <section>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          💬 Reseñas de la Comunidad
        </h2>
        <div className="game-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {reviews.map((review: any) => (
            <div key={review.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* User & Game Header */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{
                  width: '50px', height: '50px',
                  background: `url(${review.game.coverUrl}) center/cover`,
                  borderRadius: 'var(--radius-sm)',
                  flexShrink: 0
                }}></div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {review.user.username}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    en <span style={{ color: 'var(--primary)' }}>{review.game.title}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div style={{
                background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)',
                fontStyle: 'italic', lineHeight: 1.5, color: '#ddd',
                flex: 1
              }}>
                "{review.content}"
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', borderRadius: 'var(--radius-md)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '1rem' }}>
                Aún no hay reseñas.
              </p>
              <p style={{ color: 'var(--text-secondary)' }}>¡Sé el primero en comentar un juego!</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

