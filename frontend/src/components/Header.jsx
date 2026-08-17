import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Container, Button, Typography, createTheme, ThemeProvider } from '@mui/material';
import { motion } from 'framer-motion';
import { Feather, ArrowRight } from 'lucide-react';

const defaultTheme = createTheme();

export default function Header() {
  const location = useLocation();
  const isLogin = location.pathname === '/login';
  const isHome = location.pathname === '/' || location.pathname === '/aura' || location.pathname === '/landing';

  return (
    <ThemeProvider theme={defaultTheme}>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'sticky',
          top: 0,
          width: '100%',
          zIndex: 1100,
          backgroundColor: 'rgba(252, 251, 247, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(23, 24, 39, 0.06)',
          boxShadow: '0 8px 30px rgba(23, 24, 39, 0.02)'
        }}
      >
        <div className="aura-header-container">
          {/* Brand Logo */}
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

          {/* Navigation Actions */}
          <div className="aura-nav-actions">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/" style={{ textDecoration: 'none' }}>
                <button
                  className="aura-btn-signin"
                  style={{
                    color: isHome ? '#171827' : '#727486',
                    fontWeight: isHome ? 800 : 700,
                    position: 'relative'
                  }}
                >
                  Home
                  {isHome && (
                    <span style={{
                      position: 'absolute',
                      bottom: 2,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: '#5B5FEF',
                      boxShadow: '0 0 8px rgba(91, 95, 239, 0.6)',
                    }} />
                  )}
                </button>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }}>
              <Link to={isLogin ? '/signup' : '/login'} style={{ textDecoration: 'none' }}>
                <button className="aura-btn-launch">
                  <span>{isLogin ? 'Sign Up' : 'Sign In'}</span>
                  <ArrowRight size={15} color="#FFFFFF" />
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>
    </ThemeProvider>
  );
}
