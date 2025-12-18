import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CatalogGameDetail from "@/components/CatalogGameDetail";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Próximos Lanzamientos | GamingShelf",
};

export default async function UpcomingPage({ searchParams }: { searchParams: Promise<any> }) {
    const params = await searchParams;
    const selectedGameId = params.gameId || null;

    // Fetch upcoming games
    const upcomingGames = await prisma.gameCatalog.findMany({
        where: {
            OR: [
                { releaseDate: { gte: new Date() } },
                { releaseDate: null, igdbId: { not: null } }
            ]
        },
        orderBy: [
            { releaseDate: { sort: 'asc', nulls: 'last' } },
            { releaseYear: { sort: 'asc', nulls: 'last' } }
        ],
        take: 100
    });

    // Helper to group by month
    const grouped = upcomingGames.reduce((acc: any, game: any) => {
        const date = game.releaseDate ? new Date(game.releaseDate) : null;
        const key = date
            ? date.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
            : "Fecha por confirmar (TBD)";

        if (!acc[key]) acc[key] = [];
        acc[key].push(game);
        return acc;
    }, {});

    return (
        <div className="container" style={{ padding: '3rem 1rem' }}>
            <div style={{ marginBottom: '3rem' }}>
                <Link href="/" style={{ color: 'var(--primary)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
                    ← Volver a Portada
                </Link>
                <h1 className="title-gradient" style={{ fontSize: '3rem', fontWeight: 800 }}>
                    Calendario de Lanzamientos
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginTop: '0.5rem' }}>
                    Los juegos más esperados que están por llegar.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                {Object.keys(grouped).map(month => (
                    <section key={month}>
                        <h2 style={{
                            fontSize: '1.5rem',
                            borderLeft: '4px solid var(--primary)',
                            paddingLeft: '1rem',
                            marginBottom: '1.5rem',
                            textTransform: 'capitalize'
                        }}>
                            {month}
                        </h2>
                        <div className="game-grid">
                            {grouped[month].map((game: any) => (
                                <Link
                                    key={game.id}
                                    href={`/catalog/upcoming?gameId=${game.id}`}
                                    className="card game-card"
                                    style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
                                >
                                    <div style={{
                                        aspectRatio: '3/4',
                                        background: game.coverUrl ? `url(${game.coverUrl}) center/cover` : 'var(--bg-subtle)',
                                        borderRadius: 'var(--radius-md) var(--radius-md) 0 0'
                                    }}></div>
                                    <div style={{ padding: '1rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{game.title}</h3>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                                            {game.releaseDate ? new Date(game.releaseDate).toLocaleDateString() : 'TBD'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                            {game.developer || 'Desarrollador desconocido'}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
                {upcomingGames.length === 0 && (
                    <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No hay lanzamientos próximos registrados.
                    </div>
                )}
            </div>

            {selectedGameId && (
                <CatalogGameDetail
                    id={selectedGameId}
                    onCloseRedirect="/catalog/upcoming"
                />
            )}
        </div>
    );
}

