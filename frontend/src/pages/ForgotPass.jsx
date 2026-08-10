import * as React from 'react';
import { useState, useEffect } from "react";
import axios from "axios";
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import { Link, useHistory } from 'react-router-dom';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import "../App.css";
import CircularProgress from '@mui/material/CircularProgress';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from "framer-motion";
import * as THREE from 'three';

// ── Modern Minimal White Luxury Ambient VFX Background Component (ForgotPass) ──
function AmbientVFXBackground() {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        background: '#F8FAFC'
      }}
    >
      {/* Top Center Golden Ambient Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.35, 0.55, 0.35],
          y: [0, 15, 0]
        }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '-120px',
          left: '30%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.22) 0%, rgba(245, 158, 11, 0.05) 55%, transparent 75%)',
          filter: 'blur(55px)'
        }}
      />
      {/* Bottom Center Subtle Radial */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.25, 0.45, 0.25]
        }}
        transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut', delay: 1 }}
        style={{
          position: 'absolute',
          bottom: '-140px',
          left: '35%',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(212, 175, 55, 0.04) 60%, transparent 80%)',
          filter: 'blur(60px)'
        }}
      />
    </Box>
  );
}

const theme = createTheme();

export default function ForgotPass() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailPres, setEmailPres] = useState(false);
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  useEffect(() => {
    document.title = "Aura | Forgot Password";
  }, []);

  const changePassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!password) {
      toast.warning('Please fill in the new password!', {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: false,
        theme: 'colored'
      });
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: { "Content-type": "application/json" }
      };

      const { data } = await axios.put(
        `/api/user/change-password`,
        { email, password },
        config
      );

      toast.success(data.message || "Password changed successfully!", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        theme: 'colored'
      });
      setLoading(false);

      setTimeout(() => {
        history.push("/login");
      }, 1500);
    } catch (error) {
      toast.error("Failed to update password!", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        theme: 'colored'
      });
      setLoading(false);
    }
  };

  const findEmail = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email) {
      toast.warning('Please enter your email address!', {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        theme: 'colored'
      });
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: { "Content-type": "application/json" }
      };

      await axios.post(
        `/api/user/find-email`,
        { email },
        config
      );

      setLoading(false);
      setEmailPres(true);
      toast.success("Account found! Please set a new password.", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        theme: 'colored'
      });
    } catch (error) {
      if (!toast.isActive("email-not-registered-toast")) {
        toast.error("Email not registered!", {
          toastId: "email-not-registered-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: true,
          theme: 'colored'
        });
      }
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <AmbientVFXBackground />
      <Grid container component="main" sx={{ 
        minHeight: 'calc(100vh - 80px)', 
        position: 'relative',
        zIndex: 1,
        background: 'transparent',
        backgroundImage: 'radial-gradient(at 50% 0%, rgba(212, 175, 55, 0.14) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(245, 158, 11, 0.08) 0px, transparent 50%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}>
        <CssBaseline />
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', maxWidth: '440px', display: 'flex', justifyContent: 'center' }}
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              p: { xs: 3.5, sm: 4.5 },
              borderRadius: '28px',
              border: '1.5px solid rgba(212, 175, 55, 0.35)',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08), 0 0 25px rgba(212, 175, 55, 0.1)'
            }}
          >
            <motion.div
              whileHover={{ rotate: 12, scale: 1.1 }}
              style={{ width: '68px', height: '68px', marginBottom: '1.2rem' }}
            >
              <Box sx={{
                width: '100%',
                height: '100%',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(212, 175, 55, 0.4)'
              }}>
                <span style={{ fontSize: '1.9rem', color: '#FFFFFF' }}>🔑</span>
              </Box>
            </motion.div>

            <h1 style={{
              fontSize: '2.4rem',
              lineHeight: 1,
              marginBottom: '0.4rem',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.03em',
              fontFamily: "'Outfit', sans-serif"
            }}>
              {emailPres ? "New Password" : "Reset Password"}
            </h1>

            <Typography variant="body2" sx={{ color: '#64748B', mb: 3, textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
              {emailPres 
                ? "Enter your new password below to update your account" 
                : "Enter your account email to verify and reset your password"}
            </Typography>

            <Box component="form" noValidate sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                disabled={emailPres}
                autoFocus={!emailPres}
                variant="outlined"
                value={email || ''}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#0F172A',
                    backgroundColor: emailPres ? '#F1F5F9' : '#FFFFFF',
                    borderRadius: '16px',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    '& fieldset': {
                      borderColor: 'rgba(226, 232, 240, 0.9)',
                      borderWidth: '1.5px'
                    },
                    '&:hover fieldset': {
                      borderColor: '#D4AF37'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#D4AF37',
                      borderWidth: '2px',
                      boxShadow: '0 4px 16px rgba(212, 175, 55, 0.15)'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#64748B',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    '&.Mui-focused': {
                      color: '#D4AF37'
                    }
                  }
                }}
              />

              {emailPres && (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="New Password"
                  type="password"
                  id="password"
                  autoFocus
                  variant="outlined"
                  value={password || ''}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      '& fieldset': {
                        borderColor: 'rgba(226, 232, 240, 0.9)',
                        borderWidth: '1.5px'
                      },
                      '&:hover fieldset': {
                        borderColor: '#D4AF37'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#D4AF37',
                        borderWidth: '2px',
                        boxShadow: '0 4px 16px rgba(212, 175, 55, 0.15)'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#64748B',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      '&.Mui-focused': {
                        color: '#D4AF37'
                      }
                    }
                  }}
                />
              )}

              <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
                <Button
                  style={{
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(212, 175, 55, 0.5)',
                    fontWeight: 800,
                    fontSize: '1rem',
                    padding: '14px',
                    borderRadius: '16px',
                    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.2)',
                    textTransform: 'none',
                    fontFamily: "'Outfit', sans-serif",
                    letterSpacing: '0.04em'
                  }}
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  onClick={emailPres ? changePassword : findEmail}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex' }}>
                      <CircularProgress size={24} color="inherit" />
                    </Box>
                  ) : (
                    emailPres ? "Update Password" : "Verify Email"
                  )}
                </Button>
              </motion.div>

                <Box sx={{ mt: 2.5, width: '100%', display: 'flex', flexDirection: 'column', gap: 1.2, alignItems: 'center' }}>
                  <Link to="/login" style={{
                    cursor: "pointer",
                    textDecoration: "none",
                    color: "#D4AF37",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    Remembered password? Sign In
                  </Link>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Typography variant="body2" component="span" sx={{ color: '#64748B', fontSize: '0.875rem', fontFamily: "'Inter', sans-serif" }}>
                      Don't have an account?
                    </Typography>
                    <Link to="/signup" style={{
                      cursor: "pointer",
                      textDecoration: "none",
                      color: "#0F172A",
                      fontSize: "0.875rem",
                      fontWeight: 800,
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      Sign Up
                    </Link>
                  </Box>
                </Box>
            </Box>
          </Box>
        </motion.div>
      </Grid>
    </ThemeProvider>
  );
}