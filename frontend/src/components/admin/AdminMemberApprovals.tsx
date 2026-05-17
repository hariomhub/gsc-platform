import React, { useState, useEffect, useCallback } from 'react';
import { getErrorMessage } from '../../utils/apiHelpers.js';
import { formatDate, formatDateTime } from '../../utils/dateFormatter.js';
import Pagination from '../common/Pagination.tsx';
import ConfirmDialog from '../common/ConfirmDialog.tsx';
import { SkeletonRow, EmptyState, ErrorState, TableWrapper, SectionHeader, FormField,
         PILL, IBTN, BTN_PRIMARY, BTN_CANCEL, BTN_WARN, BTN_DANGER, BTN_SUCCESS,
         ROLE_LABELS, ROLE_COLORS, ROLE_OPTIONS, EVENT_CATEGORIES, CATCOLORS } from './adminShared.tsx';
import { Check, X, Mail, Building, Loader2, UserX, UserCheck, ChevronDown, Search, AlertCircle, Clock, Users, RefreshCw, Eye, Star, Globe } from 'lucide-react';
import { getPendingUsers, getAllUsers, approveUser, rejectUser, updateUserRole,
         getMembershipApplications, approveMembershipApplication, rejectMembershipApplication,
         getPendingSubTypeUpgrades, approveSubTypeUpgrade, rejectSubTypeUpgrade } from '../../api/admin.api.js';

// ─── 1. Member Approvals Tab ──────────────────────────────────────────────────
const AdminMemberApprovals = ({ showToast, onApproved }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [confirm, setConfirm] = useState(null);
    const [actioning, setActioning] = useState({});
    const [apps, setApps] = useState([]);
    const [appsLoading, setAppsLoading] = useState(true);
    const [appsError, setAppsError] = useState('');
    const [appFilter, setAppFilter] = useState('pending');
    const [appActioning, setAppActioning] = useState({});
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectNotes, setRejectNotes] = useState('');
    const [expanded, setExpanded] = useState(null);

    const [userFilter, setUserFilter] = useState('pending');
    const [userPage, setUserPage] = useState(1);
    const [userTotalPages, setUserTotalPages] = useState(1);
    const [viewUser, setViewUser] = useState(null);

    const [appPage, setAppPage] = useState(1);
    const [appTotalPages, setAppTotalPages] = useState(1);

    // Sub-type upgrade state (final_year_undergrad → working_professional)
    const [subUpgrades, setSubUpgrades]               = useState([]);
    const [subUpgradesLoading, setSubUpgradesLoading] = useState(true);
    const [subUpgradesError, setSubUpgradesError]     = useState('');
    const [subActioning, setSubActioning]             = useState({});
    const [subFilter, setSubFilter]                   = useState('pending');
    const [subPage, setSubPage]                       = useState(1);
    const [subTotalPages, setSubTotalPages]           = useState(1);

    const [badgeModal, setBadgeModal]                 = useState(null);
    const [badgeText, setBadgeText]                   = useState('');

    const fetch = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const res = await getAllUsers({ status: userFilter, limit: 20, page: userPage });
            const payload = res.data?.data;
            setUsers(Array.isArray(payload) ? payload : []);
            setUserTotalPages(res.data?.totalPages || 1);
        } catch (err) { setError(getErrorMessage(err)); }
        finally { setLoading(false); }
    }, [userFilter, userPage]);

    const loadApps = useCallback(async () => {
        setAppsLoading(true); setAppsError('');
        try {
            const res = await getMembershipApplications({ status: appFilter, limit: 20, page: appPage });
            setApps(Array.isArray(res.data?.data) ? res.data.data : []);
            setAppTotalPages(res.data?.totalPages || 1);
        } catch (err) { setAppsError(getErrorMessage(err) || 'Failed to load applications.'); }
        finally { setAppsLoading(false); }
    }, [appFilter, appPage]);

    const loadSubUpgrades = useCallback(async () => {
        setSubUpgradesLoading(true); setSubUpgradesError('');
        try {
            const res = await getPendingSubTypeUpgrades({ status: subFilter, page: subPage, limit: 20 });
            setSubUpgrades(Array.isArray(res.data?.data) ? res.data.data : []);
            setSubTotalPages(res.data?.totalPages || 1);
        } catch (err) { setSubUpgradesError(getErrorMessage(err) || 'Failed to load upgrade requests.'); }
        finally { setSubUpgradesLoading(false); }
    }, [subFilter, subPage]);

    useEffect(() => { fetch(); }, [fetch]);
    useEffect(() => { loadApps(); }, [loadApps]);
    useEffect(() => { loadSubUpgrades(); }, [loadSubUpgrades]);

    const handleSubApprove = (userId, name) => {
        setBadgeModal({ type: 'subtype', id: userId, name });
        setBadgeText('');
    };

    const handleSubReject = async (userId, name) => {
        setSubActioning(p => ({ ...p, [userId]: 'rejecting' }));
        try {
            await rejectSubTypeUpgrade(userId);
            setSubUpgrades(prev => prev.filter(u => u.id !== userId));
            showToast(`${name}'s upgrade request rejected.`, 'info');
        } catch (err) { showToast(getErrorMessage(err), 'error'); }
        finally { setSubActioning(p => ({ ...p, [userId]: null })); }
    };

    const handleApprove = (userId, name) => {
        setBadgeModal({ type: 'user', id: userId, name: name || 'User' });
        setBadgeText('');
    };

    const confirmReject = async () => {
        const { userId } = confirm; setConfirm(null);
        setActioning((p) => ({ ...p, [userId]: 'reject' }));
        try {
            await rejectUser(userId);
            setUsers((prev) => prev.filter((u) => u.id !== userId));
            showToast('User rejected.', 'success');
        } catch (err) { showToast(getErrorMessage(err), 'error'); }
        finally { setActioning((p) => ({ ...p, [userId]: null })); }
    };

    const handleAppApprove = (id, name) => {
        setBadgeModal({ type: 'council', id, name });
        setBadgeText('');
    };

    const confirmBadgeApprove = async () => {
        if (!badgeModal) return;
        const { type, id, name } = badgeModal;
        const data = { profile_badge: badgeText.trim() || null };
        setBadgeModal(null);

        if (type === 'subtype') {
            setSubActioning(p => ({ ...p, [id]: 'approving' }));
            try {
                await approveSubTypeUpgrade(id, data);
                setSubUpgrades(prev => prev.filter(u => u.id !== id));
                showToast(`${name} upgraded to Working Professional!`, 'success');
            } catch (err) { showToast(getErrorMessage(err), 'error'); }
            finally { setSubActioning(p => ({ ...p, [id]: null })); }
        } else if (type === 'user') {
            setActioning((p) => ({ ...p, [id]: 'approve' }));
            try {
                await approveUser(id, data);
                setUsers((prev) => prev.filter((u) => u.id !== id));
                showToast(`${name} approved!`, 'success');
                onApproved?.();
            } catch (err) { showToast(getErrorMessage(err), 'error'); }
            finally { setActioning((p) => ({ ...p, [id]: null })); }
        } else if (type === 'council') {
            setAppActioning(prev => ({ ...prev, [id]: 'approving' }));
            try {
                await approveMembershipApplication(id, data);
                showToast(`${name} approved!`, 'success');
                loadApps();
            } catch (err) { showToast(getErrorMessage(err) || 'Failed to approve.', 'error'); }
            finally { setAppActioning(prev => ({ ...prev, [id]: null })); }
        }
    };

    const handleAppReject = async () => {
        if (!rejectModal) return;
        const { id, name } = rejectModal;
        setAppActioning(prev => ({ ...prev, [id]: 'rejecting' }));
        try {
            await rejectMembershipApplication(id, rejectNotes.trim() || undefined);
            showToast(`${name}'s application rejected.`, 'info');
            setRejectModal(null); setRejectNotes('');
            loadApps();
        } catch (err) { showToast(getErrorMessage(err) || 'Failed to reject.', 'error'); }
        finally { setAppActioning(prev => ({ ...prev, [id]: null })); }
    };

    const ROLE_BADGE   = { council_member: { color: '#0284C7', bg: 'rgba(2,132,199,0.1)' }, executive: { color: '#0284C7', bg: 'rgba(2,132,199,0.1)' }, founding_member: { color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' } };
    const STATUS_BADGE = { pending: { color: '#92400e', bg: '#fffbeb' }, approved: { color: '#15803d', bg: '#f0fdf4' }, rejected: { color: '#991b1b', bg: '#fef2f2' } };

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', background: '#0F2A1E', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Users size={16} color='#6EE7B7' />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#1E293B' }}>New Member Registrations</h3>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8' }}>{userFilter === 'pending' ? 'Pending account approvals' : `Viewing ${userFilter} accounts`}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {['pending', 'approved', 'rejected'].map(s => (
                        <button key={s} onClick={() => setUserFilter(s)} style={{ padding: '0.4rem 0.85rem', border: `1.5px solid ${userFilter === s ? '#1A4731' : '#E2E8F0'}`, borderRadius: '7px', background: userFilter === s ? '#1A4731' : 'white', color: userFilter === s ? 'white' : '#64748B', fontWeight: '600', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>{s}</button>
                    ))}
                    <button onClick={fetch} style={{ padding: '0.4rem 0.6rem', border: '1.5px solid #E2E8F0', borderRadius: '7px', background: 'white', cursor: 'pointer', color: '#64748B', fontFamily: 'inherit' }}><RefreshCw size={13} /></button>
                </div>
            </div>

            {loading && <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{[1,2,3].map(i => <div key={i} style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', height: '88px', animation: 'adm-pulse 1.4s ease-in-out infinite' }} />)}</div>}
            {error && <ErrorState message={error} onRetry={fetch} />}
            {!loading && !error && users.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'white', borderRadius: '14px', border: '1px solid #F1F5F9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0', margin: '0 auto 0.75rem' }}>
                        <UserCheck size={20} color="#16A34A" style={{ display: 'block' }} />
                    </div>
                    <p style={{ color: '#15803D', fontWeight: '700', margin: '0 0 3px', fontSize: '0.9rem' }}>All caught up!</p>
                    <p style={{ color: '#86EFAC', margin: 0, fontSize: '0.78rem' }}>No {userFilter} registrations.</p>
                </div>
            )}
            {!loading && users.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {users.map((u) => (
                        <div key={u.id} style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.1rem 1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: '1 1 200px', minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: '700', fontSize: '0.975rem', color: '#1E293B' }}>{u.name}</span>
                                    <span style={PILL(ROLE_COLORS[u.role] || '#64748B', `${ROLE_COLORS[u.role] || '#64748B'}18`)}>{ROLE_LABELS[u.role] || u.role}</span>
                                </div>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: '#64748B' }}><Mail size={12} /> {u.email}</span>
                                {u.organisation && <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: '#64748B' }}><Building size={12} /> {u.organisation}</span>}
                                <span style={{ fontSize: '0.75rem', color: '#94A3B8', background: '#F1F5F9', padding: '2px 10px', borderRadius: '100px', alignSelf: 'flex-start', marginTop: '2px' }}>Registered: {formatDate(u.created_at)}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0, flexWrap: 'wrap' }}>
                                <button onClick={() => setViewUser(u)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'white', color: '#1A4731', border: '1.5px solid #1A4731', padding: '9px 16px', borderRadius: '9px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }} onMouseOver={e => e.currentTarget.style.background='#f0f4f8'} onMouseOut={e => e.currentTarget.style.background='white'}>
                                    <Eye size={14} /> View Details
                                </button>
                                {u.status === 'pending' && (
                                    <>
                                        <button onClick={() => handleApprove(u.id, u.name)} disabled={!!actioning[u.id]} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#16A34A', color: 'white', border: 'none', padding: '9px 20px', borderRadius: '9px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit', opacity: actioning[u.id] ? 0.6 : 1 }}>
                                            {actioning[u.id] === 'approve' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />} Approve
                                        </button>
                                        <button onClick={() => setConfirm({ userId: u.id })} disabled={!!actioning[u.id]} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#DC2626', color: 'white', border: 'none', padding: '9px 20px', borderRadius: '9px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit', opacity: actioning[u.id] ? 0.6 : 1 }}>
                                            {actioning[u.id] === 'reject' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <X size={14} />} Reject
                                        </button>
                                    </>
                                )}
                                {u.status !== 'pending' && (
                                    <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '700', background: STATUS_BADGE[u.status]?.bg || '#f1f5f9', color: STATUS_BADGE[u.status]?.color || '#64748b', textTransform: 'uppercase' }}>
                                        {u.status}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                    <Pagination page={userPage} totalPages={userTotalPages} onPageChange={setUserPage} />
                </div>
            )}
            <ConfirmDialog isOpen={!!confirm} title="Reject Application" message="Are you sure you want to reject this application?" confirmLabel="Reject" onConfirm={confirmReject} onClose={() => setConfirm(null)} />

            {viewUser && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1E293B' }}>Registration Details</h3>
                            <button onClick={() => setViewUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div><p style={{ margin: '0 0 2px', fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Full Name</p><p style={{ margin: 0, fontSize: '0.95rem', color: '#0F172A', fontWeight: '500' }}>{viewUser.name}</p></div>
                            <div><p style={{ margin: '0 0 2px', fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Email Address</p><p style={{ margin: 0, fontSize: '0.95rem', color: '#0F172A', fontWeight: '500' }}>{viewUser.email}</p></div>
                            <div><p style={{ margin: '0 0 2px', fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Role Requested</p><p style={{ margin: 0, fontSize: '0.95rem', color: '#0F172A', fontWeight: '500', textTransform: 'capitalize' }}>{(viewUser.role || '').replace('_', ' ')}</p></div>
                            {viewUser.professional_sub_type && <div><p style={{ margin: '0 0 2px', fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Professional Type</p><p style={{ margin: 0, fontSize: '0.95rem', color: '#0F172A', fontWeight: '500' }}>{viewUser.professional_sub_type === 'working_professional' ? 'Working Professional' : 'Final Year Undergraduate'}</p></div>}
                            {viewUser.organization_name && <div><p style={{ margin: '0 0 2px', fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Organisation Name</p><p style={{ margin: 0, fontSize: '0.95rem', color: '#0F172A', fontWeight: '500' }}>{viewUser.organization_name}</p></div>}
                            {viewUser.linkedin_url && <div><p style={{ margin: '0 0 2px', fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>LinkedIn Profile</p><a href={viewUser.linkedin_url} target="_blank" rel="noreferrer" style={{ margin: 0, fontSize: '0.95rem', color: '#0D9B6E', fontWeight: '500', textDecoration: 'none' }}>{viewUser.linkedin_url}</a></div>}
                        </div>
                        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setViewUser(null)} style={{ padding: '0.6rem 1.2rem', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {badgeModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1E293B' }}>Assign Profile Badge</h3>
                            <button onClick={() => setBadgeModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#475569' }}>
                                You are approving <strong>{badgeModal.name}</strong>. Optionally, enter a profile badge (e.g., "Microsoft Lead") to display next to their name in the community feed.
                            </p>
                            <input 
                                type="text"
                                className="adm-input"
                                placeholder="e.g. Microsoft Lead"
                                value={badgeText}
                                onChange={(e) => setBadgeText(e.target.value)}
                                maxLength={60}
                                style={{ marginBottom: '0.5rem' }}
                            />
                            <div style={{ fontSize: '0.75rem', color: badgeText.length >= 60 ? '#EF4444' : '#94A3B8', textAlign: 'right' }}>
                                {badgeText.length}/60
                            </div>
                        </div>
                        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: '#F8FAFC' }}>
                            <button onClick={() => setBadgeModal(null)} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={confirmBadgeApprove} style={{ padding: '0.5rem 1rem', background: '#16A34A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Check size={14} /> Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Membership Upgrade Applications */}
            <div style={{ marginTop: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', background: '#0F2A1E', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Star size={16} color='#6EE7B7' />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#1E293B' }}>Membership Upgrade Applications</h3>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8' }}>Chapter Lead &amp; Founding Member requests</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {['pending', 'approved', 'rejected'].map(s => (
                            <button key={s} onClick={() => { setAppFilter(s); setAppPage(1); }} style={{ padding: '0.4rem 0.85rem', border: `1.5px solid ${appFilter === s ? '#1A4731' : '#E2E8F0'}`, borderRadius: '7px', background: appFilter === s ? '#1A4731' : 'white', color: appFilter === s ? 'white' : '#64748B', fontWeight: '600', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>{s}</button>
                        ))}
                        <button onClick={loadApps} style={{ padding: '0.4rem 0.6rem', border: '1.5px solid #E2E8F0', borderRadius: '7px', background: 'white', cursor: 'pointer', color: '#64748B', fontFamily: 'inherit' }}><RefreshCw size={13} /></button>
                    </div>
                </div>

                {appsLoading && <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{[1,2].map(i => <div key={i} style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', height: '80px', animation: 'adm-pulse 1.4s ease-in-out infinite' }} />)}</div>}
                {appsError && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.85rem 1rem', color: '#DC2626', fontSize: '0.875rem' }}>{appsError}</div>}
                {!appsLoading && !appsError && apps.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'white', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                        <Star size={28} style={{ margin: '0 auto 0.6rem', display: 'block', opacity: 0.3, color: '#94A3B8' }} />
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94A3B8', fontWeight: '600' }}>No {appFilter} applications</p>
                    </div>
                )}
                {!appsLoading && apps.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        {apps.map(a => {
                            const roleBadge   = ROLE_BADGE[a.requested_role] || {};
                            const statusBadge = STATUS_BADGE[a.status] || {};
                            const isExpanded  = expanded === a.id;
                            const displayName = a.full_name || a.current_name || '—';
                            return (
                                <div key={a.id} style={{ background: 'white', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '1.25rem 1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: '180px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1E293B' }}>{displayName}</span>
                                                <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: '700', background: roleBadge.bg, color: roleBadge.color }}>{a.requested_role === 'founding_member' ? 'Founding Member' : 'Chapter Lead'}</span>
                                                <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: '700', background: statusBadge.bg, color: statusBadge.color, textTransform: 'capitalize' }}>{a.status}</span>
                                            </div>
                                            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                                                <Mail size={11} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{a.email}
                                                {a.organization_name && <>&nbsp;·&nbsp;<Building size={11} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{a.organization_name}</>}
                                                {a.job_title && <>&nbsp;·&nbsp;{a.job_title}</>}
                                            </p>
                                            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>Applied: {a.created_at ? new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                                            <button onClick={() => setExpanded(isExpanded ? null : a.id)} style={{ padding: '0.45rem 0.75rem', border: '1.5px solid #E2E8F0', borderRadius: '7px', background: 'white', cursor: 'pointer', fontSize: '0.8rem', color: '#64748B', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Eye size={13} />{isExpanded ? 'Less' : 'Details'}
                                            </button>
                                            {a.status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleAppApprove(a.id, displayName)} disabled={!!appActioning[a.id]} style={{ padding: '0.45rem 0.9rem', border: 'none', borderRadius: '7px', background: '#15803d', color: 'white', fontWeight: '700', fontSize: '0.8rem', cursor: appActioning[a.id] ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: appActioning[a.id] ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {appActioning[a.id] === 'approving' ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />} Approve
                                                    </button>
                                                    <button onClick={() => { setRejectModal({ id: a.id, name: displayName }); setRejectNotes(''); }} disabled={!!appActioning[a.id]} style={{ padding: '0.45rem 0.9rem', border: 'none', borderRadius: '7px', background: '#dc2626', color: 'white', fontWeight: '700', fontSize: '0.8rem', cursor: appActioning[a.id] ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: appActioning[a.id] ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <X size={13} />Reject
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px,100%), 1fr))', gap: '0.75rem 1.5rem' }}>
                                            {[
                                                ['LinkedIn', a.linkedin_url ? <a href={a.linkedin_url} target='_blank' rel='noreferrer' style={{ color: '#0284C7', wordBreak: 'break-all' }}>{a.linkedin_url}</a> : null],
                                                ['Phone', a.phone],
                                                ['Website', a.website_url ? <a href={a.website_url} target='_blank' rel='noreferrer' style={{ color: '#0284C7' }}>{a.website_url}</a> : null],
                                                ['Twitter / X', a.twitter_url ? <a href={a.twitter_url} target='_blank' rel='noreferrer' style={{ color: '#0284C7' }}>{a.twitter_url}</a> : null],
                                                ['Expertise', a.areas_of_expertise],
                                            ].filter(([, v]) => v).map(([label, val]) => (
                                                <div key={label}>
                                                    <p style={{ margin: '0 0 2px', fontSize: '0.7rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                                                    <p style={{ margin: 0, fontSize: '0.825rem', color: '#374151' }}>{val}</p>
                                                </div>
                                            ))}
                                            {a.professional_bio && (
                                                <div style={{ gridColumn: '1 / -1' }}>
                                                    <p style={{ margin: '0 0 2px', fontSize: '0.7rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Professional Bio</p>
                                                    <p style={{ margin: 0, fontSize: '0.825rem', color: '#374151', lineHeight: '1.6' }}>{a.professional_bio}</p>
                                                </div>
                                            )}
                                            {a.why_founding_member && (
                                                <div style={{ gridColumn: '1 / -1' }}>
                                                    <p style={{ margin: '0 0 2px', fontSize: '0.7rem', fontWeight: '700', color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Why Founding Member</p>
                                                    <p style={{ margin: 0, fontSize: '0.825rem', color: '#374151', lineHeight: '1.6', background: '#faf5ff', borderLeft: '3px solid #7C3AED', padding: '0.5rem 0.75rem', borderRadius: '0 6px 6px 0' }}>{a.why_founding_member}</p>
                                                </div>
                                            )}
                                            {a.admin_notes && (
                                                <div style={{ gridColumn: '1 / -1' }}>
                                                    <p style={{ margin: '0 0 2px', fontSize: '0.7rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Admin Notes</p>
                                                    <p style={{ margin: 0, fontSize: '0.825rem', color: '#374151', fontStyle: 'italic' }}>{a.admin_notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <Pagination page={appPage} totalPages={appTotalPages} onPageChange={setAppPage} />
                    </div>
                )}
            </div>

            {/* ── Sub-type Upgrade Requests (final_year_undergrad → working_professional) ── */}
            <div style={{ marginTop: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', background: '#78350F', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserCheck size={16} color='#FCD34D' />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#1E293B' }}>Working Professional Upgrade Requests</h3>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8' }}>Final Year Undergrad → Working Professional (requires admin approval)</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {['pending', 'approved', 'rejected'].map(s => (
                            <button key={s} onClick={() => { setSubFilter(s); setSubPage(1); }}
                                style={{ padding: '0.4rem 0.85rem', border: `1.5px solid ${subFilter === s ? '#1A4731' : '#E2E8F0'}`, borderRadius: '7px', background: subFilter === s ? '#1A4731' : 'white', color: subFilter === s ? 'white' : '#64748B', fontWeight: '600', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
                                {s}
                            </button>
                        ))}
                        <button onClick={loadSubUpgrades} style={{ padding: '0.4rem 0.6rem', border: '1.5px solid #E2E8F0', borderRadius: '7px', background: 'white', cursor: 'pointer', color: '#64748B', fontFamily: 'inherit' }}><RefreshCw size={13} /></button>
                    </div>
                </div>

                {subUpgradesLoading && <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{[1,2].map(i => <div key={i} style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', height: '80px', animation: 'adm-pulse 1.4s ease-in-out infinite' }} />)}</div>}
                {subUpgradesError && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '0.85rem 1rem', color: '#DC2626', fontSize: '0.875rem' }}>{subUpgradesError}</div>}
                {!subUpgradesLoading && !subUpgradesError && subUpgrades.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'white', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                        <UserCheck size={28} style={{ margin: '0 auto 0.6rem', display: 'block', opacity: 0.3, color: '#94A3B8' }} />
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94A3B8', fontWeight: '600' }}>No {subFilter} upgrade requests</p>
                    </div>
                )}
                {!subUpgradesLoading && subUpgrades.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        {subUpgrades.map(u => {
                            const statusBadge = { pending: { color:'#92400E', bg:'#FFFBEB' }, approved: { color:'#15803D', bg:'#F0FDF4' }, rejected: { color:'#991B1B', bg:'#FEF2F2' } }[u.sub_type_upgrade_status || 'pending'] || {};
                            return (
                            <div key={u.id} style={{ background: 'white', borderRadius: '14px', border: '1.5px solid #FDE68A', padding: '1.1rem 1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: '1 1 200px', minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1E293B' }}>{u.name}</span>
                                        <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px', borderRadius: '100px', background: '#FFFBEB', color: '#92400E' }}>Final Year Undergrad</span>
                                        <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px', borderRadius: '100px', background: '#F0FDF4', color: '#15803D' }}>→ Working Professional</span>
                                        <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px', borderRadius: '100px', background: statusBadge.bg, color: statusBadge.color, textTransform: 'capitalize' }}>{u.sub_type_upgrade_status || 'pending'}</span>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                        <Mail size={11} /> {u.email}
                                        {u.organization_name && <><span style={{ margin: '0 4px' }}>·</span><Building size={11} /> {u.organization_name}</>}
                                        {u.linkedin_url && <><span style={{ margin: '0 4px' }}>·</span><a href={u.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0A66C2', textDecoration: 'none', fontWeight: '600' }}><Globe size={11} /> LinkedIn</a></>}
                                    </span>
                                    <span style={{ fontSize: '0.73rem', color: '#94A3B8' }}>Requested: {formatDate(u.created_at)}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
                                    {subFilter === 'pending' && (
                                        <>
                                            <button onClick={() => handleSubApprove(u.id, u.name)} disabled={!!subActioning[u.id]}
                                                style={{ padding: '0.45rem 0.9rem', border: 'none', borderRadius: '7px', background: '#15803d', color: 'white', fontWeight: '700', fontSize: '0.8rem', cursor: subActioning[u.id] ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: subActioning[u.id] ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {subActioning[u.id] === 'approving' ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />} Approve
                                            </button>
                                            <button onClick={() => handleSubReject(u.id, u.name)} disabled={!!subActioning[u.id]}
                                                style={{ padding: '0.45rem 0.9rem', border: 'none', borderRadius: '7px', background: '#dc2626', color: 'white', fontWeight: '700', fontSize: '0.8rem', cursor: subActioning[u.id] ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: subActioning[u.id] ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <X size={13} /> Reject
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            );
                        })}
                        <Pagination page={subPage} totalPages={subTotalPages} onPageChange={setSubPage} />
                    </div>
                )}
            </div>

            {rejectModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: 'white', borderRadius: '14px', padding: 'clamp(1.5rem,4vw,2rem)', maxWidth: '440px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: '800', color: '#1E293B' }}>Reject Application</h3>
                        <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: '#64748B' }}>Reject <strong>{rejectModal.name}</strong>'s membership application? The applicant will receive an email notification.</p>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Reason / Notes (optional)</label>
                        <textarea value={rejectNotes} onChange={e => setRejectNotes(e.target.value)} rows={3} placeholder='Optional reason to include in the notification email…' style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.65rem 0.9rem', fontSize: '0.875rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '1.25rem' }} />
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setRejectModal(null)} style={{ flex: 1, padding: '0.75rem', border: '1.5px solid #E2E8F0', borderRadius: '8px', background: 'white', color: '#64748B', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                            <button onClick={handleAppReject} style={{ flex: 1, padding: '0.75rem', border: 'none', borderRadius: '8px', background: '#DC2626', color: 'white', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>Reject Application</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminMemberApprovals;
