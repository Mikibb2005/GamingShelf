export default function MessagesLoading() {
    return (
        <div className="container" style={{ padding: '2rem 1rem', height: 'calc(100vh - 100px)', display: 'flex', gap: '1.5rem' }}>
            {/* Sidebar Skeleton */}
            <div className="card" style={{ width: '300px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <div className="skeleton" style={{ height: '1.5rem', width: '120px', borderRadius: '4px' }}></div>
                </div>
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
                            <div style={{ flex: 1 }}>
                                <div className="skeleton" style={{ height: '0.9rem', width: '60%', marginBottom: '0.4rem', borderRadius: '4px' }}></div>
                                <div className="skeleton" style={{ height: '0.7rem', width: '80%', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Skeleton */}
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <div className="skeleton" style={{ height: '1.2rem', width: '150px', borderRadius: '4px' }}></div>
                </div>
                <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="skeleton" style={{ height: '3rem', width: '60%', alignSelf: 'flex-start', borderRadius: '12px' }}></div>
                    <div className="skeleton" style={{ height: '2rem', width: '40%', alignSelf: 'flex-end', borderRadius: '12px' }}></div>
                    <div className="skeleton" style={{ height: '4rem', width: '50%', alignSelf: 'flex-start', borderRadius: '12px' }}></div>
                    <div className="skeleton" style={{ height: '2.5rem', width: '30%', alignSelf: 'flex-end', borderRadius: '12px' }}></div>
                </div>
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
                    <div className="skeleton" style={{ flex: 1, height: '3rem', borderRadius: '24px' }}></div>
                    <div className="skeleton" style={{ width: '80px', height: '3rem', borderRadius: '24px' }}></div>
                </div>
            </div>
        </div>
    );
}
