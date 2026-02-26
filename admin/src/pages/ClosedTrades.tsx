import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, CircularProgress, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import { collection, query, getDocs, deleteDoc, doc, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ClosedTrade } from '../types';

const ClosedTrades: React.FC = () => {
  const [trades, setTrades] = useState<ClosedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    open: boolean; message: string; severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editTrade, setEditTrade] = useState<ClosedTrade | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTrades(); }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'closedTrades'), orderBy('closedAt', 'desc'));
      const snapshot = await getDocs(q);
      const tradesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ClosedTrade[];
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
        showSnackbar('Error deleting trade', 'error');
      }
    }
  };

  const handleEditOpen = (trade: ClosedTrade) => {
    setEditTrade({ ...trade });
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditTrade(null);
  };

  const handleEditSave = async () => {
    if (!editTrade) return;
    setSaving(true);
    try {
      const { id, ...data } = editTrade;
      // Recalculate P/L %
      const pl = ((Number(data.exitPrice) - Number(data.entryPrice)) / Number(data.entryPrice)) * 100;
      await updateDoc(doc(db, 'closedTrades', id), {
        ...data,
        entryPrice: Number(data.entryPrice),
        exitPrice: Number(data.exitPrice),
        profitLossPercent: parseFloat(pl.toFixed(2)),
      });
      showSnackbar('Trade updated successfully', 'success');
      handleEditClose();
      fetchTrades();
    } catch (error) {
      showSnackbar('Error updating trade', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Closed Trades</Typography>
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
                  <TableCell><strong>Segment</strong></TableCell>
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
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">No closed trades</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell><strong>{trade.stockName}</strong></TableCell>
                      <TableCell>
                        <Chip label={trade.type} color={trade.type === 'BUY' ? 'success' : 'error'} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={trade.segment ?? 'equity'}
                          size="small"
                          sx={{
                            backgroundColor:
                              trade.segment === 'options' ? '#a855f7' :
                              trade.segment === 'futures' ? '#f59e0b' : '#22c55e',
                            color: '#fff', fontWeight: 700,
                          }}
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
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="primary" onClick={() => handleEditOpen(trade)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(trade.id)}>
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

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Closed Trade</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {editTrade && (
            <>
              <TextField
                label="Stock Name"
                value={editTrade.stockName}
                onChange={e => setEditTrade({ ...editTrade, stockName: e.target.value })}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={editTrade.type}
                  label="Type"
                  onChange={e => setEditTrade({ ...editTrade, type: e.target.value as 'BUY' | 'SELL' })}
                >
                  <MenuItem value="BUY">BUY</MenuItem>
                  <MenuItem value="SELL">SELL</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Segment</InputLabel>
                <Select
                  value={editTrade.segment ?? 'equity'}
                  label="Segment"
                  onChange={e => setEditTrade({ ...editTrade, segment: e.target.value as any })}
                >
                  <MenuItem value="equity">Equity</MenuItem>
                  <MenuItem value="futures">Futures</MenuItem>
                  <MenuItem value="options">Options</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Entry Price (₹)"
                type="number"
                value={editTrade.entryPrice}
                onChange={e => setEditTrade({ ...editTrade, entryPrice: Number(e.target.value) })}
                fullWidth
              />
              <TextField
                label="Exit Price (₹)"
                type="number"
                value={editTrade.exitPrice}
                onChange={e => setEditTrade({ ...editTrade, exitPrice: Number(e.target.value) })}
                fullWidth
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleEditClose} color="inherit">Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
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

export default ClosedTrades;
