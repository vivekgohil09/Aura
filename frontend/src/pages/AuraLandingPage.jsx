import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Feather, MessageCircle, Video, Shield, Zap, Globe, ArrowRight, Star } from 'lucide-react';

// ── Ember Particle (fire sparks)
function Ember({ delay = 0, left = 50 }) {
  return (
    <motion.div
      initial={{ y: 0, x: 0, opacity: 0, scale: 0 }}
      animate={{
        y: [-10, -80, -160],
        x: [0, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 120],
        opacity: [0, 0.9, 0],
        scale: [0, 1, 0.2],
      }}
      transition={{ duration: 1.8 + Math.random(), delay, repeat: Infinity, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        bottom: 0,
        left: `${left}%`,
        width: 4 + Math.random() * 4,
        height: 4 + Math.random() * 4,
        borderRadius: '50%',
        background: `hsl(${20 + Math.random() * 30}, 100%, ${55 + Math.random() * 20}%)`,
        boxShadow: '0 0 6px 2px rgba(255, 100, 0, 0.6)',
        pointerEvents: 'none',
      }}
    />
  );
}

// ── Fire Glow Layer behind a feature card
function FireGlow({ active }) {
  return (
    <motion.div
      animate={active ? {
        opacity: [0.5, 0.85, 0.5],
        scale: [1, 1.08, 1],
      } : { opacity: 0 }}
      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      style={{
        position: 'absolute', inset: -12,
        borderRadius: '36px',
        background: 'radial-gradient(ellipse at 50% 100%, rgba(255, 107, 107, 0.5) 0%, rgba(255, 142, 83, 0.25) 50%, transparent 75%)',
        filter: 'blur(16px)',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

// ── Feature card with scroll-triggered burn-in
const FEATURES = [
  {
    icon: <MessageCircle size={32} strokeWidth={1.5} />,
    title: 'Real-Time Messaging',
    desc: 'Socket-powered instant delivery. Zero lag, zero delay — every message lands in milliseconds.',
    accent: '#E63946',
    glow: 'rgba(255, 107, 107, 0.18)',
    embers: [15, 30, 45, 60, 75, 85],
  },
  {
    icon: <Video size={32} strokeWidth={1.5} />,
    title: '4K HD Video Calls',
    desc: 'Crystal-clear peer-to-peer WebRTC calls with adaptive bitrate and spatial audio.',
    accent: '#d62839',
    glow: 'rgba(255, 142, 83, 0.18)',
    embers: [10, 25, 40, 55, 70, 90],
  },
  {
    icon: <Shield size={32} strokeWidth={1.5} />,
    title: 'End-to-End Encrypted',
    desc: 'Military-grade encryption on every message and call. Your data is yours alone.',
    accent: '#E63946',
    glow: 'rgba(255, 107, 107, 0.18)',
    embers: [20, 35, 50, 65, 80, 92],
  },
  {
    icon: <Zap size={32} strokeWidth={1.5} />,
    title: '0ms Socket Sync',
    desc: 'WebSocket-native architecture with instant presence detection and typing indicators.',
    accent: '#d62839',
    glow: 'rgba(255, 142, 83, 0.18)',
    embers: [12, 28, 44, 60, 76, 88],
  },
  {
    icon: <Globe size={32} strokeWidth={1.5} />,
    title: 'Global P2P Network',
    desc: 'Distributed relay network ensures flawless connectivity across every continent.',
    accent: '#E63946',
    glow: 'rgba(255, 107, 107, 0.18)',
    embers: [18, 33, 48, 63, 78, 94],
  },
  {
    icon: <Star size={32} strokeWidth={1.5} />,
    title: 'AI Smart Replies',
    desc: 'Context-aware suggestions powered by on-device AI — private, instant, brilliant.',
    accent: '#d62839',
    glow: 'rgba(255, 142, 83, 0.18)',
    embers: [8, 22, 38, 54, 70, 86],
  },
];

function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60, scale: 0.92 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 60, scale: 0.92 }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, scale: 1.02 }}
      style={{ position: 'relative', cursor: 'default' }}
    >
      {/* Burning fire glow behind card */}
      <FireGlow active={isInView} />

      {/* Ember particles rising from card bottom */}
      {isInView && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, overflow: 'visible', zIndex: 10, pointerEvents: 'none' }}>
          {feature.embers.map((left, i) => (
            <Ember key={i} delay={i * 0.28} left={left} />
          ))}
        </div>
      )}

      {/* Card body */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(20px)',
        borderRadius: '28px',
        padding: '36px 32px',
        border: `1px solid ${isInView ? feature.accent + '40' : 'rgba(61, 43, 38, 0.08)'}`,
        boxShadow: isInView
          ? `0 20px 50px ${feature.glow}, 0 4px 16px rgba(61, 43, 38, 0.04)`
          : '0 8px 24px rgba(61, 43, 38, 0.04)',
        transition: 'border-color 0.6s ease, box-shadow 0.6s ease',
        overflow: 'hidden',
      }}>
        {/* Specular top-edge shine */}
        <div style={{
          position: 'absolute', top: 0, left: '20%', right: '20%',
          height: '1.5px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
          borderRadius: '2px'
        }} />

        {/* Icon badge */}
        <motion.div
          animate={isInView ? { rotate: [0, -5, 5, 0] } : {}}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          style={{
            width: 64, height: 64,
            borderRadius: '18px',
            background: `linear-gradient(135deg, ${feature.accent}22, ${feature.accent}11)`,
            border: `1.5px solid ${feature.accent}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px',
            color: feature.accent,
            boxShadow: `0 6px 20px ${feature.accent}22`,
          }}
        >
          {feature.icon}
        </motion.div>

        <h3 style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          fontSize: '1.25rem',
          color: '#3D2B26',
          marginBottom: '10px',
          letterSpacing: '-0.02em',
        }}>{feature.title}</h3>

        <p style={{
          fontFamily: "'Inter', sans-serif",
          color: '#806C65',
          fontSize: '0.9rem',
          lineHeight: 1.65,
          margin: 0,
        }}>{feature.desc}</p>

        {/* Bottom burn line */}
        <motion.div
          animate={isInView ? { scaleX: [0, 1] } : { scaleX: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute', bottom: 0, left: '10%', right: '10%',
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${feature.accent}, transparent)`,
            borderRadius: '2px',
            transformOrigin: 'center',
          }}
        />
      </div>
    </motion.div>
  );
}

export default function AuraLandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const featherY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
  const featherRotate = useTransform(scrollYProgress, [0, 0.3], [0, 15]);
  const heroBurnOpacity = useTransform(scrollYProgress, [0, 0.15], [0, 1]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isBurning = scrollY > 80;

  return (
    <div style={{
      backgroundColor: '#FFF9F2',
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif",
      color: '#3D2B26',
      overflowX: 'hidden',
    }}>
      {/* ── STICKY GLASSMORPHIC NAVIGATION HEADER ── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          top: 0,
          width: '100%',
          zIndex: 1100,
          backgroundColor: isBurning ? 'rgba(255, 249, 242, 0.88)' : 'rgba(255, 249, 242, 0.4)',
          backdropFilter: 'blur(16px)',
          borderBottom: isBurning ? '1px solid rgba(61, 43, 38, 0.08)' : '1px solid transparent',
          boxShadow: isBurning ? '0 4px 20px rgba(61, 43, 38, 0.04)' : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px'
        }}>
          {/* Brand Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #E63946 0%, #d62839 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(230, 57, 70, 0.25)'
            }}>
              <span style={{ fontSize: '1.25rem', color: '#FFFFFF' }}>🪶</span>
            </div>
            <span style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: '1.45rem',
              letterSpacing: '-0.03em',
              color: '#3D2B26',
              lineHeight: 1
            }}>
              AURA
            </span>
          </Link>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'transparent',
                border: 'none',
                color: '#3D2B26',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                padding: '8px 16px',
                transition: 'all 0.2s'
              }}>
                Sign In
              </button>
            </Link>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link to="/signup" style={{ textDecoration: 'none' }}>
                <button style={{
                  background: 'linear-gradient(135deg, #E63946 0%, #d62839 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  padding: '8px 18px',
                  borderRadius: '99px',
                  boxShadow: '0 4px 12px rgba(230, 57, 70, 0.25)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}>
                  Sign Up <ArrowRight size={14} />
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* ════════════════════════════════════════
          HERO SECTION — full-viewport, 3D VFX
          ════════════════════════════════════════ */}
      <section
        ref={heroRef}
        style={{
          minHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: '60px 20px 30px',
        }}
      >
        {/* Mesh gradient background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 20% 30%, rgba(255, 142, 83, 0.18) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(255, 107, 107, 0.13) 0%, transparent 50%), radial-gradient(ellipse at 50% 0%, rgba(255, 220, 180, 0.3) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* Rotating outer ring */}
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 700, height: 700,
            borderRadius: '50%',
            border: '1px solid rgba(255, 107, 107, 0.08)',
            pointerEvents: 'none',
          }}
        />
        {/* Counter-rotating inner ring */}
        <motion.div
          animate={{ rotate: [360, 0] }}
          transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 480, height: 480,
            borderRadius: '50%',
            border: '1px dashed rgba(255, 142, 83, 0.1)',
            pointerEvents: 'none',
          }}
        />

        {/* Floating orb top-right */}
        <motion.div
          animate={{ y: [0, -25, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '10%', right: '8%',
            width: 220, height: 220, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, rgba(255, 107, 107, 0.35), rgba(255, 142, 83, 0.15) 60%, transparent)',
            filter: 'blur(35px)', pointerEvents: 'none',
          }}
        />
        {/* Floating orb bottom-left */}
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -15, 0], scale: [1, 1.12, 1] }}
          transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut', delay: 2 }}
          style={{
            position: 'absolute', bottom: '12%', left: '6%',
            width: 180, height: 180, borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 40%, rgba(255, 142, 83, 0.4), rgba(255, 220, 180, 0.2) 60%, transparent)',
            filter: 'blur(30px)', pointerEvents: 'none',
          }}
        />

        {/* Particle dots */}
        {[
          { top: '20%', left: '12%', size: 8, color: '#E63946', dur: 3.5 },
          { top: '30%', right: '15%', size: 6, color: '#d62839', dur: 4.2, delay: 0.8 },
          { bottom: '25%', left: '18%', size: 5, color: '#E63946', dur: 5, delay: 1.4 },
          { bottom: '30%', right: '12%', size: 7, color: '#d62839', dur: 3.8, delay: 0.5 },
        ].map((p, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -14, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: p.dur, ease: 'easeInOut', delay: p.delay || 0 }}
            style={{
              position: 'absolute', ...p,
              width: p.size, height: p.size, borderRadius: '50%',
              background: p.color,
              boxShadow: `0 0 14px ${p.color}99`,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* 3D Giant Floating Feather */}
        <motion.div
          style={{ y: featherY, rotate: featherRotate }}
        >
          <motion.div
            animate={{
              y: [0, -14, 0],
              rotate: [-6, 6, -6],
              scale: [1, 1.04, 1],
            }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
            whileHover={{ scale: 1.12, rotate: 15 }}
            style={{
              display: 'inline-flex',
              marginBottom: '16px',
              filter: 'drop-shadow(0 20px 40px rgba(255, 107, 107, 0.5)) drop-shadow(0 6px 12px rgba(255, 142, 83, 0.35))',
              transformStyle: 'preserve-3d',
              cursor: 'default',
            }}
          >
            <Feather size={76} color="#E63946" strokeWidth={1.2} />
          </motion.div>
        </motion.div>

        {/* Hero text */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(3rem, 7.5vw, 5.5rem)',
            lineHeight: 0.95,
            letterSpacing: '-0.05em',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #E63946 0%, #C1121F 60%, #3D2B26 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            display: 'inline-block',
            marginBottom: '14px',
            maxWidth: 800,
            position: 'relative', zIndex: 1,
          }}
        >
          AURA
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
            color: '#806C65',
            textAlign: 'center',
            maxWidth: 520,
            lineHeight: 1.6,
            marginBottom: '28px',
            position: 'relative', zIndex: 1,
          }}
        >
          The next-generation messaging platform built for speed, security, and clarity. Crafted for people who expect more.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 1 }}
        >
          <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
            <Link to="/signup" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'linear-gradient(135deg, #E63946 0%, #d62839 100%)',
                color: '#FFFFFF',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: '1rem',
                padding: '14px 32px',
                borderRadius: '99px',
                boxShadow: '0 8px 28px rgba(230, 57, 70, 0.35)',
                display: 'flex', alignItems: 'center', gap: '8px',
                whiteSpace: 'nowrap',
                letterSpacing: '0.02em',
              }}>
                Get Started Free <ArrowRight size={18} />
              </div>
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(230, 57, 70, 0.06)',
                color: '#E63946',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: '1rem',
                padding: '14px 32px',
                borderRadius: '99px',
                border: '1.5px solid rgba(230, 57, 70, 0.25)',
                display: 'flex', alignItems: 'center', gap: '8px',
                whiteSpace: 'nowrap',
                letterSpacing: '0.02em',
              }}>
                Sign In
              </div>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          style={{
            position: 'absolute', bottom: '32px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
            color: '#A39088', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}
        >
          <span>Scroll to ignite</span>
          <div style={{
            width: 1.5, height: 36,
            background: 'linear-gradient(to bottom, #E63946, transparent)',
            borderRadius: '2px',
          }} />
        </motion.div>
      </section>

      {/* ════════════════════════════════════════
          DASHBOARD PREVIEW SECTION
          ════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        padding: 'clamp(80px, 10vw, 130px) clamp(20px, 5vw, 60px)',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #FFF9F2 0%, #FFF2E8 100%)',
      }}>
        {/* Burning Feather Eagle — giant ghost behind mockup */}
        <motion.div
          animate={{ y: [0, -22, 0], rotate: [-4, 4, -4], scale: [1, 1.03, 1] }}
          transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.055,
            filter: 'drop-shadow(0 0 40px rgba(255, 107, 107, 0.7)) blur(1px)',
            pointerEvents: 'none', zIndex: 0,
          }}
        >
          <Feather size={600} color="#E63946" strokeWidth={0.6} />
        </motion.div>

        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: false, margin: '-60px' }}
          style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 72px)', position: 'relative', zIndex: 1 }}
        >
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: '0.78rem', fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: '#E63946',
            display: 'block', marginBottom: '12px'
          }}>🪶 Live Dashboard Preview</span>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 900,
            fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #3D2B26 0%, #E63946 70%, #d62839 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            margin: 0,
          }}>Your command center</h2>
          <p style={{
            fontFamily: "'Inter', sans-serif", color: '#806C65',
            fontSize: '1rem', maxWidth: 480, margin: '14px auto 0', lineHeight: 1.65
          }}>A thoughtfully designed interface that keeps everything one click away.</p>
        </motion.div>

        {/* 3D Floating Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60, rotateX: 12 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 6 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: false, margin: '-80px' }}
          animate={{ y: [0, -10, 0] }}
          style={{
            position: 'relative', zIndex: 2,
            maxWidth: 1020, margin: '0 auto',
            perspective: 1200,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Glow underneath mockup */}
          <motion.div
            animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            style={{
              position: 'absolute', bottom: -40, left: '10%', right: '10%',
              height: 60, borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(255,107,107,0.35), transparent 70%)',
              filter: 'blur(20px)', pointerEvents: 'none',
            }}
          />

          {/* Outer glass frame */}
          <div style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(30px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 142, 83, 0.2)',
            boxShadow: '0 40px 100px rgba(61,43,38,0.12), 0 8px 30px rgba(255,107,107,0.08)',
            overflow: 'hidden',
            transformStyle: 'preserve-3d',
          }}>
            {/* Top bar — macOS-style title bar */}
            <div style={{
              background: 'linear-gradient(90deg, #3D2B26 0%, #5C3D35 100%)',
              padding: '12px 18px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#E63946' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#C1121F' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <span style={{
                  fontFamily: "'Outfit', sans-serif", fontSize: '0.78rem', fontWeight: 700,
                  color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase'
                }}>AURA — Messaging</span>
              </div>
            </div>

            {/* Dashboard body */}
            <div className="preview-dashboard-body" style={{ display: 'flex', minHeight: 500 }}>

              {/* ── LEFT SIDEBAR ── */}
              <div className="preview-dashboard-sidebar" style={{
                width: 270, minWidth: 220, flexShrink: 0,
                background: '#FAFAF9',
                borderRight: '1px solid rgba(61,43,38,0.07)',
                display: 'flex', flexDirection: 'column',
              }}>
                {/* Sidebar logo */}
                <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(61,43,38,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '12px',
                      background: 'linear-gradient(135deg, #E63946, #d62839)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(230,57,70,0.3)',
                    }}>
                      <Feather size={17} color="#FFF" strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#3D2B26', letterSpacing: '-0.02em' }}>AURA</div>
                      <div style={{ fontSize: '0.65rem', color: '#A39088', fontWeight: 600, letterSpacing: '0.04em' }}>Boutique Messaging</div>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ width: 9, height: 9, borderRadius: '50%', background: '#10B981', marginLeft: 'auto', boxShadow: '0 0 6px #10B981' }}
                    />
                  </div>
                  {/* Search bar */}
                  <div style={{
                    background: 'rgba(61,43,38,0.05)', borderRadius: '99px',
                    padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A39088" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                    <span style={{ fontSize: '0.73rem', color: '#A39088', fontFamily: "'Inter', sans-serif" }}>Search messages…</span>
                  </div>
                </div>

                {/* Chat list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
                  {[
                    { name: 'Alex M.', msg: 'Hey! Did you see th...', time: '2m', unread: 3, active: true, color: '#E63946' },
                    { name: 'Team Aura', msg: 'New build is deployi...', time: '8m', unread: 0, active: false, color: '#d62839' },
                    { name: 'Sara K.', msg: 'That call was amazi...', time: '1h', unread: 1, active: false, color: '#10B981' },
                    { name: 'Design Chat', msg: 'Figma file updated ✓', time: '3h', unread: 0, active: false, color: '#8B5CF6' },
                    { name: 'Dev Group', msg: 'PR merged success...', time: '5h', unread: 0, active: false, color: '#3B82F6' },
                  ].map((chat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.07, type: 'spring', stiffness: 200 }}
                    >
                      <div style={{
                        padding: '11px 18px',
                        background: chat.active ? 'rgba(230,57,70,0.06)' : 'transparent',
                        borderLeft: chat.active ? '3px solid #E63946' : '3px solid transparent',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        cursor: 'default',
                      }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                          background: `${chat.color}22`,
                          border: `1.5px solid ${chat.color}44`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.88rem', fontWeight: 800, color: chat.color,
                          fontFamily: "'Outfit', sans-serif",
                        }}>{chat.name[0]}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '0.82rem', color: '#3D2B26' }}>{chat.name}</span>
                            <span style={{ fontSize: '0.65rem', color: '#A39088', fontFamily: "'Inter', sans-serif" }}>{chat.time}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                            <span style={{ fontSize: '0.7rem', color: '#806C65', fontFamily: "'Inter', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{chat.msg}</span>
                            {chat.unread > 0 && (
                              <div style={{
                                width: 19, height: 19, borderRadius: '50%',
                                background: '#E63946', color: '#fff',
                                fontSize: '0.6rem', fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                              }}>{chat.unread}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── RIGHT: CHAT AREA ── */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FFFFFF', minWidth: 0 }}>
                {/* Chat header */}
                <div style={{
                  padding: '14px 22px',
                  borderBottom: '1px solid rgba(61,43,38,0.06)',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: '#FFFFFF',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: '#E6394622',
                    border: '1.5px solid #E6394644',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.92rem', fontWeight: 800, color: '#E63946',
                    fontFamily: "'Outfit', sans-serif",
                  }}>A</div>
                  <div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '0.92rem', color: '#3D2B26' }}>Alex M.</div>
                    <div style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <motion.div
                        animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }}
                      />
                      Online
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    {[Video, Shield].map((Icon, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.12, background: 'rgba(230,57,70,0.12)' }}
                        whileTap={{ scale: 0.9 }}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        style={{
                          width: 34, height: 34, borderRadius: '10px',
                          background: 'rgba(230,57,70,0.06)', border: '1px solid rgba(230,57,70,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'default',
                        }}
                      >
                        <Icon size={14} color="#E63946" strokeWidth={2} />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, padding: '24px 22px 16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', background: '#FEFEFE' }}>
                  {[
                    { text: 'Hey! Did you see the new AURA demo? 🔥', from: 'other' },
                    { text: 'Yes! The burning VFX on scroll is incredible. Who built this?', from: 'me' },
                    { text: 'The team did — zero-latency socket + 4K video. Try the feather animation 🪶', from: 'other' },
                    { text: 'Already hooked. This is next-level!', from: 'me' },
                  ].map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: msg.from === 'me' ? 40 : -40, scale: 0.88 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ delay: 0.15 + i * 0.28, duration: 0.5, type: 'spring', stiffness: 180, damping: 18 }}
                      style={{ display: 'flex', justifyContent: msg.from === 'me' ? 'flex-end' : 'flex-start' }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        style={{
                          maxWidth: '65%',
                          padding: '11px 16px',
                          borderRadius: msg.from === 'me' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                          background: msg.from === 'me'
                            ? 'linear-gradient(135deg, #E63946, #d62839)'
                            : '#F5F5F4',
                          color: msg.from === 'me' ? '#FFFFFF' : '#3D2B26',
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '0.78rem',
                          lineHeight: 1.6,
                          boxShadow: msg.from === 'me' ? '0 4px 18px rgba(230,57,70,0.28)' : 'none',
                          cursor: 'default',
                        }}
                      >
                        {msg.text}
                      </motion.div>
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  <motion.div
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5, type: 'spring' }}
                    style={{ display: 'flex', justifyContent: 'flex-start' }}
                  >
                    <div style={{
                      padding: '11px 16px', borderRadius: '20px 20px 20px 4px',
                      background: '#F5F5F4',
                      display: 'flex', alignItems: 'center', gap: '5px',
                    }}>
                      {[0, 1, 2].map(d => (
                        <motion.div
                          key={d}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.65, repeat: Infinity, delay: d * 0.16, ease: 'easeInOut' }}
                          style={{ width: 6, height: 6, borderRadius: '50%', background: '#A39088' }}
                        />
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Message input */}
                <div style={{
                  padding: '12px 18px 16px',
                  borderTop: '1px solid rgba(61,43,38,0.06)',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: '#FFFFFF',
                }}>
                  <div style={{
                    flex: 1, background: '#F5F5F4',
                    borderRadius: '99px', padding: '10px 18px',
                    border: '1px solid rgba(61,43,38,0.07)',
                    fontSize: '0.77rem', color: '#A39088',
                    fontFamily: "'Inter', sans-serif",
                  }}>Type a message…</div>
                  <motion.div
                    animate={{ boxShadow: ['0 4px 12px rgba(230,57,70,0.3)', '0 4px 22px rgba(230,57,70,0.6)', '0 4px 12px rgba(230,57,70,0.3)'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    whileHover={{ scale: 1.12 }}
                    style={{
                      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #E63946, #d62839)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'default',
                    }}
                  >
                    <ArrowRight size={16} color="#FFF" strokeWidth={2.5} />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════
          FEATURES SECTION — Burning on scroll
          ════════════════════════════════════════ */}
      <section
        ref={featuresRef}
        style={{
          position: 'relative',
          padding: 'clamp(80px, 10vw, 140px) clamp(20px, 6vw, 80px)',
          overflow: 'hidden',
        }}
      >
        {/* Section background burn layer */}
        <motion.div
          style={{ opacity: heroBurnOpacity }}
          transition={{ duration: 1 }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 107, 107, 0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          {/* Top burn border */}
          <motion.div
            animate={isBurning ? { scaleX: [0, 1], opacity: [0, 1] } : {}}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, transparent 0%, #E63946 30%, #d62839 60%, #C1121F 80%, transparent 100%)',
              transformOrigin: 'left',
              boxShadow: '0 0 20px rgba(255, 107, 107, 0.6)',
            }}
          />
        </motion.div>

        {/* Burning embers across section top edge */}
        {isBurning && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, pointerEvents: 'none', zIndex: 10 }}>
            {[5, 12, 20, 28, 36, 44, 52, 60, 68, 76, 84, 92].map((left, i) => (
              <Ember key={i} delay={i * 0.12} left={left} />
            ))}
          </div>
        )}

        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: false, margin: '-60px' }}
          style={{ textAlign: 'center', marginBottom: 'clamp(48px, 6vw, 80px)', position: 'relative', zIndex: 1 }}
        >
          <motion.div
            animate={isBurning ? {
              textShadow: ['0 0 0px transparent', '0 0 30px rgba(255, 107, 107, 0.4)', '0 0 0px transparent'],
            } : {}}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#E63946',
              display: 'block',
              marginBottom: '12px',
            }}>
              ⚡ Ignited Features
            </span>
            <h2 style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(2.2rem, 5vw, 4rem)',
              letterSpacing: '-0.04em',
              background: isBurning
                ? 'linear-gradient(135deg, #E63946 0%, #d62839 50%, #C1121F 100%)'
                : 'linear-gradient(135deg, #3D2B26 0%, #E63946 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
              transition: 'all 0.8s ease',
            }}>
              Built to Burn Bright
            </h2>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              color: '#806C65', fontSize: '1.05rem',
              maxWidth: 520, margin: '16px auto 0',
              lineHeight: 1.65,
            }}>
              Every feature was forged with obsession. Scroll down — watch them ignite.
            </p>
          </motion.div>
        </motion.div>

        {/* Feature Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: 'clamp(20px, 3vw, 32px)',
          maxWidth: 1100,
          margin: '0 auto',
          position: 'relative', zIndex: 1,
        }}>
          {FEATURES.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          STATS RIBBON
          ════════════════════════════════════════ */}
      <section style={{
        padding: 'clamp(60px, 8vw, 100px) clamp(20px, 6vw, 80px)',
        background: 'linear-gradient(135deg, #3D2B26 0%, #5C3D35 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Burn top border */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, transparent, #E63946, #d62839, #C1121F, transparent)',
          boxShadow: '0 0 24px rgba(255, 107, 107, 0.5)',
        }} />

        <div style={{
          maxWidth: 900, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '40px', textAlign: 'center',
        }}>
          {[
            { value: '<5ms', label: 'Message latency' },
            { value: '4K', label: 'Video quality' },
            { value: '256-bit', label: 'Encryption' },
            { value: '∞', label: 'Connections' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              viewport={{ once: false }}
            >
              <div style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #E63946, #d62839)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                lineHeight: 1,
                marginBottom: '8px',
              }}>{stat.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          BOTTOM CTA
          ════════════════════════════════════════ */}
      <section style={{
        padding: 'clamp(80px, 10vw, 140px) clamp(20px, 6vw, 80px)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Background orb */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.28, 0.15] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600, height: 300, borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(255, 107, 107, 0.25), transparent 70%)',
            filter: 'blur(40px)', pointerEvents: 'none',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: false }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          {/* Large floating feather */}
          <motion.div
            animate={{ y: [0, -16, 0], rotate: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
            style={{
              display: 'inline-flex', marginBottom: '24px',
              filter: 'drop-shadow(0 16px 32px rgba(255, 107, 107, 0.45))',
            }}
          >
            <Feather size={72} color="#E63946" strokeWidth={1.3} />
          </motion.div>

          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #3D2B26 0%, #E63946 60%, #d62839 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '16px',
          }}>
            Ready to ignite?
          </h2>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            color: '#806C65', fontSize: '1.05rem',
            maxWidth: 480, margin: '0 auto 36px',
            lineHeight: 1.65,
          }}>
            Join thousands already messaging at the speed of thought.
          </p>

          <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}>
            <Link to="/signup" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                background: 'linear-gradient(135deg, #E63946 0%, #d62839 100%)',
                color: '#FFFFFF',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700, fontSize: '1.05rem',
                padding: '16px 40px', borderRadius: '99px',
                boxShadow: '0 10px 35px rgba(255, 107, 107, 0.35)',
                letterSpacing: '0.02em',
              }}>
                Start Messaging Free <ArrowRight size={20} />
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
