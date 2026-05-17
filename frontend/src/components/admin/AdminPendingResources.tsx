import React, { useState, useEffect, useCallback } from 'react';
import { getErrorMessage } from '../../utils/apiHelpers.js';
import { formatDate, formatDateTime } from '../../utils/dateFormatter.js';
import Pagination from '../common/Pagination.tsx';
import ConfirmDialog from '../common/ConfirmDialog.tsx';
import { SkeletonRow, EmptyState, ErrorState, TableWrapper, SectionHeader, FormField,
         PILL, IBTN, BTN_PRIMARY, BTN_CANCEL, BTN_WARN, BTN_DANGER, BTN_SUCCESS,
         ROLE_LABELS, ROLE_COLORS, ROLE_OPTIONS, EVENT_CATEGORIES, CATCOLORS } from './adminShared.tsx';
import { FileText, Check, X, Loader2 } from 'lucide-react';
import { getPendingResources, approveResource, rejectResource } from '../../api/resources.api.js';

// ─── 2. Pending Resources Tab ─────────────────────────────────────────────────
const AdminPendingResources = ({ showToast, onCountChange }) => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState('');
    const [actioning, setActioning] = useState({});
    const [confirm, setConfirm] = useState(null);

    const fetchPending = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const res = await getPendingResources({ page, limit: 20 });
            const payload = res.data?.data;
            const list = Array.isArray(payload) ? payload : [];
            setResources(list);
            setTotalPages(res.data?.totalPages || 1);
            onCountChange?.(res.data?.total || list.length);
        } catch (err) { setError(getErrorMessage(err)); }
        finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchPending(); }, [fetchPending]);

    const handleApprove = async (id) => {
        setActioning((p) => ({ ...p, [id]: 'approve' }));
        try {
            await approveResource(id);
            const next = resources.filter((r) => r.id !== id);
            setResources(next); onCountChange?.(next.length);
            showToast('Resource approved!', 'success');
        } catch (err) { showToast(getErrorMessage(err), 'error'); }
        finally { setActioning((p) => ({ ...p, [id]: null })); }
    };

    const confirmReject = async () => {
        const { id } = confirm; setConfirm(null);
        setActioning((p) => ({ ...p, [id]: 'reject' }));
        try {
            await rejectResource(id);
            const next = resources.filter((r) => r.id !== id);
            setResources(next); onCountChange?.(next.length);
            showToast('Resource rejected.', 'success');
        } catch (err) { showToast(getErrorMessage(err), 'error'); }
        finally { setActioning((p) => ({ ...p, [id]: null })); }
    };

    const TYPE_COLORS = { framework: '#1A4731', whitepaper: '#7C3AED', product: '#D97706' };

    if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{[1,2,3].map((i) => <div key={i} style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', height: '88px', animation: 'adm-pulse 1.4s ease-in-out infinite' }} />)}</div>;
    if (error) return <ErrorState message={error} onRetry={fetchPending} />;
    if (resources.length === 0) return (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'white', borderRadius: '14px', border: '1px solid #F1F5F9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', background: '#F0FDF4', borderRadius: '14px', border: '1px solid #BBF7D0', margin: '0 auto 1rem' }}><Check size={22} color="#16A34A" style={{ display: 'block' }} /></div>
            <p style={{ color: '#15803D', fontWeight: '700', margin: '0 0 4px', fontSize: '0.925rem' }}>All caught up!</p>
            <p style={{ color: '#86EFAC', margin: 0, fontSize: '0.8rem' }}>No pending resource approvals at this time.</p>
        </div>
    );

    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {resources.map((r) => (
                    <div key={r.id} style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.1rem 1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: '1 1 200px', minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: '700', fontSize: '0.975rem', color: '#1E293B' }}>{r.title}</span>
                                <span style={PILL(TYPE_COLORS[r.type] || '#64748B', `${TYPE_COLORS[r.type] || '#64748B'}18`)}>{r.type}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '600' }}>{r.uploader_name || 'Unknown'}</span>
                                <span style={PILL(ROLE_COLORS[r.uploader_role] || '#64748B', `${ROLE_COLORS[r.uploader_role] || '#64748B'}18`)}>{ROLE_LABELS[r.uploader_role] || r.uploader_role || 'Member'}</span>
                                <span style={{ fontSize: '0.75rem', color: '#94A3B8', background: '#F1F5F9', padding: '2px 10px', borderRadius: '100px' }}>Submitted: {formatDate(r.created_at)}</span>
                            </div>
                            <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                                <Mail size={11} /> {r.uploader_email}
                                {r.uploader_org && <><span style={{ margin: '0 4px' }}>·</span><Building size={11} /> {r.uploader_org}</>}
                                {r.uploader_linkedin && <><span style={{ margin: '0 4px' }}>·</span><a href={r.uploader_linkedin} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0A66C2', textDecoration: 'none', fontWeight: '600' }}><Globe size={11} /> LinkedIn</a></>}
                            </span>
                            {r.description && <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B', maxWidth: '480px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</p>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0, flexWrap: 'wrap' }}>
                            <a href={`/resources/${r.id}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'white', color: '#1A4731', border: '1.5px solid #1A4731', padding: '9px 16px', borderRadius: '9px', fontWeight: '700', fontSize: '0.88rem', textDecoration: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }} onMouseOver={e => e.currentTarget.style.background='#f0f4f8'} onMouseOut={e => e.currentTarget.style.background='white'}>
                                <Eye size={14} /> View
                            </a>
                            <button onClick={() => handleApprove(r.id)} disabled={!!actioning[r.id]} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#16A34A', color: 'white', border: 'none', padding: '9px 20px', borderRadius: '9px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit', opacity: actioning[r.id] ? 0.6 : 1 }}>
                                {actioning[r.id] === 'approve' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />} Approve
                            </button>
                            <button onClick={() => setConfirm({ id: r.id })} disabled={!!actioning[r.id]} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#DC2626', color: 'white', border: 'none', padding: '9px 20px', borderRadius: '9px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit', opacity: actioning[r.id] ? 0.6 : 1 }}>
                                {actioning[r.id] === 'reject' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <X size={14} />} Reject
                            </button>
                        </div>
                    </div>
                ))}
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
            <ConfirmDialog isOpen={!!confirm} title="Reject Resource" message="Are you sure you want to reject this resource? It will not be visible to users." confirmLabel="Reject" onConfirm={confirmReject} onClose={() => setConfirm(null)} />
        </>
    );
};

export default AdminPendingResources;
