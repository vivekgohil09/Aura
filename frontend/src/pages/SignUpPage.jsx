import * as React from 'react';
import axios from "axios";
import { useState, useEffect } from "react";
import Avatar from '@mui/material/Avatar';
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
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch } from "react-redux";
import { setUserDetails } from "../redux/actions/index";
import { motion } from "framer-motion";
import { Feather } from "lucide-react";
import * as THREE from 'three';

// ── Modern Minimal White Luxury Ambient VFX Background Component (SignUpPage) ──
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
      {/* Top Right Golden Warm Radial */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.35, 0.6, 0.35],
          x: [0, -25, 0],
          y: [0, 20, 0]
        }}
        transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-80px',
          width: '540px',
          height: '540px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91, 95, 239, 0.18) 0%, rgba(128, 103, 232, 0.06) 60%, transparent 80%)',
          filter: 'blur(55px)'
        }}
      />
      {/* Bottom Left Subtle Aura Violet Orb */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 25, 0],
          y: [0, -20, 0]
        }}
        transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut', delay: 1.5 }}
        style={{
          position: 'absolute',
          bottom: '-120px',
          left: '-80px',
          width: '560px',
          height: '560px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(128, 103, 232, 0.16) 0%, rgba(91, 95, 239, 0.05) 60%, transparent 80%)',
          filter: 'blur(60px)'
        }}
      />
    </Box>
  );
}

const theme = createTheme();

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pic, setPic] = useState("");
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const dispatch = useDispatch();

  useEffect(() => {
    document.title = "Aura — Create Account";
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    if (!name || !email || !password) {
      toast.warning('Please Fill all the fields!', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        theme: 'colored'
      });
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: { "Content-type": "application/json" },
      };
      const { data } = await axios.post(
        `/api/user/register`,
        { name, email, password, pic },
        config
      );

      toast.success("Account Created Successfully!", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        theme: 'colored'
      });

      if (data.userLogin && data.token) {
        localStorage.setItem("userInfo", JSON.stringify(data.userLogin));
        localStorage.setItem("jwt", data.token);
        dispatch(setUserDetails(data.userLogin));
      } else if (data._id && data.token) {
        const userInfo = {
          _id: data._id,
          name: data.name,
          email: data.email,
          pic: data.pic,
          isAdmin: data.isAdmin,
          token: data.token
        };
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
        localStorage.setItem("jwt", data.token);
        dispatch(setUserDetails(userInfo));
      }

      setLoading(false);
      setTimeout(() => {
        history.push("/chats");
      }, 1500);
    } catch (error) {
      const errorMessage = error.response && error.response.data && (error.response.data.message || error.response.data)
        ? (typeof error.response.data === 'string' ? error.response.data : error.response.data.message)
        : 'Registration failed. Please try again.';

      if (!toast.isActive("signup-error-toast")) {
        toast.error(errorMessage, {
          toastId: "signup-error-toast",
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
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
        background: 'var(--aura-ivory, #FCFBF7)',
        backgroundImage: 'radial-gradient(at 10% 10%, rgba(91, 95, 239, 0.08) 0px, transparent 55%), radial-gradient(at 90% 90%, rgba(128, 103, 232, 0.06) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(255, 255, 255, 0.8) 0px, transparent 100%)'
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
          {/* 3D VFX — Floating Orb Top-Right */}
          <motion.div
            animate={{ y: [0, -18, 0], x: [0, 8, 0], scale: [1, 1.12, 1] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            style={{
              position: 'absolute', top: '6%', right: '8%',
              width: 140, height: 140,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, rgba(91, 95, 239, 0.2), rgba(128, 103, 232, 0.05) 60%, transparent)',
              filter: 'blur(22px)',
              pointerEvents: 'none'
            }}
          />
          {/* 3D VFX — Floating Orb Bottom-Left */}
          <motion.div
            animate={{ y: [0, 16, 0], x: [0, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 2 }}
            style={{
              position: 'absolute', bottom: '8%', left: '6%',
              width: 170, height: 170,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 40%, rgba(23, 24, 39, 0.04), rgba(91, 95, 239, 0.08) 60%, transparent)',
              filter: 'blur(28px)',
              pointerEvents: 'none'
            }}
          />
          {/* 3D VFX — Outer Rotating Ring */}
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 420, height: 420,
              borderRadius: '50%',
              border: '1.5px solid rgba(91, 95, 239, 0.16)',
              pointerEvents: 'none'
            }}
          />
          {/* 3D VFX — Inner Dashed Ring */}
          <motion.div
            animate={{ rotate: [360, 0] }}
            transition={{ repeat: Infinity, duration: 14, ease: "linear" }}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 280, height: 280,
              borderRadius: '50%',
              border: '1px dashed rgba(128, 103, 232, 0.2)',
              pointerEvents: 'none'
            }}
          />
          {/* Particle Dots */}
          <motion.div animate={{ y: [0, -12, 0], opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
            style={{ position: 'absolute', top: '20%', left: '15%', width: 9, height: 9, borderRadius: '50%', background: '#5B5FEF', boxShadow: '0 0 14px rgba(91, 95, 239, 0.6)', pointerEvents: 'none' }}
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
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '28px',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1px solid rgba(23, 24, 39, 0.06)',
                boxShadow: '0 20px 60px rgba(23, 24, 39, 0.04), 0 0 25px rgba(91, 95, 239, 0.08)',
                overflow: 'hidden'
              }}>
                <Box sx={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px', background: 'linear-gradient(90deg, transparent, #5B5FEF, transparent)', borderRadius: '2px', zIndex: 3 }} />
                
                <motion.div
                  animate={{
                    y: [0, -14, 0],
                    rotate: [8, -8, 8],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                  whileHover={{ scale: 1.25, rotate: -22 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    width: '68px',
                    height: '68px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                    boxShadow: '0 10px 30px rgba(91, 95, 239, 0.35)'
                  }}
                >
                  <Feather size={36} color="#FFFFFF" strokeWidth={2.2} />
                </motion.div>

                <h1 style={{
                  fontSize: '2.8rem',
                  lineHeight: 1,
                  marginBottom: '0.35rem',
                  fontWeight: 900,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: '#171827',
                  letterSpacing: '-0.03em'
                }}>AURA</h1>
                <p style={{ color: '#5B5FEF', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Join The Living Network</p>
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
            borderLeft: { xs: 'none', md: '1px solid rgba(23, 24, 39, 0.06)' },
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
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              style={{
                position: 'absolute', top: '10%', left: '5%',
                width: 140, height: 140, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(91, 95, 239, 0.3), transparent 70%)',
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
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                p: { xs: 3.5, sm: 4.5 },
                borderRadius: '28px',
                border: '1px solid rgba(23, 24, 39, 0.06)',
                boxShadow: '0 20px 50px rgba(23, 24, 39, 0.04), 0 0 20px rgba(91, 95, 239, 0.06)',
                position: 'relative',
                zIndex: 1
              }}
            >
              <h1 style={{ fontSize: '2.1rem', marginBottom: '0.25rem', fontWeight: 900, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#171827', letterSpacing: '-0.03em' }}>Create Account</h1>
              <Typography variant="body2" sx={{ color: '#727486', mb: 3, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.88rem' }}>
                Fill in your details to join <strong style={{ color: '#5B5FEF' }}>AURA</strong>
              </Typography>
              <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Your Name"
                  name="name"
                  autoComplete="name"
                  autoFocus
                  variant="outlined"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#171827',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 600,
                      '& fieldset': {
                        borderColor: 'rgba(23, 24, 39, 0.08)',
                        borderWidth: '1.5px'
                      },
                      '&:hover fieldset': {
                        borderColor: '#5B5FEF'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#5B5FEF',
                        borderWidth: '2px',
                        boxShadow: '0 4px 16px rgba(91, 95, 239, 0.15)'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#727486',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      '&.Mui-focused': {
                        color: '#5B5FEF'
                      }
                    }
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#171827',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 600,
                      '& fieldset': {
                        borderColor: 'rgba(23, 24, 39, 0.08)',
                        borderWidth: '1.5px'
                      },
                      '&:hover fieldset': {
                        borderColor: '#5B5FEF'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#5B5FEF',
                        borderWidth: '2px',
                        boxShadow: '0 4px 16px rgba(91, 95, 239, 0.15)'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#727486',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      '&.Mui-focused': {
                        color: '#5B5FEF'
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
                  variant="outlined"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#171827',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 600,
                      '& fieldset': {
                        borderColor: 'rgba(23, 24, 39, 0.08)',
                        borderWidth: '1.5px'
                      },
                      '&:hover fieldset': {
                        borderColor: '#5B5FEF'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#5B5FEF',
                        borderWidth: '2px',
                        boxShadow: '0 4px 16px rgba(91, 95, 239, 0.15)'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#727486',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      '&.Mui-focused': {
                        color: '#5B5FEF'
                      }
                    }
                  }}
                />

                <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    style={{
                      background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 800,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '1rem',
                      padding: '14px',
                      borderRadius: '16px',
                      boxShadow: '0 10px 28px rgba(91, 95, 239, 0.28)',
                      textTransform: 'none',
                      letterSpacing: '0.04em'
                    }}
                    sx={{ mt: 3, mb: 2 }}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex' }}>
                        <CircularProgress size={24} color="inherit" />
                      </Box>
                    ) : 'Sign Up'}
                  </Button>
                </motion.div>

                <Grid container justifyContent="center" alignItems="center" sx={{ mt: 1, mb: 1 }}>
                  <Grid item xs={12} sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" component="span" sx={{ color: '#727486', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.875rem', mr: 0.5 }}>
                      Already have an account?
                    </Typography>
                    <Link to="/login" style={{
                      cursor: "pointer",
                      textDecoration: "none",
                      color: "#5B5FEF",
                      fontSize: "0.875rem",
                      fontWeight: 800,
                      fontFamily: "'Plus Jakarta Sans', sans-serif"
                    }}>
                      Sign In
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
