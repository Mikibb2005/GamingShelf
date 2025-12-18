import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
// We will use the standalone CatalogGameDetail as a modal trigger if we want, 
// or just implement a small client component for the 'Add to Collection' logic.
import AddToCollectionButton from "./AddToCollectionButton";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const game = await prisma.gameCatalog.findUnique({ where: { id } });
    return {
        title: `${game?.title || 'Juego'} | GamingShelf`,
    };
}

export default async function CatalogDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();

    const gameData = await prisma.gameCatalog.findUnique({
        where: { id }
    });

    if (!gameData) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Juego no encontrado</div>;

    const game = {
        ...gameData,
        platforms: gameData.platforms ? JSON.parse(gameData.platforms) : [],
        screenshots: gameData.screenshots ? JSON.parse(gameData.screenshots) : [],
        metacriticScore: gameData.opencriticScore && gameData.opencriticScore > 0 ? gameData.opencriticScore : null
    };

    const bgStyle = {
        position: 'relative' as const,
        height: '350px',
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '-100px'
    };

    return (
        <div className="container" style={{ padding: '0 1rem 2rem' }}>
            {/* Hero */}
            <div style={bgStyle}>
                <Image
                    src={game.screenshots[0] || game.coverUrl || ""}
                    alt="Hero"
                    fill
                    priority
                    style={{ objectFit: 'cover' }}
                    className="skeleton"
                />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), var(--bg-app))',
                    zIndex: 1
                }}></div>
                <Link
                    href=".."
                    style={{
                        position: 'absolute', top: '20px', left: '20px', zIndex: 10,
                        background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white',
                        textDecoration: 'none', fontSize: '0.9rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '8px 16px', borderRadius: '20px',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    ← Volver
                </Link>
            </div>

            <div style={{ padding: '0 2rem', position: 'relative', display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap', zIndex: 2 }}>

                {/* Cover */}
                <div style={{ flexShrink: 0, position: 'relative', width: '200px', height: '300px' }}>
                    <Image
                        src={game.coverUrl || "/placeholder.jpg"}
                        alt="Cover"
                        fill
                        sizes="200px"
                        style={{
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-lg)',
                            border: '4px solid var(--bg-card)'
                        }}
                        className="skeleton"
                    />
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{game.title}</h1>
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', alignItems: 'center' }}>
                        <span>{game.releaseYear}</span>
                        <span>•</span>
                        <span>{game.developer}</span>
                        <span style={{
                            background: game.metacriticScore
                                ? (game.metacriticScore >= 75 ? '#66cc33' : game.metacriticScore >= 50 ? '#ffcc33' : '#ff3333')
                                : '#666',
                            color: game.metacriticScore ? 'black' : '#aaa',
                            fontWeight: 700, padding: '2px 8px', borderRadius: '4px'
                        }}>
                            {game.metacriticScore || '-'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <AddToCollectionButton
                            gameId={game.id}
                            platforms={game.platforms}
                            gameTitle={game.title}
                            coverUrl={game.coverUrl}
                            releaseYear={game.releaseYear}
                            genres={game.genres}
                        />
                    </div>

                    {/* Genres & Platforms */}
                    <div style={{ marginBottom: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                        <div><strong>GÉNEROS</strong><br />{game.genres}</div>
                        <div><strong>PLATAFORMAS</strong><br />{game.platforms.join(", ")}</div>
                        <div><strong>PUBLISHER</strong><br />{game.publisher}</div>
                    </div>

                    {/* Description */}
                    {game.description && (
                        <div style={{ lineHeight: 1.6, maxWidth: '800px', background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700 }}>Sinopsis</h3>
                            <p style={{ color: '#ccc' }}>{game.description}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Screenshots Grid */}
            {game.screenshots.length > 0 && (
                <div style={{ marginTop: '4rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 700 }}>Galería de Imágenes</h2>
                    <div className="game-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                        {game.screenshots.map((s: string, i: number) => (
                            <div key={i} style={{ position: 'relative', aspectRatio: '16/9', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                <Image
                                    src={s}
                                    alt={`Screenshot ${i}`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    style={{ objectFit: 'cover', cursor: 'pointer' }}
                                    className="skeleton"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

