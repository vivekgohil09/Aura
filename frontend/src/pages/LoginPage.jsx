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
import { MDBBtn } from 'mdb-react-ui-kit';
import { MDBTypography } from 'mdb-react-ui-kit';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch } from "react-redux";
import { setUserDetails, setChats } from "../redux/actions/index";
import { motion } from "framer-motion";
import { Feather } from "lucide-react";

import confetti from 'canvas-confetti';

const url = "http://localhost:8000";

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
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const dispatch = useDispatch();

  const isGoogleInitialized = useRef(false);

  useEffect(() => {
    document.title = "Aura | Login";
    const initGoogle = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: "1012565781444-eok0rpma515el0i2pvg2j6o58lacb228.apps.googleusercontent.com",
            callback: handleGoogleLogin,
            auto_select: false,
            use_fedcm_for_prompt: true,
          });
          isGoogleInitialized.current = true;
          const container = document.getElementById("googleSignInDiv");
          if (container && container.children.length === 0) {
            window.google.accounts.id.renderButton(container, {
              theme: "outline",
              size: "large",
              width: "100%",
              shape: "pill",
            });
          }
        } catch (err) {
          console.error("Google Sign-In initialization failed:", err);
        }
      }
    };
    initGoogle();
    const timer = setTimeout(initGoogle, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      toast.warning('Please Fill all the fields!', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
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
        position: "bottom-right",
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
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
      // Extract backend error message dynamically
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Invalid Credentials!";

      if (!toast.isActive("login-error-toast")) {
        toast.error(errorMessage, {
          toastId: "login-error-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: true,
          closeButton: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
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
    setLoading(true);
    try {
      const decoded = response?.credential ? parseJwt(response.credential) : null;
      const googleName = decoded?.name || decoded?.given_name || "Google User";
      const googleEmail = decoded?.email || "";
      const googlePic = decoded?.picture || "";

      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };

      const { data } = await axios.post(
        `/api/user/google/login`,
        {
          credential: response?.credential || "GOOGLE_SSO_DEMO_TOKEN",
          name: googleName,
          email: googleEmail,
          pic: googlePic,
        },
        config
      );

      toast.success(data.message || "Google Login Successful!", {
        position: "top-center",
        hideProgressBar: true,
        closeOnClick: true,
        theme: 'colored',
        autoClose: 3000
      });

      const userObj = data.data?.userLogin || data.userLogin || data;
      const token = data.data?.token || data.token;

      localStorage.setItem("userInfo", JSON.stringify(userObj));
      if (token) localStorage.setItem("jwt", JSON.stringify(token));

      dispatch(setUserDetails(userObj));
      setLoading(false);

      setTimeout(() => {
        history.push("/chats");
      }, 1000);
    } catch (error) {
      // Extract backend Google login error message dynamically
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Google Sign-In failed!";

      toast.error(errorMessage, {
        position: "top-center",
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
    if (isGoogleInitialized.current) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          toast.error("Google One-Tap was dismissed or not displayed. Try again.");
        }
      });
    } else {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: "1012565781444-eok0rpma515el0i2pvg2j6o58lacb228.apps.googleusercontent.com",
            callback: handleGoogleLogin,
            auto_select: false,
            use_fedcm_for_prompt: true,
          });
          isGoogleInitialized.current = true;
          window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              toast.error("Google One-Tap was dismissed or not displayed. Try again.");
            }
          });
        } catch (err) {
          toast.error("Google Sign-In initialization failed.");
        }
      } else {
        toast.error("Google Sign-In script is not loaded yet.");
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Grid container component="main" sx={{
        minHeight: 'calc(100vh - 80px)',
        background: '#FFF9F2',
        backgroundImage: 'radial-gradient(at 0% 0%, rgba(255, 232, 210, 0.8) 0px, transparent 55%), radial-gradient(at 100% 100%, rgba(255, 107, 107, 0.07) 0px, transparent 50%)'
      }}>
        <CssBaseline />
        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          className="card-3d-wrapper"
          sx={{
            background: 'linear-gradient(145deg, #FFF0E5 0%, #FFDECA 40%, #FFE8D5 100%)',
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 6,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Floating Orbs & Background Rings */}
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
            style={{
              position: 'absolute', top: '8%', left: '6%',
              width: 120, height: 120,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, rgba(255, 142, 83, 0.55), rgba(255, 107, 107, 0.2) 60%, transparent)',
              filter: 'blur(18px)',
              pointerEvents: 'none'
            }}
          />
          <motion.div
            animate={{ y: [0, 18, 0], x: [0, -12, 0], scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 9, ease: "easeInOut", delay: 1.5 }}
            style={{
              position: 'absolute', bottom: '10%', right: '8%',
              width: 160, height: 160,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 40%, rgba(255, 107, 107, 0.4), rgba(255, 220, 180, 0.2) 60%, transparent)',
              filter: 'blur(28px)',
              pointerEvents: 'none'
            }}
          />
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 420, height: 420,
              borderRadius: '50%',
              border: '1.5px solid rgba(255, 107, 107, 0.1)',
              boxShadow: '0 0 40px rgba(255, 107, 107, 0.05) inset',
              pointerEvents: 'none'
            }}
          />
          <motion.div
            animate={{ rotate: [360, 0] }}
            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 280, height: 280,
              borderRadius: '50%',
              border: '1px dashed rgba(255, 142, 83, 0.15)',
              pointerEvents: 'none'
            }}
          />
          <motion.div
            animate={{ y: [0, -14, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            style={{ position: 'absolute', top: '18%', right: '14%', width: 10, height: 10, borderRadius: '50%', background: '#FF8E53', boxShadow: '0 0 12px rgba(255, 142, 83, 0.6)', pointerEvents: 'none' }}
          />
          <motion.div
            animate={{ y: [0, 12, 0], opacity: [0.5, 0.9, 0.5] }}
            transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut", delay: 1 }}
            style={{ position: 'absolute', bottom: '22%', left: '12%', width: 7, height: 7, borderRadius: '50%', background: '#FF6B6B', boxShadow: '0 0 10px rgba(255, 107, 107, 0.5)', pointerEvents: 'none' }}
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
              <Box className="card-3d-tilt vfx-pulse-glow" sx={{
                position: 'relative',
                zIndex: 2,
                textAlign: 'center',
                width: '100%',
                p: { md: 4, lg: 5 },
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 142, 83, 0.15)',
                boxShadow: '0 18px 50px rgba(255, 107, 107, 0.09), 0 6px 16px rgba(61, 43, 38, 0.04)',
                overflow: 'hidden'
              }}
              >
                <Box sx={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent)', borderRadius: '2px', zIndex: 3 }} />
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.85, 0.5] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                  style={{
                    position: 'absolute',
                    top: '-25%',
                    left: '5%',
                    width: '90%',
                    height: '90%',
                    background: 'radial-gradient(circle, rgba(255, 107, 107, 0.14) 0%, rgba(255, 142, 83, 0.08) 50%, transparent 80%)',
                    filter: 'blur(35px)',
                    zIndex: -1,
                    pointerEvents: 'none'
                  }}
                />

                <motion.div
                  animate={{
                    y: [0, -14, 0],
                    rotate: [-8, 8, -8],
                    rotateY: [0, 20, -20, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                  whileHover={{ scale: 1.25, rotate: 22 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    filter: 'drop-shadow(0 10px 20px rgba(255, 107, 107, 0.5)) drop-shadow(0 3px 6px rgba(255, 142, 83, 0.3))',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  <Feather size={54} color="#FF6B6B" strokeWidth={1.5} />
                </motion.div>

                <h1 style={{
                  fontSize: '2.8rem',
                  lineHeight: 1,
                  marginBottom: '0.35rem',
                  fontWeight: 900,
                  fontFamily: "'Outfit', sans-serif",
                  background: 'linear-gradient(135deg, #3D2B26 0%, #FF6B6B 60%, #FF8E53 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.05em'
                }}>AURA</h1>
                <p style={{ color: '#806C65', fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '0.75rem', marginBottom: '1.2rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Next-Gen Messaging</p>

                <Grid container spacing={1.5} justifyContent="center">
                  <Grid item xs={6}>
                    <motion.div
                      whileHover={{ y: -4, scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <Box sx={{
                        p: 1.5,
                        borderRadius: '12px',
                        background: '#FFF4EE',
                        border: '1px solid rgba(255, 107, 107, 0.25)',
                        color: '#FF6B6B',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(255, 107, 107, 0.08)'
                      }}>
                        <div style={{ fontSize: '1.1rem', marginBottom: '3px' }}>⚡</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>Ultra-Fast</div>
                      </Box>
                    </motion.div>
                  </Grid>
                  <Grid item xs={6}>
                    <motion.div
                      whileHover={{ y: -4, scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <Box sx={{
                        p: 1.5,
                        borderRadius: '12px',
                        background: '#FFEADF',
                        border: '1px solid rgba(255, 142, 83, 0.3)',
                        color: '#1E1B18',
                        textAlign: 'center',
                        boxShadow: '0 2px 8px rgba(255, 142, 83, 0.08)'
                      }}>
                        <div style={{ fontSize: '1.1rem', marginBottom: '3px' }}>🔒</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>Encrypted</div>
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
            background: { xs: '#FFF9F2', md: '#FFFDF9' },
            borderLeft: { xs: 'none', md: '1px solid rgba(61, 43, 38, 0.1)' },
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
              animate={{ y: [0, -16, 0], rotate: [-8, 8, -8], scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              style={{
                position: 'absolute', top: '-20px', left: '-25px',
                opacity: 0.08,
                filter: 'drop-shadow(0 8px 20px rgba(255, 107, 107, 0.4))'
              }}
            >
              <Feather size={200} color="#FF6B6B" strokeWidth={1} />
            </motion.div>
            <motion.div
              animate={{ y: [0, 12, 0], rotate: [8, -8, 8], scale: [1, 1.04, 1] }}
              transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut', delay: 1 }}
              style={{
                position: 'absolute', bottom: '-20px', right: '-25px',
                opacity: 0.06,
                filter: 'drop-shadow(0 8px 20px rgba(255, 142, 83, 0.3))'
              }}
            >
              <Feather size={150} color="#FF8E53" strokeWidth={1} />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
              style={{
                position: 'absolute', bottom: '15%', left: '5%',
                width: 110, height: 110, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255, 142, 83, 0.6), transparent 70%)',
                filter: 'blur(18px)'
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
                maxWidth: '360px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(16px)',
                p: { xs: 3, sm: 4 },
                borderRadius: '20px',
                border: '1px solid rgba(61, 43, 38, 0.08)',
                boxShadow: '0 10px 32px rgba(61, 43, 38, 0.07)',
                position: 'relative',
                zIndex: 1
              }}
            >
              <h1 style={{ fontSize: '1.9rem', marginBottom: '0.15rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: '#3D2B26', letterSpacing: '-0.03em' }}>Welcome Back</h1>
              <Typography variant="body2" sx={{ color: '#806C65', mb: 2.5, fontFamily: "'Inter', sans-serif", fontSize: '0.82rem' }}>
                Sign in to your <strong style={{ color: '#E63946' }}>AURA</strong> account
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
                      color: '#1E1B18',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      '& fieldset': {
                        borderColor: 'rgba(61, 43, 38, 0.15)',
                        borderWidth: '1px'
                      },
                      '&:hover fieldset': {
                        borderColor: '#E63946'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#E63946',
                        borderWidth: '1.5px',
                        boxShadow: '0 4px 12px rgba(230, 57, 70, 0.1)'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#806C65',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.9rem',
                      '&.Mui-focused': {
                        color: '#E63946'
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
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#1E1B18',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      '& fieldset': {
                        borderColor: 'rgba(61, 43, 38, 0.15)',
                        borderWidth: '1px'
                      },
                      '&:hover fieldset': {
                        borderColor: '#E63946'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#E63946',
                        borderWidth: '1.5px',
                        boxShadow: '0 4px 12px rgba(230, 57, 70, 0.1)'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#806C65',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.9rem',
                      '&.Mui-focused': {
                        color: '#E63946'
                      }
                    }
                  }}
                />

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    style={{
                      background: 'linear-gradient(135deg, #E63946 0%, #d62839 100%)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '1rem',
                      padding: '12px',
                      borderRadius: '12px',
                      boxShadow: '0 6px 20px rgba(230, 57, 70, 0.3)'
                    }}
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 1.5, textTransform: 'none' }}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex' }}>
                        <CircularProgress size={24} color="inherit" />
                      </Box>
                    ) : 'Sign In'}
                  </Button>
                </motion.div>

                {/* Official & Fallback Google Sign In Container */}
                <Box sx={{ mb: 2, width: '100%' }}>
                  <div id="googleSignInDiv" style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}></div>
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
                      border: '1px solid #E2E8F0',
                      color: '#1A1D20',
                      fontWeight: 600,
                      borderRadius: '12px',
                      padding: '10px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    Sign in with Google
                  </Button>
                </Box>
                <Grid container spacing={1.5} justifyContent="space-between" alignItems="center" sx={{ mt: 1, mb: 1 }}>
                  <Grid item xs={12} sm="auto">
                    <Link to="/change-password" style={{
                      cursor: "pointer",
                      textDecoration: "none",
                      color: "#E63946",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      fontFamily: "'Inter', sans-serif",
                      transition: "color 0.2s"
                    }}>
                      Forgot password?
                    </Link>
                  </Grid>
                  <Grid item xs={12} sm="auto" sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                    <Typography variant="body2" component="span" sx={{ color: '#806C65', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', mr: 0.5 }}>
                      Don't have an account?
                    </Typography>
                    <Link to="/signup" style={{
                      cursor: "pointer",
                      textDecoration: "none",
                      color: "#E63946",
                      fontSize: "0.875rem",
                      fontWeight: 700,
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