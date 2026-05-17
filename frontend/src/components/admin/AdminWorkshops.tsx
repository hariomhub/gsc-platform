import React, { useState, useEffect, useCallback } from 'react';
import { getErrorMessage } from '../../utils/apiHelpers.js';
import { formatDate, formatDateTime } from '../../utils/dateFormatter.js';
import Pagination from '../common/Pagination.tsx';
import ConfirmDialog from '../common/ConfirmDialog.tsx';
import { SkeletonRow, EmptyState, ErrorState, TableWrapper, SectionHeader, FormField,
         PILL, IBTN, BTN_PRIMARY, BTN_CANCEL, BTN_WARN, BTN_DANGER, BTN_SUCCESS,
         ROLE_LABELS, ROLE_COLORS, ROLE_OPTIONS, EVENT_CATEGORIES, CATCOLORS } from './adminShared.tsx';
import { BookOpen, Plus, Trash2, Edit2, Save, Loader2, MapPin, Users } from 'lucide-react';
import { getWorkshops, createWorkshop, updateWorkshop, deleteWorkshop, togglePublishWorkshop } from '../../api/workshops.api.js';

const AdminWorkshops = ({ showToast }) => {
    const [workshops, setWorkshops]     = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState('');
    const [page, setPage]               = useState(1);
    const [totalPages, setTotalPages]   = useState(1);
    const [showForm, setShowForm]       = useState(false);
    const [editing, setEditing]         = useState(null); // null = create mode, obj = edit mode
    const [form, setForm]               = useState(BLANK_WS);
    const [saving, setSaving]           = useState(false);
    const [formErrors, setFormErrors]   = useState({});
    const [confirm, setConfirm]         = useState(null);
    const [deleting, setDeleting]       = useState({});
    const [toggling, setToggling]       = useState({});

    const LIMIT = 20;

    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const res = await getWorkshops({ all: 'true', page, limit: LIMIT });
            const p = res.data;
            setWorkshops(Array.isArray(p.data) ? p.data : []);
            setTotalPages(p.totalPages || 1);
        } catch (err) { setError(getErrorMessage(err) || 'Failed to load workshops.'); }
        finally { setLoading(false); }
    }, [page]);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setEditing(null); setForm(BLANK_WS); setFormErrors({}); setShowForm(true); };
    const openEdit   = (ws) => {
        setEditing(ws);
        setForm({
            title:         ws.title         || '',
            date:          ws.date          ? ws.date.slice(0, 16) : '',
            location:      ws.location      || '',
            description:   ws.description   || '',
            speaker:       ws.speaker       || '',
            agenda:        ws.agenda        || '',
            recording_url: ws.recording_url || '',
            is_upcoming:   !!ws.is_upcoming,
            is_published:  !!ws.is_published,
        });
        setFormErrors({});
        setShowForm(true);
    };
    const closeForm = () => { setShowForm(false); setEditing(null); };

    const validate = () => {
        const errs = {};
        if (!form.title.trim())  errs.title = 'Title is required.';
        if (!form.date)          errs.date  = 'Date is required.';
        if (form.recording_url && !/^https?:\/\//.test(form.recording_url)) errs.recording_url = 'Must be a valid URL.';
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const payload = { ...form };
            if (editing) { await updateWorkshop(editing.id, payload); showToast('Workshop updated!', 'success'); }
            else         { await createWorkshop(payload);             showToast('Workshop created!', 'success'); }
            closeForm();
            load();
        } catch (err) { showToast(getErrorMessage(err) || 'Save failed.', 'error'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!confirm) return;
        const id = confirm.id;
        setConfirm(null);
        setDeleting(p => ({ ...p, [id]: true }));
        try {
            await deleteWorkshop(id);
            showToast('Workshop deleted.', 'success');
            load();
        } catch (err) { showToast(getErrorMessage(err) || 'Delete failed.', 'error'); }
        finally { setDeleting(p => ({ ...p, [id]: false })); }
    };

    const handleToggle = async (ws) => {
        setToggling(p => ({ ...p, [ws.id]: true }));
        try {
            await togglePublishWorkshop(ws.id);
            showToast(ws.is_published ? 'Unpublished.' : 'Published!', 'success');
            load();
        } catch (err) { showToast(getErrorMessage(err) || 'Toggle failed.', 'error'); }
        finally { setToggling(p => ({ ...p, [ws.id]: false })); }
    };

    const F = (k) => ({ value: form[k], onChange: (e) => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })) });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <SectionHeader
                icon={BookOpen}
                title="Expert Workshops"
                subtitle="Chapter Leads create workshops pending admin review. Founding Member publishes."
                action={
                    <button onClick={openCreate} style={{ ...BTN_PRIMARY, gap: '6px' }}>
                        <Plus size={14} /> Add Workshop
                    </button>
                }
            />

            {/* ── Create / Edit Form ── */}
            {showForm && (
                <div className="adm-form-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                        {editing ? '✏️ Edit Workshop' : '➕ New Expert Workshop'}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px,100%),1fr))', gap: '0.9rem' }}>
                        <FormField label="Title" required error={formErrors.title}>
                            <input className={`adm-input${formErrors.title ? ' adm-input-err' : ''}`} placeholder="Workshop title" {...F('title')} />
                        </FormField>
                        <FormField label="Date & Time" required error={formErrors.date}>
                            <input type="datetime-local" className={`adm-input${formErrors.date ? ' adm-input-err' : ''}`} {...F('date')} />
                        </FormField>
                        <FormField label="Location / Platform">
                            <input className="adm-input" placeholder="e.g. Virtual — Zoom, London HQ..." {...F('location')} />
                        </FormField>
                        <FormField label="Speaker">
                            <input className="adm-input" placeholder="Speaker name & title" {...F('speaker')} />
                        </FormField>
                    </div>
                    <FormField label="Description">
                        <textarea className="adm-input" rows={3} placeholder="Brief overview of the workshop..." {...F('description')} style={{ resize: 'vertical' }} />
                    </FormField>
                    <FormField label="Agenda">
                        <textarea className="adm-input" rows={3} placeholder="Workshop agenda or key topics..." {...F('agenda')} style={{ resize: 'vertical' }} />
                    </FormField>
                    <FormField label="Recording URL" error={formErrors.recording_url}>
                        <input className={`adm-input${formErrors.recording_url ? ' adm-input-err' : ''}`} placeholder="https://... (leave blank if not yet recorded)" {...F('recording_url')} />
                    </FormField>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600', color: '#475569' }}>
                            <input type="checkbox" checked={form.is_upcoming}  onChange={e => setForm(p => ({ ...p, is_upcoming:  e.target.checked }))} style={{ accentColor: '#1A4731', width: '15px', height: '15px' }} />
                            Mark as Upcoming
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600', color: '#475569' }}>
                            <input type="checkbox" checked={form.is_published} onChange={e => setForm(p => ({ ...p, is_published: e.target.checked }))} style={{ accentColor: '#1A4731', width: '15px', height: '15px' }} />
                            Published (visible to Chapter Leads and above)
                        </label>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
                        <button onClick={handleSave} disabled={saving} style={{ ...BTN_PRIMARY, opacity: saving ? 0.7 : 1 }}>
                            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                            {saving ? 'Saving…' : (editing ? 'Save Changes' : 'Create Workshop')}
                        </button>
                        <button onClick={closeForm} style={BTN_CANCEL}>Cancel</button>
                    </div>
                </div>
            )}

            {/* ── Error ── */}
            {error && <ErrorState message={error} onRetry={load} />}

            {/* ── List ── */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[1,2,3].map(i => <div key={i} style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', height: '88px', animation: 'adm-pulse 1.4s ease-in-out infinite' }} />)}
                </div>
            ) : !error && workshops.length === 0 ? (
                <EmptyState icon={BookOpen} message="No workshops yet. Click 'Add Workshop' to create one." />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {workshops.map(ws => (
                        <div key={ws.id} className="adm-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0F172A' }}>{ws.title}</span>
                                    <span style={{ fontSize: '0.65rem', fontWeight: '700', padding: '2px 8px', borderRadius: '100px', background: ws.is_published ? '#DCFCE7' : '#FEF3C7', color: ws.is_published ? '#15803D' : '#B45309' }}>
                                        {ws.is_published ? 'Published' : 'Draft'}
                                    </span>
                                    <span style={{ fontSize: '0.65rem', fontWeight: '700', padding: '2px 8px', borderRadius: '100px', background: ws.is_upcoming ? '#F0FDF4' : '#F1F5F9', color: ws.is_upcoming ? '#1A4731' : '#64748B' }}>
                                        {ws.is_upcoming ? 'Upcoming' : 'Past'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <CalendarDays size={11} color="#0284C7" />
                                        {new Date(ws.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {ws.speaker && <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}><Mic2 size={11} color="#7C3AED" /> {ws.speaker}</span>}
                                    {ws.location && <span style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={11} color="#0284C7" /> {ws.location}</span>}
                                </div>
                                {ws.description && <p style={{ margin: 0, fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ws.description}</p>}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                                <button onClick={() => handleToggle(ws)} disabled={!!toggling[ws.id]} style={{ ...BTN_WARN, opacity: toggling[ws.id] ? 0.6 : 1 }}>
                                    {toggling[ws.id] ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Eye size={12} />}
                                    {ws.is_published ? 'Unpublish' : 'Publish'}
                                </button>
                                <button onClick={() => openEdit(ws)} style={BTN_SUCCESS}><Edit2 size={12} /> Edit</button>
                                <button onClick={() => setConfirm({ id: ws.id, title: ws.title })} style={BTN_DANGER}><Trash2 size={12} /> Delete</button>
                            </div>
                        </div>
                    ))}
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            )}

            <ConfirmDialog
                isOpen={!!confirm}
                title="Delete Workshop"
                message={`Permanently delete "${confirm?.title}"? This cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onClose={() => setConfirm(null)}
            />
        </div>
    );
};


export default AdminWorkshops;
