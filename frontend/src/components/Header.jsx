import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Container, Button, Typography, createTheme, ThemeProvider } from '@mui/material';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

const defaultTheme = createTheme();

export default function Header() {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

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
          backgroundColor: 'rgba(255, 253, 249, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(73, 49, 41, 0.08)',
          boxShadow: '0 4px 20px rgba(73, 49, 41, 0.04)'
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 1.5,
              px: { xs: 2, sm: 4 }
            }}
          >
            {/* Brand / Logo */}
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <motion.div
                whileHover={{ rotate: 15, scale: 1.08 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #E63946 0%, #d62839 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(230, 57, 70, 0.25)'
                  }}
                >
                  <span style={{ fontSize: '1.4rem', color: '#FFFFFF' }}>🪶</span>
                </Box>
              </motion.div>
              <Box>
                <Typography
                  variant="h6"
                  component="span"
                  sx={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 800,
                    fontSize: '1.6rem',
                    letterSpacing: '-0.03em',
                    color: '#3D2B26',
                    display: 'block',
                    lineHeight: 1
                  }}
                >
                  AURA
                </Typography>
              </Box>
            </Link>

            {/* Navigation Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  component={Link}
                  to="/aura"
                  style={{
                    background: 'transparent',
                    color: '#3D2B26',
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    padding: '8px 18px',
                    borderRadius: '99px',
                    minWidth: 0
                  }}
                >
                  Home
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  component={Link}
                  to={isLogin ? '/signup' : '/login'}
                  endIcon={<ArrowRight size={14} />}
                  style={{
                    background: isLogin
                      ? 'linear-gradient(135deg, #E63946 0%, #d62839 100%)'
                      : 'rgba(230, 57, 70, 0.08)',
                    color: isLogin ? '#FFFFFF' : '#E63946',
                    border: isLogin ? 'none' : '1.5px solid rgba(230, 57, 70, 0.3)',
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    padding: '8px 18px',
                    borderRadius: '99px',
                    boxShadow: isLogin ? '0 4px 14px rgba(230, 57, 70, 0.25)' : 'none',
                    minWidth: 0
                  }}
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Button>
              </motion.div>
            </Box>
          </Box>
        </Container>
      </motion.header>
    </ThemeProvider>
  );
}
