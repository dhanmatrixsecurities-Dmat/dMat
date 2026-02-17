import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { collection, query, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ClosedTrade } from '../types';

const ClosedTrades: React.FC = () => {
  const [trades, setTrades] = useState<ClosedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'closedTrades'), orderBy('closedAt', 'desc'));
      const snapshot = await getDocs(q);
      const tradesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ClosedTrade[];
      setTrades(tradesData);
    } catch (error) {
      console.error('Error fetching trades:', error);
      showSnackbar('Error fetching trades', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tradeId: string) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      try {
        await deleteDoc(doc(db, 'closedTrades', tradeId));
        showSnackbar('Trade deleted successfully', 'success');
        fetchTrades();
      } catch (error) {
        console.error('Error deleting trade:', error);
        showSnackbar('Error deleting trade', 'error');
      }
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Closed Trades
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Historical trades visible to all users
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Stock</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Entry</strong></TableCell>
                  <TableCell><strong>Exit</strong></TableCell>
                  <TableCell><strong>P/L %</strong></TableCell>
                  <TableCell><strong>Closed</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">No closed trades</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell><strong>{trade.stockName}</strong></TableCell>
                      <TableCell>
                        <Chip
                          label={trade.type}
                          color={trade.type === 'BUY' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>₹{trade.entryPrice.toFixed(2)}</TableCell>
                      <TableCell>₹{trade.exitPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${trade.profitLossPercent > 0 ? '+' : ''}${trade.profitLossPercent.toFixed(2)}%`}
                          color={trade.profitLossPercent > 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(trade.closedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(trade.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClosedTrades;