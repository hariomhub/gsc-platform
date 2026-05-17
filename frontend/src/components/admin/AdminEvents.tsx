import React, { useState, useEffect, useCallback } from 'react';
import { getErrorMessage } from '../../utils/apiHelpers.js';
import { formatDate, formatDateTime } from '../../utils/dateFormatter.js';
import Pagination from '../common/Pagination.tsx';
import ConfirmDialog from '../common/ConfirmDialog.tsx';
import { SkeletonRow, EmptyState, ErrorState, TableWrapper, SectionHeader, FormField,
         PILL, IBTN, BTN_PRIMARY, BTN_CANCEL, BTN_WARN, BTN_DANGER, BTN_SUCCESS,
         ROLE_LABELS, ROLE_COLORS, ROLE_OPTIONS, EVENT_CATEGORIES, CATCOLORS } from './adminShared.tsx';
import { CalendarDays, Plus, Trash2, Edit2, Save, Loader2, Image, MapPin, Mic2 } from 'lucide-react';
import { getEvents, createEvent, updateEvent, deleteEvent, togglePublishEvent } from '../../api/events.api.js';

// ─── 3. Manage Events Tab ─────────────────────────────────────────────────────
const AdminEvents = ({ showToast }) => {
    const EMPTY_FORM = { title: '', description: '', date: '', time: '', event_category: 'webinar', location: '', link: '', recording_url: '', is_upcoming: true };
    const [events, setEvents] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [editFormErrors, setEditFormErrors] = useState({});
    const [updating, setUpdating] = useState(false);
    const [confirm, setConfirm] = useState(null);
    const [deleting, setDeleting] = useState({});

    const fetchEvents = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const res = await getEvents({ page, limit: 10, all: true });
            const payload = res.data?.data;
            setEvents(Array.isArray(payload) ? payload : (payload?.events || []));
            setTotalPages(payload?.totalPages ?? 1);
        } catch (err) { setError(getErrorMessage(err)); }
        finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const field = (key) => (e) => { const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value; setForm((p) => ({ ...p, [key]: val })); if (formErrors[key]) setFormErrors((p) => ({ ...p, [key]: null })); };
    const editField = (key) => (e) => { const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value; setEditForm((p) => ({ ...p, [key]: val })); if (editFormErrors[key]) setEditFormErrors((p) => ({ ...p, [key]: null })); };
    const validate = () => { const e = {}; if (!form.title.trim()) e.title = 'Title required'; if (!form.date) e.date = 'Date required'; if (!form.event_category) e.event_category = 'Category required'; return e; };
    const validateEdit = () => { const e = {}; if (!editForm.title.trim()) e.title = 'Title required'; if (!editForm.date) e.date = 'Date required'; if (!editForm.event_category) e.event_category = 'Category required'; return e; };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate(); if (Object.keys(errs).length) { setFormErrors(errs); return; }
        setSubmitting(true);
        try {
            const payload = { title: form.title, description: form.description, date: form.time ? `${form.date}T${form.time}:00` : `${form.date}T00:00:00`, event_category: form.event_category, location: form.location, link: form.link, recording_url: form.recording_url, is_upcoming: form.is_upcoming };
            await createEvent(payload); showToast('Event created!', 'success'); setForm(EMPTY_FORM); setShowForm(false); setPage(1); fetchEvents();
        } catch (err) { showToast(getErrorMessage(err), 'error'); }
        finally { setSubmitting(false); }
    };

    const startEdit = (event) => {
        const eventDate = event.date || event.start_date;
        const dateObj = new Date(eventDate);
        const date = dateObj.toISOString().split('T')[0];
        const time = dateObj.toTimeString().split(':').slice(0, 2).join(':');
        setEditingEvent(event.id);
        setEditForm({ title: event.title || '', description: event.description || '', date, time, event_category: event.event_category || 'webinar', location: event.location || '', link: event.link || '', recording_url: event.recording_url || '', is_upcoming: event.is_upcoming ?? true });
        setEditFormErrors({});
    };

    const cancelEdit = () => { setEditingEvent(null); setEditForm(EMPTY_FORM); setEditFormErrors({}); };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const errs = validateEdit(); if (Object.keys(errs).length) { setEditFormErrors(errs); return; }
        setUpdating(true);
        try {
            const payload = { title: editForm.title, description: editForm.description, date: editForm.time ? `${editForm.date}T${editForm.time}:00` : `${editForm.date}T00:00:00`, event_category: editForm.event_category, location: editForm.location, link: editForm.link, recording_url: editForm.recording_url, is_upcoming: editForm.is_upcoming };
            await updateEvent(editingEvent, payload); showToast('Event updated!', 'success'); cancelEdit(); fetchEvents();
        } catch (err) { showToast(getErrorMessage(err), 'error'); }
        finally { setUpdating(false); }
    };

    const handleDelete = async () => {
        const { id } = confirm; setConfirm(null);
        setDeleting((p) => ({ ...p, [id]: true }));
        try { await deleteEvent(id); setEvents((prev) => prev.filter((ev) => ev.id !== id)); showToast('Event deleted.', 'success'); }
        catch (err) { showToast(getErrorMessage(err), 'error'); }
        finally { setDeleting((p) => ({ ...p, [id]: false })); }
    };

    // Responsive 2-col grid that collapses on small screens
    const formGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px,100%), 1fr))', gap: '14px' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SectionHeader icon={CalendarDays} title="Manage Events" subtitle={`${events.length} event${events.length !== 1 ? 's' : ''}`}
                action={<button onClick={() => setShowForm((p) => !p)} style={showForm ? BTN_CANCEL : BTN_PRIMARY}>{showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Create Event</>}</button>} />

            {showForm && (
                <form onSubmit={handleSubmit} className="adm-form-panel">
                    <p style={{ margin: '0 0 1.1rem', fontWeight: '700', fontSize: '0.9rem', color: '#0F172A' }}>New Event</p>
                    <div style={formGrid}>
                        <FormField label="Title" required error={formErrors.title}><input value={form.title} onChange={field('title')} className={`adm-input${formErrors.title ? ' adm-input-err' : ''}`} placeholder="e.g. AI Governance Webinar" /></FormField>
                        <FormField label="Category" required error={formErrors.event_category}><select value={form.event_category} onChange={field('event_category')} className="adm-input">{EVENT_CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}</select></FormField>
                        <FormField label="Date" required error={formErrors.date}><input type="date" value={form.date} onChange={field('date')} className={`adm-input${formErrors.date ? ' adm-input-err' : ''}`} /></FormField>
                        <FormField label="Time"><input type="time" value={form.time} onChange={field('time')} className="adm-input" /></FormField>
                        <FormField label="Location / Platform"><input value={form.location} onChange={field('location')} className="adm-input" placeholder="Zoom / London / Online" /></FormField>
                        <FormField label="Registration Link"><input type="url" value={form.link} onChange={field('link')} className="adm-input" placeholder="https://..." /></FormField>
                        <FormField label="Recording URL"><input type="url" value={form.recording_url} onChange={field('recording_url')} className="adm-input" placeholder="https://... (post-event)" /></FormField>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '22px' }}>
                            <input type="checkbox" id="is_upcoming" checked={form.is_upcoming} onChange={field('is_upcoming')} style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#1A4731' }} />
                            <label htmlFor="is_upcoming" style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '500', cursor: 'pointer' }}>Mark as upcoming</label>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <FormField label="Description"><textarea value={form.description} onChange={field('description')} rows={3} className="adm-input" style={{ resize: 'vertical' }} placeholder="Event description..." /></FormField>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => { setShowForm(false); setFormErrors({}); setForm(EMPTY_FORM); }} style={BTN_CANCEL}>Cancel</button>
                        <button type="submit" disabled={submitting} style={{ ...BTN_PRIMARY, opacity: submitting ? 0.6 : 1 }}>
                            {submitting ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</> : <><Save size={14} /> Create Event</>}
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{[1,2,3].map((i) => <div key={i} style={{ height: '96px', background: 'white', borderRadius: '10px', border: '1px solid #E2E8F0', animation: 'adm-pulse 1.4s ease-in-out infinite' }} />)}</div>
            ) : error ? <ErrorState message={error} onRetry={fetchEvents} /> : events.length === 0 ? <EmptyState icon={CalendarDays} message="No events yet. Create one above." /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {events.map((ev) => (
                        <div key={ev.id}>
                            {editingEvent === ev.id ? (
                                <form onSubmit={handleUpdate} className="adm-form-panel" style={{ border: '2px solid #F59E0B' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.1rem' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B' }} />
                                        <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem', color: '#0F172A' }}>Editing: {ev.title}</p>
                                    </div>
                                    <div style={formGrid}>
                                        <FormField label="Title" required error={editFormErrors.title}><input value={editForm.title} onChange={editField('title')} className={`adm-input${editFormErrors.title ? ' adm-input-err' : ''}`} /></FormField>
                                        <FormField label="Category" required error={editFormErrors.event_category}><select value={editForm.event_category} onChange={editField('event_category')} className="adm-input">{EVENT_CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}</select></FormField>
                                        <FormField label="Date" required error={editFormErrors.date}><input type="date" value={editForm.date} onChange={editField('date')} className={`adm-input${editFormErrors.date ? ' adm-input-err' : ''}`} /></FormField>
                                        <FormField label="Time"><input type="time" value={editForm.time} onChange={editField('time')} className="adm-input" /></FormField>
                                        <FormField label="Location / Platform"><input value={editForm.location} onChange={editField('location')} className="adm-input" /></FormField>
                                        <FormField label="Registration Link"><input type="url" value={editForm.link} onChange={editField('link')} className="adm-input" /></FormField>
                                        <FormField label="Recording URL"><input type="url" value={editForm.recording_url} onChange={editField('recording_url')} className="adm-input" /></FormField>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '22px' }}>
                                            <input type="checkbox" id={`edit_upcoming_${ev.id}`} checked={editForm.is_upcoming} onChange={editField('is_upcoming')} style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#1A4731' }} />
                                            <label htmlFor={`edit_upcoming_${ev.id}`} style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '500', cursor: 'pointer' }}>Mark as upcoming</label>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <FormField label="Description"><textarea value={editForm.description} onChange={editField('description')} rows={3} className="adm-input" style={{ resize: 'vertical' }} /></FormField>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                                        <button type="button" onClick={cancelEdit} style={BTN_CANCEL}>Cancel</button>
                                        <button type="submit" disabled={updating} style={{ ...BTN_WARN, opacity: updating ? 0.6 : 1, padding: '8px 16px', fontSize: '0.8rem' }}>
                                            {updating ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Updating…</> : <><Save size={13} /> Update Event</>}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="adm-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: '#1E293B' }}>{ev.title}</h3>
                                                <span style={PILL(CATCOLORS[ev.event_category] || '#1A4731', `${CATCOLORS[ev.event_category] || '#1A4731'}18`)}>{ev.event_category}</span>
                                                <span style={PILL(ev.is_published ? '#15803D' : '#64748B', ev.is_published ? '#F0FDF4' : '#F1F5F9')}>{ev.is_published ? '● Published' : '○ Draft'}</span>
                                            </div>
                                            {ev.description && <p style={{ margin: '0 0 10px', color: '#64748B', fontSize: '0.82rem', lineHeight: '1.5' }}>{ev.description}</p>}
                                            <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: '#94A3B8', flexWrap: 'wrap' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CalendarDays size={12} />{formatDate(ev.date || ev.start_date)}</span>
                                                {ev.location && <span>📍 {ev.location}</span>}
                                                <span>{ev.is_upcoming ? '🔜 Upcoming' : '✅ Completed'}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
                                            <button onClick={() => startEdit(ev)} style={BTN_WARN}><Edit2 size={12} /> Edit</button>
                                            <button onClick={async () => {
                                                try { const r = await togglePublishEvent(ev.id); setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, is_published: r.data?.data?.is_published ?? !ev.is_published } : e)); showToast(r.data?.data?.is_published ? 'Event published!' : 'Event unpublished.', 'success'); }
                                                catch (err) { showToast(getErrorMessage(err), 'error'); }
                                            }} style={ev.is_published ? BTN_WARN : BTN_SUCCESS}>{ev.is_published ? 'Unpublish' : 'Publish'}</button>
                                            <button onClick={() => setConfirm({ id: ev.id, name: ev.title })} disabled={deleting[ev.id]} style={{ ...BTN_DANGER, opacity: deleting[ev.id] ? 0.5 : 1 }}>
                                                {deleting[ev.id] ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            <ConfirmDialog isOpen={!!confirm} title="Delete Event" message={`Delete "${confirm?.name}"? This cannot be undone.`} confirmLabel="Delete" onConfirm={handleDelete} onClose={() => setConfirm(null)} />
        </div>
    );
};

export default AdminEvents;
