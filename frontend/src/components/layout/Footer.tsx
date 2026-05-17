import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Leaf, ArrowUpRight } from 'lucide-react';

const Footer = () => (
    <>
        <style>{`
            .ft-root {
                background: #0A2B1D;
                color: white;
                position: relative;
                overflow: hidden;
            }
            .ft-root::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(245,184,66,0.4), transparent);
            }
            .ft-grid {
                display: grid;
                grid-template-columns: 2fr 1fr 1fr 1.4fr;
                gap: 3rem;
            }
            .ft-col-title {
                font-family: var(--font-heading);
                font-size: 0.75rem;
                font-weight: 800;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: rgba(255,255,255,0.5);
                margin-bottom: 1.1rem;
            }
            .ft-col-link {
                display: flex;
                align-items: center;
                gap: 6px;
                color: rgba(255,255,255,0.65);
                font-size: 0.95rem;
                font-weight: 500;
                text-decoration: none;
                padding: 0.2rem 0;
                transition: color 0.2s;
                line-height: 1.5;
            }
            .ft-col-link:hover { color: rgba(255,255,255,0.95); text-decoration: none; }
            .ft-col-link:hover .ft-arrow { opacity: 1; transform: translate(2px,-2px); }
            .ft-arrow { opacity: 0; transition: opacity 0.2s, transform 0.2s; flex-shrink: 0; }
            .ft-bottom-link {
                color: rgba(255,255,255,0.4);
                font-size: 0.85rem;
                text-decoration: none;
                transition: color 0.2s;
                white-space: nowrap;
            }
            .ft-bottom-link:hover { color: rgba(255,255,255,0.7); text-decoration: none; }
            .ft-contact-item {
                display: flex;
                gap: 10px;
                align-items: flex-start;
                color: rgba(255,255,255,0.6);
                font-size: 0.9rem;
                line-height: 1.6;
                margin-bottom: 0.75rem;
                text-decoration: none;
                transition: color 0.2s;
            }
            .ft-contact-item:hover { color: rgba(255,255,255,0.85); text-decoration: none; }
            .ft-contact-icon { color: #F5B842; flex-shrink: 0; margin-top: 2px; }
            .ft-divider {
                height: 1px;
                background: rgba(255,255,255,0.07);
                margin-bottom: 2rem;
            }

            @media (max-width: 1000px) { .ft-grid { grid-template-columns: 1fr 1fr; gap: 2.5rem; } }
            @media (max-width: 540px)  {
                .ft-grid { grid-template-columns: 1fr; gap: 2rem; }
                .ft-bottom-row { flex-direction: column; align-items: flex-start; gap: 1rem; }
                .ft-bottom-links { flex-wrap: wrap; gap: 0.85rem !important; }
            }
        `}</style>

        <footer className="ft-root">
            {/* Decorative orb */}
            <div style={{
                position: 'absolute', top: '-120px', right: '-120px',
                width: '400px', height: '400px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(61,235,160,0.07) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-60px', left: '10%',
                width: '280px', height: '280px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(245,184,66,0.05) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div style={{
                maxWidth: '1440px', margin: '0 auto', position: 'relative', zIndex: 1,
                padding: 'clamp(2.5rem,4vw,3.5rem) clamp(2rem,6vw,5rem)',
            }}>

                <div className="ft-grid">
                    {/* ── Brand ─────────────────────────────────────── */}
                    <div>
                        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '1.25rem' }}>
                            <img src="/gsc-logo.png" alt="Logo" style={{ width: '42px', height: '42px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                            <div>
                                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'white', letterSpacing: '-0.01em', lineHeight: 1.2, fontFamily: 'var(--font-heading)' }}>
                                    Global Sustainability
                                </div>
                                <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em', lineHeight: 1.2, fontFamily: 'var(--font-heading)' }}>
                                    Council
                                </div>
                            </div>
                        </Link>
                        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem', lineHeight: '1.75', maxWidth: '300px', marginBottom: '1.75rem' }}>
                            The independent global council advancing sustainable business practice, ESG governance, and transparent climate action.
                        </p>
                        {/* Framework badges */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {['GRI', 'CSRD', 'TCFD', 'SBTi', 'ISSB'].map(f => (
                                <span key={f} style={{
                                    fontSize: '0.62rem', fontWeight: '700',
                                    padding: '3px 9px', borderRadius: '100px',
                                    background: 'rgba(245,184,66,0.08)',
                                    border: '1px solid rgba(245,184,66,0.18)',
                                    color: 'rgba(255,255,255,0.55)',
                                    letterSpacing: '0.04em',
                                }}>{f}</span>
                            ))}
                        </div>
                    </div>

                    {/* ── Governance ─────────────────────────────────── */}
                    <div>
                        <p className="ft-col-title">Governance</p>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {[
                                { to: '/framework',     label: 'Sustainability Framework' },
                                { to: '/certification', label: 'Assessment & Certification' },
                                { to: '/services',      label: 'Global Standards' },
                                { to: '/contact',       label: 'Policy & Regulation' },
                            ].map(({ to, label }) => (
                                <Link key={to} to={to} className="ft-col-link">
                                    {label}
                                    <ArrowUpRight size={12} className="ft-arrow" />
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* ── Resources ──────────────────────────────────── */}
                    <div>
                        <p className="ft-col-title">Resources</p>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {[
                                { to: '/resources',     label: 'Research & Whitepapers' },
                                { to: '/events',        label: 'Events & Webinars' },
                                { to: '/membership',    label: 'Member Portal' },
                                { to: '/news',          label: 'ESG News' },
                                { to: '/community',     label: 'ESG Community' },
                            ].map(({ to, label }) => (
                                <Link key={to} to={to} className="ft-col-link">
                                    {label}
                                    <ArrowUpRight size={12} className="ft-arrow" />
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* ── Contact ────────────────────────────────────── */}
                    <div>
                        <p className="ft-col-title">Contact</p>
                        <address style={{ fontStyle: 'normal' }}>
                            <div className="ft-contact-item">
                                <MapPin size={14} className="ft-contact-icon" />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span><strong style={{ color: 'rgba(255,255,255,0.65)', fontWeight: '600' }}>USA:</strong> Costa Mesa, California (CA) 92626</span>
                                    <span><strong style={{ color: 'rgba(255,255,255,0.65)', fontWeight: '600' }}>UAE:</strong> Villa 43, Springs 3, Dubai</span>
                                    <span><strong style={{ color: 'rgba(255,255,255,0.65)', fontWeight: '600' }}>India:</strong> 902, Unitech Arcadia, Gurugram</span>
                                    <span><strong style={{ color: 'rgba(255,255,255,0.65)', fontWeight: '600' }}>Canada:</strong> 3105, 50 Charles St E, Toronto</span>
                                </div>
                            </div>
                            <a href="tel:+16477688767" className="ft-contact-item">
                                <Phone size={14} className="ft-contact-icon" />
                                <span>+1 (647) 768-8767</span>
                            </a>
                            <a href="mailto:support@globalsustainabilitycouncil.com" className="ft-contact-item">
                                <Mail size={14} className="ft-contact-icon" />
                                <span>support@globalsustainabilitycouncil.com</span>
                            </a>
                        </address>
                    </div>
                </div>

                {/* ── Bottom bar ──────────────────────────────────────── */}
                <div className="ft-divider" />
                <div className="ft-bottom-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', margin: 0 }}>
                        © 2026 Global Sustainability Council. All rights reserved.
                    </p>
                    <nav className="ft-bottom-links" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        {[
                            { to: '/privacy',        label: 'Privacy Policy' },
                            { to: '/terms',          label: 'Terms of Use' },
                            { to: '/cookie',         label: 'Cookies' },
                            { to: '/delete-account', label: 'Delete Account' },
                        ].map(({ to, label }) => (
                            <Link key={to} to={to} className="ft-bottom-link">{label}</Link>
                        ))}
                    </nav>
                </div>
            </div>
        </footer>
    </>
);

export default Footer;
