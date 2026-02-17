import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import ActiveTrades from './pages/ActiveTrades';
import ClosedTrades from './pages/ClosedTrades';
import Layout from './components/Layout';

const theme = createTheme({
  palette: {
    primary: {
      main: '#001F3F', // Navy Blue
    },
    secondary: {
      main: '#006400', // Dark Green
    },
    success: {
      main: '#00C853',
    },
    error: {
      main: '#D32F2F',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    return unsubscribe;
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/active-trades" element={<ActiveTrades />} />
                  <Route path="/closed-trades" element={<ClosedTrades />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </ThemeProvider>
  );
}

export default App;