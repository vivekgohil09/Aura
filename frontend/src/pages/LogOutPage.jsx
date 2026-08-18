import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Feather, ArrowRight, ShieldCheck, Heart, Sparkles, MessageSquare } from 'lucide-react';

// ── 3D Ambient Glowing VFX Background ──
function AmbientVFXBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden', background: 'var(--aura-ivory, #FCFBF7)' }}>
      {/* Center Aura Violet Glow */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.35, 0.55, 0.35],
          y: [0, 15, 0]
        }}
        transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '20%',
          left: '25%',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91, 95, 239, 0.16) 0%, rgba(128, 103, 232, 0.05) 55%, transparent 75%)',
          filter: 'blur(55px)'
        }}
      />
      {/* Bottom Center Radial */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.25, 0.45, 0.25]
        }}
        transition={{ repeat: Infinity, duration: 11, ease: 'easeInOut', delay: 1 }}
        style={{
          position: 'absolute',
          bottom: '-100px',
          left: '30%',
          width: '540px',
          height: '540px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(128, 103, 232, 0.14) 0%, rgba(91, 95, 239, 0.04) 60%, transparent 80%)',
          filter: 'blur(60px)'
        }}
      />
    </div>
  );
}

export default function LogOutPage() {
  useEffect(() => {
    document.title = "Aura | Session Ended Safely";
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--aura-ivory, #FCFBF7)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      color: '#171827',
      position: 'relative',
      overflowX: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <AmbientVFXBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: '32px',
          padding: 'clamp(32px, 6vw, 48px)',
          border: '1px solid rgba(23, 24, 39, 0.08)',
          boxShadow: '0 25px 70px rgba(23, 24, 39, 0.05)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2
        }}
      >
        {/* Animated Brand Emblem */}
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
          transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
          style={{
            width: '76px',
            height: '76px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 30px rgba(91, 95, 239, 0.35)',
            marginBottom: '24px'
          }}
        >
          <Feather size={38} color="#FFFFFF" strokeWidth={2.2} />
        </motion.div>

        {/* Security Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 14px',
          borderRadius: '99px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          color: '#10B981',
          fontSize: '0.8rem',
          fontWeight: 800,
          marginBottom: '16px'
        }}>
          <ShieldCheck size={14} color="#10B981" />
          <span>VAULT SESSION SAFELY SEALED</span>
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: 'clamp(1.8rem, 4vw, 2.3rem)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          color: '#171827',
          margin: '0 0 10px'
        }}>
          You Are Signed Out
        </h1>

        <p style={{
          color: '#727486',
          fontSize: '1rem',
          lineHeight: 1.6,
          margin: '0 auto 32px',
          maxWidth: 380
        }}>
          Your WebSocket socket tunnels and client-side encryption caches have been completely closed and cleared.
        </p>

        {/* Primary Action Button */}
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ marginBottom: '14px' }}>
          <Link to="/login" style={{ textDecoration: 'none', display: 'block' }}>
            <button style={{
              width: '100%',
              background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '16px',
              padding: '16px 28px',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 12px 35px rgba(91, 95, 239, 0.32)',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}>
              <span>Sign Back In</span>
              <ArrowRight size={18} color="#FFFFFF" />
            </button>
          </Link>
        </motion.div>

        {/* Secondary Links */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '20px', flexWrap: 'wrap' }}>
          <Link 
            to="/" 
            style={{ 
              color: '#727486', 
              fontSize: '0.88rem', 
              fontWeight: 700, 
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ← Return to Orbit
          </Link>
          <span style={{ color: '#D1D5DB' }}>•</span>
          <Link 
            to="/review-page" 
            style={{ 
              color: '#5B5FEF', 
              fontSize: '0.88rem', 
              fontWeight: 700, 
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <MessageSquare size={14} /> Leave Feedback
          </Link>
        </div>

        {/* Footer info */}
        <div style={{
          marginTop: '36px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(23, 24, 39, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '0.8rem',
          color: '#A1A3B5'
        }}>
          <span>AURA Living Conversations © {new Date().getFullYear()}</span>
        </div>
      </motion.div>
    </div>
  );
}