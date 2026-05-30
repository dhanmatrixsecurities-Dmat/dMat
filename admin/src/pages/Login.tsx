import React, { useState } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { Lock } from '@mui/icons-material';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your admin email address first, then click Forgot Password.');
      return;
    }

    // Only allow password reset for admin accounts (@dhanmatrix.com or @dhanmatrix.in)
    if (!email.endsWith('@dhanmatrix.com') && !email.endsWith('@dhanmatrix.in')) {
      setError('Password reset is only available for admin accounts. Members must contact their administrator.');
      return;
    }

    setResetLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No admin account found with this email.');
      } else {
        setError(err.message || 'Failed to send reset email.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <Lock sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Stock Advisory
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Admin Panel
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {resetSent && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Password reset email sent to <strong>{email}</strong>. Check your inbox and follow the link to reset your password.
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 1 }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            {/* Forgot Password — admin only */}
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Button
                variant="text"
                size="small"
                disabled={resetLoading}
                onClick={handleForgotPassword}
                sx={{ color: 'text.secondary', fontSize: '0.8rem', textTransform: 'none' }}
              >
                {resetLoading ? 'Sending reset email...' : 'Forgot Password? (Admin only)'}
              </Button>
            </Box>
          </form>

          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              <strong>Note:</strong> Admin access only. Contact your administrator for credentials.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
