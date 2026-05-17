import React, { useState, useEffect, useCallback } from 'react';
import { getErrorMessage } from '../../utils/apiHelpers.js';
import { formatDate, formatDateTime } from '../../utils/dateFormatter.js';
import Pagination from '../common/Pagination.tsx';
import ConfirmDialog from '../common/ConfirmDialog.tsx';
import { SkeletonRow, EmptyState, ErrorState, TableWrapper, SectionHeader, FormField,
         PILL, IBTN, BTN_PRIMARY, BTN_CANCEL, BTN_WARN, BTN_DANGER, BTN_SUCCESS,
         ROLE_LABELS, ROLE_COLORS, ROLE_OPTIONS, EVENT_CATEGORIES, CATCOLORS } from './adminShared.tsx';
import { Newspaper, Plus, Trash2, FileText, Loader2 } from 'lucide-react';
import { getNews, createNews, deleteNews, togglePublishNews } from '../../api/news.api.js';

// ─── 4. Manage News Tab ───────────────────────────────────────────────────────
const AdminNews = ({ showToast }) => {
    const EMPTY_FORM = { title: '', summary: '', content: '', source_url: '', image_url: '', category: 'industry_news', is_published: true };
    const [articles, setArticles] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [confirm, setConfirm] = useState(null);
    const [deleting, setDeleting] = useState({});
    const [toggling, setToggling] = useState({});

    const fetchNews = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const res = await getNews({ page, limit: 10, all: true });
            const payload = res.data?.data;
            setArticles(Array.isArray(payload) ? payload : (payload?.news || []));
            setTotalPages(payload?.totalPages ?? 1);
        } catch (err) { setError(getErrorMessage(err)); }
        finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchNews(); }, [fetchNews]);

    const field = (key) => (e) => { const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value; setForm((p) => ({ ...p, [key]: val })); if (formErrors[key]) setFormErrors((p) => ({ ...p, [key]: null })); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) { setFormErrors({ title: 'Title required' }); return; }
        setSubmitting(true);
        try { await createNews(form); showToast('Article created!', 'success'); setForm(EMPTY_FORM); setShowForm(false); setPage(1); fetchNews(); }
        catch (err) { showToast(getErrorMessage(err), 'error'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async () => {
        const { id } = confirm; setConfirm(null); setDeleting((p) => ({ ...p, [id]: true }));
        try { await deleteNews(id); setArticles((prev) => prev.filter((a) => a.id !== id)); showToast('Article deleted.', 'success'); }
        catch (err) { showToast(getErrorMessage(err), 'error'); }
        finally { setDeleting((p) => ({ ...p, [id]: false })); }
    };

    const handleTogglePublish = async (article) => {
        setToggling((p) => ({ ...p, [article.id]: true }));
        try {
            const res = await togglePublishNews(article.id);
            const newVal = res.data?.data?.is_published ?? !article.is_published;
            setArticles((prev) => prev.map((a) => a.id === article.id ? { ...a, is_published: newVal } : a));
            showToast(newVal ? 'Article published!' : 'Article unpublished.', 'success');
        } catch (err) { showToast(getErrorMessage(err), 'error'); }
        finally { setToggling((p) => ({ ...p, [article.id]: false })); }
    };

    const NEWS_CATS = ['industry_news', 'research', 'regulation', 'event_recap', 'opinion', 'case_study'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SectionHeader icon={Newspaper} title="Manage News" subtitle={`${articles.length} article${articles.length !== 1 ? 's' : ''}`}
                action={<button onClick={() => setShowForm((p) => !p)} style={showForm ? BTN_CANCEL : BTN_PRIMARY}><Plus size={14} /> {showForm ? 'Cancel' : 'Add Article'}</button>} />

            {showForm && (
                <form onSubmit={handleSubmit} noValidate className="adm-form-panel">
                    <p style={{ margin: '0 0 1rem', fontWeight: '700', fontSize: '0.9rem', color: '#0F172A' }}>New Article</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px,100%), 1fr))', gap: '14px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <FormField label="Title" required error={formErrors.title}><input value={form.title} onChange={field('title')} className={`adm-input${formErrors.title ? ' adm-input-err' : ''}`} placeholder="Article headline" /></FormField>
                        </div>
                        <FormField label="Category"><select value={form.category} onChange={field('category')} className="adm-input">{NEWS_CATS.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}</select></FormField>
                        <FormField label="Image URL"><input value={form.image_url} onChange={field('image_url')} className="adm-input" placeholder="https://…/image.jpg" /></FormField>
                        <div style={{ gridColumn: '1 / -1' }}><FormField label="Source URL"><input type="url" value={form.source_url} onChange={field('source_url')} className="adm-input" placeholder="https://…" /></FormField></div>
                        <div style={{ gridColumn: '1 / -1' }}><FormField label="Summary"><textarea value={form.summary} onChange={field('summary')} rows={2} className="adm-input" style={{ resize: 'vertical' }} placeholder="Brief summary displayed in cards…" /></FormField></div>
                        <div style={{ gridColumn: '1 / -1' }}><FormField label="Full Content"><textarea value={form.content} onChange={field('content')} rows={5} className="adm-input" style={{ resize: 'vertical' }} placeholder="Full article body (markdown supported)…" /></FormField></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" id="is_pub" checked={form.is_published} onChange={field('is_published')} style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#1A4731' }} />
                            <label htmlFor="is_pub" style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '500', cursor: 'pointer' }}>Publish immediately</label>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => { setShowForm(false); setFormErrors({}); setForm(EMPTY_FORM); }} style={BTN_CANCEL}>Cancel</button>
                        <button type="submit" disabled={submitting} style={{ ...BTN_PRIMARY, opacity: submitting ? 0.6 : 1 }}>
                            {submitting ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <><Save size={13} /> Publish Article</>}
                        </button>
                    </div>
                </form>
            )}

            {loading ? <TableWrapper headers={['Title', 'Category', 'Status', '']}>{[1,2,3].map((i) => <SkeletonRow key={i} cols={4} />)}</TableWrapper>
            : error ? <ErrorState message={error} onRetry={fetchNews} /> : articles.length === 0 ? <EmptyState icon={FileText} message="No articles yet. Add one above." /> : (
                <TableWrapper headers={['Title', 'Category', 'Status', '']}>
                    {articles.map((a) => (
                        <tr key={a.id} style={{ borderBottom: '1px solid #F1F5F9' }} onMouseOver={(e) => (e.currentTarget.style.background = '#FAFBFC')} onMouseOut={(e) => (e.currentTarget.style.background = 'white')}>
                            <td style={{ padding: '0.9rem 1rem', fontWeight: '600', color: '#1E293B', maxWidth: '260px' }}>
                                <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.875rem' }}>{a.title}</div>
                                {a.image_url && <img src={a.image_url} alt="" style={{ width: '52px', height: '34px', objectFit: 'cover', borderRadius: '5px', marginTop: '5px' }} />}
                            </td>
                            <td style={{ padding: '0.9rem 1rem' }}><span style={PILL('#7C3AED', '#FAF5FF')}>{(a.category || '').replace(/_/g, ' ')}</span></td>
                            <td style={{ padding: '0.9rem 1rem' }}><span style={PILL(a.is_published ? '#15803D' : '#64748B', a.is_published ? '#F0FDF4' : '#F1F5F9')}>{a.is_published ? '● Live' : '○ Draft'}</span></td>
                            <td style={{ padding: '0.9rem 1rem' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={() => handleTogglePublish(a)} disabled={toggling[a.id]} style={{ ...IBTN(a.is_published ? '#B45309' : '#15803D', a.is_published ? '#FFFBEB' : '#F0FDF4'), opacity: toggling[a.id] ? 0.5 : 1 }}>
                                        {toggling[a.id] ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : null}{a.is_published ? 'Unpublish' : 'Publish'}
                                    </button>
                                    <button onClick={() => setConfirm({ id: a.id, name: a.title })} disabled={deleting[a.id]} style={{ ...IBTN('#DC2626', '#FEF2F2'), opacity: deleting[a.id] ? 0.5 : 1 }}>
                                        {deleting[a.id] ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={11} />}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </TableWrapper>
            )}
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            <ConfirmDialog isOpen={!!confirm} title="Delete Article" message={`Delete "${confirm?.name}"? This cannot be undone.`} confirmLabel="Delete" onConfirm={handleDelete} onClose={() => setConfirm(null)} />
        </div>
    );
};

export default AdminNews;
