import React from 'react';
// ─── AdminDashboard Shared Helpers & Constants ─────────────────────────────────
// Imported by all AdminDashboard sub-components

export const ROLE_OPTIONS = ['founding_member', 'council_member', 'professional'];
export const ROLE_LABELS: Record<string, string>  = { founding_member: 'Founding Member', council_member: 'Council Member', professional: 'Professional' };
export const ROLE_COLORS: Record<string, string>  = { founding_member: '#7C3AED', council_member: '#0284C7', professional: '#059669' };
export const EVENT_CATEGORIES = ['webinar', 'seminar', 'workshop', 'podcast', 'conference'];
export const CATCOLORS: Record<string, string> = { webinar: '#0284C7', seminar: '#059669', workshop: '#7C3AED', podcast: '#DC2626', conference: '#D97706' };

export const PILL = (color: string, bg: string) => ({
    display: 'inline-block', whiteSpace: 'nowrap' as const, textTransform: 'capitalize' as const,
    fontSize: '0.7rem', fontWeight: '700', padding: '3px 10px', borderRadius: '100px',
    color, background: bg,
});

export const IBTN = (color: string, bg: string) => ({
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    border: 'none', padding: '5px 11px', borderRadius: '7px',
    fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer',
    fontFamily: 'inherit', color, background: bg, transition: 'opacity 0.15s',
});

export const BTN_PRIMARY = { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#1A4731', color: 'white', border: '1px solid #122F21', padding: '8px 16px', borderRadius: '7px', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' };
export const BTN_CANCEL  = { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', padding: '8px 16px', borderRadius: '7px', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' };
export const BTN_WARN    = { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', padding: '6px 12px', borderRadius: '7px', fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' };
export const BTN_DANGER  = { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '6px 12px', borderRadius: '7px', fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' };
export const BTN_SUCCESS = { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', padding: '6px 12px', borderRadius: '7px', fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' };

export const SkeletonRow = ({ cols = 4 }: { cols?: number }) => (
    <tr>
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} style={{ padding: '0.85rem 1rem' }}>
                <div style={{ height: '11px', background: '#E2E8F0', borderRadius: '4px', width: `${50 + (i * 15) % 40}%`, animation: 'adm-pulse 1.4s ease-in-out infinite' }} />
            </td>
        ))}
    </tr>
);

export const EmptyState = ({ icon: Icon, message }: { icon: any; message: string }) => (
    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'white', borderRadius: '14px', border: '1px solid #F1F5F9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', margin: '0 auto 1rem' }}>
            <Icon size={22} style={{ opacity: 0.4, color: '#64748B', display: 'block' }} />
        </div>
        <p style={{ fontSize: '0.875rem', margin: 0, color: '#94A3B8', fontWeight: '500' }}>{message}</p>
    </div>
);

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#EF4444' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
        <p style={{ marginBottom: '1.25rem', fontSize: '0.875rem' }}>{message}</p>
        {onRetry && (
            <button onClick={onRetry} style={IBTN('white', '#1A4731')}>
                ↺ Retry
            </button>
        )}
    </div>
);

export const TableWrapper = ({ children, headers }: { children: React.ReactNode; headers: string[] }) => (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                        {headers.map((h) => (
                            <th key={h} style={{ padding: '0.7rem 1rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>{children}</tbody>
            </table>
        </div>
    </div>
);

export const SectionHeader = ({ icon: Icon, title, subtitle, action }: { icon: any; title: string; subtitle?: string; action?: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '2px solid #F1F5F9', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '40px', height: '40px', background: '#1A4731', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(26,71,49,0.3)' }}>
                <Icon size={18} color="#6EE7B7" />
            </div>
            <div>
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#0F172A', letterSpacing: '-0.01em' }}>{title}</h2>
                {subtitle && <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94A3B8', fontWeight: '500' }}>{subtitle}</p>}
            </div>
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
);

export const FormField = ({ label, required, error, children }: { label: string; required?: boolean; error?: string | null; children: React.ReactNode }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}{required && <span style={{ color: '#EF4444', marginLeft: '2px' }}>*</span>}
        </label>
        {children}
        {error && <p style={{ color: '#EF4444', fontSize: '0.72rem', margin: 0 }}>{error}</p>}
    </div>
);
