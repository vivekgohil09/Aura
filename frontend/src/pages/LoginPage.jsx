import * as React from 'react';
import axios from "axios";
import { useState, useEffect, useRef } from "react"
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { Link, useHistory } from 'react-router-dom';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import "../App.css"
import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/system';
import ModalUnstyled from '@mui/base/ModalUnstyled';
import EmailIcon from '@mui/icons-material/Email';
import PasswordIcon from '@mui/icons-material/Password';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { MDBBtn } from 'mdb-react-ui-kit';
import { MDBTypography } from 'mdb-react-ui-kit';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch } from "react-redux";
import { setUserDetails, setChats } from "../redux/actions/index";
import { motion } from "framer-motion";
import { Feather } from "lucide-react";

import confetti from 'canvas-confetti';
import { encryptMessage, decryptMessage } from '../config/dataCompressor';
import * as THREE from 'three';

// ── Modern Minimal White Luxury Ambient VFX Background Component ──
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
      {/* Top Left Golden Ambient Glow */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.35, 0.55, 0.35],
          x: [0, 20, 0],
          y: [0, -15, 0]
        }}
        transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '-120px',
          left: '-80px',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.18) 0%, rgba(245, 158, 11, 0.05) 55%, transparent 75%)',
          filter: 'blur(50px)'
        }}
      />
      {/* Bottom Right Champagne Soft Radial */}
      <motion.div
        animate={{
          scale: [1, 1.18, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, -25, 0],
          y: [0, 20, 0]
        }}
        transition={{ repeat: Infinity, duration: 11, ease: 'easeInOut', delay: 1 }}
        style={{
          position: 'absolute',
          bottom: '-140px',
          right: '-100px',
          width: '580px',
          height: '580px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(212, 175, 55, 0.04) 60%, transparent 80%)',
          filter: 'blur(60px)'
        }}
      />
      {/* Center Subtle Specular Light Beam */}
      <motion.div
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '30%',
          left: '20%',
          right: '20%',
          height: '350px',
          background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.9) 0%, transparent 70%)',
          filter: 'blur(40px)'
        }}
      />
    </Box>
  );
}

const url = "https://aura-vdcq.onrender.com";

const StyledModal = styled(ModalUnstyled)`
  position: fixed;
  z-index: 1300;
  right: 0;
  bottom: 0;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Backdrop = styled('div')`
  z-index: -1;
  position: fixed;
  right: 0;
  bottom: 0;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.5);
  -webkit-tap-highlight-color: transparent;
`;

const style = {
  width: 500,
  height: 500,
  bgcolor: 'background.paper',
  p: 2,
  px: 4,
  pb: 3,
};

function Copyright(props) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © Aura {new Date().getFullYear()} · Created by Vivek Gohil. All rights reserved. '}
      Aura{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const theme = createTheme();

export default function LoginPage() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const dispatch = useDispatch();

  const isGoogleInitialized = useRef(false);
  const googleButtonRef = useRef(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  useEffect(() => {
    document.title = "Aura | Login";

    const initGoogle = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: "1012565781444-eok0rpma515el0i2pvg2j6o58lacb228.apps.googleusercontent.com",
            callback: handleGoogleLogin,
            auto_select: true,
            use_fedcm_for_prompt: true,
            itp_support: true,
            cancel_on_tap_outside: false,
            context: 'signin',
          });
          isGoogleInitialized.current = true;

          // Auto-show One Tap prompt on page load (especially useful on mobile)
          window.google.accounts.id.prompt((notification) => {
            if (notification.isDisplayed()) {
              console.log('One Tap prompt displayed');
            } else if (notification.isNotDisplayed()) {
              console.log('One Tap not displayed:', notification.getNotDisplayedReason());
              // Render hidden button as fallback
              if (googleButtonRef.current) {
                window.google.accounts.id.renderButton(googleButtonRef.current, {
                  theme: "outline",
                  size: "large",
                  type: "standard"
                });
              }
            } else if (notification.isSkippedMoment()) {
              console.log('One Tap skipped:', notification.getSkippedReason());
            }
          });
        } catch (err) {
          console.error("Google Sign-In initialization failed:", err);
        }
      }
    };

    initGoogle();
    const interval = setInterval(() => {
      if (!isGoogleInitialized.current && window.google) {
        initGoogle();
      } else if (isGoogleInitialized.current) {
        clearInterval(interval);
      }
    }, 500);

    return () => {
      clearInterval(interval);
      // Cancel One Tap prompt on unmount
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      toast.warning('Please Fill all the fields!', {
        position: "top-right",
        autoClose: 3000,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        theme: 'colored'
      });
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };

      const { data } = await axios.post(
        `/api/user/login`,
        { email, password },
        config
      );

      toast.success(data.message || "Login successful!", {
        position: "top-right",
        autoClose: 3000,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        theme: 'colored'
      });
      localStorage.setItem("userInfo", JSON.stringify(data.userLogin));
      localStorage.setItem("jwt", data.token);

      dispatch(setUserDetails(data.userLogin));
      setLoading(false);

      setTimeout(() => {
        history.push("/chats");
      }, 1000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Invalid Credentials!";

      if (!toast.isActive("login-error-toast")) {
        toast.error(errorMessage, {
          toastId: "login-error-toast",
          position: "top-right",
          autoClose: 3000,
          closeButton: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          theme: 'colored'
        });
      }
      setLoading(false);
    }
  };

  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const handleGoogleLogin = async (response) => {
    toast.dismiss();
    if (!response?.credential) {
      toast.error("Google authentication cancelled or failed.", {
        position: "top-right",
        autoClose: 3000
      });
      return;
    }

    setLoading(true);
    try {
      const decoded = parseJwt(response.credential);
      if (!decoded || !decoded.email) {
        toast.error("Could not retrieve email from Google credential.", {
          position: "top-right",
          autoClose: 3000
        });
        setLoading(false);
        return;
      }

      const googleName = decoded.name || decoded.given_name || "Google User";
      const googleEmail = decoded.email;
      const googlePic = decoded.picture || "";

      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };

      const { data } = await axios.post(
        `/api/user/google/login`,
        {
          credential: response.credential,
          name: googleName,
          email: googleEmail,
          pic: googlePic,
        },
        config
      );

      toast.success(data.message || "Google Login Successful!", {
        position: "top-right",
        hideProgressBar: true,
        closeOnClick: true,
        theme: 'colored',
        autoClose: 3000
      });

      const userObj = data.data?.userLogin || data.userLogin || data;
      const token = data.data?.token || data.token;

      localStorage.setItem("userInfo", JSON.stringify(userObj));
      if (token) localStorage.setItem("jwt", token);

      dispatch(setUserDetails(userObj));
      setLoading(false);

      setTimeout(() => {
        toast.dismiss();
        history.push("/chats");
      }, 800);
    } catch (error) {
      toast.dismiss();
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Google Sign-In failed!";

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        closeButton: true,
        pauseOnHover: false,
        draggable: true,
        theme: 'colored'
      });
      setLoading(false);
    }
  };

  const triggerGooglePrompt = () => {
    toast.dismiss();

    if (window.google && window.google.accounts && window.google.accounts.id) {
      // Re-initialize if not already done
      if (!isGoogleInitialized.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: "1012565781444-eok0rpma515el0i2pvg2j6o58lacb228.apps.googleusercontent.com",
            callback: handleGoogleLogin,
            auto_select: true,
            use_fedcm_for_prompt: true,
            itp_support: true,
            cancel_on_tap_outside: false,
            context: 'signin',
          });
          isGoogleInitialized.current = true;
        } catch (err) {
          console.error("Google Sign-In initialization failed:", err);
        }
      }

      // Trigger the One Tap prompt directly
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback: click the hidden rendered button
            const hiddenBtn = googleButtonRef.current?.querySelector('div[role="button"], button, iframe');
            if (hiddenBtn) {
              hiddenBtn.click();
            } else {
              // Last resort: re-render and click
              if (googleButtonRef.current) {
                window.google.accounts.id.renderButton(googleButtonRef.current, {
                  theme: "outline",
                  size: "large",
                  type: "standard"
                });
                setTimeout(() => {
                  const btn = googleButtonRef.current?.querySelector('div[role="button"], button, iframe');
                  if (btn) btn.click();
                }, 300);
              }
            }
          }
        });
      } catch (e) {
        console.error("Google prompt error:", e);
      }
    } else {
      toast.error("Google Sign-In service is loading. Please try again.", {
        position: "top-right",
        autoClose: 3000
      });
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
        backgroundImage: 'radial-gradient(at 10% 10%, rgba(212, 175, 55, 0.12) 0px, transparent 55%), radial-gradient(at 90% 90%, rgba(245, 158, 11, 0.08) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(255, 255, 255, 0.8) 0px, transparent 100%)'
      }}>
        <CssBaseline />
        <Grid
          item
          xs={false}
          sm={false}
          md={7}
          className="card-3d-wrapper"
          sx={{
            background: 'transparent',
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 6,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Floating Luxury Orbs & Background Rings */}
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
            style={{
              position: 'absolute', top: '8%', left: '6%',
              width: 140, height: 140,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, rgba(212, 175, 55, 0.25), rgba(245, 158, 11, 0.05) 60%, transparent)',
              filter: 'blur(22px)',
              pointerEvents: 'none'
            }}
          />
          <motion.div
            animate={{ y: [0, 18, 0], x: [0, -12, 0], scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 9, ease: "easeInOut", delay: 1.5 }}
            style={{
              position: 'absolute', bottom: '10%', right: '8%',
              width: 180, height: 180,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 40%, rgba(15, 23, 42, 0.08), rgba(212, 175, 55, 0.08) 60%, transparent)',
              filter: 'blur(30px)',
              pointerEvents: 'none'
            }}
          />
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 440, height: 440,
              borderRadius: '50%',
              border: '1.5px solid rgba(212, 175, 55, 0.2)',
              boxShadow: '0 0 30px rgba(212, 175, 55, 0.04) inset',
              pointerEvents: 'none'
            }}
          />
          <motion.div
            animate={{ rotate: [360, 0] }}
            transition={{ repeat: Infinity, duration: 14, ease: "linear" }}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 290, height: 290,
              borderRadius: '50%',
              border: '1px dashed rgba(212, 175, 55, 0.25)',
              pointerEvents: 'none'
            }}
          />
          <motion.div
            animate={{ y: [0, -14, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            style={{ position: 'absolute', top: '18%', right: '14%', width: 10, height: 10, borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 14px rgba(212, 175, 55, 0.8)', pointerEvents: 'none' }}
          />
          <motion.div
            initial={{ opacity: 0, x: -40, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%', maxWidth: '460px', display: 'flex', justifyContent: 'center' }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              style={{ width: '100%' }}
            >
              <Box className="card-3d-tilt" sx={{
                position: 'relative',
                zIndex: 2,
                textAlign: 'center',
                width: '100%',
                p: { md: 4, lg: 5 },
                borderRadius: '28px',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08), 0 0 25px rgba(212, 175, 55, 0.12)',
                overflow: 'hidden'
              }}
              >
                <Box sx={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px', background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)', borderRadius: '2px', zIndex: 3 }} />
                
                <motion.div
                  animate={{
                    y: [0, -14, 0],
                    rotate: [-8, 8, -8],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                  whileHover={{ scale: 1.25, rotate: 22 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    width: '68px',
                    height: '68px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
                    boxShadow: '0 10px 30px rgba(212, 175, 55, 0.4)'
                  }}
                >
                  <Feather size={36} color="#FFFFFF" strokeWidth={2.2} />
                </motion.div>

                <h1 style={{
                  fontSize: '2.8rem',
                  lineHeight: 1,
                  marginBottom: '0.35rem',
                  fontWeight: 900,
                  fontFamily: "'Outfit', sans-serif",
                  background: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.03em'
                }}>AURA</h1>
                <p style={{ color: '#D4AF37', fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '0.75rem', marginBottom: '1.4rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Pristine Encrypted Messaging</p>

                <Grid container spacing={1.5} justifyContent="center">
                  <Grid item xs={6}>
                    <motion.div whileHover={{ y: -4, scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Box sx={{
                        p: 1.8,
                        borderRadius: '16px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        color: '#0F172A',
                        textAlign: 'center',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
                      }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>⚡</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>Ultra-Fast</div>
                      </Box>
                    </motion.div>
                  </Grid>
                  <Grid item xs={6}>
                    <motion.div whileHover={{ y: -4, scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Box sx={{
                        p: 1.8,
                        borderRadius: '16px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        color: '#0F172A',
                        textAlign: 'center',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
                      }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>🔒</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>Encrypted</div>
                      </Box>
                    </motion.div>
                  </Grid>
                </Grid>
              </Box>
            </motion.div>
          </motion.div>
        </Grid>
        <Grid
          item
          xs={12}
          sm={12}
          md={5}
          component={Paper}
          elevation={0}
          className="page-animate"
          sx={{
            background: 'transparent',
            borderLeft: { xs: 'none', md: '1px solid rgba(212, 175, 55, 0.2)' },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: 2, sm: 4 },
            py: { xs: 4, md: 5 },
            minHeight: 'auto',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Mobile-only VFX */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0 }}>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.25, 0.1] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
              style={{
                position: 'absolute', bottom: '15%', left: '5%',
                width: 140, height: 140, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(212, 175, 55, 0.4), transparent 70%)',
                filter: 'blur(25px)'
              }}
            />
          </Box>

          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: '400px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.88)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                p: { xs: 3.5, sm: 4.5 },
                borderRadius: '28px',
                border: '1.5px solid rgba(212, 175, 55, 0.35)',
                boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08), 0 0 20px rgba(212, 175, 55, 0.1)',
                position: 'relative',
                zIndex: 1
              }}
            >
              <h1 style={{ fontSize: '2.1rem', marginBottom: '0.25rem', fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: '#0F172A', letterSpacing: '-0.03em' }}>Welcome Back</h1>
              <Typography variant="body2" sx={{ color: '#64748B', mb: 3, fontFamily: "'Inter', sans-serif", fontSize: '0.88rem' }}>
                Sign in to your <strong style={{ color: '#D4AF37' }}>AURA</strong> luxury workspace
              </Typography>

              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#94A3B8', '&:hover': { color: '#D4AF37' } }}
                        >
                          {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '14px',
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
                      fontFamily: "'Outfit', sans-serif",
                      letterSpacing: '0.04em'
                    }}
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2, textTransform: 'none' }}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex' }}>
                        <CircularProgress size={24} color="inherit" />
                      </Box>
                    ) : 'Sign In'}
                  </Button>
                </motion.div>

                {/* ─── OR Divider ─── */}
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', my: 1.5 }}>
                  <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent)' }} />
                  <Typography sx={{ px: 2, color: '#94A3B8', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'Inter', sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>or</Typography>
                  <Box sx={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent)' }} />
                </Box>

                {/* Hidden container for official Google rendered button */}
                <div ref={googleButtonRef} style={{ display: 'none' }} id="google-hidden-btn" />

                {/* Custom Google Sign In Button */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={triggerGooglePrompt}
                    startIcon={
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    }
                    style={{
                      background: '#FFFFFF',
                      border: '1.5px solid rgba(226, 232, 240, 0.9)',
                      color: '#0F172A',
                      fontWeight: 700,
                      borderRadius: '16px',
                      padding: '12px',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                      fontFamily: "'Inter', sans-serif"
                    }}
                    sx={{ mb: 3, textTransform: 'none' }}
                  >
                    Sign in with Google
                  </Button>
                </motion.div>
                <Grid container spacing={1.5} justifyContent="space-between" alignItems="center" sx={{ mt: 1, mb: 1 }}>
                  <Grid item xs={12} sm="auto">
                    <Link to="/change-password" style={{
                      cursor: "pointer",
                      textDecoration: "none",
                      color: "#D4AF37",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      Forgot password?
                    </Link>
                  </Grid>
                  <Grid item xs={12} sm="auto" sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                    <Typography variant="body2" component="span" sx={{ color: '#64748B', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', mr: 0.5 }}>
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
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </motion.div>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}