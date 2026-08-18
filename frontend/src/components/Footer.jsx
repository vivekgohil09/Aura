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
          borderTop: '1px solid rgba(23, 24, 39, 0.06)',
          color: '#727486',
          pt: 6,
          pb: 4,
          position: 'relative',
          zIndex: 10,
          boxShadow: '0 -10px 30px rgba(23, 24, 39, 0.02)'
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
                    background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 18px rgba(91, 95, 239, 0.32)'
                  }}
                >
                  <Feather size={20} color="#FFFFFF" strokeWidth={2} />
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 900,
                    fontSize: '1.5rem',
                    letterSpacing: '-0.03em',
                    color: '#171827'
                  }}
                >
                  AURA
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#727486', maxWidth: 320, lineHeight: 1.6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Next-generation living conversations app crafted with warm ivory aesthetics, relationship orbits, and zero-knowledge encryption.
              </Typography>
            </Grid>

            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#171827', mb: 1.5, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.82rem' }}>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {[
                  { to: '/login', label: 'Sign In' },
                  { to: '/signup', label: 'Sign Up' },
                  { to: '/change-password', label: 'Reset Password' },
                  { to: '/review-page', label: 'Experience & Feedback' },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    style={{
                      textDecoration: 'none',
                      color: '#5B5FEF',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      position: 'relative',
                      display: 'inline-block',
                      width: 'fit-content',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#4B4ED8';
                      const underline = e.currentTarget.querySelector('.footer-underline');
                      if (underline) underline.style.width = '100%';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#5B5FEF';
                      const underline = e.currentTarget.querySelector('.footer-underline');
                      if (underline) underline.style.width = '0%';
                    }}
                  >
                    {link.label}
                    <span
                      className="footer-underline"
                      style={{
                        position: 'absolute',
                        bottom: -2,
                        left: 0,
                        width: '0%',
                        height: '2px',
                        background: 'linear-gradient(90deg, #5B5FEF, #8067E8)',
                        borderRadius: '2px',
                        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </Link>
                ))}
              </Box>
            </Grid>

            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#171827', mb: 1.5, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.82rem' }}>
                Security & Integrity
              </Typography>
              <Typography variant="body2" sx={{ color: '#727486', lineHeight: 1.7, fontSize: '0.85rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
              borderTop: '1px solid rgba(23, 24, 39, 0.06)',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Typography variant="caption" sx={{ color: '#A1A3B5', fontSize: '0.8rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Copyright © Aura {new Date().getFullYear()} · Created by Vivek Gohil. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#A1A3B5', fontSize: '0.8rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Crafted with care & precision
              </Typography>
              <Heart size={14} color="#5B5FEF" fill="#5B5FEF" />
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
