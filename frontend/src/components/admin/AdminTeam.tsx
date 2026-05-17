import React, { useState, useEffect, useCallback } from 'react';
import { getErrorMessage } from '../../utils/apiHelpers.js';
import { formatDate, formatDateTime } from '../../utils/dateFormatter.js';
import Pagination from '../common/Pagination.tsx';
import ConfirmDialog from '../common/ConfirmDialog.tsx';
import { SkeletonRow, EmptyState, ErrorState, TableWrapper, SectionHeader, FormField,
         PILL, IBTN, BTN_PRIMARY, BTN_CANCEL, BTN_WARN, BTN_DANGER, BTN_SUCCESS,
         ROLE_LABELS, ROLE_COLORS, ROLE_OPTIONS, EVENT_CATEGORIES, CATCOLORS } from './adminShared.tsx';
import { Users, Plus, Trash2, Edit2, Save, Loader2, Linkedin } from 'lucide-react';
import { getTeam, createTeamMember, updateTeamMember, deleteTeamMember } from '../../api/team.api.js';

// ─── 5. Manage Team Tab ───────────────────────────────────────────────────────
const AdminTeam = ({ showToast }) => {
    const EMPTY_FORM = { name: '', role: '', bio: '', linkedin_url: '', email: '', image: null };
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [confirm, setConfirm] = useState(null);
    const [viewMemberDetails, setViewMemberDetails] = useState(null);
    const [deleting, setDeleting] = useState({});
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchTeam = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const res = await getTeam({ page, limit: 10 });
            const payload = res.data?.data;
            setMembers(Array.isArray(payload) ? payload : (payload?.members || []));
            setTotalPages(payload?.totalPages ?? 1);
        } catch (err) { setError(getErrorMessage(err)); }
        finally { setLoading(false); }
    }, [page]);

    useEffect(() => { fetchTeam(); }, [fetchTeam]);

    const field = (key) => (e) => { setForm((p) => ({ ...p, [key]: e.target.value })); if (formErrors[key]) setFormErrors((p) => ({ ...p, [key]: null })); };
    const validate = () => { const e = {}; if (!form.name.trim()) e.name = 'Name required'; if (!form.role.trim()) e.role = 'Role required'; return e; };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate(); if (Object.keys(errs).length) { setFormErrors(errs); return; }
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('name', form.name); fd.append('role', form.role); fd.append('bio', form.bio || '');
            if (form.linkedin_url) fd.append('linkedin_url', form.linkedin_url);
            else fd.append('linkedin_url', '');
            if (form.email) fd.append('email', form.email);
            else fd.append('email', '');
            if (form.image) fd.append('photo', form.image);
            if (editingId) {
                await updateTeamMember(editingId, fd);
                showToast('Team member updated!', 'success');
            } else {
                await createTeamMember(fd);
                showToast('Team member added!', 'success');
            }
            setForm(EMPTY_FORM); setEditingId(null); setShowForm(false); fetchTeam();
        } catch (err) { showToast(getErrorMessage(err), 'error'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async () => {
        const { id } = confirm; setConfirm(null); setDeleting((p) => ({ ...p, [id]: true }));
        try { await deleteTeamMember(id); setMembers((prev) => prev.filter((m) => m.id !== id)); showToast('Team member removed.', 'success'); }
        catch (err) { showToast(getErrorMessage(err), 'error'); }
        finally { setDeleting((p) => ({ ...p, [id]: false })); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <SectionHeader icon={Users} title="Manage Team" subtitle={`${members.length} member${members.length !== 1 ? 's' : ''}`}
                action={<button onClick={() => { setShowForm((p) => !p); if (!showForm) { setForm(EMPTY_FORM); setEditingId(null); } }} style={showForm ? BTN_CANCEL : BTN_PRIMARY}><Plus size={14} /> {showForm ? 'Cancel' : 'Add Member'}</button>} />

            {showForm && (
                <form onSubmit={handleSubmit} noValidate className="adm-form-panel">
                    <p style={{ margin: '0 0 1rem', fontWeight: '700', fontSize: '0.9rem', color: '#0F172A' }}>{editingId ? 'Edit Team Member' : 'New Team Member'}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px,100%), 1fr))', gap: '14px' }}>
                        <FormField label="Full Name" required error={formErrors.name}><input value={form.name} onChange={field('name')} className={`adm-input${formErrors.name ? ' adm-input-err' : ''}`} placeholder="Dr. Jane Smith" /></FormField>
                        <FormField label="Role / Title" required error={formErrors.role}><input value={form.role} onChange={field('role')} className={`adm-input${formErrors.role ? ' adm-input-err' : ''}`} placeholder="Director of Research" /></FormField>
                        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                            <FormField label="Email ID (Optional)"><input type="email" value={form.email || ''} onChange={field('email')} className="adm-input" placeholder="member@example.com" /></FormField>
                            <FormField label="LinkedIn URL (Optional)"><input type="url" value={form.linkedin_url || ''} onChange={field('linkedin_url')} className="adm-input" placeholder="https://linkedin.com/in/..." /></FormField>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}><FormField label="Bio"><textarea value={form.bio || ''} onChange={field('bio')} rows={3} className="adm-input" style={{ resize: 'vertical' }} placeholder="Short biography…" /></FormField></div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <FormField label="Profile Photo">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.25rem', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px', cursor: 'pointer', color: '#475569', fontSize: '0.85rem', fontWeight: '500', transition: 'all 0.2s', width: '100%', boxSizing: 'border-box' }} onMouseOver={(e) => { e.currentTarget.style.borderColor = '#94A3B8'; e.currentTarget.style.background = '#F1F5F9'; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#F8FAFC'; }}>
                                    <Upload size={18} color="#64748B" />
                                    {form.image ? <span style={{ color: '#0F172A', fontWeight: '600' }}>{form.image.name}</span> : <span>Click to browse or drop an image file</span>}
                                    <input type="file" accept="image/*" onChange={(e) => setForm((p) => ({ ...p, image: e.target.files?.[0] || null }))} style={{ display: 'none' }} />
                                </label>
                            </FormField>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setEditingId(null); setFormErrors({}); }} style={BTN_CANCEL}>Cancel</button>
                        <button type="submit" disabled={submitting} style={{ ...BTN_PRIMARY, opacity: submitting ? 0.6 : 1 }}>
                            {submitting ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <><Save size={13} /> {editingId ? 'Save Changes' : 'Add Member'}</>}
                        </button>
                    </div>
                </form>
            )}

            {loading ? <TableWrapper headers={['Member', 'Role / Title', 'Details', 'Added', '']}>{[1,2,3].map((i) => <SkeletonRow key={i} cols={5} />)}</TableWrapper>
            : error ? <ErrorState message={error} onRetry={fetchTeam} /> : members.length === 0 ? <EmptyState icon={Users} message="No team members yet." /> : (
                <TableWrapper headers={['Member', 'Role / Title', 'Details', 'Added', '']}>
                    {members.map((m) => (
                        <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }} onMouseOver={(e) => (e.currentTarget.style.background = '#FAFBFC')} onMouseOut={(e) => (e.currentTarget.style.background = 'white')}>
                            <td style={{ padding: '0.85rem 1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {m.photo_url ? <img src={m.photo_url} alt={m.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid #E2E8F0' }} /> : <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0F2A1E', border: '1px solid #122F21', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#6EE7B7', fontSize: '0.75rem', fontWeight: '800' }}>{m.name?.charAt(0)?.toUpperCase()}</div>}
                                    <span style={{ fontWeight: '600', color: '#1E293B', fontSize: '0.875rem' }}>{m.name}</span>
                                </div>
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: '#64748B', fontSize: '0.875rem' }}>{m.role || m.title || '—'}</td>
                            <td style={{ padding: '0.85rem 1rem', maxWidth: '200px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                    {m.linkedin_url && (
                                        <a href={m.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#0A66C2', textDecoration: 'none', fontWeight: '600' }} title="View LinkedIn Profile">
                                            <Linkedin size={12} /> LinkedIn Profile
                                        </a>
                                    )}
                                    <button onClick={() => setViewMemberDetails(m)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'transparent', border: '1px solid #E2E8F0', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#475569', cursor: 'pointer', fontWeight: '600', transition: 'all 0.15s' }} onMouseOver={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#CBD5E1'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#E2E8F0'; }}>
                                        <Eye size={12} /> View Full Details
                                    </button>
                                </div>
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: '#94A3B8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(m.created_at)}</td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => {
                                        setForm({ name: m.name, role: m.role || m.title || '', bio: m.bio || '', linkedin_url: m.linkedin_url || '', email: m.email || '', image: null });
                                        setEditingId(m.id);
                                        setFormErrors({});
                                        setShowForm(true);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }} style={IBTN('#0284C7', '#F0F9FF')}>
                                        <Edit2 size={11} /> Edit
                                    </button>
                                    <button onClick={() => setConfirm({ id: m.id, name: m.name })} disabled={deleting[m.id]} style={{ ...IBTN('#DC2626', '#FEF2F2'), opacity: deleting[m.id] ? 0.5 : 1 }}>
                                        {deleting[m.id] ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={11} />} Remove
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </TableWrapper>
            )}
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            <ConfirmDialog isOpen={!!confirm} title="Remove Team Member" message={`Remove "${confirm?.name}" from the team?`} confirmLabel="Remove" onConfirm={handleDelete} onClose={() => setConfirm(null)} />
            
            {viewMemberDetails && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setViewMemberDetails(null)}>
                    <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setViewMemberDetails(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
                        
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
                            {viewMemberDetails.photo_url ? <img src={viewMemberDetails.photo_url} alt={viewMemberDetails.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #E2E8F0' }} /> : <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#0F2A1E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6EE7B7', fontSize: '1.5rem', fontWeight: '800' }}>{viewMemberDetails.name?.charAt(0)?.toUpperCase()}</div>}
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', color: '#0F172A', fontWeight: '800' }}>{viewMemberDetails.name}</h3>
                                <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', fontWeight: '500' }}>{viewMemberDetails.role}</p>
                            </div>
                        </div>

                        <div>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Biography</h4>
                            {viewMemberDetails.bio ? (
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{viewMemberDetails.bio}</p>
                            ) : (
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#94A3B8', fontStyle: 'italic' }}>No biography provided.</p>
                            )}
                        </div>

                        {viewMemberDetails.linkedin_url && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <a href={viewMemberDetails.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem', background: '#F0F9FF', color: '#0369A1', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem', border: '1px solid #BAE6FD', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#E0F2FE'} onMouseOut={e => e.currentTarget.style.background = '#F0F9FF'}>
                                    <Linkedin size={14} /> Open LinkedIn Profile
                                </a>
                            </div>
                        )}
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #E2E8F0', marginTop: '0.5rem' }}>
                            <button onClick={() => setViewMemberDetails(null)} style={{ padding: '0.5rem 1.25rem', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTeam;
