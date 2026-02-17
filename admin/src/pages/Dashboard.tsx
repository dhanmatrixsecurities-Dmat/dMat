import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import {
  People,
  TrendingUp,
  CheckCircle,
  PersonAdd,
} from '@mui/icons-material';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface Stats {
  totalUsers: number;
  freeUsers: number;
  activeUsers: number;
  blockedUsers: number;
  activeTrades: number;
  closedTrades: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    freeUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    activeTrades: 0,
    closedTrades: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => doc.data());

      const freeUsers = users.filter(u => u.status === 'FREE').length;
      const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
      const blockedUsers = users.filter(u => u.status === 'BLOCKED').length;

      // Fetch active trades
      const activeTradesSnapshot = await getDocs(collection(db, 'activeTrades'));

      // Fetch closed trades
      const closedTradesSnapshot = await getDocs(collection(db, 'closedTrades'));

      setStats({
        totalUsers: users.length,
        freeUsers,
        activeUsers,
        blockedUsers,
        activeTrades: activeTradesSnapshot.size,
        closedTrades: closedTradesSnapshot.size,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#001F3F',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: <PersonAdd sx={{ fontSize: 40 }} />,
      color: '#00C853',
    },
    {
      title: 'Active Trades',
      value: stats.activeTrades,
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: '#FF6F00',
    },
    {
      title: 'Closed Trades',
      value: stats.closedTrades,
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: '#006400',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Overview of your stock advisory platform
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {loading ? '...' : card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              User Distribution
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>FREE Users</Typography>
                <Typography fontWeight="bold">{stats.freeUsers}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>ACTIVE Users</Typography>
                <Typography fontWeight="bold" color="success.main">{stats.activeUsers}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>BLOCKED Users</Typography>
                <Typography fontWeight="bold" color="error.main">{stats.blockedUsers}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Manage user access levels from the Users page
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Add new trades from Active Trades page
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Close trades to move them to Closed Trades
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Monitor user activity and trade performance
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;