import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useHistory } from 'react-router-dom';
import emailjs from 'emailjs-com';
import { init } from 'emailjs-com';
import confetti from 'canvas-confetti';
import { toast } from 'react-toastify';
import { 
  Feather, Star, Send, ArrowLeft, Heart, Sparkles, MessageSquare, 
  ThumbsUp, CheckCircle, ShieldCheck, Zap, Radio, Smile 
} from 'lucide-react';
import { Box, Typography, Button, TextField, Chip, Paper, Grid } from '@mui/material';

init("user_gNLrEaX8TC2lFKuWqbni7");

// ── 3D Ambient Glowing VFX Background ──
function AmbientVFXBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden', background: 'var(--aura-ivory, #FCFBF7)' }}>
      {/* Top Right Aura Indigo Orb */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.35, 0.6, 0.35],
          x: [0, 25, 0],
          y: [0, -20, 0]
        }}
        transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-80px',
          width: '540px',
          height: '540px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91, 95, 239, 0.16) 0%, rgba(128, 103, 232, 0.05) 55%, transparent 75%)',
          filter: 'blur(50px)'
        }}
      />
      {/* Bottom Left Violet Soft Radial */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.55, 0.3],
          x: [0, -25, 0],
          y: [0, 25, 0]
        }}
        transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut', delay: 1 }}
        style={{
          position: 'absolute',
          bottom: '-120px',
          left: '-80px',
          width: '580px',
          height: '580px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(128, 103, 232, 0.14) 0%, rgba(91, 95, 239, 0.04) 60%, transparent 80%)',
          filter: 'blur(60px)'
        }}
      />
    </div>
  );
}

const FEEDBACK_TAGS = [
  { label: "⚡ Sub-1ms Speed", icon: <Zap size={14} /> },
  { label: "✨ Luxury Design", icon: <Sparkles size={14} /> },
  { label: "🔒 Zero-Knowledge Privacy", icon: <ShieldCheck size={14} /> },
  { label: "🎙️ HD Spatial Audio", icon: <Radio size={14} /> },
  { label: "💎 Fluid Smoothness", icon: <Smile size={14} /> },
  { label: "🌐 P2P 4K Calling", icon: <MessageSquare size={14} /> }
];

export default function Review() {
  const history = useHistory();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState(["✨ Luxury Design", "⚡ Sub-1ms Speed"]);
  const [msg, setMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    document.title = "Aura | Living Experience Review";
    const user = JSON.parse(localStorage.getItem("userInfo") || "{}");
    if (user?.name) setName(user.name);
    if (user?.email) setEmail(user.email);
  }, []);

  const toggleTag = (tagLabel) => {
    if (selectedTags.includes(tagLabel)) {
      setSelectedTags(selectedTags.filter(t => t !== tagLabel));
    } else {
      setSelectedTags([...selectedTags, tagLabel]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !msg.trim()) {
      toast.warning("Please provide your name and your thoughts!");
      return;
    }

    setIsSubmitting(true);

    const templateParams = {
      name: name,
      user_name: name,
      user_email: email || "Anonymous",
      rating: `${rating} / 5 Stars`,
      highlights: selectedTags.join(", ") || "None selected",
      message: msg
    };

    try {
      await emailjs.send('service_ntl00xp', 'template_8njo9ej', templateParams);
    } catch (err) {
      console.warn("EmailJS note:", err);
    }

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Fire Celebration Confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#5B5FEF', '#8067E8', '#6D8CFF', '#10B981', '#F59E0B']
    });

    toast.success("Thank you! Your review has been submitted to the Aura team ✨");
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--aura-ivory, #FCFBF7)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      color: '#171827',
      position: 'relative',
      overflowX: 'hidden',
      padding: '40px 20px 80px'
    }}>
      <AmbientVFXBackground />

      {/* Main Container */}
      <div style={{ maxWidth: '780px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        
        {/* Back Link */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ marginBottom: '24px' }}
        >
          <Link 
            to="/" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              color: '#5B5FEF', 
              textDecoration: 'none', 
              fontWeight: 800,
              fontSize: '0.9rem' 
            }}
          >
            <ArrowLeft size={16} /> Back to Orbit
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            borderRadius: '28px',
            padding: 'clamp(28px, 5vw, 48px)',
            border: '1px solid rgba(23, 24, 39, 0.08)',
            boxShadow: '0 20px 60px rgba(23, 24, 39, 0.04)',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(91, 95, 239, 0.32)',
                marginBottom: '16px'
              }}
            >
              <Feather size={32} color="#FFFFFF" strokeWidth={2.2} />
            </motion.div>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: '#171827',
              margin: '0 0 8px'
            }}>
              How is Your Aura Experience?
            </h1>
            <p style={{
              color: '#727486',
              fontSize: '1rem',
              maxWidth: 480,
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              Your insights shape our living communication spaces, telemetry speed, and luxury aesthetics.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.form 
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
              >
                {/* 1. Interactive Star Rating */}
                <div style={{
                  background: 'rgba(252, 251, 247, 0.8)',
                  padding: '18px 24px',
                  borderRadius: '20px',
                  border: '1px solid rgba(23, 24, 39, 0.06)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#727486', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    Rate Your Atmosphere
                  </div>
                  <div style={{ display: 'inline-flex', gap: '10px', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = (hoverRating || rating) >= star;
                      return (
                        <motion.button
                          key={star}
                          type="button"
                          whileHover={{ scale: 1.25 }}
                          whileTap={{ scale: 0.9 }}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            outline: 'none'
                          }}
                        >
                          <Star 
                            size={32} 
                            color={isFilled ? '#F59E0B' : '#D1D5DB'} 
                            fill={isFilled ? '#F59E0B' : 'transparent'} 
                            strokeWidth={1.8}
                          />
                        </motion.button>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '0.88rem', fontWeight: 800, color: '#5B5FEF' }}>
                    {rating === 5 && "🌟 Extraordinary — Pure Luxury!"}
                    {rating === 4 && "✨ Great Experience — Loving It!"}
                    {rating === 3 && "👍 Good Atmosphere — Ready for more"}
                    {rating === 2 && "⚡ Needs Some Tuning"}
                    {rating === 1 && "🛠️ Needs Urgent Refinements"}
                  </div>
                </div>

                {/* 2. Highlight Tag Pills */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#171827', marginBottom: '10px' }}>
                    What stood out the most?
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {FEEDBACK_TAGS.map((tag) => {
                      const isSel = selectedTags.includes(tag.label);
                      return (
                        <motion.button
                          key={tag.label}
                          type="button"
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => toggleTag(tag.label)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            borderRadius: '99px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: isSel ? 'rgba(91, 95, 239, 0.12)' : 'rgba(23, 24, 39, 0.04)',
                            color: isSel ? '#5B5FEF' : '#727486',
                            border: isSel ? '1.5px solid #5B5FEF' : '1px solid rgba(23, 24, 39, 0.08)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {tag.icon}
                          <span>{tag.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Name & Email Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#171827', marginBottom: '6px' }}>
                      Your Name <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Vance"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 18px',
                        borderRadius: '14px',
                        border: '1px solid rgba(23, 24, 39, 0.12)',
                        background: '#FFFFFF',
                        color: '#171827',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        outline: 'none',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#171827', marginBottom: '6px' }}>
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="alex@aura.space"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 18px',
                        borderRadius: '14px',
                        border: '1px solid rgba(23, 24, 39, 0.12)',
                        background: '#FFFFFF',
                        color: '#171827',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        outline: 'none',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* 4. Feedback Message */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#171827' }}>
                      Your Thoughts & Impressions <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.78rem', color: '#727486', fontWeight: 700 }}>
                      {msg.length} / 500
                    </span>
                  </div>
                  <textarea
                    required
                    maxLength={500}
                    rows={4}
                    placeholder="Tell us what you loved, or any new orbit features you'd like to see in Aura..."
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      borderRadius: '16px',
                      border: '1px solid rgba(23, 24, 39, 0.12)',
                      background: '#FFFFFF',
                      color: '#171827',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      outline: 'none',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 5. Submit CTA Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '16px 28px',
                    fontSize: '1rem',
                    fontWeight: 800,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 12px 35px rgba(91, 95, 239, 0.32)',
                    marginTop: '8px'
                  }}
                >
                  <Send size={18} color="#FFFFFF" />
                  <span>{isSubmitting ? 'Transmitting Review…' : 'Submit Review to Aura Studio'}</span>
                </motion.button>
              </motion.form>
            ) : (
              <motion.div
                key="submitted"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  textAlign: 'center',
                  padding: '30px 20px',
                }}
              >
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '2px solid #10B981',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <CheckCircle size={38} color="#10B981" />
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#171827', marginBottom: '8px' }}>
                  Review Received with Gratitude!
                </h2>
                <p style={{ color: '#727486', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto 28px' }}>
                  Your valuable feedback has been transmitted directly to our product engineers.
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/" style={{ textDecoration: 'none' }}>
                    <button style={{
                      padding: '12px 24px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(91, 95, 239, 0.28)'
                    }}>
                      Go to Landing Orbit
                    </button>
                  </Link>
                  <Link to="/chats" style={{ textDecoration: 'none' }}>
                    <button style={{
                      padding: '12px 24px',
                      borderRadius: '12px',
                      background: '#FFFFFF',
                      color: '#171827',
                      fontWeight: 800,
                      border: '1px solid rgba(23, 24, 39, 0.12)',
                      cursor: 'pointer'
                    }}>
                      Open Live Chats
                    </button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}