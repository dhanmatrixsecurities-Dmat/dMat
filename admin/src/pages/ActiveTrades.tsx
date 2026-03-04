import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp, getDoc,
} from 'firebase/firestore';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField,
  Select, MenuItem, FormControl, InputLabel, Button,
  IconButton, Alert, Snackbar, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Add, Edit, Delete, Close } from '@mui/icons-material';

type Segment = 'Equity' | 'Futures' | 'Options';
type ActionType = 'BUY' | 'SELL';
type OptionType = 'CE' | 'PE';

interface Trade {
  stockName?: string; // old field name
  id: string;
  symbol?: string;
  segment: Segment;
  action?: ActionType;
  type?: ActionType; // old field name
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  lotSize?: number;
  expiryDate?: string;
  strikePrice?: number;
  optionType?: OptionType;
  duration?: string;
  status: string;
  createdAt: any;
}

const emptyForm = {
  symbol: '',
  segment: 'Equity' as Segment,
  action: 'BUY' as ActionType,
  entryPrice: '',
  targetPrice: '',
  stopLoss: '',
  lotSize: '',
  expiryDate: '',
  strikePrice: '',
  optionType: 'CE' as OptionType,
  duration: '',
};

export default function AdminActiveTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Close trade dialog
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [tradeToClose, setTradeToClose] = useState<Trade | null>(null);
  const [exitPrice, setExitPrice] = useState('');

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // ✅ Listen to activeTrades collection (not 'trades')
  useEffect(() => {
    const q = query(collection(db, 'activeTrades'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setTrades(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trade)));
    });
    return unsub;
  }, []);

  const isFutOpt = form.segment === 'Futures' || form.segment === 'Options';
  const isOptions = form.segment === 'Options';

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleEdit = (trade: Trade) => {
    setEditId(trade.id);
    setForm({
      symbol: trade.symbol || trade.stockName || '',
      segment: trade.segment,
      action: trade.action || trade.type || 'BUY' as ActionType,
      entryPrice: String(trade.entryPrice),
      targetPrice: String(trade.targetPrice),
      stopLoss: String(trade.stopLoss),
      lotSize: trade.lotSize ? String(trade.lotSize) : '',
      expiryDate: trade.expiryDate || '',
      strikePrice: trade.strikePrice ? String(trade.strikePrice) : '',
      optionType: trade.optionType || 'CE',
      duration: trade.duration || '',
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        symbol: form.symbol.toUpperCase(),
        // ✅ Also save as stockName for mobile app compatibility
        stockName: form.symbol.toUpperCase(),
        segment: form.segment.toLowerCase(),
        // ✅ Also save as type for mobile app compatibility
        type: form.action,
        action: form.action,
        entryPrice: parseFloat(form.entryPrice),
        targetPrice: parseFloat(form.targetPrice),
        stopLoss: parseFloat(form.stopLoss),
        status: 'active',
      };

      if (isFutOpt && form.lotSize) payload.lotSize = parseInt(form.lotSize);
      if (isFutOpt && form.expiryDate) payload.expiryDate = form.expiryDate;
      if (isFutOpt && form.duration) payload.duration = form.duration;
      if (isOptions && form.strikePrice) payload.strikePrice = parseFloat(form.strikePrice);
      if (isOptions) payload.optionType = form.optionType;

      if (editId) {
        // ✅ Update in activeTrades
        await updateDoc(doc(db, 'activeTrades', editId), payload);
        showSnackbar('Trade updated!', 'success');
      } else {
        // ✅ Add to activeTrades
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'activeTrades'), payload);
        showSnackbar('Trade added!', 'success');
      }
      handleCloseModal();
    } catch (err) {
      showSnackbar('Error saving trade', 'error');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this trade?')) return;
    // ✅ Delete from activeTrades
    await deleteDoc(doc(db, 'activeTrades', id));
    showSnackbar('Trade deleted', 'success');
  };

  // ✅ Open close trade dialog
  const handleOpenCloseDialog = (trade: Trade) => {
    setTradeToClose(trade);
    setExitPrice('');
    setCloseDialogOpen(true);
  };

  // ✅ Close trade: move from activeTrades → closedTrades
  const handleCloseTrade = async () => {
    if (!tradeToClose || !exitPrice) return;
    setLoading(true);
    try {
      const exitPriceNum = parseFloat(exitPrice);
      const profitLossPercent = ((exitPriceNum - tradeToClose.entryPrice) / tradeToClose.entryPrice) * 100;

      // Add to closedTrades
      await addDoc(collection(db, 'closedTrades'), {
        stockName: tradeToClose.symbol || tradeToClose.stockName || '',
        symbol: tradeToClose.symbol || tradeToClose.stockName || '',
        type: tradeToClose.action || tradeToClose.type || 'BUY',
        action: tradeToClose.action || tradeToClose.type || 'BUY',
        segment: tradeToClose.segment.toLowerCase(),
        entryPrice: tradeToClose.entryPrice,
        exitPrice: exitPriceNum,
        profitLossPercent: parseFloat(profitLossPercent.toFixed(2)),
        lotSize: tradeToClose.lotSize || null,
        expiryDate: tradeToClose.expiryDate || null,
        strikePrice: tradeToClose.strikePrice || null,
        optionType: tradeToClose.optionType || null,
        closedAt: new Date().toISOString(),
      });

      // Remove from activeTrades
      await deleteDoc(doc(db, 'activeTrades', tradeToClose.id));

      showSnackbar('Trade closed successfully!', 'success');
      setCloseDialogOpen(false);
      setTradeToClose(null);
      setExitPrice('');
    } catch (err) {
      showSnackbar('Error closing trade', 'error');
    }
    setLoading(false);
  };

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getSegmentColor = (segment: string) => {
    const s = segment?.toLowerCase();
    if (s === 'options') return '#7b1fa2';
    if (s === 'futures') return '#1565c0';
    return '#2e7d32';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Active Trades</Typography>
          <Typography variant="body1" color="text.secondary">Manage live trades for ACTIVE users</Typography>
        </Box>
        <Button
          variant="contained" startIcon={<Add />} onClick={handleOpenAdd}
          sx={{ backgroundColor: '#1a237e', mt: 1, borderRadius: 2, px: 3 }}
        >
          ADD TRADE
        </Button>
      </Box>

      {/* Trade Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Trades</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['Stock', 'Segment', 'Type', 'Entry', 'Target', 'Stop Loss', 'Details', 'Created', 'Actions'].map((h) => (
                  <TableCell key={h}><strong>{h}</strong></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {trades.map((trade) => (
                <TableRow key={trade.id} hover>
                  <TableCell><strong>{trade.stockName || trade.symbol}</strong></TableCell>
                  <TableCell>
                    <Chip size="small" label={(trade.segment || 'equity').toUpperCase()}
                      sx={{ backgroundColor: getSegmentColor(trade.segment), color: '#fff', fontWeight: 'bold', fontSize: 11 }} />
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={trade.action || trade.type}
                      sx={{ backgroundColor: ( trade.action || trade.type) === 'BUY' ? '#2e7d32' : '#c62828', color: '#fff', fontWeight: 'bold', fontSize: 11 }} />
                  </TableCell>
                  <TableCell>₹{trade.entryPrice}</TableCell>
                  <TableCell sx={{ color: 'green', fontWeight: 'bold' }}>₹{trade.targetPrice}</TableCell>
                  <TableCell sx={{ color: 'red', fontWeight: 'bold' }}>₹{trade.stopLoss}</TableCell>
                  <TableCell>
                    {trade.strikePrice && (
                      <Typography variant="caption" display="block">Strike: ₹{trade.strikePrice} {trade.optionType}</Typography>
                    )}
                    {trade.expiryDate && (
                      <Typography variant="caption" display="block" color="text.secondary">Expiry: {trade.expiryDate}</Typography>
                    )}
                    {trade.lotSize && (
                      <Typography variant="caption" display="block" color="text.secondary">Lot: {trade.lotSize}</Typography>
                    )}
                    {trade.duration && (
                      <Typography variant="caption" display="block" color="text.secondary">{trade.duration}</Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(trade.createdAt)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <IconButton size="small" color="primary" onClick={() => handleEdit(trade)}><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" color="warning" onClick={() => handleOpenCloseDialog(trade)}><Close fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(trade.id)}><Delete fontSize="small" /></IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {trades.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>No active trades found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── ADD / EDIT MODAL ── */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: 22 }}>
          {editId ? 'Edit Trade' : 'Add New Trade'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            <TextField fullWidth label="Stock Name (NSE)" required placeholder="e.g. RELIANCE, NIFTY"
              value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} sx={{ mb: 2 }} />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Segment</InputLabel>
              <Select label="Segment" value={form.segment}
                onChange={(e) => setForm({ ...form, segment: e.target.value as Segment })}>
                <MenuItem value="Equity">Equity</MenuItem>
                <MenuItem value="Futures">Futures</MenuItem>
                <MenuItem value="Options">Options</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={form.action}
                onChange={(e) => setForm({ ...form, action: e.target.value as ActionType })}>
                <MenuItem value="BUY">BUY</MenuItem>
                <MenuItem value="SELL">SELL</MenuItem>
              </Select>
            </FormControl>

            <TextField fullWidth label="Entry Price" required type="number"
              value={form.entryPrice} onChange={(e) => setForm({ ...form, entryPrice: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Target Price" required type="number"
              value={form.targetPrice} onChange={(e) => setForm({ ...form, targetPrice: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Stop Loss" required type="number"
              value={form.stopLoss} onChange={(e) => setForm({ ...form, stopLoss: e.target.value })} sx={{ mb: 2 }} />

            {isFutOpt && (
              <Box sx={{ backgroundColor: '#e8f4fd', border: '1px solid #90caf9', borderRadius: 2, p: 2, mb: 2 }}>
                <Typography variant="caption" fontWeight="bold" color="primary"
                  sx={{ textTransform: 'uppercase', display: 'block', mb: 2 }}>
                  {form.segment} Fields
                </Typography>
                <TextField fullWidth label="Lot Size" type="number" size="small"
                  value={form.lotSize} onChange={(e) => setForm({ ...form, lotSize: e.target.value })} sx={{ mb: 2 }} />
                <TextField fullWidth label="Expiry Date" type="date" size="small"
                  value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />
                <TextField fullWidth label="Duration" size="small" placeholder="e.g. Weekly"
                  value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  sx={{ mb: isOptions ? 2 : 0 }} />
                {isOptions && (
                  <>
                    <TextField fullWidth label="Strike Price" type="number" size="small"
                      value={form.strikePrice} onChange={(e) => setForm({ ...form, strikePrice: e.target.value })} sx={{ mb: 2 }} />
                    <FormControl fullWidth size="small">
                      <InputLabel>Option Type</InputLabel>
                      <Select label="Option Type" value={form.optionType}
                        onChange={(e) => setForm({ ...form, optionType: e.target.value as OptionType })}>
                        <MenuItem value="CE">CE — Call</MenuItem>
                        <MenuItem value="PE">PE — Put</MenuItem>
                      </Select>
                    </FormControl>
                  </>
                )}
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={handleCloseModal} variant="outlined">CANCEL</Button>
            <Button type="submit" variant="contained" disabled={loading}
              sx={{ backgroundColor: '#1a237e', px: 4 }}>
              {loading ? <CircularProgress size={20} color="inherit" /> : editId ? 'UPDATE' : 'ADD'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ── CLOSE TRADE DIALOG ── */}
      <Dialog open={closeDialogOpen} onClose={() => setCloseDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="bold">Close Trade</DialogTitle>
        <DialogContent>
          {tradeToClose && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Closing <strong>{tradeToClose.stockName || tradeToClose.symbol}</strong> | Entry: ₹{tradeToClose.entryPrice}
              </Typography>
              <TextField fullWidth label="Exit Price" type="number" value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)} sx={{ mt: 2 }} autoFocus />
              {exitPrice && (
                <Alert severity={parseFloat(exitPrice) >= tradeToClose.entryPrice ? 'success' : 'error'} sx={{ mt: 2 }}>
                  P&L: <strong>
                    {(((parseFloat(exitPrice) - tradeToClose.entryPrice) / tradeToClose.entryPrice) * 100).toFixed(2)}%
                  </strong>
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCloseDialogOpen(false)} variant="outlined">CANCEL</Button>
          <Button onClick={handleCloseTrade} variant="contained" color="success" disabled={!exitPrice || loading}>
            {loading ? <CircularProgress size={20} color="inherit" /> : 'CLOSE TRADE'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
