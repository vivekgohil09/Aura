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
      <Grid container component="main" sx={{ 
        minHeight: 'calc(100vh - 80px)', 
        background: '#FFF9F2',
        backgroundImage: 'radial-gradient(at 100% 0%, rgba(255, 232, 220, 0.7) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(255, 107, 107, 0.06) 0px, transparent 50%)',
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
              background: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(16px)',
              p: { xs: 3.5, sm: 4.5 },
              borderRadius: '20px',
              border: '1px solid rgba(61, 43, 38, 0.08)',
              boxShadow: '0 10px 32px rgba(73, 49, 41, 0.06)'
            }}
          >
            <motion.div
              whileHover={{ rotate: 12, scale: 1.1 }}
              style={{ width: '60px', height: '60px', marginBottom: '1rem' }}
            >
              <Box sx={{
                width: '100%',
                height: '100%',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #FFF0F2 0%, #FFE3E6 100%)',
                border: '1px solid #FFE3E6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(230, 57, 70, 0.12)'
              }}>
                <span style={{ fontSize: '1.75rem', color: '#E63946' }}>🔑</span>
              </Box>
            </motion.div>

            <h1 style={{
              fontSize: '2.4rem',
              lineHeight: 1,
              marginBottom: '0.4rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #E63946 0%, #d62839 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-0.03em',
              fontFamily: "'Outfit', sans-serif"
            }}>
              {emailPres ? "New Password" : "Forgot Password"}
            </h1>

            <Typography variant="body2" sx={{ color: '#806C65', mb: 3, textAlign: 'center', fontFamily: "'Inter', sans-serif" }}>
              {emailPres 
                ? "Enter your new password below" 
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
                    color: '#1E1B18',
                    backgroundColor: emailPres ? '#F4F3EF' : '#FFFFFF',
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
              )}

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  style={{
                    background: 'linear-gradient(135deg, #E63946 0%, #d62839 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '1rem',
                    padding: '12px',
                    borderRadius: '12px',
                    boxShadow: '0 6px 20px rgba(230, 57, 70, 0.3)',
                    textTransform: 'none'
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
                    emailPres ? "Update Password" : "Next"
                  )}
                </Button>
              </motion.div>

              <Grid container spacing={1} justifyContent="center" alignItems="center" sx={{ mt: 1.5, textAlign: 'center' }}>
                <Grid item xs={12}>
                  <Link to="/login" style={{
                    cursor: "pointer",
                    textDecoration: "none",
                    color: "#E63946",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    Already have an account? Sign In
                  </Link>
                </Grid>
                <Grid item xs={12} sx={{ mt: 0.5 }}>
                  <Typography variant="body2" component="span" sx={{ color: '#806C65', fontSize: '0.875rem', mr: 0.5, fontFamily: "'Inter', sans-serif" }}>
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
    </ThemeProvider>
  );
}