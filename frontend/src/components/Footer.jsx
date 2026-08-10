import React from 'react';
import { Box, Container, Typography, Grid, Link as MuiLink, createTheme, ThemeProvider } from '@mui/material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Feather, Sparkles, Heart } from 'lucide-react';

const defaultTheme = createTheme();

export default function Footer() {
  return (
    <ThemeProvider theme={defaultTheme}>
      <Box
        component="footer"
        sx={{
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid rgba(212, 175, 55, 0.25)',
          color: '#64748B',
          pt: 6,
          pb: 4,
          position: 'relative',
          zIndex: 10,
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.02)'
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={4} justifyContent="space-between">
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 18px rgba(212, 175, 55, 0.35)'
                  }}
                >
                  <Feather size={20} color="#FFFFFF" strokeWidth={2} />
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 900,
                    fontSize: '1.5rem',
                    letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  AURA
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 320, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
                Next-generation real-time encrypted messaging app crafted with pristine white luxury aesthetics & instant socket speed.
              </Typography>
            </Grid>

            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1.5, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif", fontSize: '0.82rem' }}>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, fontFamily: "'Inter', sans-serif" }}>
                <Link to="/login" style={{ textDecoration: 'none', color: '#D4AF37', fontSize: '0.875rem', fontWeight: 700 }}>
                  Sign In
                </Link>
                <Link to="/signup" style={{ textDecoration: 'none', color: '#D4AF37', fontSize: '0.875rem', fontWeight: 700 }}>
                  Sign Up
                </Link>
                <Link to="/change-password" style={{ textDecoration: 'none', color: '#D4AF37', fontSize: '0.875rem', fontWeight: 700 }}>
                  Reset Password
                </Link>
              </Box>
            </Grid>

            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1.5, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif", fontSize: '0.82rem' }}>
                Security & Integrity
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.7, fontSize: '0.85rem', fontFamily: "'Inter', sans-serif" }}>
                ✦ End-to-end encrypted payload protocol<br />
                ✦ Dynamic JWT authentication security<br />
                ✦ Always-on high availability cluster
              </Typography>
            </Grid>
          </Grid>

          <Box
            sx={{
              mt: 5,
              pt: 3,
              borderTop: '1px solid rgba(226, 232, 240, 0.8)',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.8rem', fontFamily: "'Inter', sans-serif" }}>
              Copyright © Aura {new Date().getFullYear()} · Created by Vivek Gohil. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.8rem', fontFamily: "'Inter', sans-serif" }}>
                Crafted with luxury & precision
              </Typography>
              <Heart size={14} color="#D4AF37" fill="#D4AF37" />
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
