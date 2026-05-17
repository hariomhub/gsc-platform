import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Shield, Users, Clock, FileText, CalendarDays,
    BookOpen, ShieldCheck, Trophy, Newspaper,
} from 'lucide-react';
import { useAuth }  from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { getAdminStats, getPendingUsers, getMembershipApplications } from '../../api/admin.api.js';
import { getPendingResources } from '../../api/resources.api.js';
import { getFetchStats }  from '../../api/autoNews.api.js';

// ── Sub-components ─────────────────────────────────────────────────────────────
import AdminMemberApprovals from '../../components/admin/AdminMemberApprovals.tsx';
import AdminPendingResources from '../../components/admin/AdminPendingResources.tsx';
import AdminEvents           from '../../components/admin/AdminEvents.tsx';
import AdminNews             from '../../components/admin/AdminNews.tsx';
import AdminTeam             from '../../components/admin/AdminTeam.tsx';
import AdminResources        from '../../components/admin/AdminResources.tsx';
import AdminProductReviews   from '../../components/admin/AdminProductReviews.tsx';
import AdminWorkshops        from '../../components/admin/AdminWorkshops.tsx';
import AdminNominees         from './AdminNominees.tsx';
import FrameworkManagement       from '../../components/admin/FrameworkManagement.tsx';
import AutomatedNewsManagement   from '../../components/admin/AutomatedNewsManagement.tsx';
import HeroBackground from '../../components/common/HeroBackground.tsx';

// ── Tab config ─────────────────────────────────────────────────────────────────
const TABS = [
    { key: 'pending',           label: 'Member Approvals',     icon: Clock       },
    { key: 'pending_resources', label: 'Pending Resources',    icon: FileText    },
    { key: 'news',              label: 'Manage News',          icon: FileText    },
    { key: 'auto_news',         label: 'Automated News',       icon: Newspaper   },
    { key: 'events',            label: 'Manage Events',        icon: CalendarDays},
    { key: 'workshops',         label: 'Expert Workshops',     icon: BookOpen    },
    { key: 'team',              label: 'Manage Team',          icon: Users       },
    { key: 'resources',         label: 'Manage Resources',     icon: FileText    },
    { key: 'product_reviews',   label: 'ESG Solution Reviews', icon: ShieldCheck },
    { key: 'nominations',       label: 'Nominations',          icon: Trophy      },
    { key: 'framework',         label: 'Framework Content',    icon: Shield      },
];

const VALID_TABS   = TABS.map(t => t.key);
const COUNCIL_TABS = ['pending_resources'];

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { showToast } = useToast();
    const defaultTab = user?.role === 'council_member' ? 'pending_resources' : 'pending';
    const urlTab = searchParams.get('tab');
    const [tab, setTab] = useState(urlTab && VALID_TABS.includes(urlTab) ? urlTab : defaultTab);
    const [pendingCount, setPendingCount] = useState(0);
    const [pendingResourcesCount, setPendingResourcesCount] = useState(0);
    const [pendingNewsCount, setPendingNewsCount] = useState(0);

    useEffect(() => { document.title = 'Admin Dashboard | GSC'; }, []);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        if (user.role !== 'founding_member' && user.role !== 'council_member') { navigate('/'); }
    }, [user, navigate]);

    const refreshPending = useCallback(async () => {
        try {
            const [usersRes, appsRes] = await Promise.allSettled([getPendingUsers(), getMembershipApplications({ status: 'pending' })]);
            const users = usersRes.status === 'fulfilled' ? (usersRes.value.data?.data ?? []) : [];
            const apps  = appsRes.status  === 'fulfilled' ? (appsRes.value.data?.data  ?? []) : [];
            setPendingCount((Array.isArray(users) ? users.length : 0) + (Array.isArray(apps) ? apps.length : 0));
        } catch { setPendingCount(0); }
    }, []);

    const refreshPendingResources = useCallback(async () => {
        try { const res = await getPendingResources(); const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []); setPendingResourcesCount(list.length); }
        catch { setPendingResourcesCount(0); }
    }, []);

    const refreshPendingNews = useCallback(async () => {
        try { const res = await getFetchStats(); const stats = res?.data ?? res ?? {}; setPendingNewsCount(stats.pending ?? 0); }
        catch { setPendingNewsCount(0); }
    }, []);

    useEffect(() => {
        if (user?.role === 'founding_member') { refreshPending(); refreshPendingResources(); refreshPendingNews(); }
        else if (user?.role === 'council_member') { refreshPendingResources(); refreshPendingNews(); }
    }, [user, refreshPending, refreshPendingResources, refreshPendingNews]);

    if (!user || (user.role !== 'founding_member' && user.role !== 'council_member')) return null;

    const isFoundingMember = user.role === 'founding_member';
    const COUNCIL_TABS = ['pending_resources', 'news', 'auto_news', 'events', 'resources'];
    // workshops tab is founding_member only — not in COUNCIL_TABS
    const visibleTabs = isFoundingMember ? TABS : TABS.filter(t => COUNCIL_TABS.includes(t.key));
    const activeTabInfo = TABS.find(t => t.key === tab);
    const ActiveTabIcon = activeTabInfo?.icon;

    return (
        <div style={{ background: '#F1F5F9', minHeight: '100vh' }}>
            {/* ── Header ── */}
            <div style={{ background: '#0A2B1D', borderBottom: '1px solid #122F21', position: 'relative', overflow: 'hidden' }}>
                <HeroBackground />
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(1rem,3vw,2rem)', position: 'relative', zIndex: 1 }}>


                    {/* Top bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.4rem 0 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{ width: '42px', height: '42px', background: '#1A4731', border: '1px solid #0a4f99', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Shield size={20} color="#6EE7B7" />
                            </div>
                            <div>
                                <h1 style={{ margin: 0, color: '#F8FAFC', fontSize: 'clamp(1rem,2vw,1.25rem)', fontWeight: '700', letterSpacing: '-0.01em', lineHeight: 1.2 }}>Admin Dashboard</h1>
                                <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.78rem', fontWeight: '400' }}>Global Sustainability Council (GSC) - Control Centre</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
                            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Logged in as</span>
                            <span style={{ fontSize: '0.78rem', color: '#F1F5F9', fontWeight: '600' }}>{user.name}</span>
                            <span style={{ marginLeft: '4px', background: '#1A4731', border: '1px solid #0a4f99', borderRadius: '5px', padding: '2px 8px', fontSize: '0.65rem', fontWeight: '700', color: '#6EE7B7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{isFoundingMember ? 'Admin' : 'Chapter Lead'}</span>
                        </div>
                    </div>

                    {/* Stats row — horizontal scroll on mobile */}
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <div style={{ display: 'flex', gap: '0', padding: '1rem 0', minWidth: 'max-content' }}>

                            {isFoundingMember && (
                                <div className="adm-stat-card" onClick={() => setTab('pending')} style={{ flex: '0 0 auto', paddingRight: '2rem', marginRight: '2rem', borderRight: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: pendingCount > 0 ? '#EF4444' : '#334155', flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.67rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pending Approvals</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.8rem', fontWeight: '800', color: pendingCount > 0 ? '#F87171' : '#475569', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{pendingCount > 0 ? pendingCount : '0'}</span>
                                        {pendingCount > 0 && <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#F87171', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '4px', padding: '1px 6px', whiteSpace: 'nowrap' }}>Action needed</span>}
                                    </div>
                                </div>
                            )}

                            <div className="adm-stat-card" onClick={() => setTab('pending_resources')} style={{ flex: '0 0 auto', paddingRight: '2rem', marginRight: '2rem', borderRight: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: pendingResourcesCount > 0 ? '#F59E0B' : '#334155', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.67rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pending Resources</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.8rem', fontWeight: '800', color: pendingResourcesCount > 0 ? '#FBBF24' : '#475569', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{pendingResourcesCount > 0 ? pendingResourcesCount : '0'}</span>
                                    {pendingResourcesCount > 0 && <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#FBBF24', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '4px', padding: '1px 6px', whiteSpace: 'nowrap' }}>Needs review</span>}
                                </div>
                            </div>

                            <div className="adm-stat-card" onClick={() => setTab('auto_news')} style={{ flex: '0 0 auto', paddingRight: '2rem', marginRight: '2rem', borderRight: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: pendingNewsCount > 0 ? '#8B5CF6' : '#334155', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.67rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pending News</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.8rem', fontWeight: '800', color: pendingNewsCount > 0 ? '#A78BFA' : '#475569', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{pendingNewsCount}</span>
                                    {pendingNewsCount > 0 && <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#A78BFA', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '4px', padding: '1px 6px', whiteSpace: 'nowrap' }}>Needs review</span>}
                                </div>
                            </div>

                            <div style={{ flex: '0 0 auto' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0D9B6E', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.67rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Active Section</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {ActiveTabIcon && <ActiveTabIcon size={15} color="#6EE7B7" />}
                                    <span style={{ fontSize: '1rem', fontWeight: '700', color: '#E2E8F0' }}>{activeTabInfo?.label || '—'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tab Navigation — horizontal scroll on mobile ── */}
            <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 40 }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(0.5rem,2vw,2rem)' }}>
                    <div>
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                            {visibleTabs.map(({ key, label, icon: Icon }) => {
                                const active = tab === key;
                                return (
                                    <button key={key} onClick={() => setTab(key)} className="adm-tab-btn"
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.8rem 1.1rem', background: active ? '#F8FAFC' : 'none', border: 'none', borderBottom: active ? '2px solid #1A4731' : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: active ? '700' : '500', color: active ? '#1A4731' : '#64748B', whiteSpace: 'nowrap', transition: 'all 0.15s', outline: 'none', marginBottom: '-1px' }}>
                                        <Icon size={13} style={{ opacity: active ? 1 : 0.5, flexShrink: 0, transition: 'opacity 0.15s' }} />
                                        {label}
                                        {key === 'pending' && pendingCount > 0 && <span style={{ background: '#EF4444', color: 'white', fontSize: '0.6rem', fontWeight: '800', padding: '1px 5px', borderRadius: '100px', lineHeight: '1.6', marginLeft: '1px' }}>{pendingCount}</span>}
                                        {key === 'pending_resources' && pendingResourcesCount > 0 && <span style={{ background: '#F59E0B', color: 'white', fontSize: '0.6rem', fontWeight: '800', padding: '1px 5px', borderRadius: '100px', lineHeight: '1.6', marginLeft: '1px' }}>{pendingResourcesCount}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'clamp(1rem,3vw,1.75rem) clamp(1rem,3vw,1.5rem) 5rem' }}>
                {tab === 'pending'           && <AdminMemberApprovals showToast={showToast} onApproved={refreshPending} />}
                {tab === 'pending_resources' && <AdminPendingResources showToast={showToast} onCountChange={setPendingResourcesCount} />}
                {tab === 'news'              && <AdminNews showToast={showToast} />}
                {tab === 'auto_news'         && <AutomatedNewsManagement />}
                {tab === 'events'            && <AdminEvents showToast={showToast} />}
                {tab === 'team'              && <AdminTeam showToast={showToast} />}
                {tab === 'resources'         && <AdminResources showToast={showToast} />}
                {tab === 'product_reviews'   && <AdminProductReviews showToast={showToast} />}
                {tab === 'workshops'         && <AdminWorkshops showToast={showToast} />}
                {tab === 'nominations'       && <AdminNominees embedded />}
                {tab === 'framework'         && <FrameworkManagement />}
            </div>

            <style>{`
                @keyframes adm-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
                @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

                .adm-stat-card { transition: opacity 0.15s; }
                .adm-stat-card:hover { opacity: 0.75; }

                /* Tab nav scrollbar hidden */
                .adm-tab-btn:hover { background: #F8FAFC !important; color: #1A4731 !important; }
                .adm-tab-btn:focus-visible { outline: 2px solid #1A4731; outline-offset: -2px; }

                /* Form panel */
                .adm-form-panel {
                    background: white;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    padding: clamp(1rem,3vw,1.5rem);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
                }

                /* Inputs */
                .adm-input {
                    width: 100%;
                    padding: 0.55rem 0.75rem;
                    border: 1px solid #CBD5E1;
                    border-radius: 6px;
                    font-size: 0.875rem;
                    font-family: inherit;
                    outline: none;
                    box-sizing: border-box;
                    transition: border-color 0.15s, box-shadow 0.15s;
                    background: white;
                    color: #1E293B;
                }
                .adm-input:focus { border-color: #1A4731; box-shadow: 0 0 0 3px rgba(0,51,102,0.08); }
                .adm-input-err { border-color: #EF4444 !important; }
                .adm-input-err:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }

                /* Cards */
                .adm-card {
                    background: white;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    padding: clamp(0.875rem,2vw,1rem) clamp(1rem,2.5vw,1.25rem);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
                    transition: box-shadow 0.15s;
                }
                .adm-card:hover { box-shadow: 0 3px 10px rgba(0,51,102,0.08); border-color: #CBD5E1; }

                /* Hide tab scrollbar on WebKit */
                div[style*="overflow-x: auto"]::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};

export default AdminDashboard;