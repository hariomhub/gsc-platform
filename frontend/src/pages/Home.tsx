import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Calendar, MapPin, CheckCircle, Users,
  BookOpen, Star, ChevronRight, Leaf, Globe,
  TrendingUp, Award, ExternalLink
} from 'lucide-react';
import { useAuth }  from '../hooks/useAuth.js';
import { useModal } from '../hooks/useModal.js';
import { getNews }   from '../api/news.api.js';
import { getEvents } from '../api/events.api.js';
import { formatDate } from '../utils/dateFormatter.js';
import UpgradeModal from '../components/modals/UpgradeModal.tsx';
import HeroBackground from '../components/common/HeroBackground.tsx';

// ─── Network Background Particle System ───────────────────────────────────────────
const NetworkBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;

    const particles: any[] = [];
    const particleCount = Math.min(Math.floor(window.innerWidth / 15), 100);

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 0.5,
        color: Math.random() > 0.6 ? '#F5B842' : '#3DEBA0'
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < 14400) { // 120px threshold
            const dist = Math.sqrt(distSq);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color === '#F5B842' || p2.color === '#F5B842' 
              ? `rgba(245, 184, 66, ${0.15 * (1 - dist / 120)})`
              : `rgba(61, 235, 160, ${0.1 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        position: 'absolute', inset: 0, 
        width: '100%', height: '100%', 
        pointerEvents: 'none', opacity: 0.8,
        zIndex: 1
      }} 
    />
  );
};

// ─── Stats counter ────────────────────────────────────────────────────────────
const StatCounter = ({ icon, value, label, sublabel }: { icon: React.ReactNode; value: string; label: string; sublabel: string }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
      <div style={{ marginBottom: '0.5rem', opacity: 0.75 }}>{icon}</div>
      <div style={{
        fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: '800', color: 'white',
        fontFamily: 'var(--font-heading)', lineHeight: 1,
        animation: visible ? 'countUp .6s ease both' : 'none',
      }}>
        {value}
      </div>
      <div style={{ fontSize: '0.95rem', color: 'white', marginTop: '4px', fontWeight: '700', letterSpacing: '0.01em' }}>{label}</div>
      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', fontWeight: '400' }}>{sublabel}</div>
    </div>
  );
};

// ─── Feature card ─────────────────────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, color, title, desc, delay }: any) => (
  <div style={{
    background: 'white', borderRadius: '20px', padding: '2rem',
    border: '1px solid #E2E8F0', boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
    display: 'flex', flexDirection: 'column', gap: '1.25rem',
    transition: 'all .3s cubic-bezier(0.2, 0.8, 0.2, 1)',
    animation: `fadeUp .6s ${delay}s ease both`,
    cursor: 'default'
  }}
  onMouseEnter={e => { 
    (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; 
    (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)'; 
    (e.currentTarget as HTMLElement).style.borderColor = 'var(--emerald-light)';
  }}
  onMouseLeave={e => { 
    (e.currentTarget as HTMLElement).style.transform = 'none'; 
    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(0,0,0,0.06)'; 
    (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0';
  }}>
    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .3s' }}>
      <Icon size={26} color={color} />
    </div>
    <div>
      <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-900)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>{title}</h3>
      <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.7', margin: 0 }}>{desc}</p>
    </div>
  </div>
);

// ─── News card ────────────────────────────────────────────────────────────────
const NewsCard = ({ item }: { item: any }) => {
  const SOURCE_COLORS: Record<string, string> = {
    climate: '#0D9B6E', esg: '#0A2E1F', csrd: '#7C3AED',
    carbon: '#D97706', biodiversity: '#059669', general: '#64748B',
  };
  const color = SOURCE_COLORS[item.source_type] || '#64748B';
  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', background: 'white', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E8F4EE', textDecoration: 'none', transition: 'all .3s ease', boxShadow: '0 4px 24px rgba(10,46,31,0.04)' }}
      onMouseEnter={e => { 
        (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 32px rgba(10,46,31,0.08)'; 
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; 
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--emerald-light)';
      }}
      onMouseLeave={e => { 
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(10,46,31,0.04)'; 
        (e.currentTarget as HTMLElement).style.transform = 'none'; 
        (e.currentTarget as HTMLElement).style.borderColor = '#E8F4EE';
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '4px 10px', borderRadius: '100px', background: color + '15', color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {item.source_type || 'ESG'}
        </span>
        {item.source_name && <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: '500' }}>{item.source_name}</span>}
      </div>
      <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-900)', lineHeight: '1.5', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: 'var(--font-heading)' }}>
        {item.title}
      </h4>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>{formatDate(item.created_at)}</span>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ExternalLink size={14} color="var(--emerald)" />
        </div>
      </div>
    </a>
  );
};

// ─── Event card ───────────────────────────────────────────────────────────────
const EventCard = ({ ev, onRegister }: { ev: any; onRegister: (ev: any) => void }) => {
  const CAT_COLORS: Record<string, { bg: string; color: string }> = {
    webinar:  { bg: '#F0FDF4', color: '#0A2E1F' },
    seminar:  { bg: '#ECFDF5', color: '#059669' },
    workshop: { bg: '#FFF7ED', color: '#C2410C' },
    podcast:  { bg: '#FAF5FF', color: '#7C3AED' },
  };
  const cat = CAT_COLORS[ev.event_category] || { bg: '#F0F7F4', color: '#0A2E1F' };
  return (
    <div style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', border: '1px solid #E8F4EE', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'all .3s ease', boxShadow: '0 4px 24px rgba(10,46,31,0.04)' }}
         onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 32px rgba(10,46,31,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--emerald-light)'; }}
         onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(10,46,31,0.04)'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.borderColor = '#E8F4EE'; }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '4px 10px', borderRadius: '100px', background: cat.bg, color: cat.color, textTransform: 'capitalize' }}>{ev.event_category}</span>
        {ev.is_upcoming && <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '4px 10px', borderRadius: '100px', background: 'var(--emerald-bright)', color: '#04150D' }}>Upcoming</span>}
      </div>
      <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-900)', lineHeight: '1.4', fontFamily: 'var(--font-heading)' }}>{ev.title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
          <Calendar size={15} color="var(--emerald)" /> {formatDate(ev.date)}
        </div>
        {ev.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            <MapPin size={15} color="var(--emerald)" /> {ev.location}
          </div>
        )}
      </div>
      <button onClick={() => onRegister(ev)}
        style={{ alignSelf: 'flex-start', background: 'var(--forest)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'background .2s', display: 'flex', alignItems: 'center', gap: '6px' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--forest-light)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--forest)'; }}>
        Register Now <ArrowRight size={14} />
      </button>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const upgradeModal = useModal();

  // Conditional state for showing videos vs framework text
  const [hasVideos, setHasVideos] = useState(false);

  const [news, setNews]           = useState<any[]>([]);
  const [events, setEvents]       = useState<any[]>([]);
  const [newsLoading, setNL]      = useState(true);
  const [eventsLoading, setEL]    = useState(true);
  const [regEvent, setRegEvent]   = useState<any>(null);

  useEffect(() => { document.title = 'Global Sustainability Council — Advancing Sustainable Business'; }, []);

  useEffect(() => {
    getNews({ limit: 6 }).then((r: any) => { setNews(r.data?.data || []); setNL(false); }).catch(() => setNL(false));
    getEvents({ limit: 4, upcoming: true }).then((r: any) => { setEvents(r.data?.data || []); setEL(false); }).catch(() => setEL(false));
  }, []);

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', background: '#0A2B1D' }}>
        <NetworkBackground />
        
        {/* Soft radial glow for depth with floating animation */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(61,235,160,0.08) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(60px)', animation: 'float1 15s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,184,66,0.05) 0%, transparent 60%)', pointerEvents: 'none', filter: 'blur(80px)', animation: 'float2 18s ease-in-out infinite' }} />

        {/* Responsive CSS */}
        <style>{`
          @keyframes float1 { 0% { transform: translate(0,0) scale(1); } 33% { transform: translate(30px,-50px) scale(1.1); } 66% { transform: translate(-20px,20px) scale(0.9); } 100% { transform: translate(0,0) scale(1); } }
          @keyframes float2 { 0% { transform: translate(0,0) scale(1); } 33% { transform: translate(-30px,50px) scale(1.15); } 66% { transform: translate(20px,-20px) scale(0.85); } 100% { transform: translate(0,0) scale(1); } }
          .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(2rem,4vw,3.5rem); align-items: center; }
          .hero-right { animation: fadeUp .8s .2s cubic-bezier(0.2,0.8,0.2,1) both; justify-self: end; width: 100%; max-width: 520px; }
          
          .stats-strip { background: rgba(245,184,66,0.03); border-top: 1px solid rgba(245,184,66,0.15); border-bottom: 1px solid rgba(245,184,66,0.15); }
          .stats-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); }
          .stat-divider { border-right: 1px solid rgba(245,184,66,0.1); }
          .stat-divider:last-child { border-right: none; }

          @media (max-width: 1024px) {
            .hero-grid { grid-template-columns: 1fr; }
            .hero-right { display: none; }
            .stats-inner { grid-template-columns: repeat(2, 1fr); }
            .stat-divider:nth-child(2) { border-right: none; }
            .stat-divider:nth-child(1), .stat-divider:nth-child(2) { border-bottom: 1px solid rgba(245,184,66,0.1); }
          }
          @media (max-width: 600px) {
            .stats-inner { grid-template-columns: 1fr; }
            .stat-divider { border-right: none; border-bottom: 1px solid rgba(245,184,66,0.1); }
            .stat-divider:last-child { border-bottom: none; }
          }
        `}</style>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1280px', margin: '0 auto', padding: 'clamp(3.5rem,6vw,5rem) clamp(1.5rem,5vw,4rem) clamp(2.5rem,4vw,3rem)', width: '100%' }} className="hero-grid">

          {/* Left */}
          <div style={{ animation: 'fadeUp .8s cubic-bezier(0.2, 0.8, 0.2, 1) both' }}>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(245,184,66,0.1)', border: '1px solid rgba(245,184,66,0.3)', borderRadius: '100px', padding: '6px 14px', marginBottom: '1.25rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F5B842', animation: 'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#F5B842', letterSpacing: '0.05em', textTransform: 'uppercase' }}>The Independent ESG Council</span>
            </div>

            {/* Headline */}
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem,4.5vw,3.8rem)', color: 'white', lineHeight: '1.05', marginBottom: '1rem', letterSpacing: '-0.02em', fontWeight: '800' }}>
              Advancing <br />
              <span style={{ color: '#F5B842' }}>Sustainable</span> <br />
              Business Worldwide
            </h1>

            <p style={{ fontSize: 'clamp(0.95rem,1.6vw,1.1rem)', color: 'rgba(255,255,255,0.8)', lineHeight: '1.7', marginBottom: '0.75rem', maxWidth: '520px', fontWeight: '400' }}>
              The independent global council helping organisations navigate CSRD, achieve net-zero commitments, and lead on ESG governance.
            </p>
            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', marginBottom: '2rem', maxWidth: '480px' }}>
              Backed by GRI, TCFD, SBTi, and ISSB frameworks. Trusted by CSOs and ESG leaders across 15+ countries.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/membership')}
                style={{ background: '#F5B842', color: '#0A2B1D', border: 'none', padding: '12px 24px', fontSize: '1rem', fontWeight: '800', borderRadius: '8px', cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(245,184,66,0.4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                Join the Council <ArrowRight size={18} />
              </button>
              <button onClick={() => navigate('/framework')}
                style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '12px 24px', fontSize: '1rem', fontWeight: '600', borderRadius: '8px', cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}>
                Explore Framework
              </button>
            </div>
          </div>

          {/* Right Panel (Conditional Video vs Text) */}
          <div className="hero-right">
            {hasVideos ? (
              /* Video UI Placeholder */
              <div style={{ borderRadius: '16px', overflow: 'hidden', background: '#061A0F', border: '1px solid rgba(245,184,66,0.2)', boxShadow: '0 16px 40px rgba(0,0,0,0.3)' }}>
                {/* Main Featured Video */}
                <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0A2B1D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#F5B842', color: '#0A2B1D', fontSize: '0.7rem', fontWeight: '800', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Featured</div>
                  
                  {/* Play Button */}
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(245,184,66,0.15)', border: '2px solid rgba(245,184,66,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,184,66,0.3)'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,184,66,0.15)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#F5B842"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                  
                  {/* Title Overlay */}
                  <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginBottom: '4px' }}>Expert Insights</div>
                    <div style={{ fontSize: '1.05rem', color: 'white', fontWeight: '700', lineHeight: '1.2' }}>Navigating the CSRD Reporting Landscape</div>
                  </div>
                </div>
                
                {/* Video Thumbnails Row */}
                <div style={{ padding: '12px', display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)' }}>
                  {[1,2,3].map(n => (
                    <div key={n} style={{ flex: '1', aspectRatio: '16/9', borderRadius: '6px', background: '#134D35', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Text/Frameworks UI */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <p style={{ fontSize: '0.8rem', color: '#F5B842', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: '700', margin: 0 }}>Aligned Frameworks</p>
                </div>
                {[
                  { label: 'CSRD / ESRS',   desc: 'Corporate Sustainability Reporting Directive' },
                  { label: 'GRI Standards', desc: 'Global Reporting Initiative' },
                  { label: 'TCFD',          desc: 'Task Force on Climate-related Disclosures' },
                  { label: 'SBTi',          desc: 'Science Based Targets initiative' },
                  { label: 'ISSB IFRS S1 & S2', desc: 'International Sustainability Standards Board' },
                ].map(({ label, desc }, i) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '1.2rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', transition: 'transform .2s' }}
                       onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(-6px)'; (e.currentTarget as HTMLElement).style.borderColor = '#F5B842'; }}
                       onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F5B842', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'white', fontFamily: 'var(--font-heading)' }}>{label}</div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── STATS STRIP (inside hero at the bottom) ── */}
        <div className="stats-strip" style={{ position: 'relative', zIndex: 2 }}>
          <div className="stats-inner" style={{ padding: '0 clamp(1rem,3vw,2rem)' }}>
            <div className="stat-divider"><StatCounter icon={<Users size={20} color="#F5B842" />} value="50,000+" label="CSRD-in-scope" sublabel="companies" /></div>
            <div className="stat-divider"><StatCounter icon={<Globe size={20} color="#F5B842" />} value="500+" label="Member organisations" sublabel="worldwide" /></div>
            <div className="stat-divider"><StatCounter icon={<MapPin size={20} color="#F5B842" />} value="15+" label="Countries" sublabel="represented" /></div>
            <div className="stat-divider"><StatCounter icon={<Leaf size={20} color="#F5B842" />} value="6" label="Sustainability pillars" sublabel="GRI-aligned" /></div>
          </div>
        </div>

      </section>

      {/* ── WHAT WE DO (Light Theme) ──────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', paddingTop: 'clamp(3rem,5vw,4rem)', paddingBottom: 'clamp(2.5rem,4vw,3.5rem)', paddingLeft: 'clamp(1.5rem,5vw,4rem)', paddingRight: 'clamp(1.5rem,5vw,4rem)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

          {/* Section label */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--emerald)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>What We Offer</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: 'var(--text-900)', margin: '1rem 0 1.5rem', lineHeight: '1.1', fontWeight: '800' }}>
              Everything your organisation<br />needs to lead on sustainability
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(1rem,1.8vw,1.15rem)', maxWidth: '640px', margin: '0 auto', lineHeight: '1.8' }}>
              A global community built for practitioners driving meaningful ESG, net-zero, and climate action outcomes.
            </p>
          </div>

          {/* Features grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <FeatureCard icon={BookOpen}    color="var(--emerald)"   delay={0}    title="ESG Knowledge Hub"    desc="Access 120+ sustainability reports, CSRD templates, GHG inventory tools, and audit frameworks. New resources added monthly." />
            <FeatureCard icon={Users}       color="#0A2E1F"          delay={0.1}  title="Peer Network"          desc="Connect with 500+ sustainability professionals, CSOs, ESG analysts, and climate leaders across 15+ countries." />
            <FeatureCard icon={TrendingUp}  color="#D97706"          delay={0.2}  title="Stay Ahead"            desc="Early-access briefings on CSRD enforcement timelines, ISSB IFRS S1 & S2, TNFD, and emerging ESG regulations." />
            <FeatureCard icon={Star}        color="#7C3AED"          delay={0.3}  title="Priority Access"       desc="Expert workshops, ESG advisory sessions, and the annual GSC Summit. Members get first access to every template." />
          </div>
        </div>
      </section>

      {/* ── ABOUT STRIP (Mint Theme) ─────────────────────────────────────────────── */}
      <section style={{ background: '#ECFDF5', padding: 'clamp(2.5rem,4vw,3.5rem) clamp(1.5rem,5vw,4rem)', borderTop: '1px solid #D1FAE5', borderBottom: '1px solid #D1FAE5' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'clamp(3rem,8vw,6rem)', alignItems: 'center' }}>
          {/* Left */}
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--emerald)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>About GSC</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem,4vw,2.5rem)', color: 'var(--text-900)', margin: '1rem 0 1.5rem', lineHeight: '1.15', fontWeight: '800' }}>
              The independent global council advancing sustainable business
            </h2>
            <p style={{ color: 'var(--text-700)', lineHeight: '1.8', fontSize: '1.05rem', marginBottom: '1.5rem' }}>
              An independent council of sustainability professionals, Chief Sustainability Officers, ESG analysts, climate scientists, and policy experts across 15+ countries — delivering practical, science-based guidance to organisations committed to responsible business.
            </p>
            <p style={{ color: 'var(--text-500)', lineHeight: '1.8', fontSize: '1rem', marginBottom: '2.5rem' }}>
              We bridge the gap between ambitious ESG commitments and real-world implementation — from double materiality to net-zero pathways, supply chain due diligence to board-level disclosure.
            </p>
            <Link to="/about" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'white', background: 'var(--forest)', padding: '14px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '1rem', textDecoration: 'none', transition: 'all .2s', boxShadow: '0 4px 12px rgba(10,46,31,0.1)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--forest-light)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(10,46,31,0.2)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--forest)'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(10,46,31,0.1)'; }}>
              Learn about GSC <ArrowRight size={18} />
            </Link>
          </div>

          {/* Right — pillars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              { icon: Leaf,   title: 'Events & Community',      desc: 'Webinars, workshops, and podcasts bringing together CSOs, ESG analysts, and climate leaders globally.' },
              { icon: BookOpen, title: 'ESG Knowledge & Resources', desc: 'CSRD templates, GHG tools, materiality frameworks, and practical guidance aligned to global standards.' },
              { icon: Award,  title: 'Sustainability Certifications', desc: 'GSC-certified credentials for sustainability professionals from Associate to Expert level.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: '1.25rem', padding: '1.75rem', background: 'white', borderRadius: '16px', border: '1px solid #D1FAE5', boxShadow: '0 4px 20px rgba(10,46,31,0.03)', transition: 'transform .2s' }}
                   onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(8px)'; }}
                   onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={22} color="var(--emerald)" />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-900)', marginBottom: '0.4rem', fontFamily: 'var(--font-heading)' }}>{title}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LATEST NEWS ─────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: 'clamp(2.5rem,4vw,3.5rem) clamp(1.5rem,5vw,4rem)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--emerald)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>ESG News</span>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem,4vw,2.5rem)', color: 'var(--text-900)', marginTop: '0.5rem', fontWeight: '800' }}>
                Latest in sustainability & ESG
              </h2>
            </div>
            <Link to="/news" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--forest)', fontWeight: '700', fontSize: '1rem', textDecoration: 'none', padding: '10px 20px', borderRadius: '100px', border: '1px solid #E8F4EE', transition: 'all .2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F0FDF4'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--emerald-light)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = '#E8F4EE'; }}>
              All news <ChevronRight size={18} />
            </Link>
          </div>

          {newsLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ height: '180px', borderRadius: '20px', background: 'linear-gradient(90deg, #F8FAFC 25%, #F1F5F9 50%, #F8FAFC 75%)', backgroundSize: '400px 100%', animation: 'shimmer 1.6s ease-in-out infinite' }} />
              ))}
            </div>
          ) : news.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
              {news.map((item: any) => <NewsCard key={item.id} item={item} />)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', background: '#F8FAFC', borderRadius: '20px', border: '1px dashed #CBD5E1' }}>
              <Globe size={40} style={{ opacity: 0.3, margin: '0 auto 1rem', display: 'block' }} />
              <p style={{ fontSize: '1.1rem' }}>News articles will appear here once the automated feed is configured.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── EVENTS ──────────────────────────────────────────────────── */}
      <section style={{ background: '#F8FAFC', padding: 'clamp(2.5rem,4vw,3.5rem) clamp(1.5rem,5vw,4rem)', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--emerald)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Upcoming</span>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem,4vw,2.5rem)', color: 'var(--text-900)', marginTop: '0.5rem', fontWeight: '800' }}>
                Events & Webinars
              </h2>
            </div>
            <Link to="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--forest)', fontWeight: '700', fontSize: '1rem', textDecoration: 'none', padding: '10px 20px', borderRadius: '100px', border: '1px solid #E2E8F0', transition: 'all .2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'white'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--emerald-light)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'; }}>
              All events <ChevronRight size={18} />
            </Link>
          </div>
          {eventsLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ height: '220px', borderRadius: '20px', background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)', backgroundSize: '400px 100%', animation: 'shimmer 1.6s ease-in-out infinite' }} />
              ))}
            </div>
          ) : events.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
              {events.map((ev: any) => (
                <EventCard key={ev.id} ev={ev} onRegister={setRegEvent} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', background: 'white', borderRadius: '20px', border: '1px dashed #CBD5E1' }}>
              <Calendar size={40} style={{ opacity: 0.3, margin: '0 auto 1rem', display: 'block' }} />
              <p style={{ fontSize: '1.1rem' }}>No upcoming events scheduled. Check back later!</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(2.5rem,4vw,4rem) clamp(1.5rem,5vw,4rem)', background: '#F8FAFC' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', background: '#0A2B1D', borderRadius: '24px', padding: 'clamp(2.5rem,4vw,4rem)', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 64px rgba(10,43,29,0.15)' }}>
          <HeroBackground />
          
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: '720px', margin: '0 auto' }}>
            <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '100px', background: 'rgba(245,184,66,0.15)', color: '#F5B842', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>Join Today</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem,4vw,2.5rem)', color: 'white', marginBottom: '1.25rem', lineHeight: '1.1', fontWeight: '800' }}>
              Join the Global Council
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2.5rem' }}>
              Access exclusive risk assessment templates, peer benchmarking data, and executive briefings. Join a network of over 25 global organisations committed to responsible business.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/membership')}
                style={{ background: '#F5B842', color: '#0A2B1D', border: 'none', padding: '14px 32px', fontSize: '1rem', fontWeight: '800', borderRadius: '8px', cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(245,184,66,0.4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                Explore Membership
              </button>
              <button onClick={() => navigate('/contact')}
                style={{ background: 'transparent', color: '#F5B842', border: '1px solid rgba(245,184,66,0.3)', padding: '14px 32px', fontSize: '1rem', fontWeight: '600', borderRadius: '8px', cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,184,66,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      {upgradeModal.isOpen && <UpgradeModal onClose={upgradeModal.close} />}
      {/* Event registration modal loaded from Events page */}
    </>
  );
};

export default Home;
