import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, useMotionTemplate, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  Feather, MessageCircle, Video, ShieldCheck, Zap, Globe, ArrowRight, 
  Sparkles, Star, Lock, Mic, Phone, Check, ChevronDown, Activity, 
  Users, Shield, Cpu, RefreshCw, Radio, Layers, Compass, Play, Volume2, 
  Flame, Eye, Clock, CheckCircle2, ChevronRight, Share2, HelpCircle
} from 'lucide-react';

// ── 1. Ultra-Luxury 3D Projected Sacred Geometry & Particle VFX Canvas Background (60 FPS Optimized) ──
function ThreeVFXBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let isVisible = true;

    // Mouse coordinates with smooth damping
    let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleVisibility = () => {
      isVisible = document.visibilityState === 'visible';
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);

    // ── Generate 3D Torus Knot Vertices (Optimized 70 points) ──
    const torusKnotPoints = [];
    const p = 2, q = 3;
    const samples = 70;
    const R = 220; // major radius
    const r = 70;  // minor radius
    for (let i = 0; i < samples; i++) {
      const phi = (i / samples) * Math.PI * 2;
      const r_tube = r * (0.8 + 0.2 * Math.cos(q * phi));
      const x = (R + r_tube * Math.cos(q * phi)) * Math.cos(p * phi);
      const y = (R + r_tube * Math.cos(q * phi)) * Math.sin(p * phi);
      const z = -r_tube * Math.sin(q * phi) * 2.5;
      torusKnotPoints.push({ x, y, z });
    }

    // ── Generate Stardust Floating Particles in 3D (Optimized 36 particles) ──
    const particleCount = 36;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.4,
        y: (Math.random() - 0.5) * height * 1.4,
        z: (Math.random() - 0.5) * 500,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        vz: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 2.0 + 0.9,
        isPurple: Math.random() > 0.45,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    let rotX = 0;
    let rotY = 0;
    let time = 0;

    // ── 3D Projection Math ──
    const fov = 460;
    const project = (x, y, z, cx, cy) => {
      const depth = fov + z;
      if (depth <= 10) return null;
      const scale = fov / depth;
      return {
        x: cx + x * scale,
        y: cy + y * scale,
        scale
      };
    };

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      time += 0.01;
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      const tiltX = ((mouse.y - height / 2) / height) * 0.5;
      const tiltY = ((mouse.x - width / 2) / width) * 0.5;

      rotX = time * 0.25 + tiltX;
      rotY = time * 0.35 + tiltY;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2 + (mouse.x - width / 2) * 0.02;
      const centerY = height / 2 + (mouse.y - height / 2) * 0.02;

      // 1. Draw 3D Torus Knot Wireframe
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

      const projectedKnot = [];
      for (let i = 0; i < torusKnotPoints.length; i++) {
        const pt = torusKnotPoints[i];
        let x1 = pt.x * cosY + pt.z * sinY;
        let y1 = pt.y;
        let z1 = -pt.x * sinY + pt.z * cosY;
        let x2 = x1;
        let y2 = y1 * cosX - z1 * sinX;
        let z2 = y1 * sinX + z1 * cosX;

        const proj = project(x2, y2, z2, centerX, centerY);
        if (proj) projectedKnot.push(proj);
      }

      if (projectedKnot.length > 2) {
        ctx.beginPath();
        for (let i = 0; i < projectedKnot.length; i++) {
          const p1 = projectedKnot[i];
          const nextIdx = (i + 1) % projectedKnot.length;
          const p2 = projectedKnot[nextIdx];

          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        }
        ctx.strokeStyle = 'rgba(91, 95, 239, 0.12)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Glowing node sparkles
        for (let i = 0; i < projectedKnot.length; i += 6) {
          const p1 = projectedKnot[i];
          const alpha = Math.max(0.12, Math.min(0.45, (p1.scale - 0.7) * 1.2));
          ctx.fillStyle = `rgba(128, 103, 232, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, Math.max(1, p1.scale * 2.2), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Draw 3D Floating Particles & Constellations (High Performance)
      const cosT = Math.cos(time * 0.07);
      const sinT = Math.sin(time * 0.07);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.pulse += 0.025;

        if (p.x > width * 0.65) p.x = -width * 0.65;
        if (p.x < -width * 0.65) p.x = width * 0.65;
        if (p.y > height * 0.65) p.y = -height * 0.65;
        if (p.y < -height * 0.65) p.y = height * 0.65;
        if (p.z > 250) p.z = -250;
        if (p.z < -250) p.z = 250;

        let px = p.x * cosT - p.z * sinT;
        let pz = p.x * sinT + p.z * cosT;
        let py = p.y;

        const proj = project(px, py, pz, centerX, centerY);
        if (!proj) continue;

        const currentSize = p.size * proj.scale * (1 + 0.2 * Math.sin(p.pulse));
        const alpha = Math.max(0.12, Math.min(0.65, (proj.scale - 0.5) * 0.75));

        ctx.beginPath();
        ctx.arc(proj.x, proj.y, Math.max(0.6, currentSize), 0, Math.PI * 2);
        ctx.fillStyle = p.isPurple 
          ? `rgba(91, 95, 239, ${alpha})`
          : `rgba(128, 103, 232, ${alpha})`;
        ctx.fill();

        // Connect nearby particles with subtle threads (Fast threshold check)
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          if (Math.abs(dx) > 95) continue;
          const dy = p.y - p2.y;
          if (Math.abs(dy) > 95) continue;

          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 95) {
            const p2x = p2.x * cosT - p2.z * sinT;
            const p2z = p2.x * sinT + p2.z * cosT;
            const proj2 = project(p2x, p2.y, p2z, centerX, centerY);
            if (proj2) {
              const lineAlpha = (1 - dist / 95) * 0.1 * alpha;
              ctx.beginPath();
              ctx.moveTo(proj.x, proj.y);
              ctx.lineTo(proj2.x, proj2.y);
              ctx.strokeStyle = `rgba(91, 95, 239, ${lineAlpha})`;
              ctx.lineWidth = 0.75;
              ctx.stroke();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        width: '100%',
        height: '100%',
        transform: 'translate3d(0,0,0)',
        willChange: 'transform'
      }}
    />
  );
}

// ── 2. Floating Ambient Glow Orbs (GPU Accelerated) ──
function AuroraGlowOrbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden', transform: 'translate3d(0,0,0)', willChange: 'transform' }}>
      <motion.div
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '12%',
          left: '10%',
          width: '480px',
          height: '480px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91, 95, 239, 0.09) 0%, rgba(128, 103, 232, 0.02) 60%, transparent 80%)',
          filter: 'blur(60px)',
          transform: 'translate3d(0,0,0)',
          willChange: 'transform'
        }}
      />
      <motion.div
        animate={{
          x: [0, -40, 20, 0],
          y: [0, 40, -30, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '42%',
          right: '5%',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(109, 140, 255, 0.08) 0%, rgba(91, 95, 239, 0.02) 60%, transparent 80%)',
          filter: 'blur(70px)',
          transform: 'translate3d(0,0,0)',
          willChange: 'transform'
        }}
      />
    </div>
  );
}

// ── 3. Interactive Hero Simulator Widget ──
function InteractiveHeroPlayground() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hey! Welcome to AURA Living Spaces ✨", sender: "aura", time: "Just now" },
    { id: 2, text: "Is the latency really sub-millisecond?", sender: "user", time: "Just now" },
    { id: 3, text: "Yes! 0.42ms average P2P dispatch across global edge relays ⚡", sender: "aura", time: "Just now" },
  ]);
  const [inputText, setInputText] = useState("");
  const [activeTheme, setActiveTheme] = useState("pearl");
  const [isAudioSimulating, setIsAudioSimulating] = useState(false);

  const triggerConfetti = (emoji) => {
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.75 },
      colors: ['#5B5FEF', '#8067E8', '#6D8CFF', '#10B981', '#F43F5E']
    });
    setMessages(prev => [
      ...prev,
      { id: Date.now(), text: `Reaction burst: ${emoji}`, sender: "user", time: "Just now" }
    ]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const newMsg = { id: Date.now(), text: inputText, sender: "user", time: "Just now" };
    setMessages(prev => [...prev, newMsg]);
    setInputText("");

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, text: "Living presence acknowledged! Instant sync broadcasted 🚀", sender: "aura", time: "Just now" }
      ]);
    }, 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      style={{
        width: '100%',
        maxWidth: '860px',
        margin: '36px auto 0',
        borderRadius: '28px',
        background: activeTheme === 'pearl' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(23, 24, 39, 0.95)',
        color: activeTheme === 'pearl' ? '#171827' : '#FFFFFF',
        border: '1px solid rgba(91, 95, 239, 0.25)',
        boxShadow: '0 25px 70px rgba(91, 95, 239, 0.15), 0 10px 30px rgba(0, 0, 0, 0.04)',
        backdropFilter: 'blur(30px)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 2,
        transition: 'background 0.3s ease, color 0.3s ease'
      }}
    >
      {/* Playground Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: activeTheme === 'pearl' ? '1px solid rgba(23, 24, 39, 0.06)' : '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981', display: 'inline-block' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.04em' }}>
              LIVE INTERACTIVE PLAYGROUND
            </span>
          </div>
        </div>

        {/* Theme Switcher Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: activeTheme === 'pearl' ? '#F4F3EF' : 'rgba(255,255,255,0.08)', padding: '3px', borderRadius: '99px' }}>
          <button
            type="button"
            onClick={() => setActiveTheme('pearl')}
            style={{
              border: 'none',
              background: activeTheme === 'pearl' ? '#FFFFFF' : 'transparent',
              color: activeTheme === 'pearl' ? '#5B5FEF' : '#727486',
              borderRadius: '99px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: activeTheme === 'pearl' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            ☀️ Warm Pearl
          </button>
          <button
            type="button"
            onClick={() => setActiveTheme('midnight')}
            style={{
              border: 'none',
              background: activeTheme === 'midnight' ? '#5B5FEF' : 'transparent',
              color: activeTheme === 'midnight' ? '#FFFFFF' : '#727486',
              borderRadius: '99px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: activeTheme === 'midnight' ? '0 2px 8px rgba(91, 95, 239, 0.3)' : 'none'
            }}
          >
            🌙 Midnight Orbit
          </button>
        </div>
      </div>

      {/* Interactive Chat Window Stream */}
      <div style={{
        padding: '20px',
        maxHeight: '260px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                background: isUser 
                  ? 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)'
                  : (activeTheme === 'pearl' ? '#F4F3EF' : 'rgba(255, 255, 255, 0.08)'),
                color: isUser ? '#FFFFFF' : (activeTheme === 'pearl' ? '#171827' : '#FFFFFF'),
                padding: '10px 16px',
                borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                fontSize: '0.86rem',
                fontWeight: 600,
                lineHeight: 1.45,
                boxShadow: isUser ? '0 4px 14px rgba(91, 95, 239, 0.25)' : 'none'
              }}>
                {m.text}
              </div>
              <span style={{ fontSize: '0.65rem', color: '#A1A3B5', marginTop: '3px', padding: '0 4px' }}>
                {m.time}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Interactive Live Reactions Dock */}
      <div style={{
        padding: '10px 20px',
        borderTop: activeTheme === 'pearl' ? '1px solid rgba(23, 24, 39, 0.05)' : '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#727486' }}>Burst Reactions:</span>
          {['✨', '🌌', '🪐', '⚡', '💖', '🔥'].map((emoji) => (
            <motion.button
              key={emoji}
              type="button"
              whileHover={{ scale: 1.25, y: -2 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => triggerConfetti(emoji)}
              style={{
                background: activeTheme === 'pearl' ? '#F4F3EF' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                width: '30px',
                height: '30px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {emoji}
            </motion.button>
          ))}
        </div>

        {/* Audio Visualizer Simulator Toggle */}
        <button
          type="button"
          onClick={() => setIsAudioSimulating(!isAudioSimulating)}
          style={{
            background: isAudioSimulating ? 'rgba(91, 95, 239, 0.15)' : 'transparent',
            border: isAudioSimulating ? '1px solid rgba(91, 95, 239, 0.4)' : '1px solid rgba(23, 24, 39, 0.1)',
            color: isAudioSimulating ? '#5B5FEF' : '#727486',
            borderRadius: '99px',
            padding: '4px 12px',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Volume2 size={13} color={isAudioSimulating ? '#5B5FEF' : '#727486'} />
          {isAudioSimulating ? 'Spatial Audio Active' : 'Test Spatial Audio'}
          {isAudioSimulating && (
            <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
              {[12, 18, 8, 16, 22, 10].map((h, idx) => (
                <motion.span
                  key={idx}
                  animate={{ height: [4, h, 4] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: idx * 0.1 }}
                  style={{ width: '2px', background: '#5B5FEF', borderRadius: '2px', display: 'inline-block' }}
                />
              ))}
            </span>
          )}
        </button>
      </div>

      {/* Input Field Form */}
      <form onSubmit={handleSendMessage} style={{
        padding: '12px 18px',
        borderTop: activeTheme === 'pearl' ? '1px solid rgba(23, 24, 39, 0.06)' : '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a real-time message into this sandbox orbit…"
          style={{
            flex: 1,
            border: activeTheme === 'pearl' ? '1px solid rgba(23, 24, 39, 0.08)' : '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '99px',
            padding: '10px 18px',
            outline: 'none',
            fontSize: '0.85rem',
            background: activeTheme === 'pearl' ? '#F4F3EF' : 'rgba(255, 255, 255, 0.06)',
            color: activeTheme === 'pearl' ? '#171827' : '#FFFFFF',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 600
          }}
        />
        <motion.button
          type="submit"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
            border: 'none',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(91, 95, 239, 0.3)',
            flexShrink: 0
          }}
        >
          <ArrowRight size={18} color="#FFFFFF" />
        </motion.button>
      </form>
    </motion.div>
  );
}

// ── 4. Live Network Telemetry Stats Bar ──
function LiveTelemetryBanner() {
  const stats = [
    { label: "Dispatch Latency", value: "0.42 ms", icon: <Zap size={18} color="#5B5FEF" />, trend: "Sub-Millisecond" },
    { label: "Vault Security", value: "256-Bit", icon: <ShieldCheck size={18} color="#10B981" />, trend: "Zero-Knowledge" },
    { label: "WebRTC Spatial Audio", value: "4K 60fps", icon: <Radio size={18} color="#8067E8" />, trend: "Peer-to-Peer" },
    { label: "Edge Mesh Availability", value: "99.999%", icon: <Globe size={18} color="#6D8CFF" />, trend: "Global Edge" }
  ];

  return (
    <div style={{
      maxWidth: '1100px',
      margin: '40px auto 0',
      padding: '0 20px',
      position: 'relative',
      zIndex: 2
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(24px)',
        borderRadius: '24px',
        padding: '20px 24px',
        border: '1px solid rgba(23, 24, 39, 0.08)',
        boxShadow: '0 12px 36px rgba(23, 24, 39, 0.04)'
      }}>
        {stats.map((st, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '6px 0' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              background: 'rgba(91, 95, 239, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {st.icon}
            </div>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: '1.25rem', color: '#171827', lineHeight: 1.1 }}>
                {st.value}
              </div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#727486', marginTop: '2px' }}>
                {st.label} <span style={{ color: '#5B5FEF', fontWeight: 800 }}>• {st.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 5. Interactive Deep-Dive Features Tabs ──
function InteractiveDeepDiveShowcase() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: 0,
      title: "Relationship Orbit Gravity",
      subtitle: "Contacts orbit closer based on closeness & frequency",
      icon: <Compass size={20} />,
      content: {
        headline: "Organic Orbital Relationship Intelligence",
        desc: "Instead of rigid flat list interfaces, AURA computes relationship proximity. Your closest connections gracefully drift closer to your focal orbit, complete with pulsating beacons and instant telemetry.",
        highlights: ["Dynamic gravity positioning", "Visual orbit rings", "Breathing presence halos", "Zero algorithm tracking"],
        accent: "#5B5FEF"
      }
    },
    {
      id: 1,
      title: "Spatial HD Audio & 4K Video",
      subtitle: "Native peer-to-peer WebRTC calling engine",
      icon: <Video size={20} />,
      content: {
        headline: "Ultra-Low Latency Spatial Communications",
        desc: "Equipped with real-time waveform spectrum equalizers, automated live captioning, and local camera PiP overlays, AURA delivers crystal clear video and voice without centralized data logging.",
        highlights: ["Adaptive background noise cancellation", "Live subtitle transcription", "Picture-in-picture floating view", "4K 60fps WebRTC streams"],
        accent: "#8067E8"
      }
    },
    {
      id: 2,
      title: "Vault Cryptography & View-Once",
      subtitle: "Zero-knowledge disappearing privacy controls",
      icon: <Lock size={20} />,
      content: {
        headline: "Absolute Zero-Knowledge Privacy Architecture",
        desc: "Your data belongs to you alone. Send self-destructing view-once photos and media, locked with client-side keys and verified authenticity handshakes that prevent screenshots and leaks.",
        highlights: ["View-Once disappearing messages", "Client-side private key generation", "Self-destruct timer telemetry", "Anti-leak encrypted buffer"],
        accent: "#10B981"
      }
    },
    {
      id: 3,
      title: "Atmospheric Living Spaces",
      subtitle: "Warm Ivory, Soft Pearl & reactive palettes",
      icon: <Sparkles size={20} />,
      content: {
        headline: "Designed for High Visual & Emotional Comfort",
        desc: "Built from the ground up with soft pearl surfaces, warm ivory lighting, and delicate micro-animations that make digital communication feel natural, calm, and deeply enjoyable.",
        highlights: ["Warm Ivory (#FCFBF7) foundation", "Micro-interaction haptics", "Fluid 60fps animations", "Accessible high-contrast typography"],
        accent: "#6D8CFF"
      }
    }
  ];

  const current = tabs[activeTab];

  return (
    <section style={{
      padding: 'clamp(70px, 9vw, 130px) clamp(20px, 5vw, 60px)',
      background: 'linear-gradient(180deg, #FFFFFF 0%, var(--aura-ivory, #FCFBF7) 100%)',
      position: 'relative',
      zIndex: 2
    }}>
      <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#5B5FEF',
            display: 'block',
            marginBottom: '10px'
          }}>
            ⚡ ARCHITECTURE MATRIX
          </span>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)',
            color: '#171827',
            letterSpacing: '-0.04em',
            margin: 0
          }}>
            Engineered for Pure Perfection
          </h2>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: '#727486',
            fontSize: '1.05rem',
            maxWidth: 520,
            margin: '14px auto 0',
            lineHeight: 1.6
          }}>
            Explore how AURA redefines real-time communication across four groundbreaking pillars.
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '12px',
          marginBottom: '32px'
        }}>
          {tabs.map((t) => {
            const isSel = activeTab === t.id;
            return (
              <motion.button
                key={t.id}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(t.id)}
                style={{
                  background: isSel ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                  border: isSel ? `1.5px solid ${t.content.accent}` : '1px solid rgba(23, 24, 39, 0.08)',
                  borderRadius: '20px',
                  padding: '16px 18px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  boxShadow: isSel ? `0 10px 30px ${t.content.accent}20` : 'none',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background: isSel ? t.content.accent : '#F4F3EF',
                  color: isSel ? '#FFFFFF' : '#727486',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {t.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: isSel ? '#171827' : '#4B4D63' }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#727486', marginTop: '2px', lineHeight: 1.3 }}>
                    {t.subtitle}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Tab Showcase Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            style={{
              background: '#FFFFFF',
              borderRadius: '28px',
              border: '1px solid rgba(23, 24, 39, 0.08)',
              padding: 'clamp(28px, 4vw, 44px)',
              boxShadow: '0 20px 60px rgba(23, 24, 39, 0.05)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '36px',
              alignItems: 'center'
            }}
          >
            <div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: current.content.accent,
                background: `${current.content.accent}15`,
                padding: '6px 14px',
                borderRadius: '99px',
                display: 'inline-block',
                marginBottom: '16px'
              }}>
                ✦ PILLAR 0{activeTab + 1}
              </span>
              <h3 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                color: '#171827',
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
                marginBottom: '16px'
              }}>
                {current.content.headline}
              </h3>
              <p style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: '#727486',
                fontSize: '0.98rem',
                lineHeight: 1.7,
                marginBottom: '24px'
              }}>
                {current.content.desc}
              </p>

              {/* Highlights Checkmark Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {current.content.highlights.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color={current.content.accent} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#171827' }}>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Interactive Graphic */}
            <div style={{
              background: '#F4F3EF',
              borderRadius: '24px',
              padding: '30px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '280px',
              border: '1px solid rgba(23, 24, 39, 0.06)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {activeTab === 0 && (
                <div style={{ position: 'relative', width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Orbit concentric circles */}
                  <div style={{ position: 'absolute', width: '210px', height: '210px', borderRadius: '50%', border: '1.5px dashed rgba(91, 95, 239, 0.25)' }} />
                  <div style={{ position: 'absolute', width: '130px', height: '130px', borderRadius: '50%', border: '1.5px solid rgba(91, 95, 239, 0.35)' }} />
                  
                  {/* Center Sun Avatar */}
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #5B5FEF, #8067E8)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, boxShadow: '0 0 20px rgba(91, 95, 239, 0.5)', zIndex: 5 }}>
                    YOU
                  </div>

                  {/* Orbiting friends */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                  >
                    <div style={{ position: 'absolute', top: '5px', left: '50%', transform: 'translateX(-50%)', width: '32px', height: '32px', borderRadius: '50%', background: '#10B981', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, border: '2px solid #FFF' }}>
                      AR
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    style={{ position: 'absolute', width: '130px', height: '130px' }}
                  >
                    <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', width: '30px', height: '30px', borderRadius: '50%', background: '#0284C7', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, border: '2px solid #FFF' }}>
                      SC
                    </div>
                  </motion.div>
                </div>
              )}

              {activeTab === 1 && (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #8067E8, #5B5FEF)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      HD
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#171827', fontSize: '0.9rem' }}>Spatial Audio Relay</div>
                      <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>● Active • 0.38ms Jitter Buffer</div>
                    </div>
                  </div>

                  {/* Equalizer Spectrum */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '50px' }}>
                    {[16, 28, 44, 32, 48, 20, 36, 42, 24, 46, 30, 18, 38, 50, 22].map((val, idx) => (
                      <motion.div
                        key={idx}
                        animate={{ height: [8, val, 8] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: idx * 0.05 }}
                        style={{ width: '4px', background: '#8067E8', borderRadius: '4px' }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
                  <div style={{ width: 54, height: 54, borderRadius: '16px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={26} />
                  </div>
                  <div style={{ fontWeight: 900, color: '#171827', fontSize: '1.05rem' }}>View-Once Self Destruction</div>
                  <div style={{ background: '#FFFFFF', padding: '8px 18px', borderRadius: '99px', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.78rem', color: '#10B981', fontWeight: 800 }}>
                    ⏳ Auto Purging in 5 seconds
                  </div>
                </div>
              )}

              {activeTab === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '240px' }}>
                  <div style={{ background: '#FFFFFF', padding: '12px 14px', borderRadius: '16px', border: '1px solid rgba(23, 24, 39, 0.08)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#171827' }}>Warm Ivory Atmosphere</div>
                    <div style={{ fontSize: '0.68rem', color: '#727486' }}>Reduced eye strain & soothing contrast</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #5B5FEF, #8067E8)', padding: '12px 14px', borderRadius: '16px', color: '#FFFFFF', boxShadow: '0 8px 20px rgba(91, 95, 239, 0.25)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800 }}>Living Soft Pearl Accent</div>
                    <div style={{ fontSize: '0.68rem', opacity: 0.9 }}>Interactive fluid responses</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// ── 6. Comparison Matrix: AURA vs Legacy Messengers ──
function ComparisonMatrix() {
  const features = [
    { name: "Living Organic Atmosphere & Gravity UI", aura: true, others: false },
    { name: "Sub-Millisecond Native Socket Sync (<1ms)", aura: true, others: false },
    { name: "Zero-Knowledge Client-Side Cryptographic Isolation", aura: true, others: false },
    { name: "Peer-to-Peer Spatial Audio & 4K Video Calling", aura: true, others: "Partial" },
    { name: "Real-Time AI Voice Subtitles & Captions", aura: true, others: false },
    { name: "No Ad Tracking, No Telemetry Reselling", aura: true, others: false },
  ];

  return (
    <section style={{
      padding: 'clamp(60px, 8vw, 110px) clamp(20px, 5vw, 60px)',
      background: 'var(--aura-ivory, #FCFBF7)',
      position: 'relative',
      zIndex: 2
    }}>
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#5B5FEF', display: 'block', marginBottom: '10px' }}>
            ⚡ SIDE BY SIDE
          </span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 'clamp(2rem, 4.5vw, 3.4rem)', color: '#171827', letterSpacing: '-0.04em', margin: 0 }}>
            Why AURA Outperforms Legacy Apps
          </h2>
        </div>

        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          border: '1px solid rgba(23, 24, 39, 0.08)',
          boxShadow: '0 20px 60px rgba(23, 24, 39, 0.04)',
          overflow: 'hidden'
        }}>
          {/* Header Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            padding: '20px 24px',
            background: '#F4F3EF',
            borderBottom: '1px solid rgba(23, 24, 39, 0.08)',
            fontWeight: 800,
            fontSize: '0.88rem',
            color: '#171827'
          }}>
            <div>Capability & Feature</div>
            <div style={{ textAlign: 'center', color: '#5B5FEF' }}>✨ AURA Spaces</div>
            <div style={{ textAlign: 'center', color: '#727486' }}>Legacy Apps (Slack / WA)</div>
          </div>

          {/* Rows */}
          {features.map((f, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr',
              padding: '16px 24px',
              borderBottom: i !== features.length - 1 ? '1px solid rgba(23, 24, 39, 0.05)' : 'none',
              alignItems: 'center',
              fontSize: '0.88rem'
            }}>
              <div style={{ fontWeight: 700, color: '#171827' }}>{f.name}</div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <span style={{
                  background: 'rgba(91, 95, 239, 0.1)',
                  color: '#5B5FEF',
                  padding: '4px 10px',
                  borderRadius: '99px',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Check size={14} /> YES
                </span>
              </div>
              <div style={{ textAlign: 'center', color: '#A1A3B5', fontWeight: 700, fontSize: '0.8rem' }}>
                {f.others === "Partial" ? "⚠️ Partial" : "❌ No"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 7. FAQ Accordion ──
function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null);

  const faqs = [
    {
      q: "What makes AURA different from conventional messaging apps?",
      a: "AURA is engineered around the 'Living Conversations' philosophy. Instead of sterile flat message blocks, AURA uses fluid gravity-based relationship proximity, sub-millisecond WebSockets, peer-to-peer 4K spatial audio, and zero-knowledge encryption."
    },
    {
      q: "Is AURA free to use?",
      a: "Yes! AURA is completely free for individual messaging, group rooms, voice notes, and HD video calls. We never monetize personal data or run tracking ads."
    },
    {
      q: "How does the Zero-Knowledge Vault work?",
      a: "All conversations and view-once attachments are encrypted directly on your device before transmission. No intermediary servers, advertisers, or third parties can read your messages."
    },
    {
      q: "Does AURA work seamlessly across mobile and desktop?",
      a: "Yes! AURA is completely responsive with high-performance WebRTC hardware acceleration, instant QR code synchronization, and touch-optimized haptic reactions."
    }
  ];

  return (
    <section style={{
      padding: 'clamp(60px, 8vw, 110px) clamp(20px, 5vw, 60px)',
      background: '#FFFFFF',
      position: 'relative',
      zIndex: 2
    }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#5B5FEF', display: 'block', marginBottom: '10px' }}>
            ⚡ GOT QUESTIONS?
          </span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', color: '#171827', letterSpacing: '-0.04em', margin: 0 }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                style={{
                  border: '1px solid rgba(23, 24, 39, 0.08)',
                  borderRadius: '20px',
                  background: isOpen ? '#FCFBF7' : '#FFFFFF',
                  overflow: 'hidden',
                  transition: 'all 0.25s ease'
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    fontWeight: 800,
                    fontSize: '0.98rem',
                    color: '#171827',
                    cursor: 'pointer',
                    gap: '14px'
                  }}
                >
                  <span>{faq.q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={18} color="#5B5FEF" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div style={{ padding: '0 24px 20px', fontSize: '0.9rem', color: '#727486', lineHeight: 1.65 }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── 8. Main Aura Landing Page Component ──
export default function AuraLandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    document.title = "Aura — Living Spaces";
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isScrolled = scrollY > 40;

  return (
    <div style={{
      backgroundColor: '#FCFBF7',
      minHeight: '100vh',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      color: '#171827',
      overflowX: 'hidden',
      position: 'relative',
    }}>
      {/* 3D Sacred Torus Knot Canvas */}
      <ThreeVFXBackground />
      
      {/* Ambient Aurora Glow Orbs */}
      <AuroraGlowOrbs />

      {/* ── STICKY GLASSMORPHIC HEADER ── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 1100,
          backgroundColor: isScrolled ? 'rgba(252, 251, 247, 0.94)' : 'rgba(252, 251, 247, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(23, 24, 39, 0.06)',
          boxShadow: isScrolled ? '0 8px 30px rgba(23, 24, 39, 0.03)' : '0 8px 30px rgba(23, 24, 39, 0.02)',
          transition: 'all 0.3s ease'
        }}
      >
        <div className="aura-header-container">
          {/* Brand Logo - Responsive */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <motion.div
              whileHover={{ rotate: 12, scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="aura-logo-icon">
                <Feather size={22} color="#FFFFFF" strokeWidth={2} />
              </div>
            </motion.div>
            <div>
              <span className="aura-logo-text">
                AURA
              </span>
              <span className="aura-logo-sub">
                LIVING SPACES
              </span>
            </div>
          </Link>

          {/* Action CTAs - Responsive & Fluid */}
          <div className="aura-nav-actions">
            <Link to="/login" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="aura-btn-signin"
              >
                Sign In
              </motion.button>
            </Link>

            <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }} style={{ flexShrink: 0 }}>
              <Link to="/signup" style={{ textDecoration: 'none' }}>
                <button className="aura-btn-launch">
                  <span>Launch Aura</span>
                  <ArrowRight size={15} color="#FFFFFF" />
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* ── HERO SECTION ── */}
      <section style={{
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '130px 24px 40px',
        textAlign: 'center'
      }}>
        {/* Status Beacon Tag */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(91, 95, 239, 0.08)',
            border: '1px solid rgba(91, 95, 239, 0.25)',
            padding: '6px 14px',
            borderRadius: '99px',
            marginBottom: '20px',
            maxWidth: '92%',
            boxSizing: 'border-box'
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#5B5FEF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            AURA v3.0 ONLINE • SUB-1MS WEBSOCKET SYNC
          </span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            fontWeight: 900,
            fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            color: '#171827',
            maxWidth: 960,
            margin: '0 auto 20px',
          }}
        >
          Where Conversations Feel{' '}
          <span style={{
            background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 50%, #6D8CFF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Truly Alive.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: '#727486',
            maxWidth: 620,
            lineHeight: 1.65,
            margin: '0 auto 32px'
          }}
        >
          Experience warm ivory surfaces, relationship orbit gravity, peer-to-peer 4K calling, and zero-knowledge encryption.
        </motion.p>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            width: '100%',
            maxWidth: '560px',
            margin: '0 auto 36px',
            boxSizing: 'border-box'
          }}
        >
          <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} style={{ flex: '1 1 200px', maxWidth: '280px' }}>
            <Link to="/signup" style={{ textDecoration: 'none', display: 'block' }}>
              <button style={{
                width: '100%',
                background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: 'clamp(0.88rem, 2vw, 1rem)',
                padding: '14px 24px',
                borderRadius: '99px',
                border: 'none',
                boxShadow: '0 12px 35px rgba(91, 95, 239, 0.32)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}>
                <span>Start Messaging Free</span>
                <ArrowRight size={16} color="#FFFFFF" />
              </button>
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} style={{ flex: '1 1 180px', maxWidth: '240px' }}>
            <Link to="/login" style={{ textDecoration: 'none', display: 'block' }}>
              <button style={{
                width: '100%',
                background: '#FFFFFF',
                color: '#171827',
                fontWeight: 700,
                fontSize: 'clamp(0.88rem, 2vw, 1rem)',
                padding: '14px 24px',
                borderRadius: '99px',
                border: '1.5px solid rgba(23, 24, 39, 0.08)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}>
                Live Demo Orbit
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Live Interactive Hero Sandbox Playground */}
        <InteractiveHeroPlayground />

        {/* Live Telemetry Metrics */}
        <LiveTelemetryBanner />
      </section>

      {/* ── INTERACTIVE DEEP DIVE SHOWCASE ── */}
      <InteractiveDeepDiveShowcase />

      {/* ── COMPARISON MATRIX ── */}
      <ComparisonMatrix />

      {/* ── FAQ SECTION ── */}
      <FAQSection />

      {/* ── GRAND FINALE CALL TO ACTION ── */}
      <section style={{
        padding: 'clamp(80px, 10vw, 140px) clamp(20px, 6vw, 80px)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, var(--aura-ivory, #FCFBF7) 0%, #FFFFFF 100%)',
        zIndex: 2
      }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: false }}
        >
          <motion.div
            animate={{ y: [0, -14, 0], rotate: [-4, 4, -4] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
            style={{
              display: 'inline-flex',
              marginBottom: '24px',
              filter: 'drop-shadow(0 16px 32px rgba(91, 95, 239, 0.35))',
            }}
          >
            <Feather size={72} color="#5B5FEF" strokeWidth={1.3} />
          </motion.div>

          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
            letterSpacing: '-0.04em',
            color: '#171827',
            marginBottom: '16px',
          }}>
            Ready to Step Into Your Aura Space?
          </h2>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: '#727486',
            fontSize: '1.05rem',
            maxWidth: 480,
            margin: '0 auto 36px',
            lineHeight: 1.65,
          }}>
            Join thousands communicating on the world's most living messaging platform.
          </p>

          <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}>
            <Link to="/signup" style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                color: '#FFFFFF',
                border: 'none',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: '1.05rem',
                padding: '16px 42px',
                borderRadius: '99px',
                boxShadow: '0 12px 35px rgba(91, 95, 239, 0.32)',
                cursor: 'pointer'
              }}>
                Launch Your Space Free <ArrowRight size={20} color="#FFFFFF" />
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FUTURISTIC GLASS FOOTER ── */}
      <footer style={{
        padding: '40px 28px',
        borderTop: '1px solid rgba(23, 24, 39, 0.08)',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        maxWidth: '1240px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Feather size={18} color="#5B5FEF" />
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#171827' }}>AURA</span>
          <span style={{ fontSize: '0.8rem', color: '#727486' }}>— Living Conversations System © {new Date().getFullYear()}</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', fontWeight: 700, color: '#727486' }}>
          <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign In</Link>
          <Link to="/signup" style={{ color: 'inherit', textDecoration: 'none' }}>Register</Link>
          <span style={{ color: '#10B981', fontWeight: 800 }}>● Network Optimal</span>
        </div>
      </footer>
    </div>
  );
}
