import React, { useState, useEffect, useCallback } from 'react';
import { getErrorMessage } from '../../utils/apiHelpers.js';
import { formatDate, formatDateTime } from '../../utils/dateFormatter.js';
import Pagination from '../common/Pagination.tsx';
import ConfirmDialog from '../common/ConfirmDialog.tsx';
import { SkeletonRow, EmptyState, ErrorState, TableWrapper, SectionHeader, FormField,
         PILL, IBTN, BTN_PRIMARY, BTN_CANCEL, BTN_WARN, BTN_DANGER, BTN_SUCCESS,
         ROLE_LABELS, ROLE_COLORS, ROLE_OPTIONS, EVENT_CATEGORIES, CATCOLORS } from './adminShared.tsx';
import { FileText, Trash2, BookOpen } from 'lucide-react';
import { getResources, deleteResource } from '../../api/resources.api.js';

// ─── 6. Manage Resources Tab ──────────────────────────────────────────────────
const AdminResources = ({ showToast }) => {
    const [resources, setResources] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [confirm, setConfirm] = useState(null);
    const [deleting, setDeleting] = useState({});
    const [typeFilter, setTypeFilter] = useState('all');

    const fetchResources = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const params = { page, limit: 15 };
            if (typeFilter !== 'all') params.type = typeFilter;
            const res = await getResources(params);
            const payload = res.data?.data;
            setResources(Array.isArray(payload) ? payload : (payload?.resources || []));
            setTotalPages(payload?.totalPages ?? 1);
        } catch (err) { setError(getErrorMessage(err)); }
        finally { setLoading(false); }
    }, [page, typeFilter]);

    useEffect(() => { fetchResources(); }, [fetchResources]);

    const handleDelete = async () => {
        const { id } = confirm; setConfirm(null); setDeleting((p) => ({ ...p, [id]: true }));
        try { await deleteResource(id); setResources((prev) => prev.filter((r) => r.id !== id)); showToast('Resource deleted.', 'success'); }
        catch (err) { showToast(getErrorMessage(err), 'error'); }
        finally { setDeleting((p) => ({ ...p, [id]: false })); }
    };

    const TYPE_COLORS = { framework: '#1A4731', whitepaper: '#7C3AED', product: '#D97706' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SectionHeader icon={FileText} title="Manage Resources" subtitle={`${resources.length} result${resources.length !== 1 ? 's' : ''}`}
                action={
                    <div style={{ display: 'flex', gap: '4px', background: '#E2E8F0', borderRadius: '8px', padding: '3px' }}>
                        {['all', 'framework', 'whitepaper', 'product'].map((t) => (
                            <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }} style={{ padding: '5px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: typeFilter === t ? 'white' : 'transparent', color: typeFilter === t ? '#1A4731' : '#64748B', boxShadow: typeFilter === t ? '0 1px 3px rgba(0,0,0,0.12)' : 'none', whiteSpace: 'nowrap' }}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                } />

            {loading ? <TableWrapper headers={['Title', 'Type', 'Uploader', 'Date', '']}>{[1,2,3,4].map((i) => <SkeletonRow key={i} cols={5} />)}</TableWrapper>
            : error ? <ErrorState message={error} onRetry={fetchResources} /> : resources.length === 0 ? <EmptyState icon={FileText} message="No resources found." /> : (
                <TableWrapper headers={['Title', 'Type', 'Uploader', 'Date', '']}>
                    {resources.map((r) => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }} onMouseOver={(e) => (e.currentTarget.style.background = '#FAFBFC')} onMouseOut={(e) => (e.currentTarget.style.background = 'white')}>
                            <td style={{ padding: '0.9rem 1rem', fontWeight: '600', color: '#1E293B', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</td>
                            <td style={{ padding: '0.9rem 1rem' }}><span style={PILL(TYPE_COLORS[r.type] || '#64748B', `${TYPE_COLORS[r.type] || '#64748B'}18`)}>{r.type}</span></td>
                            <td style={{ padding: '0.9rem 1rem', color: '#64748B', fontSize: '0.875rem' }}>{r.uploader_name || '—'}</td>
                            <td style={{ padding: '0.9rem 1rem', color: '#94A3B8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(r.created_at)}</td>
                            <td style={{ padding: '0.9rem 1rem' }}>
                                <button onClick={() => setConfirm({ id: r.id, name: r.title })} disabled={deleting[r.id]} style={{ ...IBTN('#DC2626', '#FEF2F2'), opacity: deleting[r.id] ? 0.5 : 1 }}>
                                    {deleting[r.id] ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={11} />}
                                </button>
                            </td>
                        </tr>
                    ))}
                </TableWrapper>
            )}
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            <ConfirmDialog isOpen={!!confirm} title="Delete Resource" message={`Permanently delete "${confirm?.name}"?`} confirmLabel="Delete" onConfirm={handleDelete} onClose={() => setConfirm(null)} />
        </div>
    );
};

export default AdminResources;
