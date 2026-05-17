import React, { useState, useEffect, useCallback } from 'react';
import { getErrorMessage } from '../../utils/apiHelpers.js';
import { formatDate, formatDateTime } from '../../utils/dateFormatter.js';
import Pagination from '../common/Pagination.tsx';
import ConfirmDialog from '../common/ConfirmDialog.tsx';
import { SkeletonRow, EmptyState, ErrorState, TableWrapper, SectionHeader, FormField,
         PILL, IBTN, BTN_PRIMARY, BTN_CANCEL, BTN_WARN, BTN_DANGER, BTN_SUCCESS,
         ROLE_LABELS, ROLE_COLORS, ROLE_OPTIONS, EVENT_CATEGORIES, CATCOLORS } from './adminShared.tsx';
import { ShieldCheck, Plus, Trash2, Edit2, Save, Star, Eye, Upload, Video, Image, Loader2, ChevronDown } from 'lucide-react';
import { getProducts, getProductById as getProductByIdAPI, createProduct, updateProduct, deleteProduct,
         addFeatureTest, updateFeatureTest, deleteFeatureTest,
         uploadProductMedia, deleteProductMedia,
         uploadEvidence, deleteEvidence,
         submitUserReview, deleteUserReview } from '../../api/productReviews.api.js';

// ─── 7. ESG Solution Reviews Tab ───────────────────────────────────────────────────
const AdminProductReviews = ({ showToast }) => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [confirm, setConfirm] = useState(null);
    const [deleting, setDeleting] = useState({});
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [managingId, setManagingId] = useState(null);
    const [managingProduct, setManagingProduct] = useState(null);
    const [mpLoading, setMpLoading] = useState(false);

    const EMPTY_FORM = { name: '', vendor: '', category: '', portal_url: '', short_description: '', overview: '', version_tested: '', key_features: [] };
    const [form, setForm] = useState(EMPTY_FORM);
    const [editId, setEditId] = useState(null);
    const [kfDraft, setKfDraft] = useState('');

    const EMPTY_FT = { feature_name: '', test_method: '', result: '', score: '', comments: '', display_order: '0' };
    const [ftForm, setFtForm] = useState(EMPTY_FT);
    const [ftSaving, setFtSaving] = useState(false);
    const [ftEditId, setFtEditId] = useState(null);
    const [showFtForm, setShowFtForm] = useState(false);
    const [evidenceFtId, setEvidenceFtId] = useState('');

    const [adminRating, setAdminRating] = useState(0);
    const [adminHover, setAdminHover] = useState(0);
    const [adminComment, setAdminComment] = useState('');
    const [adminReviewSaving, setAdminReviewSaving] = useState(false);
    const [adminOwnReviewId, setAdminOwnReviewId] = useState(null);
    const [adminReviewEditing, setAdminReviewEditing] = useState(false);

    const fetchProducts = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const res = await getProducts({ page, limit: 15 });
            const payload = res.data;
            setProducts(Array.isArray(payload?.data) ? payload.data : []);
            setTotalPages(payload?.totalPages ?? 1);
        } catch (err) { setError(getErrorMessage(err)); }
        finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const fetchManaging = useCallback(async (id) => {
        setMpLoading(true);
        try {
            const res = await getProductByIdAPI(id);
            const data = res.data?.data ?? null;
            setManagingProduct(data);
            if (user && data?.userReviews) {
                const own = data.userReviews.find(r => r.user_id === user.id);
                if (own) { setAdminRating(own.rating); setAdminComment(own.comment || ''); setAdminOwnReviewId(own.id); setAdminReviewEditing(false); }
                else { setAdminRating(0); setAdminComment(''); setAdminOwnReviewId(null); setAdminReviewEditing(false); }
            }
        } catch (err) { showToast(getErrorMessage(err), 'error'); }
        finally { setMpLoading(false); }
    }, [showToast]);

    const openManage = (product) => { setManagingId(product.id); fetchManaging(product.id); setShowForm(false); };
    const closeManage = () => { setManagingId(null); setManagingProduct(null); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const payload = { ...form, key_features: Array.isArray(form.key_features) ? form.key_features : [] };
            if (editId) { await updateProduct(editId, payload); showToast('Product updated.', 'success'); }
            else { await createProduct(payload); showToast('Product created.', 'success'); }
            setForm(EMPTY_FORM); setEditId(null); setShowForm(false); setKfDraft(''); fetchProducts();
        } catch (err) { showToast(getErrorMessage(err), 'error'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        const { id } = confirm; setConfirm(null); setDeleting((p) => ({ ...p, [id]: true }));
        try { await deleteProduct(id); if (managingId === id) closeManage(); setProducts((prev) => prev.filter((p) => p.id !== id)); showToast('Product deleted.', 'success'); }
        catch (err) { showToast(getErrorMessage(err), 'error'); }
        finally { setDeleting((p) => ({ ...p, [id]: false })); }
    };

    const startEdit = (p) => {
        setForm({ name: p.name || '', vendor: p.vendor || '', category: p.category || '', portal_url: p.portal_url || '', short_description: p.short_description || '', overview: p.overview || '', version_tested: p.version_tested || '', key_features: Array.isArray(p.key_features) ? [...p.key_features] : (p.key_features ? p.key_features.split('\n').map(f => f.trim()).filter(Boolean) : []) });
        setKfDraft(''); setEditId(p.id); setShowForm(true); closeManage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddFT = async (e) => {
        e.preventDefault(); setFtSaving(true);
        try {
            if (ftEditId) { await updateFeatureTest(managingId, ftEditId, ftForm); showToast('Feature test updated.', 'success'); }
            else { await addFeatureTest(managingId, ftForm); showToast('Feature test added.', 'success'); }
            setFtForm(EMPTY_FT); setFtEditId(null); fetchManaging(managingId);
        } catch (err) { showToast(getErrorMessage(err), 'error'); }
        finally { setFtSaving(false); }
    };

    const handleDeleteFT = async (ftId) => {
        try { await deleteFeatureTest(managingId, ftId); showToast('Feature test deleted.', 'success'); fetchManaging(managingId); }
        catch (err) { showToast(getErrorMessage(err), 'error'); }
    };

    const handleAdminReview = async (e) => {
        e.preventDefault();
        if (!adminRating) { showToast('Please select a rating.', 'error'); return; }
        setAdminReviewSaving(true);
        try { await submitUserReview(managingId, { rating: adminRating, comment: adminComment }); showToast('Review submitted!', 'success'); setAdminReviewEditing(false); fetchManaging(managingId); }
        catch (err) { showToast(getErrorMessage(err), 'error'); }
        finally { setAdminReviewSaving(false); }
    };

    const handleDeleteAdminReview = async () => {
        if (!adminOwnReviewId) return;
        try { await deleteUserReview(managingId, adminOwnReviewId); showToast('Review deleted.', 'success'); setAdminRating(0); setAdminComment(''); setAdminOwnReviewId(null); fetchManaging(managingId); }
        catch (err) { showToast(getErrorMessage(err), 'error'); }
    };

    const handleUploadMedia = async (e) => {
        const files = Array.from(e.target.files); if (!files.length) return;
        const fd = new FormData(); files.forEach(f => fd.append('files', f));
        try { await uploadProductMedia(managingId, fd); showToast('Media uploaded.', 'success'); fetchManaging(managingId); }
        catch (err) { showToast(getErrorMessage(err), 'error'); }
        e.target.value = '';
    };

    const handleDeleteMedia = async (mediaId) => {
        try { await deleteProductMedia(managingId, mediaId); showToast('Media deleted.', 'success'); fetchManaging(managingId); }
        catch (err) { showToast(getErrorMessage(err), 'error'); }
    };

    const handleUploadEvidence = async (e) => {
        const files = Array.from(e.target.files); if (!files.length) return;
        const fd = new FormData(); files.forEach(f => fd.append('files', f));
        if (evidenceFtId) fd.append('feature_test_id', evidenceFtId);
        try { await uploadEvidence(managingId, fd); showToast('Evidence uploaded.', 'success'); fetchManaging(managingId); }
        catch (err) { showToast(getErrorMessage(err), 'error'); }
        e.target.value = '';
    };

    const handleDeleteEvidence = async (evId) => {
        try { await deleteEvidence(managingId, evId); showToast('Evidence deleted.', 'success'); fetchManaging(managingId); }
        catch (err) { showToast(getErrorMessage(err), 'error'); }
    };

    const inputStyle = { width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
    const labelStyle = { fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1E293B', margin: 0 }}>AI ESG Solution Reviews</h3>
                <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(EMPTY_FORM); closeManage(); }} style={{ ...IBTN('white', '#1A4731'), padding: '8px 16px', fontSize: '0.82rem' }}>
                    <Plus size={13} /> {showForm && !editId ? 'Cancel' : 'Add Product'}
                </button>
            </div>

            {/* Create/Edit form */}
            {showForm && (
                <form onSubmit={handleSubmit} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: 'clamp(1.25rem,3vw,1.75rem)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: '700', color: '#1E293B' }}>{editId ? 'Edit Product' : 'New Product'}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px,100%), 1fr))', gap: '1rem' }}>
                        <div><label style={labelStyle}>Product Name *</label><input required style={inputStyle} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. AI Governance Suite" /></div>
                        <div><label style={labelStyle}>Vendor *</label><input required style={inputStyle} value={form.vendor} onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))} placeholder="e.g. Acme Corp" /></div>
                        <div><label style={labelStyle}>Category</label><input style={inputStyle} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Risk Management" /></div>
                        <div><label style={labelStyle}>Version Tested</label><input style={inputStyle} value={form.version_tested} onChange={e => setForm(p => ({ ...p, version_tested: e.target.value }))} placeholder="e.g. v2.4.1" /></div>
                        <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Portal URL</label><input type="url" style={inputStyle} value={form.portal_url} onChange={e => setForm(p => ({ ...p, portal_url: e.target.value }))} placeholder="https://vendor.com/product" /></div>
                        <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Short Description</label><input style={inputStyle} value={form.short_description} onChange={e => setForm(p => ({ ...p, short_description: e.target.value }))} placeholder="One-liner shown on cards" /></div>
                        <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Overview</label><textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={form.overview} onChange={e => setForm(p => ({ ...p, overview: e.target.value }))} placeholder="Detailed product overview..." /></div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={labelStyle}>Key Features</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                <input style={{ ...inputStyle, flex: 1, background: 'white' }} placeholder="Type a feature name and press Enter or click Add…" value={kfDraft} onChange={e => setKfDraft(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = kfDraft.trim(); if (v && !form.key_features.includes(v)) setForm(p => ({ ...p, key_features: [...p.key_features, v] })); setKfDraft(''); } }} />
                                <button type="button" onClick={() => { const v = kfDraft.trim(); if (!v || form.key_features.includes(v)) return; setForm(p => ({ ...p, key_features: [...p.key_features, v] })); setKfDraft(''); }} style={{ ...IBTN('white', '#1A4731'), padding: '0 14px', height: '38px', flexShrink: 0 }}>
                                    <Plus size={13} /> Add
                                </button>
                            </div>
                            {form.key_features.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {form.key_features.map((f, i) => (
                                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#EBF0F7', color: '#1A4731', fontSize: '0.78rem', fontWeight: '600', padding: '4px 10px', borderRadius: '6px' }}>
                                            {f}<button type="button" onClick={() => setForm(p => ({ ...p, key_features: p.key_features.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1A4731', display: 'flex', padding: 0, lineHeight: 1, opacity: 0.55 }}><X size={11} /></button>
                                        </span>
                                    ))}
                                </div>
                            ) : <p style={{ fontSize: '0.75rem', color: '#CBD5E1', margin: '2px 0 0' }}>No features added yet.</p>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); setKfDraft(''); }} style={{ ...IBTN('#64748B', '#F1F5F9'), padding: '8px 16px' }}>Cancel</button>
                        <button type="submit" disabled={saving} style={{ ...IBTN('white', '#1A4731'), padding: '8px 20px', opacity: saving ? 0.7 : 1 }}>
                            {saving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />} {editId ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            )}

            {/* Products table */}
            {loading ? <TableWrapper headers={['Product','Vendor','Category','Avg Rating','Reviews','Added','']}>{[1,2,3,4].map(i => <SkeletonRow key={i} cols={7} />)}</TableWrapper>
            : error ? <ErrorState message={error} onRetry={fetchProducts} /> : products.length === 0 ? <EmptyState icon={ShieldCheck} message="No products yet. Add one above." /> : (
                <TableWrapper headers={['Product','Vendor','Category','Avg Rating','Reviews','Added','']}>
                    {products.map((p) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }} onMouseOver={e => (e.currentTarget.style.background = '#FAFBFC')} onMouseOut={e => (e.currentTarget.style.background = 'white')}>
                            <td style={{ padding: '0.9rem 1rem', fontWeight: '600', color: '#1E293B', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                            <td style={{ padding: '0.9rem 1rem', color: '#475569', fontSize: '0.875rem' }}>{p.vendor || '—'}</td>
                            <td style={{ padding: '0.9rem 1rem' }}>{p.category ? <span style={PILL('#1A4731', '#EBF0F7')}>{p.category}</span> : '—'}</td>
                            <td style={{ padding: '0.9rem 1rem', color: '#D97706', fontSize: '0.875rem', fontWeight: '700' }}>{p.avg_rating ? `★ ${parseFloat(p.avg_rating).toFixed(1)}` : '—'}</td>
                            <td style={{ padding: '0.9rem 1rem', color: '#64748B', fontSize: '0.875rem' }}>{p.review_count ?? 0}</td>
                            <td style={{ padding: '0.9rem 1rem', color: '#94A3B8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(p.created_at)}</td>
                            <td style={{ padding: '0.9rem 1rem' }}>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    <button onClick={() => openManage(p)} style={{ ...IBTN('#0284C7', '#F0FDF4'), padding: '5px 10px' }}><Eye size={11} /> Manage</button>
                                    <button onClick={() => startEdit(p)} style={{ ...IBTN('#D97706', '#FFFBEB'), padding: '5px 10px' }}><Edit2 size={11} /></button>
                                    <button onClick={() => setConfirm({ id: p.id, name: p.name })} disabled={deleting[p.id]} style={{ ...IBTN('#DC2626', '#FEF2F2'), padding: '5px 10px', opacity: deleting[p.id] ? 0.5 : 1 }}>
                                        {deleting[p.id] ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={11} />}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </TableWrapper>
            )}

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

            {/* Manage panel */}
            {managingId && (
                <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: 'clamp(1.25rem,3vw,1.75rem)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#1E293B' }}>Managing: {products.find(p => p.id === managingId)?.name}</h4>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button onClick={() => { startEdit(managingProduct); }} style={{ ...IBTN('#D97706', '#FFFBEB'), padding: '5px 14px', fontSize: '0.82rem' }}><Edit2 size={12} /> Update Product</button>
                            <button onClick={closeManage} style={{ ...IBTN('#64748B', '#F1F5F9'), padding: '5px 12px' }}><X size={12} /> Close</button>
                        </div>
                    </div>

                    {mpLoading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /></div>
                    ) : managingProduct ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                            {/* About Product */}
                            <section style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: 'clamp(1rem,3vw,1.25rem)' }}>
                                <h5 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>About Product</h5>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px,100%), 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                                    {[['Vendor', managingProduct.vendor], ['Category', managingProduct.category], ['Version Tested', managingProduct.version_tested]].map(([label, val]) => val ? (
                                        <div key={label}><span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span><p style={{ margin: '2px 0 0', fontSize: '0.875rem', color: '#1E293B', fontWeight: '600' }}>{val}</p></div>
                                    ) : null)}
                                    {managingProduct.portal_url && <div><span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Portal URL</span><p style={{ margin: '2px 0 0' }}><a href={managingProduct.portal_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0284C7', fontSize: '0.8rem', wordBreak: 'break-all' }}>{managingProduct.portal_url}</a></p></div>}
                                </div>
                                {managingProduct.short_description && <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.7', marginBottom: '0.75rem' }}>{managingProduct.short_description}</p>}
                                {managingProduct.overview && <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: '1.75', whiteSpace: 'pre-wrap', marginBottom: '0.75rem' }}>{managingProduct.overview}</p>}
                                {Array.isArray(managingProduct.key_features) && managingProduct.key_features.length > 0 && (
                                    <div><span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Key Features</span>
                                        <ul style={{ margin: '6px 0 0', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {managingProduct.key_features.map((f, i) => <li key={i} style={{ fontSize: '0.875rem', color: '#475569' }}>{f}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </section>

                            {/* Feature Tests */}
                            <section>
                                <h5 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Feature Tests</h5>
                                {managingProduct.featureTests?.length > 0 && (
                                    <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '480px' }}>
                                            <thead><tr style={{ background: '#F8FAFC' }}>{['Feature','Method','Result','Score','Comments',''].map(h => <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: '700', color: '#64748B', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                                            <tbody>
                                                {managingProduct.featureTests.map(ft => (
                                                    <tr key={ft.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                                                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: '600', color: '#1E293B' }}>{ft.feature_name}</td>
                                                        <td style={{ padding: '0.6rem 0.75rem', color: '#64748B' }}>{ft.test_method || '—'}</td>
                                                        <td style={{ padding: '0.6rem 0.75rem', color: '#475569' }}>{ft.result || '—'}</td>
                                                        <td style={{ padding: '0.6rem 0.75rem', fontWeight: '700', color: '#D97706' }}>{ft.score != null ? ft.score : '—'}</td>
                                                        <td style={{ padding: '0.6rem 0.75rem', color: '#64748B', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ft.comments || '—'}</td>
                                                        <td style={{ padding: '0.6rem 0.75rem' }}>
                                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                                <button onClick={() => { setFtForm({ feature_name: ft.feature_name||'', test_method: ft.test_method||'', result: ft.result||'', score: ft.score??'', comments: ft.comments||'', display_order: ft.display_order??'0' }); setFtEditId(ft.id); setShowFtForm(false); }} style={{ ...IBTN('#D97706','#FFFBEB'), padding: '4px 8px' }}><Edit2 size={10} /></button>
                                                                <button onClick={() => handleDeleteFT(ft.id)} style={{ ...IBTN('#DC2626','#FEF2F2'), padding: '4px 8px' }}><Trash2 size={10} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {!showFtForm && !ftEditId && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                        <button type="button" onClick={() => { setShowFtForm(true); setFtForm(EMPTY_FT); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#1A4731', color: 'white', border: 'none', padding: '0.55rem 1.1rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                                            <Plus size={14} /> Add Test
                                        </button>
                                    </div>
                                )}

                                {(showFtForm || ftEditId) && (
                                    <form onSubmit={async (e) => { await handleAddFT(e); if (!ftEditId) setShowFtForm(false); }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px,100%), 1fr))', gap: '0.75rem', background: '#F8FAFC', padding: 'clamp(0.75rem,2vw,1rem)', borderRadius: '8px', marginTop: '0.75rem' }}>
                                        <div>
                                            <label style={labelStyle}>Feature Name *</label>
                                            <select required style={inputStyle} value={ftForm.feature_name} onChange={e => setFtForm(p => ({ ...p, feature_name: e.target.value }))}>
                                                <option value="">— Select a feature —</option>
                                                {Array.isArray(managingProduct?.key_features) && managingProduct.key_features.map(f => <option key={f} value={f}>{f}</option>)}
                                                {ftForm.feature_name && Array.isArray(managingProduct?.key_features) && !managingProduct.key_features.includes(ftForm.feature_name) && <option value={ftForm.feature_name}>{ftForm.feature_name}</option>}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Test Method</label>
                                            <select style={{ ...inputStyle, marginBottom: '6px' }} value={['Live Demo','Hands-on Evaluation','Prompt Testing','Red Teaming','Adversarial Testing','Bias & Fairness Testing','Explainability Review','API / Integration Testing','Data Privacy Audit','Model Output Review','Documentation Review','Third-Party Audit'].includes(ftForm.test_method) ? ftForm.test_method : (ftForm.test_method ? '__custom__' : '')} onChange={e => { if (e.target.value !== '__custom__') setFtForm(p => ({ ...p, test_method: e.target.value })); }}>
                                                <option value="">— Pick a preset —</option>
                                                {['Live Demo','Hands-on Evaluation','Prompt Testing','Red Teaming','Adversarial Testing','Bias & Fairness Testing','Explainability Review','API / Integration Testing','Data Privacy Audit','Model Output Review','Documentation Review','Third-Party Audit'].map(v => <option key={v} value={v}>{v}</option>)}
                                                {ftForm.test_method && !['Live Demo','Hands-on Evaluation','Prompt Testing','Red Teaming','Adversarial Testing','Bias & Fairness Testing','Explainability Review','API / Integration Testing','Data Privacy Audit','Model Output Review','Documentation Review','Third-Party Audit'].includes(ftForm.test_method) && <option value="__custom__">✎ {ftForm.test_method}</option>}
                                            </select>
                                            <input style={{ ...inputStyle, fontSize: '0.8rem' }} placeholder="Or type a custom method…" value={ftForm.test_method} onChange={e => setFtForm(p => ({ ...p, test_method: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Result</label>
                                            <select style={inputStyle} value={ftForm.result} onChange={e => setFtForm(p => ({ ...p, result: e.target.value }))}>
                                                <option value="">— Select result —</option>
                                                {['Pass','Conditional Pass','Partial Pass','Fail','Needs Improvement','Not Applicable'].map(v => <option key={v} value={v}>{v}</option>)}
                                            </select>
                                        </div>
                                        <div><label style={labelStyle}>Score (0–10)</label><input type="number" min="0" max="10" step="0.1" style={inputStyle} value={ftForm.score} onChange={e => setFtForm(p => ({ ...p, score: e.target.value }))} placeholder="e.g. 8.5" /></div>
                                        <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Comments</label><input style={inputStyle} value={ftForm.comments} onChange={e => setFtForm(p => ({ ...p, comments: e.target.value }))} placeholder="Optional notes..." /></div>
                                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                            <button type="button" onClick={() => { setShowFtForm(false); setFtEditId(null); setFtForm(EMPTY_FT); }} style={{ ...IBTN('#64748B','#F1F5F9'), padding: '0.55rem 1rem', fontSize: '0.85rem' }}>Cancel</button>
                                            <button type="submit" disabled={ftSaving} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#1A4731', color: 'white', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: ftSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: ftSaving ? 0.7 : 1 }}>
                                                {ftSaving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />}{ftEditId ? 'Update Test Result' : 'Submit Test Result'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </section>

                            {/* Media */}
                            <section>
                                <h5 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Media (Images / Videos)</h5>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                                    {managingProduct.media?.map(m => (
                                        <div key={m.id} style={{ position: 'relative', width: '120px' }}>
                                            {m.type === 'image' ? <img src={m.url} alt={m.label||''} style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E2E8F0' }} /> : <div style={{ width: '120px', height: '80px', background: '#1E293B', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Video size={28} color="white" /></div>}
                                            <button onClick={() => handleDeleteMedia(m.id)} style={{ position: 'absolute', top: '4px', right: '4px', background: '#DC2626', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}><X size={10} color="white" /></button>
                                        </div>
                                    ))}
                                    {(!managingProduct.media || managingProduct.media.length === 0) && <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>No media uploaded yet.</p>}
                                </div>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', ...IBTN('#1A4731','#EBF0F7'), padding: '8px 14px', cursor: 'pointer' }}>
                                    <Upload size={12} /> Upload Images/Videos
                                    <input type="file" accept="image/*,video/*" multiple hidden onChange={handleUploadMedia} />
                                </label>
                            </section>

                            {/* Evidence */}
                            <section>
                                <h5 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Evidence Files</h5>
                                {(() => {
                                    const grouped = {}; const unassigned = [];
                                    (managingProduct.evidences || []).forEach(ev => {
                                        if (ev.feature_test_id && ev.feature_test_name) { if (!grouped[ev.feature_test_id]) grouped[ev.feature_test_id] = { name: ev.feature_test_name, items: [] }; grouped[ev.feature_test_id].items.push(ev); }
                                        else { unassigned.push(ev); }
                                    });
                                    const groups = Object.values(grouped);
                                    if (unassigned.length) groups.push({ name: 'Unassigned', items: unassigned });
                                    if (!groups.length) return <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '0.75rem' }}>No evidence files uploaded yet.</p>;
                                    return groups.map(g => (
                                        <div key={g.name} style={{ marginBottom: '0.85rem' }}>
                                            <p style={{ margin: '0 0 0.35rem', fontSize: '0.75rem', fontWeight: '700', color: '#1A4731', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{g.name}</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                {g.items.map(ev => (
                                                    <div key={ev.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', gap: '8px', flexWrap: 'wrap' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                            <FileText size={14} color="#1A4731" />
                                                            <span style={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.file_name}</span>
                                                            <span style={{ fontSize: '0.75rem', color: '#94A3B8', flexShrink: 0 }}>{ev.file_type}</span>
                                                        </div>
                                                        <button onClick={() => handleDeleteEvidence(ev.id)} style={{ ...IBTN('#DC2626','#FEF2F2'), padding: '4px 8px', flexShrink: 0 }}><Trash2 size={10} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ));
                                })()}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                    <select value={evidenceFtId} onChange={e => setEvidenceFtId(e.target.value)} style={{ flex: '1', minWidth: '180px', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'inherit', color: evidenceFtId ? '#1E293B' : '#94A3B8', background: 'white' }}>
                                        <option value="">— Select Feature (optional) —</option>
                                        {(managingProduct.featureTests || []).map(ft => <option key={ft.id} value={ft.id}>{ft.feature_name}</option>)}
                                    </select>
                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', ...IBTN('#0284C7','#F0FDF4'), padding: '8px 14px', cursor: 'pointer', flexShrink: 0 }}>
                                        <Upload size={12} /> Upload Evidence
                                        <input type="file" accept=".pdf,.xlsx,.xls,.docx,.doc,image/*,video/*" multiple hidden onChange={handleUploadEvidence} />
                                    </label>
                                </div>
                            </section>

                            {/* Admin Review */}
                            <section style={{ background: '#FFF9F0', border: '2px solid #FCD34D', borderRadius: '10px', padding: 'clamp(1rem,3vw,1.25rem)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <h5 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Your Review</h5>
                                    {adminOwnReviewId && !adminReviewEditing && (
                                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#D97706', background: '#FEF3C7', padding: '2px 8px', borderRadius: '99px' }}>Submitted ✓</span>
                                            <button type="button" onClick={() => setAdminReviewEditing(true)} style={{ ...IBTN('#D97706','#FFFBEB'), padding: '3px 10px', fontSize: '0.75rem' }}><Edit2 size={11} /> Edit</button>
                                            <button type="button" onClick={handleDeleteAdminReview} style={{ ...IBTN('#DC2626','#FEF2F2'), padding: '3px 10px', fontSize: '0.75rem' }}><Trash2 size={11} /> Remove</button>
                                        </div>
                                    )}
                                </div>
                                {adminOwnReviewId && !adminReviewEditing ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                                            {[1,2,3,4,5].map(i => <Star key={i} size={24} fill={adminRating >= i ? '#F59E0B' : 'none'} color={adminRating >= i ? '#F59E0B' : '#D1D5DB'} strokeWidth={1.5} />)}
                                            <span style={{ marginLeft: '6px', fontSize: '0.85rem', fontWeight: '700', color: '#92400E', alignSelf: 'center' }}>{adminRating}/5</span>
                                        </div>
                                        {adminComment && <p style={{ margin: 0, fontSize: '0.9rem', color: '#78350F', lineHeight: '1.65', background: 'white', border: '1px solid #FDE68A', borderRadius: '8px', padding: '0.65rem 0.85rem', fontStyle: 'italic' }}>"{adminComment}"</p>}
                                    </div>
                                ) : (
                                    <form onSubmit={handleAdminReview} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#78350F', display: 'block', marginBottom: '6px' }}>Rating *</label>
                                            <span style={{ display: 'inline-flex', gap: '6px' }}>
                                                {[1,2,3,4,5].map(i => <Star key={i} size={28} fill={(adminHover||adminRating) >= i ? '#F59E0B' : 'none'} color={(adminHover||adminRating) >= i ? '#F59E0B' : '#CBD5E1'} strokeWidth={1.5} style={{ cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={() => setAdminHover(i)} onMouseLeave={() => setAdminHover(0)} onClick={(e) => { e.preventDefault(); setAdminRating(i); }} />)}
                                            </span>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#78350F', display: 'block', marginBottom: '4px' }}>Comment (optional)</label>
                                            <textarea value={adminComment} onChange={e => setAdminComment(e.target.value)} placeholder="Share your assessment of this product..." style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #FCD34D', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'inherit', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box', background: 'white' }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <button type="submit" disabled={adminReviewSaving || !adminRating} style={{ ...IBTN('white','#D97706'), padding: '8px 20px', opacity: (adminReviewSaving || !adminRating) ? 0.6 : 1, fontWeight: '700' }}>
                                                {adminReviewSaving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />} Save Review
                                            </button>
                                            {adminReviewEditing && <button type="button" onClick={() => { setAdminReviewEditing(false); }} style={{ ...IBTN('#64748B','#F1F5F9'), padding: '8px 14px' }}>Cancel</button>}
                                        </div>
                                    </form>
                                )}
                            </section>

                            {/* Submit footer */}
                            <div style={{ borderTop: '2px dashed #CBD5E1', paddingTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '700', color: '#1E293B' }}>Done adding test data?</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>All changes are saved automatically. Click to mark this assessment complete.</p>
                                </div>
                                <button onClick={() => { closeManage(); showToast('Assessment submitted successfully!', 'success'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#1A4731', color: 'white', border: 'none', padding: '0.7rem 1.75rem', borderRadius: '10px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.01em', boxShadow: '0 2px 8px rgba(0,51,102,0.25)', flexShrink: 0 }}>
                                    <ShieldCheck size={16} /> Submit Assessment
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            <ConfirmDialog isOpen={!!confirm} title="Delete Product" message={`Permanently delete "${confirm?.name}" and all its data?`} confirmLabel="Delete" onConfirm={handleDelete} onClose={() => setConfirm(null)} />
        </div>
    );
};

// ─── WorkshopsTab ────────────────────────────────────────────────────────────
const BLANK_WS = { title: '', date: '', location: '', description: '', speaker: '', agenda: '', recording_url: '', is_upcoming: true, is_published: true };

export default AdminProductReviews;
