import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField,
  Select, MenuItem, FormControl, InputLabel, Button,
  IconButton, Alert, Snackbar, CircularProgress, Divider,
} from '@mui/material';
import { Add, Edit, Delete, Close } from '@mui/icons-material';

type TradeType = 'Equity' | 'Futures' | 'Options';
type Action = 'BUY' | 'SELL';
type OptionType = 'CE' | 'PE';

interface Trade {
  id: string;
  symbol: string;
  tradeType: TradeType;
  action: Action;
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
  tradeType: 'Equity' as TradeType,
  action: 'BUY' as Action,
  entryPrice: '',
  targetPrice: '',
  stopLoss: '',
  lotSize: '',
  expiryDate: '',
  strikePrice: '',
  optionType: 'CE' as OptionType,
  duration: '',
  status: 'active',
};

const inputSx = { mb: 2 };

export default function AdminActiveTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => {
    const q = query(collection(db, 'trades'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setTrades(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trade)));
    });
    return unsub;
  }, []);

  const isFutOpt = form.tradeType === 'Futures' || form.tradeType === 'Options';
  const isOptions = form.tradeType === 'Options';

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        symbol: form.symbol.toUpperCase(),
        tradeType: form.tradeType,
        action: form.action,
        entryPrice: parseFloat(form.entryPrice),
        targetPrice: parseFloat(form.targetPrice),
        stopLoss: parseFloat(form.stopLoss),
        status: form.status,
      };
      if (isFutOpt && form.lotSize) payload.lotSize = parseInt(form.lotSize);
      if (isFutOpt && form.expiryDate) payload.expiryDate = form.expiryDate;
      if (isFutOpt && form.duration) payload.duration = form.duration;
      if (isOptions && form.strikePrice) payload.strikePrice = parseFloat(form.strikePrice);
      if (isOptions) payload.optionType = form.optionType;

      if (editId) {
        await updateDoc(doc(db, 'trades', editId), payload);
        showSnackbar('Trade updated!', 'success');
        setEditId(null);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'trades'), payload);
        showSnackbar('Trade added!', 'success');
      }
      setForm(emptyForm);
    } catch (err) {
      showSnackbar('Error saving trade', 'error');
    }
    setLoading(false);
  };

  const handleEdit = (trade: Trade) => {
    setEditId(trade.id);
    setForm({
      symbol: trade.symbol,
      tradeType: trade.tradeType,
      action: trade.action,
      entryPrice: String(trade.entryPrice),
      targetPrice: String(trade.targetPrice),
      stopLoss: String(trade.stopLoss),
      lotSize: trade.lotSize ? String(trade.lotSize) : '',
      expiryDate: trade.expiryDate || '',
      strikePrice: trade.strikePrice ? String(trade.strikePrice) : '',
      optionType: trade.optionType || 'CE',
      duration: trade.duration || '',
      status: trade.status,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this trade?')) return;
    await deleteDoc(doc(db, 'trades', id));
    showSnackbar('Trade deleted', 'success');
  };

  const handleClose = async (id: string) => {
    await updateDoc(doc(db, 'trades', id), { status: 'closed' });
    showSnackbar('Trade closed', 'success');
  };

  const displayTrades = activeTab === 'active'
    ? trades.filter((t) => t.status === 'active')
    : trades;

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Active Trades</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage and post trade recommendations
      </Typography>

      {/* ── FORM ── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {editId ? '✏️ Edit Trade' : '➕ Add New Trade'}
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box component="form" onSubmit={handleSubmit}>
          {/* Row 1 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
            <TextField
              label="Symbol *" size="small" required
              placeholder="e.g. NIFTY, RELIANCE"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            />
            <FormControl size="small">
              <InputLabel>Trade Type</InputLabel>
              <Select label="Trade Type" value={form.tradeType}
                onChange={(e) => setForm({ ...form, tradeType: e.target.value as TradeType })}>
                <MenuItem value="Equity">Equity</MenuItem>
                <MenuItem value="Futures">Futures</MenuItem>
                <MenuItem value="Options">Options</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Action</InputLabel>
              <Select label="Action" value={form.action}
                onChange={(e) => setForm({ ...form, action: e.target.value as Action })}>
                <MenuItem value="BUY">BUY</MenuItem>
                <MenuItem value="SELL">SELL</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Row 2 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
            <TextField label="Entry Price *" size="small" type="number" required
              value={form.entryPrice} onChange={(e) => setForm({ ...form, entryPrice: e.target.value })} />
            <TextField label="Target Price *" size="small" type="number" required
              value={form.targetPrice} onChange={(e) => setForm({ ...form, targetPrice: e.target.value })} />
            <TextField label="Stop Loss *" size="small" type="number" required
              value={form.stopLoss} onChange={(e) => setForm({ ...form, stopLoss: e.target.value })} />
          </Box>

          {/* Futures/Options fields */}
          {isFutOpt && (
            <Box sx={{ backgroundColor: '#e8f4fd', border: '1px solid #90caf9', borderRadius: 2, p: 2, mb: 2 }}>
              <Typography variant="caption" fontWeight="bold" color="primary" sx={{ textTransform: 'uppercase', display: 'block', mb: 2 }}>
                {form.tradeType} Fields
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <TextField label="Lot Size" size="small" type="number"
                  value={form.lotSize} onChange={(e) => setForm({ ...form, lotSize: e.target.value })} />
                <TextField label="Expiry Date" size="small" type="date"
                  value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  InputLabelProps={{ shrink: true }} />
                <TextField label="Duration" size="small" placeholder="e.g. Weekly"
                  value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
              </Box>
              {isOptions && (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
                  <TextField label="Strike Price" size="small" type="number"
                    value={form.strikePrice} onChange={(e) => setForm({ ...form, strikePrice: e.target.value })} />
                  <FormControl size="small">
                    <InputLabel>Option Type</InputLabel>
                    <Select label="Option Type" value={form.optionType}
                      onChange={(e) => setForm({ ...form, optionType: e.target.value as OptionType })}>
                      <MenuItem value="CE">CE — Call</MenuItem>
                      <MenuItem value="PE">PE — Put</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}
            </Box>
          )}

          {/* Status */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 2, mb: 3 }}>
            <FormControl size="small">
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button type="submit" variant="contained" startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Add />}
              disabled={loading} sx={{ backgroundColor: '#1a237e' }}>
              {loading ? 'Saving...' : editId ? 'Update Trade' : 'Add Trade'}
            </Button>
            {editId && (
              <Button variant="outlined" onClick={() => { setEditId(null); setForm(emptyForm); }}>
                Cancel
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* ── TRADE LIST ── */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">Trades</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {(['active', 'all'] as const).map((t) => (
              <Button key={t} size="small" variant={activeTab === t ? 'contained' : 'outlined'}
                onClick={() => setActiveTab(t)} sx={activeTab === t ? { backgroundColor: '#1a237e' } : {}}>
                {t === 'active' ? 'Active' : 'All'}
              </Button>
            ))}
          </Box>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                {['Symbol', 'Type', 'Action', 'Entry', 'Target', 'SL', 'Lot', 'Strike', 'Expiry', 'Duration', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h}><strong>{h}</strong></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayTrades.map((trade) => (
                <TableRow key={trade.id} hover>
                  <TableCell><strong>{trade.symbol}</strong></TableCell>
                  <TableCell>
                    <Chip size="small" label={trade.tradeType}
                      color={trade.tradeType === 'Options' ? 'secondary' : trade.tradeType === 'Futures' ? 'primary' : 'success'}
                      variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={trade.action}
                      color={trade.action === 'BUY' ? 'success' : 'error'} />
                  </TableCell>
                  <TableCell>₹{trade.entryPrice}</TableCell>
                  <TableCell sx={{ color: 'green', fontWeight: 'bold' }}>₹{trade.targetPrice}</TableCell>
                  <TableCell sx={{ color: 'red', fontWeight: 'bold' }}>₹{trade.stopLoss}</TableCell>
                  <TableCell>{trade.lotSize || '—'}</TableCell>
                  <TableCell>{trade.strikePrice && trade.optionType ? `${trade.strikePrice} ${trade.optionType}` : '—'}</TableCell>
                  <TableCell>{trade.expiryDate || '—'}</TableCell>
                  <TableCell>{trade.duration || '—'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={trade.status}
                      color={trade.status === 'active' ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" color="primary" onClick={() => handleEdit(trade)}><Edit fontSize="small" /></IconButton>
                      {trade.status === 'active' && (
                        <IconButton size="small" color="warning" onClick={() => handleClose(trade.id)}><Close fontSize="small" /></IconButton>
                      )}
                      <IconButton size="small" color="error" onClick={() => handleDelete(trade.id)}><Delete fontSize="small" /></IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {displayTrades.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>No trades found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
