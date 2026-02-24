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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, Close as CloseIcon } from '@mui/icons-material';
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ActiveTrade } from '../types';

const ActiveTrades: React.FC = () => {
  const [trades, setTrades] = useState<ActiveTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<ActiveTrade | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [tradeToClose, setTradeToClose] = useState<ActiveTrade | null>(null);
  const [exitPrice, setExitPrice] = useState('');
  const [formData, setFormData] = useState({
    stockName: '',
    type: 'BUY' as 'BUY' | 'SELL',
    entryPrice: '',
    targetPrice: '',
    stopLoss: '',
    segment: 'equity' as 'equity' | 'futures' | 'options',
  });
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
      const q = query(collection(db, 'activeTrades'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const tradesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ActiveTrade[];
      setTrades(tradesData);
    } catch (error) {
      console.error('Error fetching trades:', error);
      showSnackbar('Error fetching trades', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (trade?: ActiveTrade) => {
    if (trade) {
      setEditingTrade(trade);
      setFormData({
        stockName: trade.stockName,
        type: trade.type,
        entryPrice: trade.entryPrice.toString(),
        targetPrice: trade.targetPrice.toString(),
        stopLoss: trade.stopLoss.toString(),
        segment: (trade as any).segment || 'equity',
      });
    } else {
      setEditingTrade(null);
      setFormData({
        stockName: '',
        type: 'BUY',
        entryPrice: '',
        targetPrice: '',
        stopLoss: '',
        segment: 'equity',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTrade(null);
  };

  const handleSubmit = async () => {
    try {
      const tradeData = {
        stockName: formData.stockName.toUpperCase(),
        type: formData.type,
        entryPrice: parseFloat(formData.entryPrice),
        targetPrice: parseFloat(formData.targetPrice),
        stopLoss: parseFloat(formData.stopLoss),
        segment: formData.segment,
        status: 'Active',
        createdAt: new Date().toISOString(),
      };

      if (editingTrade) {
        await updateDoc(doc(db, 'activeTrades', editingTrade.id), tradeData);
        showSnackbar('Trade updated successfully', 'success');
      } else {
        await addDoc(collection(db, 'activeTrades'), tradeData);
        showSnackbar('Trade added successfully', 'success');
      }

      handleCloseDialog();
      fetchTrades();
    } catch (error) {
      console.error('Error saving trade:', error);
      showSnackbar('Error saving trade', 'error');
    }
  };

  const handleDelete = async (tradeId: string) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      try {
        await deleteDoc(doc(db, 'activeTrades', tradeId));
        showSnackbar('Trade deleted successfully', 'success');
        fetchTrades();
      } catch (error) {
        console.error('Error deleting trade:', error);
        showSnackbar('Error deleting trade', 'error');
      }
    }
  };

  const handleOpenCloseDialog = (trade: ActiveTrade) => {
    setTradeToClose(trade);
    setExitPrice('');
    setCloseDialogOpen(true);
  };

  const handleCloseTrade = async () => {
    if (!tradeToClose || !exitPrice) return;

    try {
      const exitPriceNum = parseFloat(exitPrice);
      const profitLossPercent =
        ((exitPriceNum - tradeToClose.entryPrice) / tradeToClose.entryPrice) * 100;

      await addDoc(collection(db, 'closedTrades'), {
        stockName: tradeToClose.stockName,
        type: tradeToClose.type,
        segment: (tradeToClose as any).segment || 'equity',
        entryPrice: tradeToClose.entryPrice,
        exitPrice: exitPriceNum,
        profitLossPercent: parseFloat(profitLossPercent.toFixed(2)),
        closedAt: new Date().toISOString(),
      });

      await deleteDoc(doc(db, 'activeTrades', tradeToClose.id));

      showSnackbar('Trade closed successfully', 'success');
      setCloseDialogOpen(false);
      setTradeToClose(null);
      fetchTrades();
    } catch (error) {
      console.error('Error closing trade:', error);
      showSnackbar('Error closing trade', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const segmentColor = (segment: string) => {
    if (segment === 'futures') return 'warning';
    if (segment === 'options') return 'secondary';
    return 'primary';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Active Trades
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage live trades for ACTIVE users
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Trade
        </Button>
      </Box>

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
                  <TableCell><strong>Segment</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Entry</strong></TableCell>
                  <TableCell><strong>Target</strong></TableCell>
                  <TableCell><strong>Stop Loss</strong></TableCell>
                  <TableCell><strong>Created</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">No active trades</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell><strong>{trade.stockName}</strong></TableCell>
                      <TableCell>
                        <Chip
                          label={((trade as any).segment || 'equity').toUpperCase()}
                          color={segmentColor((trade as any).segment || 'equity')}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={trade.type}
                          color={trade.type === 'BUY' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>₹{trade.entryPrice.toFixed(2)}</TableCell>
                      <TableCell>₹{trade.targetPrice.toFixed(2)}</TableCell>
                      <TableCell>₹{trade.stopLoss.toFixed(2)}</TableCell>
                      <TableCell>
                        {new Date(trade.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleOpenDialog(trade)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleOpenCloseDialog(trade)}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTrade ? 'Edit Trade' : 'Add New Trade'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Stock Name (NSE)"
            value={formData.stockName}
            onChange={(e) => setFormData({ ...formData, stockName: e.target.value })}
            margin="normal"
            placeholder="e.g., RELIANCE, TCS, INFY"
          />

          {/* ── SEGMENT DROPDOWN ── */}
          <TextField
            fullWidth
            select
            label="Segment"
            value={formData.segment}
            onChange={(e) =>
              setFormData({ ...formData, segment: e.target.value as 'equity' | 'futures' | 'options' })
            }
            margin="normal"
          >
            <MenuItem value="equity">Equity</MenuItem>
            <MenuItem value="futures">Futures (F&O)</MenuItem>
            <MenuItem value="options">Options (F&O)</MenuItem>
          </TextField>

          <TextField
            fullWidth
            select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'BUY' | 'SELL' })}
            margin="normal"
          >
            <MenuItem value="BUY">BUY</MenuItem>
            <MenuItem value="SELL">SELL</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Entry Price"
            type="number"
            value={formData.entryPrice}
            onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Target Price"
            type="number"
            value={formData.targetPrice}
            onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Stop Loss"
            type="number"
            value={formData.stopLoss}
            onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTrade ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Close Trade Dialog */}
      <Dialog open={closeDialogOpen} onClose={() => setCloseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Close Trade</DialogTitle>
        <DialogContent>
          {tradeToClose && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Closing trade for <strong>{tradeToClose.stockName}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Entry Price: ₹{tradeToClose.entryPrice.toFixed(2)}
              </Typography>
              <TextField
                fullWidth
                label="Exit Price"
                type="number"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                margin="normal"
                autoFocus
              />
              {exitPrice && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Profit/Loss:{' '}
                  <strong>
                    {(
                      ((parseFloat(exitPrice) - tradeToClose.entryPrice) /
                        tradeToClose.entryPrice) *
                      100
                    ).toFixed(2)}
                    %
                  </strong>
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCloseTrade} variant="contained" color="success">
            Close Trade
          </Button>
        </DialogActions>
      </Dialog>

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

export default ActiveTrades;
