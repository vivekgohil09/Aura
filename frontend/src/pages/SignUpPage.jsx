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
    document.title = "Aura | Sign Up";
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
        history.push("/");
      }, 3000);
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
      <Grid container component="main" sx={{ 
        minHeight: 'calc(100vh - 80px)', 
        background: '#FFF9F2',
        backgroundImage: 'radial-gradient(at 100% 0%, rgba(255, 232, 220, 0.7) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(255, 107, 107, 0.06) 0px, transparent 50%)'
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
          {/* 3D VFX — Floating Orb Top-Right */}
          <motion.div
            animate={{ y: [0, -18, 0], x: [0, 8, 0], scale: [1, 1.12, 1] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            style={{
              position: 'absolute', top: '6%', right: '8%',
              width: 130, height: 130,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, rgba(255, 107, 107, 0.5), rgba(255, 142, 83, 0.2) 60%, transparent)',
              filter: 'blur(20px)',
              pointerEvents: 'none'
            }}
          />
          {/* 3D VFX — Floating Orb Bottom-Left */}
          <motion.div
            animate={{ y: [0, 16, 0], x: [0, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 2 }}
            style={{
              position: 'absolute', bottom: '8%', left: '6%',
              width: 150, height: 150,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 40%, rgba(255, 142, 83, 0.45), rgba(255, 220, 180, 0.15) 60%, transparent)',
              filter: 'blur(25px)',
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
              width: 400, height: 400,
              borderRadius: '50%',
              border: '1.5px solid rgba(255, 107, 107, 0.1)',
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
              width: 260, height: 260,
              borderRadius: '50%',
              border: '1px dashed rgba(255, 142, 83, 0.15)',
              pointerEvents: 'none'
            }}
          />
          {/* Particle Dots */}
          <motion.div animate={{ y: [0, -12, 0], opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
            style={{ position: 'absolute', top: '20%', left: '15%', width: 9, height: 9, borderRadius: '50%', background: '#FF6B6B', boxShadow: '0 0 14px rgba(255, 107, 107, 0.65)', pointerEvents: 'none' }}
          />
          <motion.div animate={{ y: [0, 10, 0], opacity: [0.5, 0.9, 0.5] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.8 }}
            style={{ position: 'absolute', bottom: '24%', right: '13%', width: 7, height: 7, borderRadius: '50%', background: '#FF8E53', boxShadow: '0 0 10px rgba(255, 142, 83, 0.6)', pointerEvents: 'none' }}
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
                background: 'rgba(255, 255, 255, 0.92)',
                borderRadius: '24px',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 142, 83, 0.15)',
                boxShadow: '0 18px 50px rgba(255, 107, 107, 0.09), 0 6px 16px rgba(61, 43, 38, 0.04)',
                overflow: 'hidden'
              }}>
                {/* Specular Top-edge Shine */}
                <Box sx={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent)', borderRadius: '2px', zIndex: 3 }} />
                {/* 3D Freely Floating Feather */}
                <motion.div
                  animate={{
                    y: [0, -14, 0],
                    rotate: [8, -8, 8],
                    rotateY: [0, -20, 20, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                  whileHover={{ scale: 1.25, rotate: -22 }}
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
                <p style={{ color: '#806C65', fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Create Your Account</p>
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
          {/* Mobile-only: Transparent 3D Feather Background Decoration */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0 }}>
            {/* Large ghost feather top-right */}
            <motion.div
              animate={{ y: [0, -18, 0], rotate: [-6, 6, -6], scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              style={{
                position: 'absolute', top: '-30px', right: '-20px',
                opacity: 0.08,
                filter: 'drop-shadow(0 8px 20px rgba(255, 107, 107, 0.4))'
              }}
            >
              <Feather size={200} color="#FF6B6B" strokeWidth={1} />
            </motion.div>
            {/* Medium ghost feather bottom-left */}
            <motion.div
              animate={{ y: [0, 14, 0], rotate: [10, -10, 10], scale: [1, 1.04, 1] }}
              transition={{ repeat: Infinity, duration: 6.5, ease: 'easeInOut', delay: 1.2 }}
              style={{
                position: 'absolute', bottom: '-20px', left: '-30px',
                opacity: 0.06,
                filter: 'drop-shadow(0 8px 20px rgba(255, 142, 83, 0.3))'
              }}
            >
              <Feather size={150} color="#FF8E53" strokeWidth={1} />
            </motion.div>
            {/* Floating coral glow orb top-left */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.22, 0.12] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              style={{
                position: 'absolute', top: '10%', left: '5%',
                width: 120, height: 120, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255, 107, 107, 0.5), transparent 70%)',
                filter: 'blur(20px)'
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
                boxShadow: '0 10px 32px rgba(73, 49, 41, 0.06)',
                position: 'relative',
                zIndex: 1
              }}
            >
              <h1 style={{ fontSize: '1.9rem', marginBottom: '0.15rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: '#3D2B26', letterSpacing: '-0.03em' }}>Create Account</h1>
              <Typography variant="body2" sx={{ color: '#806C65', mb: 2.5, fontFamily: "'Inter', sans-serif", fontSize: '0.82rem' }}>
                Fill in your details to get started
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
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
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
                  variant="outlined"
                  autoComplete="current-password"
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
                    type="submit"
                    fullWidth
                    variant="contained"
                    style={{
                      background: 'linear-gradient(135deg, #E63946 0%, #d62839 100%)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: '1rem',
                      padding: '12px',
                      borderRadius: '12px',
                      boxShadow: '0 6px 22px rgba(230, 57, 70, 0.3)',
                      textTransform: 'none'
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
                    <Typography variant="body2" component="span" sx={{ color: '#806C65', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', mr: 0.5 }}>
                      Already have an account?
                    </Typography>
                    <Link to="/login" style={{
                      cursor: "pointer",
                      textDecoration: "none",
                      color: "#E63946",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      fontFamily: "'Inter', sans-serif"
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
