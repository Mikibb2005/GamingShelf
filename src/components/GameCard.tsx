import Link from "next/link";
import Image from "next/image";
import styles from './GameCard.module.css';

interface GameCardProps {
    id?: string;
    title: string;
    platform: string;
    progress?: number;
    coverGradient?: string;
    layout?: 'grid' | 'list';
    releaseYear?: number;
    achievements?: { unlocked: number; total: number };
    status?: string;
}

export default function GameCard({
    id,
    title,
    platform,
    progress = 0,
    coverGradient,
    layout = 'grid',
    releaseYear,
    achievements,
    status
}: GameCardProps) {

    const isExternalImage = coverGradient && coverGradient.startsWith('http');
    const backgroundStyle = !isExternalImage
        ? { background: coverGradient || 'linear-gradient(135deg, #333, #555)' }
        : {};

    const CardContent = () => {
        if (layout === 'list') {
            return (
                <div className={styles.list}>
                    <div className={styles.cover} style={backgroundStyle}>
                        {isExternalImage && (
                            <Image
                                src={coverGradient}
                                alt={title}
                                fill
                                sizes="120px"
                                style={{ objectFit: 'cover' }}
                                className="skeleton"
                            />
                        )}
                        <div className={styles.platformTag} style={{ zIndex: 1 }}>{platform}</div>
                    </div>
                    <div className={styles.content}>
                        <div className={styles.listInfo}>
                            <div className={styles.title}>{title}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {status} • {releaseYear}
                            </div>
                        </div>

                        <div className={styles.listStats}>
                            {achievements && (
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Logros</span>
                                    <span className={styles.statValue}>{achievements.unlocked}/{achievements.total}</span>
                                </div>
                            )}
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Progreso</span>
                                <span className={styles.statValue}>{progress}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Grid Layout (Default)
        return (
            <div className={styles.card}>
                <div className={styles.cover} style={backgroundStyle}>
                    {isExternalImage && (
                        <Image
                            src={coverGradient}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 160px, 200px"
                            style={{ objectFit: 'cover' }}
                            className="skeleton"
                        />
                    )}
                    <div className={styles.platformTag} style={{ zIndex: 1 }}>{platform}</div>
                    {/* Achievement badge in grid view */}
                    {achievements && achievements.total > 0 && (
                        <div style={{
                            position: 'absolute',
                            bottom: 5,
                            right: 5,
                            background: 'rgba(0,0,0,0.8)',
                            color: achievements.unlocked === achievements.total ? '#66cc33' : 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            zIndex: 1
                        }}>
                            🏆 {achievements.unlocked}/{achievements.total}
                        </div>
                    )}
                </div>
                <div className={styles.content}>
                    <div className={styles.title}>{title}</div>
                    <div className={styles.meta}>
                        <span>{status || 'Juego'}</span>
                        <span>{progress}%</span>
                    </div>
                    {progress > 0 && (
                        <div className={styles.progressBarBack}>
                            <div
                                className={styles.progressBarFill}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (id) {
        return (
            <Link href={`/game/${id}`} style={{ display: 'block', textDecoration: 'none' }}>
                <CardContent />
            </Link>
        );
    }

    return <CardContent />;
}
