export default function GlobalLoading() {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'transparent',
            zIndex: 10000,
            overflow: 'hidden'
        }}>
            <div style={{
                height: '100%',
                width: '100%',
                background: 'linear-gradient(90deg, var(--primary), var(--accent), var(--primary))',
                backgroundSize: '200% 100%',
                animation: 'skeleton-loading 1s infinite linear',
            }} />
        </div>
    );
}
