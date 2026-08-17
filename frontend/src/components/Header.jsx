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
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 1.8,
              px: { xs: 1.5, sm: 4 }
            }}
          >
            {/* Brand Logo - Living Conversations Theme */}
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <motion.div
                whileHover={{ rotate: 12, scale: 1.08 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(91, 95, 239, 0.32)'
                  }}
                >
                  <Feather size={22} color="#FFFFFF" strokeWidth={2} />
                </Box>
              </motion.div>
              <Box>
                <Typography
                  variant="h6"
                  component="span"
                  sx={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 900,
                    fontSize: '1.5rem',
                    letterSpacing: '-0.03em',
                    color: '#171827',
                    lineHeight: 1,
                    display: 'block'
                  }}
                >
                  AURA
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: '#5B5FEF',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    display: 'block',
                    fontFamily: "'Plus Jakarta Sans', sans-serif"
                  }}
                >
                  LIVING SPACES
                </Typography>
              </Box>
            </Link>

            {/* Navigation Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexShrink: 0 }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  component={Link}
                  to="/"
                  style={{
                    background: 'transparent',
                    color: isHome ? '#171827' : '#727486',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: isHome ? 800 : 700,
                    fontSize: '0.9rem',
                    textTransform: 'none',
                    padding: '8px 18px',
                    borderRadius: '99px',
                    minWidth: 0,
                    position: 'relative',
                  }}
                >
                  Home
                  {isHome && (
                    <span style={{
                      position: 'absolute',
                      bottom: 4,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: '#5B5FEF',
                      boxShadow: '0 0 8px rgba(91, 95, 239, 0.6)',
                    }} />
                  )}
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.97 }}>
                <Button
                  component={Link}
                  to={isLogin ? '/signup' : '/login'}
                  endIcon={<ArrowRight size={16} color="#FFFFFF" />}
                  style={{
                    background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    padding: '10px 24px',
                    borderRadius: '99px',
                    boxShadow: '0 8px 24px rgba(91, 95, 239, 0.28)',
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
