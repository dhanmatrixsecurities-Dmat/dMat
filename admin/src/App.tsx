import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import ActiveTrades from './pages/ActiveTrades';
import ClosedTrades from './pages/ClosedTrades';
import FeedbackPage from './pages/Feedback';
import Portfolio from './pages/Portfolio';
import AdminManagement from './pages/AdminManagement';
import Layout from './components/Layout';

const theme = createTheme({
  palette: {
    primary:   { main: '#001F3F' },
    secondary: { main: '#006400' },
    success:   { main: '#00C853' },
    error:     { main: '#D32F2F' },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthenticated(false);
        setIsAuthorized(false);
        return;
      }

      // Check if this user exists in adminUsers collection
      try {
        const q = query(
          collection(db, 'adminUsers'),
          where('email', '==', user.email),
          where('active', '==', true)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          // Not an admin — force logout immediately
          await signOut(auth);
          setIsAuthenticated(false);
          setIsAuthorized(false);
          alert('Access denied. You are not authorized to access this panel.');
        } else {
          setIsAuthenticated(true);
          setIsAuthorized(true);
        }
      } catch (err) {
        console.error('Admin check failed:', err);
        await signOut(auth);
        setIsAuthenticated(false);
        setIsAuthorized(false);
      }
    });

    return unsubscribe;
  }, []);

  if (isAuthenticated === null || isAuthorized === null) {
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
            isAuthenticated && isAuthorized ? (
              <Layout>
                <Routes>
                  <Route path="/"               element={<Dashboard />} />
                  <Route path="/users"          element={<Users />} />
                  <Route path="/active-trades"  element={<ActiveTrades />} />
                  <Route path="/closed-trades"  element={<ClosedTrades />} />
                  <Route path="/feedback"       element={<FeedbackPage />} />
                  <Route path="/portfolio"      element={<Portfolio />} />
                  <Route path="/manage-admins"  element={<AdminManagement />} />
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
