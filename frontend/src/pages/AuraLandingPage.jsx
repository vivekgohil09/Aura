import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Feather, MessageCircle, Video, ShieldCheck, Zap, Globe, ArrowRight, Sparkles, Star, Lock } from 'lucide-react';
import * as THREE from 'three';

// ── Three.js Interactive 3D Canvas Background Component ──
function ThreeVFXBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 16;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Create 3D floating luxury golden geometry knot
    const geometry = new THREE.TorusKnotGeometry(4.8, 0.9, 128, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      metalness: 0.88,
      roughness: 0.12,
      wireframe: true,
      transparent: true,
      opacity: 0.16,
    });
    const knot = new THREE.Mesh(geometry, material);
    scene.add(knot);

    // Add an outer Icosahedron wireframe
    const icosaGeo = new THREE.IcosahedronGeometry(12, 1);
    const icosaMat = new THREE.MeshStandardMaterial({
      color: 0x38BDF8,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const icosahedron = new THREE.Mesh(icosaGeo, icosaMat);
    scene.add(icosahedron);

    // Add a glowing Torus ring
    const ringGeo = new THREE.TorusGeometry(8, 0.02, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xD4AF37, transparent: true, opacity: 0.25 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // Floating particles VFX (golden & diamond dust)
    const particleCount = 400; // Increased particle count
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 45; // Wider spread
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.09,
      color: 0xE2C044,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xD4AF37, 2.2, 50);
    pointLight1.position.set(12, 12, 12);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x38BDF8, 1.6, 50);
    pointLight2.position.set(-12, -12, -12);
    scene.add(pointLight2);

    let animationFrameId;
    const clock = new THREE.Clock();

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.0006;
      mouseY = (e.clientY - window.innerHeight / 2) * 0.0006;
    };
    window.addEventListener('mousemove', onMouseMove);

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      knot.rotation.x = elapsedTime * 0.12 + targetY * 2;
      knot.rotation.y = elapsedTime * 0.18 + targetX * 2;
      
      icosahedron.rotation.x = elapsedTime * 0.05 - targetY * 1.5;
      icosahedron.rotation.y = elapsedTime * 0.08 + targetX * 1.5;
      
      ring.rotation.y = elapsedTime * 0.1 + targetX * 3;
      ring.rotation.z = elapsedTime * -0.05;

      particles.rotation.y = elapsedTime * 0.04 + targetX * 1.2;
      particles.rotation.x = elapsedTime * 0.02 + targetY * 1.2;

      camera.position.x += (targetX * 6 - camera.position.x) * 0.05;
      camera.position.y += (-targetY * 6 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

// ── Full Page Floating Sparkles VFX ──
function FullPageVFX() {
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    // Generate static random positions once so they don't re-render chaotically
    const arr = Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      size: 3 + Math.random() * 5
    }));
    setSparkles(arr);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
      {sparkles.map(s => (
        <motion.div
          key={s.id}
          initial={{ y: 0, opacity: 0, scale: 0 }}
          animate={{
            y: [0, -150, -300],
            x: [0, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 150],
            opacity: [0, 0.7, 0],
            scale: [0, 1.3, 0.2],
          }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #F6D365 0%, #FDA085 100%)',
            boxShadow: '0 0 12px 3px rgba(212, 175, 55, 0.4)',
          }}
        />
      ))}
    </div>
  );
}

// ── Floating Ambient Aurora Glow Orbs VFX ──
function AuroraGlowOrbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {/* Golden Aura Glow Orb Left */}
      <motion.div
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -100, 60, 0],
          scale: [1, 1.25, 0.9, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '15%',
          left: '10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.14) 0%, rgba(245, 158, 11, 0.04) 50%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />
      {/* Cyan Cyber Glow Orb Right */}
      <motion.div
        animate={{
          x: [0, -90, 50, 0],
          y: [0, 90, -80, 0],
          scale: [1, 1.3, 0.85, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '40%',
          right: '5%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(99, 102, 241, 0.03) 50%, transparent 70%)',
          filter: 'blur(90px)',
        }}
      />
      {/* Soft Rose Gold Glow Orb Bottom Left */}
      <motion.div
        animate={{
          x: [0, 60, -60, 0],
          y: [0, -60, 80, 0],
          scale: [0.9, 1.2, 1, 0.9],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '20%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244, 114, 182, 0.08) 0%, rgba(212, 175, 55, 0.03) 50%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
    </div>
  );
}

// ── Luxury Glow Layer behind a feature card
function LuxuryGlow({ active }) {
  return (
    <motion.div
      animate={active ? {
        opacity: [0.4, 0.85, 0.4],
        scale: [1, 1.05, 1],
      } : { opacity: 0 }}
      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      style={{
        position: 'absolute', inset: -10,
        borderRadius: '36px',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(212, 175, 55, 0.25) 0%, rgba(246, 211, 101, 0.1) 50%, transparent 75%)',
        filter: 'blur(20px)',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

// ── Feature card with scroll-triggered luxury reveal
const FEATURES = [
  {
    icon: <MessageCircle size={32} strokeWidth={1.5} />,
    title: 'Quantum Instant Messaging',
    desc: 'Socket-powered instant delivery. Zero lag, ultra-low latency — every message lands in sub-milliseconds.',
    accent: '#D4AF37',
    glow: 'rgba(212, 175, 55, 0.18)',
    embers: [15, 30, 45, 60, 75, 85],
  },
  {
    icon: <Video size={32} strokeWidth={1.5} />,
    title: 'Ultra-HD 4K Video Calls',
    desc: 'Crystal-clear peer-to-peer WebRTC video with spatial audio and adaptive noise cancellation.',
    accent: '#0284C7',
    glow: 'rgba(2, 132, 199, 0.18)',
    embers: [10, 25, 40, 55, 70, 90],
  },
  {
    icon: <ShieldCheck size={32} strokeWidth={1.5} />,
    title: 'Bank-Grade Vault Encryption',
    desc: 'End-to-end zero-knowledge security architecture. Your data remains completely isolated and encrypted.',
    accent: '#10B981',
    glow: 'rgba(16, 185, 129, 0.18)',
    embers: [20, 35, 50, 65, 80, 92],
  },
  {
    icon: <Zap size={32} strokeWidth={1.5} />,
    title: 'Sub-Millisecond Socket Sync',
    desc: 'WebSocket native engine with real-time presence indicators and instant typing telemetry.',
    accent: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.18)',
    embers: [12, 28, 44, 60, 76, 88],
  },
  {
    icon: <Globe size={32} strokeWidth={1.5} />,
    title: 'Global P2P Relay Network',
    desc: 'Distributed edge servers ensure supreme availability and lightning connectivity worldwide.',
    accent: '#6366F1',
    glow: 'rgba(99, 102, 241, 0.18)',
    embers: [18, 33, 48, 63, 78, 94],
  },
  {
    icon: <Sparkles size={32} strokeWidth={1.5} />,
    title: 'AI Neural Assistant',
    desc: 'Context-aware intelligent suggestions powered by private on-device machine learning.',
    accent: '#EC4899',
    glow: 'rgba(236, 72, 153, 0.18)',
    embers: [8, 22, 38, 54, 70, 86],
  },
];

function FeatureCard({ feature, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: '-80px' });
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left - width / 2);
    mouseY.set(e.clientY - top - height / 2);
  };
  
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };
  
  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [10, -10]), { damping: 20, stiffness: 150 });
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-10, 10]), { damping: 20, stiffness: 150 });
  const spotlightX = useSpring(useTransform(mouseX, [-200, 200], [0, 100]), { damping: 30, stiffness: 200 });
  const spotlightY = useSpring(useTransform(mouseY, [-200, 200], [0, 100]), { damping: 30, stiffness: 200 });
  const accentGlow = useMotionValue(`${feature.accent}20`);
  const background = useMotionTemplate`radial-gradient(circle at ${spotlightX}% ${spotlightY}%, ${accentGlow} 0%, transparent 60%)`;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60, scale: 0.92 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 60, scale: 0.92 }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        cursor: 'default',
        perspective: 1200,
        height: '100%',
      }}
    >
      <LuxuryGlow active={isInView} />

      <motion.div style={{
        position: 'relative',
        zIndex: 1,
        height: '100%',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderRadius: '28px',
        padding: '38px 34px',
        border: `1px solid ${isInView ? 'rgba(212, 175, 55, 0.35)' : 'rgba(226, 232, 240, 0.9)'}`,
        boxShadow: isInView
          ? `0 20px 50px ${feature.glow}, 0 10px 25px rgba(0, 0, 0, 0.03)`
          : '0 8px 30px rgba(0, 0, 0, 0.03)',
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        overflow: 'hidden',
      }}>
        {/* Spotlight Follow effect */}
        <motion.div style={{
          position: 'absolute', inset: 0, background, zIndex: 0, pointerEvents: 'none'
        }} />
        
        {/* Holographic glowing edge */}
        <motion.div 
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 5, ease: 'linear', repeat: Infinity }}
          style={{
            position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
            background: `linear-gradient(90deg, transparent, ${feature.accent}25, transparent)`,
            backgroundSize: '200% 200%',
            opacity: 0.4,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, transform: 'translateZ(30px)' }}>
          <motion.div
            animate={isInView ? { rotate: [0, -4, 4, 0] } : {}}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            style={{
              width: 68, height: 68,
              borderRadius: '20px',
              background: `linear-gradient(135deg, ${feature.accent}15, ${feature.accent}05)`,
              border: `1.5px solid ${feature.accent}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '26px',
              color: feature.accent,
              boxShadow: `0 8px 24px ${feature.accent}22`,
            }}
          >
            {feature.icon}
          </motion.div>

          <h3 style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: '1.4rem',
            color: '#0F172A',
            marginBottom: '12px',
            letterSpacing: '-0.02em',
          }}>{feature.title}</h3>

          <p style={{
            fontFamily: "'Inter', sans-serif",
            color: '#64748B',
            fontSize: '0.98rem',
            lineHeight: 1.65,
            margin: 0,
          }}>{feature.desc}</p>
        </div>
      </motion.div>
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

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isScrolled = scrollY > 40;

  return (
    <div style={{
      backgroundColor: '#FAFAFC',
      minHeight: '100vh',
      fontFamily: "'Outfit', 'Plus Jakarta Sans', 'Inter', sans-serif",
      color: '#0F172A',
      overflowX: 'hidden',
      position: 'relative',
    }}>
      {/* Three.js Interactive VFX Canvas */}
      <ThreeVFXBackground />
      
      {/* Floating Ambient Aurora Glow Orbs VFX */}
      <AuroraGlowOrbs />

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
          backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: isScrolled ? '1px solid rgba(212, 175, 55, 0.25)' : '1px solid rgba(226, 232, 240, 0.6)',
          boxShadow: isScrolled ? '0 10px 30px rgba(0, 0, 0, 0.04)' : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 28px'
        }}>
          {/* Brand Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(212, 175, 55, 0.35)'
            }}>
              <Feather size={22} color="#FFFFFF" strokeWidth={2} />
            </div>
            <div>
              <span style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 900,
                fontSize: '1.5rem',
                letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
                display: 'block',
              }}>
                AURA
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#D4AF37', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                 MESSAGING
              </span>
            </div>
          </Link>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'transparent',
                border: 'none',
                color: '#334155',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                padding: '10px 20px',
                transition: 'all 0.2s'
              }}>
                Sign In
              </button>
            </Link>
            <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }}>
              <Link to="/signup" style={{ textDecoration: 'none' }}>
                <button style={{
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  padding: '11px 24px',
                  borderRadius: '99px',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.15)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap'
                }}>
                  Get Started <ArrowRight size={16} color="#D4AF37" />
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* ════════════════════════════════════════
          HERO SECTION — Pristine White & Gold
          ════════════════════════════════════════ */}
      <section
        ref={heroRef}
        style={{
          minHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: '120px 24px 60px',
        }}
      >
        {/* Soft radial glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 50% 30%, rgba(212, 175, 55, 0.12) 0%, rgba(248, 250, 252, 0) 65%)',
          pointerEvents: 'none',
        }} />



        {/* Floating Premium Feature Badges Group */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', marginBottom: '36px', flexWrap: 'wrap' }}
        >
          {/* Chat Icon Badge */}
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0 }}
            whileHover={{ scale: 1.08 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 22px',
              borderRadius: '99px',
              background: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              boxShadow: '0 8px 32px rgba(212, 175, 55, 0.1)',
              cursor: 'default',
            }}
          >
            <MessageCircle size={18} color="#D4AF37" strokeWidth={2} />
            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#334155', letterSpacing: '0.08em', fontFamily: "'Outfit', sans-serif" }}>SECURE CHAT</span>
          </motion.div>

          {/* Video Icon Badge */}
          <motion.div
            animate={{
              y: [0, -15, 0],
            }}
            transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut', delay: 0.3 }}
            whileHover={{ scale: 1.08 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 22px',
              borderRadius: '99px',
              background: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              boxShadow: '0 12px 40px rgba(212, 175, 55, 0.15)',
              cursor: 'default',
            }}
          >
            <Video size={18} color="#D4AF37" strokeWidth={2} />
            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#334155', letterSpacing: '0.08em', fontFamily: "'Outfit', sans-serif" }}>HD CALLS</span>
          </motion.div>

          {/* Security Icon Badge */}
          <motion.div
            animate={{
              y: [0, -8, 0],
            }}
            transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut', delay: 0.6 }}
            whileHover={{ scale: 1.08 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 22px',
              borderRadius: '99px',
              background: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              boxShadow: '0 8px 32px rgba(212, 175, 55, 0.1)',
              cursor: 'default',
            }}
          >
            <ShieldCheck size={18} color="#D4AF37" strokeWidth={2} />
            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#334155', letterSpacing: '0.08em', fontFamily: "'Outfit', sans-serif" }}>P2P PRIVACY</span>
          </motion.div>
        </motion.div>

        {/* Hero Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(3rem, 7.5vw, 5.5rem)',
            lineHeight: 1.02,
            letterSpacing: '-0.04em',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            maxWidth: 900,
            marginBottom: '20px',
          }}
        >
          Elegance at the Speed of Light
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: '#64748B',
            textAlign: 'center',
            maxWidth: 580,
            lineHeight: 1.65,
            marginBottom: '36px',
          }}
        >
          The next-generation messaging platform engineered with pristine white luxury, Three.js 3D VFX, and instant socket synchronization.
        </motion.p>

        {/* Hero CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
            <Link to="/signup" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                color: '#FFFFFF',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: '1rem',
                padding: '16px 36px',
                borderRadius: '99px',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18)',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                Start Messaging Free <ArrowRight size={18} color="#D4AF37" />
              </div>
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#0F172A',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: '1rem',
                padding: '16px 36px',
                borderRadius: '99px',
                border: '1.5px solid rgba(226, 232, 240, 0.9)',
                backdropFilter: 'blur(16px)',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
              }}>
                Live Demo
              </div>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll-to-features indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ opacity: { delay: 1.2 }, y: { repeat: Infinity, duration: 2, ease: 'easeInOut' } }}
          onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            marginTop: '48px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#94A3B8',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontFamily: "'Inter', sans-serif",
          }}>Explore Features</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════
          LIVE DASHBOARD PREVIEW MOCKUP
          ════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        padding: 'clamp(60px, 8vw, 120px) clamp(20px, 5vw, 60px)',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #FAFAFC 0%, #FFFFFF 100%)',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: false, margin: '-60px' }}
          style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}
        >
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', fontWeight: 800,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: '#D4AF37',
            display: 'block', marginBottom: '12px'
          }}>✨ PREVIEW INTERFACE</span>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 900,
            fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)', letterSpacing: '-0.04em',
            color: '#0F172A', margin: 0,
          }}>Pristine Command Center</h2>
          <p style={{
            fontFamily: "'Inter', sans-serif", color: '#64748B',
            fontSize: '1.05rem', maxWidth: 480, margin: '14px auto 0', lineHeight: 1.65
          }}>A luxury white UI designed for clarity, focus, and effortless communication.</p>
        </motion.div>

        {/* 3D Dashboard Frame */}
        <motion.div
          initial={{ opacity: 0, y: 60, rotateX: 10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 4 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: false, margin: '-80px' }}
          style={{
            position: 'relative', zIndex: 2,
            maxWidth: 1040, margin: '0 auto',
            perspective: 1200,
          }}
        >
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(30px)',
            borderRadius: '28px',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            boxShadow: '0 30px 90px rgba(15, 23, 42, 0.08), 0 10px 30px rgba(212, 175, 55, 0.1)',
            overflow: 'hidden',
          }}>
            {/* Window title bar */}
            <div style={{
              background: 'linear-gradient(90deg, #0F172A 0%, #1E293B 100%)',
              padding: '14px 20px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#F59E0B' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <span style={{
                  fontFamily: "'Outfit', sans-serif", fontSize: '0.78rem', fontWeight: 800,
                  color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase'
                }}>AURA LUXURY EDITION</span>
              </div>
            </div>

            {/* Dashboard body */}
            <div style={{ display: 'flex', minHeight: 480 }}>
              {/* Sidebar */}
              <div style={{
                width: 270, background: '#F8FAFC',
                borderRight: '1px solid rgba(226, 232, 240, 0.8)',
                padding: '16px 0', display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ padding: '0 18px 14px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '10px',
                      background: 'linear-gradient(135deg, #D4AF37, #F59E0B)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Feather size={18} color="#FFF" />
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>AURA</div>
                      <div style={{ fontSize: '0.65rem', color: '#D4AF37', fontWeight: 700, letterSpacing: '0.05em' }}>WHITE LUXURY</div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '12px 18px', flex: 1 }}>
                  {[
                    { name: 'Alex Rivera', msg: 'The 3D canvas looks stunning!', time: '1m', active: true, color: '#D4AF37' },
                    { name: 'Sarah Chen', msg: 'Socket latency is sub-1ms ⚡', time: '5m', active: false, color: '#0284C7' },
                    { name: 'Design Team', msg: 'Updated white palette uploaded', time: '1h', active: false, color: '#10B981' },
                    { name: 'Dev Ops', msg: 'Global edge node online ✓', time: '3h', active: false, color: '#6366F1' },
                  ].map((chat, i) => (
                    <div key={i} style={{
                      padding: '10px 12px', borderRadius: '12px',
                      marginBottom: '6px',
                      background: chat.active ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                      borderLeft: chat.active ? '3px solid #D4AF37' : '3px solid transparent',
                      display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: `${chat.color}22`, color: chat.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '0.85rem'
                      }}>{chat.name[0]}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>{chat.name}</span>
                          <span style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{chat.time}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.msg}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat View */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FFFFFF' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#D4AF3722', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>A</div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>Alex Rivera</div>
                      <div style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 700 }}>● Online &bull; Encrypted</div>
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ alignSelf: 'flex-start', background: '#F1F5F9', padding: '10px 16px', borderRadius: '16px 16px 16px 4px', fontSize: '0.82rem', color: '#0F172A', maxWidth: '70%' }}>
                    Hey! Have you seen the new white luxury theme with Three.js graphics? 🎨
                  </div>
                  <div style={{ alignSelf: 'flex-end', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', border: '1px solid rgba(212, 175, 55, 0.4)', color: '#FFFFFF', padding: '10px 16px', borderRadius: '16px 16px 4px 16px', fontSize: '0.82rem', maxWidth: '70%', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)' }}>
                    Yes! The golden light sparkles, smooth motion animations, and 3D knot VFX make it look incredibly prestigious. 👑
                  </div>
                </div>

                <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', gap: '10px' }}>
                  <input placeholder="Type a secure message…" style={{ flex: 1, border: '1px solid #E2E8F0', borderRadius: '99px', padding: '8px 16px', outline: 'none', fontSize: '0.8rem', background: '#F8FAFC' }} readOnly />
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #D4AF37, #F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowRight size={16} color="#FFF" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════
          FEATURES GRID SECTION
          ════════════════════════════════════════ */}
      <section
        ref={featuresRef}
        style={{
          position: 'relative',
          padding: 'clamp(80px, 10vw, 140px) clamp(20px, 6vw, 80px)',
          overflow: 'hidden',
          background: '#FAFAFC',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'clamp(48px, 6vw, 80px)' }}>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.8rem',
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#D4AF37',
            display: 'block',
            marginBottom: '12px',
          }}>
            ⚡ IGNITED PERFORMANCE
          </span>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(2.2rem, 5vw, 4rem)',
            letterSpacing: '-0.04em',
            color: '#0F172A',
            margin: 0,
          }}>
            Crafted for Unmatched Prestige
          </h2>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            color: '#64748B', fontSize: '1.05rem',
            maxWidth: 520, margin: '16px auto 0',
            lineHeight: 1.65,
          }}>
            Every detail forged with obsession — from sub-millisecond sockets to 4K video feeds.
          </p>
        </div>

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
          BOTTOM CTA
          ════════════════════════════════════════ */}
      <section style={{
        padding: 'clamp(80px, 10vw, 140px) clamp(20px, 6vw, 80px)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(180deg, #FAFAFC 0%, #FFFFFF 100%)',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: false }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <motion.div
            animate={{ y: [0, -14, 0], rotate: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
            style={{
              display: 'inline-flex', marginBottom: '24px',
              filter: 'drop-shadow(0 16px 32px rgba(212, 175, 55, 0.45))',
            }}
          >
            <Feather size={72} color="#D4AF37" strokeWidth={1.3} />
          </motion.div>

          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
            letterSpacing: '-0.04em',
            color: '#0F172A',
            marginBottom: '16px',
          }}>
            Ready to Elevate Your Experience?
          </h2>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            color: '#64748B', fontSize: '1.05rem',
            maxWidth: 480, margin: '0 auto 36px',
            lineHeight: 1.65,
          }}>
            Join thousands communicating on the world's most luxurious messaging platform.
          </p>

          <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}>
            <Link to="/signup" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                color: '#FFFFFF',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800, fontSize: '1.05rem',
                padding: '16px 42px', borderRadius: '99px',
                boxShadow: '0 12px 35px rgba(15, 23, 42, 0.2)',
                letterSpacing: '0.02em',
              }}>
                Start Messaging Free <ArrowRight size={20} color="#D4AF37" />
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
