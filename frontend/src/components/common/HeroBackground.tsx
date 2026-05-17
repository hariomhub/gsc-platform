import React from 'react';

/**
 * HeroBackground
 * A reusable, premium animated geometric background component matching the
 * Global Sustainability Council brand. Best used inside a `position: relative`
 * container with `overflow: hidden`.
 */
const HeroBackground: React.FC = () => {
    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
            {/* Base Gradient */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0A2B1D 0%, #113626 50%, #0A2B1D 100%)' }} />
            
            {/* Large Geometric Background Circles */}
            <div style={{ position: 'absolute', bottom: '-40%', left: '-15%', width: 'min(800px, 100vw)', height: 'min(800px, 100vw)', borderRadius: '50%', background: 'rgba(26, 71, 49, 0.5)', animation: 'gsc-circle-1 20s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', top: '-40%', right: '-20%', width: 'min(1000px, 120vw)', height: 'min(1000px, 120vw)', borderRadius: '50%', background: 'rgba(26, 71, 49, 0.35)', animation: 'gsc-circle-2 25s ease-in-out infinite' }} />
            
            {/* A subtle gold accent ring for premium feel */}
            <div style={{ position: 'absolute', top: '10%', right: '10%', width: 'min(400px, 50vw)', height: 'min(400px, 50vw)', borderRadius: '50%', border: '1px solid rgba(245, 184, 66, 0.1)', animation: 'gsc-circle-1 18s ease-in-out infinite reverse' }} />
            
            {/* Subtle grid overlay for professional texture */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.6 }} />
        </div>
    );
};

export default HeroBackground;
