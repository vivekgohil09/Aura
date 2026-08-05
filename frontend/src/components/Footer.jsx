import React from 'react';
import { Box, Container, Typography, Grid, Link as MuiLink, createTheme, ThemeProvider } from '@mui/material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Shield, Heart } from 'lucide-react';

const defaultTheme = createTheme();

export default function Footer() {
  return (
    <ThemeProvider theme={defaultTheme}>
      <Box
        component="footer"
        sx={{
          backgroundColor: '#F3F0E6',
          borderTop: '1px solid rgba(236, 233, 225, 0.9)',
          color: '#555E58',
          pt: 5,
          pb: 4,
          position: 'relative',
          zIndex: 10
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={4} justifyContent="space-between">
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #E7F1EE 0%, #F7F0DF 100%)',
                    border: '1px solid #E5E1D8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Sparkles size={16} color="#4F8A82" />
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    letterSpacing: '-0.02em',
                    color: '#303633'
                  }}
                >
                  Aura
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#707873', maxWidth: 320, lineHeight: 1.6 }}>
                A modern, fast, and secure real-time messaging application designed for effortless communication.
              </Typography>
            </Grid>

            <Grid item xs={6} md={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#303633', mb: 1.5 }}>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link to="/login" style={{ textDecoration: 'none', color: '#4F8A82', fontSize: '0.875rem', fontWeight: 600 }}>
                  Sign In
                </Link>
                <Link to="/signup" style={{ textDecoration: 'none', color: '#4F8A82', fontSize: '0.875rem', fontWeight: 600 }}>
                  Sign Up
                </Link>
                <Link to="/change-password" style={{ textDecoration: 'none', color: '#4F8A82', fontSize: '0.875rem', fontWeight: 600 }}>
                  Reset Password
                </Link>
              </Box>
            </Grid>

            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#303633', mb: 1.5 }}>
                Security & Privacy
              </Typography>
              <Typography variant="body2" sx={{ color: '#707873', lineHeight: 1.6, fontSize: '0.85rem' }}>
                ✦ End-to-end communication safeguards<br />
                ✦ Modern JWT Token authentication<br />
                ✦ Cloud infrastructure ready
              </Typography>
            </Grid>
          </Grid>

          <Box
            sx={{
              mt: 4,
              pt: 3,
              borderTop: '1px solid rgba(210, 205, 195, 0.4)',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Typography variant="caption" sx={{ color: '#707873', fontSize: '0.8rem' }}>
              Copyright © Aura {new Date().getFullYear()}. All rights reserved.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#707873', fontSize: '0.8rem' }}>
                Crafted with precision
              </Typography>
              <Heart size={14} color="#C9AD73" fill="#C9AD73" />
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
