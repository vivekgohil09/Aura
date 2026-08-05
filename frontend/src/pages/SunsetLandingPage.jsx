import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, Shield, Compass, Heart, Feather, Star } from 'lucide-react';

export default function SunsetLandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ backgroundColor: '#FCEEDB', minHeight: '100vh', color: '#493129', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ==================================================
          NAVIGATION BAR
          ================================================== */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: scrolled ? 'rgba(255, 253, 249, 0.95)' : 'rgba(255, 253, 249, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(73, 49, 41, 0.08)',
        transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        boxShadow: scrolled ? '0 10px 30px rgba(73, 49, 41, 0.06)' : 'none',
        padding: scrolled ? '14px 4%' : '20px 4%'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#493129',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFDF9'
            }}>
              <Feather size={18} color="#EFA3A0" />
            </div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', fontWeight: 700, color: '#493129', letterSpacing: '-0.02em' }}>
              SUNSET
            </span>
          </div>

          {/* Navigation Items */}
          <div style={{ display: 'none', md: 'flex', alignItems: 'center', gap: '32px' }} className="d-none d-md-flex">
            <a href="#about" style={{ color: '#493129', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem', transition: 'color 0.2s ease' }}>About</a>
            <a href="#collection" style={{ color: '#8B597B', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>Collection</a>
            <a href="#journal" style={{ color: '#493129', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem' }}>Journal</a>
            <a href="#contact" style={{ color: '#493129', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem' }}>Contact</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a href="/login" className="btn-secondary-sunset" style={{ textDecoration: 'none' }}>
              Sign In
            </a>
            <a href="/signup" className="btn-accent-sunset" style={{ textDecoration: 'none' }}>
              Explore Aura
            </a>
          </div>
        </div>
      </nav>

      {/* ==================================================
          HERO SECTION
          ================================================== */}
      <section style={{ paddingTop: '160px', paddingBottom: '100px', px: '4%', position: 'relative', overflow: 'hidden' }}>
        
        {/* Subtle Decorative Background Shapes */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          backgroundColor: '#FFDCC7',
          filter: 'blur(80px)',
          opacity: 0.6,
          zIndex: 0
        }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', lg: '1.1fr 0.9fr', gap: '60px', alignItems: 'center' }}>
            
            {/* Hero Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FFDCC7',
                padding: '6px 16px',
                borderRadius: '20px',
                color: '#765A63',
                fontSize: '0.825rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '24px'
              }}>
                <Sparkles size={14} color="#8B597B" /> Modern Luxury Boutique
              </div>

              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
                fontWeight: 700,
                lineHeight: 1.1,
                color: '#493129',
                marginBottom: '24px',
                letterSpacing: '-0.03em'
              }}>
                DESIGN YOUR <br />
                <span style={{ color: '#8B597B', fontStyle: 'italic' }}>MOMENT</span>
              </h1>

              <p style={{ fontSize: '1.125rem', color: '#765A63', lineHeight: 1.7, maxWidth: '520px', marginBottom: '36px' }}>
                Where understated elegance meets modern living. Curated experiences designed with warmth, intentional visual harmony, and timeless luxury.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <button className="btn-primary-sunset">
                  Discover Collection <ArrowRight size={18} />
                </button>
                <button className="btn-secondary-sunset">
                  Read Editorial
                </button>
              </div>
            </motion.div>

            {/* Hero Right Composition Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'relative' }}
            >
              <div className="sunset-card" style={{ padding: '24px', position: 'relative', zIndex: 1 }}>
                <div style={{
                  height: '420px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #FFDCC7 0%, #EFA3A0 50%, #8B597B 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '32px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(73, 49, 41, 0.15)'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 30% 30%, rgba(255, 253, 249, 0.4) 0%, transparent 60%)'
                  }} />

                  <div style={{ position: 'relative', zIndex: 2, backgroundColor: 'rgba(255, 253, 249, 0.92)', padding: '20px', borderRadius: '12px', backdropFilter: 'blur(8px)' }}>
                    <span style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8B597B', fontWeight: 700 }}>AUTUMN EDITION</span>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', margin: '4px 0 8px 0', color: '#493129' }}>Swiftly Fly The Years</h3>
                    <p style={{ fontSize: '0.875rem', color: '#765A63', margin: 0 }}>An invitation to slow down and embrace poetic simplicity.</p>
                  </div>
                </div>
              </div>

              {/* Accent Floating Badge */}
              <div style={{
                position: 'absolute',
                bottom: '-20px',
                left: '-20px',
                backgroundColor: '#EFA3A0',
                color: '#493129',
                padding: '16px 24px',
                borderRadius: '12px',
                boxShadow: '0 12px 30px rgba(239, 163, 160, 0.4)',
                fontWeight: 700,
                fontSize: '0.95rem',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Star size={18} fill="#493129" color="#493129" /> Craftsmanship First
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================================================
          FEATURED CARDS SECTION
          ================================================== */}
      <section id="collection" style={{ padding: '80px 4%', backgroundColor: '#FFFDF9' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 60px auto' }}>
            <span style={{ fontSize: '0.825rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8B597B', fontWeight: 600 }}>CURATED PILLARS</span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', color: '#493129', marginTop: '8px' }}>
              Designed For Connoisseurs
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            
            <motion.div whileHover={{ y: -4 }} className="sunset-card" style={{ padding: '36px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FFDCC7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Feather size={24} color="#8B597B" />
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', marginBottom: '12px' }}>Poetic Aesthetics</h3>
              <p style={{ color: '#765A63', fontSize: '0.95rem', lineHeight: 1.6 }}>Every detail is visually balanced with organic curves, warm lighting, and editorial typography.</p>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} className="sunset-card" style={{ padding: '36px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FFDCC7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Compass size={24} color="#8B597B" />
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', marginBottom: '12px' }}>Intuitive Flow</h3>
              <p style={{ color: '#765A63', fontSize: '0.95rem', lineHeight: 1.6 }}>Effortless navigation designed to soothe the senses while maintaining functional superiority.</p>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} className="sunset-card" style={{ padding: '36px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FFDCC7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Shield size={24} color="#8B597B" />
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', marginBottom: '12px' }}>Timeless Quality</h3>
              <p style={{ color: '#765A63', fontSize: '0.95rem', lineHeight: 1.6 }}>Engineered with uncompromised precision and privacy-first architecture at its core.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================================================
          EDITORIAL SHOWCASE SECTION
          ================================================== */}
      <section style={{ padding: '100px 4%', backgroundColor: '#FCEEDB' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="sunset-card" style={{ padding: '60px', backgroundColor: '#FFFDF9' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', lg: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.825rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8B597B', fontWeight: 600 }}>EDITORIAL ESSAY</span>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.75rem', color: '#493129', margin: '16px 0 20px 0', lineHeight: 1.2 }}>
                  The Art of Slow Digital Living
                </h2>
                <p style={{ color: '#765A63', fontSize: '1rem', lineHeight: 1.7, marginBottom: '28px' }}>
                  In a digital world dominated by noise and harsh high-contrast interfaces, Sunset offers a sanctuary of warm cocoa typography, soothing cream palettes, and tactile elegance.
                </p>
                <button className="btn-accent-sunset">
                  Read Journal Entry <ArrowRight size={16} />
                </button>
              </div>

              <div style={{
                height: '320px',
                borderRadius: '12px',
                backgroundColor: '#FFDCC7',
                backgroundImage: 'radial-gradient(circle at 50% 50%, #EFA3A0 0%, #8B597B 100%)',
                boxShadow: 'inset 0 0 40px rgba(73, 49, 41, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFDF9',
                fontFamily: "'Playfair Display', serif",
                fontSize: '2rem',
                fontStyle: 'italic'
              }}>
                "Warmth is luxury."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          FOOTER
          ================================================== */}
      <footer style={{ backgroundColor: '#493129', color: '#FFFDF9', padding: '60px 4% 40px 4%' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
          <div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#FFFDF9' }}>SUNSET</span>
            <p style={{ fontSize: '0.875rem', color: '#EFA3A0', marginTop: '4px' }}>Luxury Editorial Experience</p>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#FFDCC7' }}>
            © {new Date().getFullYear()} Sunset Boutique Inc. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
