
interface ViewToggleProps {
    viewMode: 'grid' | 'list';
    onViewChange: (mode: 'grid' | 'list') => void;
}

const IconGrid = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
);

const IconList = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
);

export default function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
    const btnStyle = (active: boolean): React.CSSProperties => ({
        background: active ? 'var(--primary)' : 'transparent',
        color: active ? 'white' : 'var(--text-secondary)',
        border: '1px solid',
        borderColor: active ? 'var(--primary)' : 'var(--border)',
        padding: '8px',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    });

    return (
        <div style={{ display: 'flex', gap: '8px' }}>
            <button
                style={btnStyle(viewMode === 'grid')}
                onClick={() => onViewChange('grid')}
                aria-label="Grid View"
            >
                <IconGrid />
            </button>
            <button
                style={btnStyle(viewMode === 'list')}
                onClick={() => onViewChange('list')}
                aria-label="List View"
            >
                <IconList />
            </button>
        </div>
    );
}
