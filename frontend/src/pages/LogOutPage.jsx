import * as React from 'react';
import axios from "axios";
import { useState, useEffect } from "react"
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
// import Link from '@mui/material/Link';
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
import { setUserDetails } from "../redux/actions/index";


function Copyright(props) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      Aura{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const theme = createTheme();

export default function LoginPage() {
  useEffect(() => {
    document.title = "Aura | Logout"

  }, [])

  return (
    <ThemeProvider theme={theme}>
      <Grid container component="main" sx={{ 
        minHeight: '100vh', 
        background: '#000e08',
        backgroundImage: 'radial-gradient(at 50% 50%, rgba(36, 120, 109, 0.35) 0px, transparent 60%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}>
        <CssBaseline />
        <Box
          sx={{
            width: '100%',
            maxWidth: '480px',
            p: 5,
            borderRadius: '24px',
            background: 'rgba(0, 14, 8, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h1 className="gradient-text mb-2" style={{ fontSize: '2.5rem', fontWeight: 800 }}>Aura</h1>
          <h2 style={{ fontSize: '1.5rem', color: '#f8fafc', fontWeight: 700, marginBottom: '0.5rem' }}>
            You are Logged Out
          </h2>
          <Typography variant="body1" sx={{ color: '#94a3b8', mb: 3 }}>
            Thank you for using <strong>Aura</strong>.
          </Typography>

          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
              Have feedback?{' '}
              <Link style={{ color: '#20A090', fontWeight: 600 }} to="/review-page">
                Click here
              </Link>
            </Typography>

            <Link to="/login" style={{ textDecoration: 'none', width: '100%' }}>
              <Button
                fullWidth
                variant="contained"
                style={{
                  background: 'linear-gradient(135deg, #24786D 0%, #20A090 100%)',
                  fontWeight: 600,
                  fontSize: '1rem',
                  padding: '12px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 20px rgba(36, 120, 109, 0.35)'
                }}
              >
                Sign In
              </Button>
            </Link>
            <Copyright sx={{ mt: 4, color: '#64748b' }} />
          </Box>
        </Box>
      </Grid>
    </ThemeProvider>
  );
}