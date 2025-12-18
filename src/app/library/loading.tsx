export default function LibraryLoading() {
    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <div className="skeleton" style={{ height: '3.5rem', width: '300px', marginBottom: '1rem', borderRadius: 'var(--radius-md)' }}></div>
                <div className="skeleton" style={{ height: '1.2rem', width: '200px', borderRadius: 'var(--radius-sm)' }}></div>
            </header>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton" style={{ height: '2.5rem', width: '100px', borderRadius: 'var(--radius-lg)' }}></div>
                ))}
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <div className="skeleton" style={{ height: '3.5rem', width: '100%', borderRadius: 'var(--radius-lg)' }}></div>
            </div>

            <div className="game-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="skeleton" style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-md)' }}></div>
                ))}
            </div>
        </div>
    );
}
