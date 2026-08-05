import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Feather, Compass, Shield, Star } from 'lucide-react';

export default function WhiteCreamLandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ backgroundColor: '#FFF9F2', minHeight: '100vh', color: '#3D2B26', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ==================================================
          NAVIGATION (65% White Dominance)
          ================================================== */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid rgba(61, 43, 38, 0.08)',
        transition: 'all 250ms ease',
        boxShadow: scrolled ? '0 10px 30px rgba(61, 43, 38, 0.04)' : 'none',
        padding: scrolled ? '14px 5%' : '20px 5%'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#111827',
              border: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(17, 24, 39, 0.2)'
            }}>
              <Feather size={20} color="#FFFFFF" />
            </div>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
              AURA
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="d-none d-md-flex">
            <a href="#philosophy" style={{ color: '#3D2B26', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem' }}>Philosophy</a>
            <a href="#collection" style={{ color: '#C98282', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>Collection</a>
            <a href="#editorial" style={{ color: '#3D2B26', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem' }}>Editorial</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a href="/login" className="btn-soft-aura" style={{ textDecoration: 'none' }}>
              Sign In
            </a>
            <a href="/signup" className="btn-primary-aura" style={{ textDecoration: 'none' }}>
              Create Account
            </a>
          </div>
        </div>
      </nav>

      {/* ==================================================
          HERO SECTION (#FFF9F2 Main Background)
          ================================================== */}
      <section style={{ paddingTop: '170px', paddingBottom: '110px', paddingLeft: '5%', paddingRight: '5%', backgroundColor: '#FFF9F2', position: 'relative' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', lg: '1.1fr 0.9fr', gap: '64px', alignItems: 'center' }}>
          
          {/* Editorial Headline */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#FDF1E4',
              border: '1px solid rgba(61, 43, 38, 0.06)',
              padding: '6px 18px',
              borderRadius: '20px',
              color: '#806C65',
              fontSize: '0.825rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '28px'
            }}>
              <Sparkles size={14} color="#C98282" /> WHERE ELEGANCE BEGINS
            </div>

            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(3rem, 5.5vw, 4.8rem)',
              fontWeight: 700,
              lineHeight: 1.08,
              color: '#3D2B26',
              marginBottom: '24px',
              letterSpacing: '-0.03em'
            }}>
              SIMPLICITY <br />
              <span style={{ color: '#C98282', fontStyle: 'italic', fontWeight: 400 }}>MADE BEAUTIFUL</span>
            </h1>

            <p style={{ fontSize: '1.125rem', color: '#806C65', lineHeight: 1.8, maxWidth: '520px', marginBottom: '36px' }}>
              A luxurious, soft ivory space designed with deep espresso typography, delicate dusty rose accents, and pure white editorial clarity.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <button className="btn-primary-aura">
                Discover Aura <ArrowRight size={18} />
              </button>
              <button className="btn-secondary-aura">
                View Lookbook
              </button>
            </div>
          </motion.div>

          {/* Pure White Card Hero Surface */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="aura-card" style={{ padding: '28px', backgroundColor: '#FFFFFF' }}>
              <div style={{
                height: '420px',
                borderRadius: '12px',
                backgroundColor: '#FDF1E4',
                background: 'linear-gradient(135deg, #FFF9F2 0%, #FDF1E4 50%, #F3D6C5 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '36px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'relative', zIndex: 2, backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(61, 43, 38, 0.06)' }}>
                  <span style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C98282', fontWeight: 700 }}>AUTUMN / WINTER</span>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', margin: '4px 0 8px 0', color: '#3D2B26' }}>Whispers of Pure Cream</h3>
                  <p style={{ fontSize: '0.9rem', color: '#806C65', margin: 0 }}>Elevated visual identity tailored for modern editorial curation.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================================================
          PURE WHITE SECTION (#FFFFFF)
          ================================================== */}
      <section id="philosophy" style={{ padding: '90px 5%', backgroundColor: '#FFFFFF', borderTop: '1px solid rgba(61, 43, 38, 0.05)', borderBottom: '1px solid rgba(61, 43, 38, 0.05)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 60px auto' }}>
            <span style={{ fontSize: '0.825rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C98282', fontWeight: 600 }}>OUR PHILOSOPHY</span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.6rem', color: '#3D2B26', marginTop: '8px' }}>
              Understated Luxury
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '36px' }}>
            
            <div className="aura-card" style={{ padding: '40px', backgroundColor: '#FFFFFF' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FDF1E4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Feather size={24} color="#C98282" />
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', marginBottom: '12px' }}>Ivory Whites</h3>
              <p style={{ color: '#806C65', fontSize: '0.95rem', lineHeight: 1.7 }}>Clean white backgrounds dominate 65% of the aesthetic to create effortless reading and high clarity.</p>
            </div>

            <div className="aura-card" style={{ padding: '40px', backgroundColor: '#FFFFFF' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FDF1E4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Compass size={24} color="#C98282" />
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', marginBottom: '12px' }}>Warm Creams</h3>
              <p style={{ color: '#806C65', fontSize: '0.95rem', lineHeight: 1.7 }}>Soft champagne cream accents provide subtle section transitions and soft visual depth.</p>
            </div>

            <div className="aura-card" style={{ padding: '40px', backgroundColor: '#FFFFFF' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FDF1E4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Shield size={24} color="#C98282" />
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', marginBottom: '12px' }}>Espresso Contrast</h3>
              <p style={{ color: '#806C65', fontSize: '0.95rem', lineHeight: 1.7 }}>Rich espresso brown typography delivers maximum legibility without harsh black tones.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          WARM CREAM SECTION (#FDF1E4)
          ================================================== */}
      <section id="collection" style={{ padding: '90px 5%', backgroundColor: '#FDF1E4' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="aura-card" style={{ padding: '64px', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', lg: '1.1fr 0.9fr', gap: '48px', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.825rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A6B82', fontWeight: 600 }}>EDITORIAL SPOTLIGHT</span>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.8rem', color: '#3D2B26', margin: '16px 0 20px 0', lineHeight: 1.15 }}>
                  Feminine Modernism
                </h2>
                <p style={{ color: '#806C65', fontSize: '1rem', lineHeight: 1.8, marginBottom: '32px' }}>
                  Crafted for high-end boutique experiences. Delicate dusty rose highlights and soft peach surfaces elevate everyday digital interactions into memorable moments.
                </p>
                <button className="btn-secondary-aura">
                  Explore Editorial <ArrowRight size={16} />
                </button>
              </div>

              <div style={{
                height: '320px',
                borderRadius: '12px',
                backgroundColor: '#FAE8D5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3D2B26',
                fontFamily: "'Playfair Display', serif",
                fontSize: '2.2rem',
                fontStyle: 'italic',
                border: '1px solid rgba(61, 43, 38, 0.08)'
              }}>
                "Pure Serenity."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          FOOTER (#FFFFFF Background)
          ================================================== */}
      <footer style={{ backgroundColor: '#FFFFFF', color: '#3D2B26', padding: '60px 5% 40px 5%', borderTop: '1px solid rgba(61, 43, 38, 0.08)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
          <div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 800, color: '#3D2B26' }}>AURA</span>
            <p style={{ fontSize: '0.875rem', color: '#806C65', marginTop: '4px' }}>Luxury Editorial White + Cream Palette</p>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#806C65' }}>
            © {new Date().getFullYear()} Aura Editorial. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
