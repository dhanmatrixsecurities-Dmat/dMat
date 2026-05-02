import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebaseConfig';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, Autocomplete,
  Select, MenuItem, FormControl, InputLabel, Button,
  IconButton, Alert, Snackbar, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Switch, LinearProgress,
} from '@mui/material';
import { Add, Edit, Delete, UploadFile } from '@mui/icons-material';

const NSE_STOCKS = [{"symbol":"RELIANCE","name":"Reliance Industries Limited"},{"symbol":"TCS","name":"Tata Consultancy Services Limited"},{"symbol":"HDFCBANK","name":"HDFC Bank Limited"},{"symbol":"INFY","name":"Infosys Limited"},{"symbol":"ICICIBANK","name":"ICICI Bank Limited"},{"symbol":"HINDUNILVR","name":"Hindustan Unilever Limited"},{"symbol":"SBIN","name":"State Bank of India"},{"symbol":"BHARTIARTL","name":"Bharti Airtel Limited"},{"symbol":"KOTAKBANK","name":"Kotak Mahindra Bank Limited"},{"symbol":"LT","name":"Larsen & Toubro Limited"},{"symbol":"AXISBANK","name":"Axis Bank Limited"},{"symbol":"WIPRO","name":"Wipro Limited"},{"symbol":"HCLTECH","name":"HCL Technologies Limited"},{"symbol":"MARUTI","name":"Maruti Suzuki India Limited"},{"symbol":"SUNPHARMA","name":"Sun Pharmaceutical Industries Limited"},{"symbol":"TATAMOTORS","name":"Tata Motors Limited"},{"symbol":"TATASTEEL","name":"Tata Steel Limited"},{"symbol":"POWERGRID","name":"Power Grid Corporation of India Limited"},{"symbol":"NTPC","name":"NTPC Limited"},{"symbol":"ONGC","name":"Oil & Natural Gas Corporation Limited"},{"symbol":"BAJFINANCE","name":"Bajaj Finance Limited"},{"symbol":"ITC","name":"ITC Limited"},{"symbol":"ADANIENT","name":"Adani Enterprises Limited"},{"symbol":"JSWSTEEL","name":"JSW Steel Limited"},{"symbol":"COALINDIA","name":"Coal India Limited"}];

type ActionType = 'BUY' | 'SELL';
type Horizon = '1 Year' | '2 Years' | '3 Years' | '4 Years' | '5 Years';

interface PortfolioStock {
  id: string;
  stockName: string;
  symbol: string;
  action: ActionType;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  horizon: string;
  rationale?: string;
  pdfUrl?: string;
  pdfName?: string;
  showInApp: boolean;
  createdAt: any;
}

const emptyForm = {
  symbol: '',
  action: 'BUY' as ActionType,
  entryPrice: '',
  targetPrice: '',
  stopLoss: '',
  horizon: '1 Year' as Horizon,
  rationale: '',
};

export default function AdminPortfolio() {
  const [stocks, setStocks] = useState<PortfolioStock[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => {
    const q = query(collection(db, 'portfolioStocks'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as PortfolioStock[];
      const sorted = data.sort((a, b) => {
        const aT = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bT = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bT - aT;
      });
      setStocks(sorted);
    });
    return () => unsub();
  }, []);

  const showSnackbar = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleToggleShowInApp = async (stock: PortfolioStock) => {
    await updateDoc(doc(db, 'portfolioStocks', stock.id), { showInApp: !stock.showInApp });
  };

  const handleOpenAdd = () => { setEditId(null); setForm(emptyForm); setPdfFile(null); setModalOpen(true); };

  const handleEdit = (stock: PortfolioStock) => {
    setEditId(stock.id);
    setForm({
      symbol: stock.symbol,
      action: stock.action,
      entryPrice: String(stock.entryPrice),
      targetPrice: String(stock.targetPrice),
      stopLoss: String(stock.stopLoss),
      horizon: stock.horizon as Horizon,
      rationale: stock.rationale || '',
    });
    setPdfFile(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => { setModalOpen(false); setEditId(null); setForm(emptyForm); setPdfFile(null); };

  const uploadPdf = async (): Promise<{ url: string; name: string } | null> => {
    if (!pdfFile) return null;
    setUploading(true);
    setUploadProgress(0);
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `portfolio-reports/${Date.now()}_${pdfFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, pdfFile);
      uploadTask.on('state_changed',
        (snapshot) => {
          setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        },
        (error) => { setUploading(false); reject(error); },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setUploading(false);
          resolve({ url, name: pdfFile.name });
        }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let pdfData: { pdfUrl?: string; pdfName?: string } = {};
      if (pdfFile) {
        const result = await uploadPdf();
        if (result) { pdfData.pdfUrl = result.url; pdfData.pdfName = result.name; }
      }

      const payload: any = {
        stockName: form.symbol.toUpperCase(),
        symbol: form.symbol.toUpperCase(),
        action: form.action,
        entryPrice: parseFloat(form.entryPrice),
        targetPrice: parseFloat(form.targetPrice),
        stopLoss: parseFloat(form.stopLoss),
        horizon: form.horizon,
        rationale: form.rationale,
        ...pdfData,
      };

      if (editId) {
        await updateDoc(doc(db, 'portfolioStocks', editId), payload);
        showSnackbar('Stock updated!', 'success');
      } else {
        payload.createdAt = serverTimestamp();
        payload.showInApp = true;
        await addDoc(collection(db, 'portfolioStocks'), payload);
        showSnackbar('Portfolio stock added!', 'success');
      }
      handleCloseModal();
    } catch (err) {
      showSnackbar('Error saving stock', 'error');
    }
    setLoading(false);
  };

  const handleDelete = async (stock: PortfolioStock) => {
    if (!window.confirm(`Delete ${stock.stockName} from portfolio?`)) return;
    await deleteDoc(doc(db, 'portfolioStocks', stock.id));
    showSnackbar('Stock deleted', 'success');
  };

  const potential = (entry: string, target: string) => {
    const e = parseFloat(entry), t = parseFloat(target);
    if (!e || !t) return null;
    return (((t - e) / e) * 100).toFixed(2);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Portfolio Stocks</Typography>
          <Typography variant="body1" color="text.secondary">
            Long-term stock picks shown to active subscribers
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}
          sx={{ backgroundColor: '#1a3d2b', mt: 1, borderRadius: 2, px: 3 }}>
          ADD STOCK
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Portfolio Stocks ({stocks.length})
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['Stock', 'Type', 'Entry', 'Target', 'Stop Loss', 'Gain%', 'Horizon', 'PDF', 'Show In App', 'Posted', 'Actions'].map(h => (
                  <TableCell key={h}><strong>{h}</strong></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {stocks.map(stock => {
                const gain = potential(String(stock.entryPrice), String(stock.targetPrice));
                return (
                  <TableRow key={stock.id} hover>
                    <TableCell>
                      <Box>
                        <Typography fontWeight="bold">{stock.stockName}</Typography>
                        <Typography variant="caption" color="text.secondary">Portfolio / Long Term</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={stock.action}
                        sx={{ backgroundColor: stock.action === 'BUY' ? '#2e7d32' : '#c62828', color: '#fff', fontWeight: 'bold', fontSize: 11 }} />
                    </TableCell>
                    <TableCell>₹{stock.entryPrice}</TableCell>
                    <TableCell sx={{ color: 'green', fontWeight: 'bold' }}>₹{stock.targetPrice}</TableCell>
                    <TableCell sx={{ color: 'red', fontWeight: 'bold' }}>₹{stock.stopLoss}</TableCell>
                    <TableCell sx={{ color: 'green', fontWeight: 'bold' }}>
                      {gain ? `+${gain}%` : '—'}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={stock.horizon}
                        sx={{ backgroundColor: '#e8f5e9', color: '#1b5e20', fontWeight: '600', fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      {stock.pdfUrl
                        ? <Button size="small" variant="outlined" color="success"
                            href={stock.pdfUrl} target="_blank"
                            sx={{ fontSize: 11, textTransform: 'none' }}>
                            View PDF
                          </Button>
                        : <Typography variant="caption" color="text.secondary">No PDF</Typography>
                      }
                    </TableCell>
                    <TableCell>
                      <Switch checked={stock.showInApp !== false}
                        onChange={() => handleToggleShowInApp(stock)} color="success" size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{formatDate(stock.createdAt)}</Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEdit(stock)} sx={{ color: '#1a237e' }}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(stock)} sx={{ color: '#d32f2f' }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {stocks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>No portfolio stocks added yet</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ADD / EDIT MODAL */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: 22, backgroundColor: '#0f4a24', color: '#fff' }}>
          {editId ? '✏️ Edit Portfolio Stock' : '🌱 Add Portfolio Stock'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 2 }}>

            <Autocomplete
              options={NSE_STOCKS}
              getOptionLabel={(option) => typeof option === 'string' ? option : `${option.symbol} - ${option.name}`}
              filterOptions={(options, { inputValue }) => {
                const val = inputValue.toUpperCase();
                if (!val) return [];
                return options.filter(o => o.symbol.startsWith(val) || o.name.toUpperCase().includes(val)).slice(0, 20);
              }}
              value={NSE_STOCKS.find(s => s.symbol === form.symbol) || null}
              onChange={(_, newValue) => {
                if (newValue && typeof newValue !== 'string') setForm({ ...form, symbol: newValue.symbol });
              }}
              freeSolo
              renderInput={(params) => (
                <TextField {...params} fullWidth label="Stock Name (NSE) *" required
                  placeholder="e.g. RELIANCE"
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                />
              )}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value as ActionType })}>
                <MenuItem value="BUY">BUY</MenuItem>
                <MenuItem value="SELL">SELL</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField fullWidth label="Entry Price *" required type="number"
                value={form.entryPrice} onChange={(e) => setForm({ ...form, entryPrice: e.target.value })} />
              <TextField fullWidth label="Target Price *" required type="number"
                value={form.targetPrice} onChange={(e) => setForm({ ...form, targetPrice: e.target.value })} />
              <TextField fullWidth label="Stop Loss *" required type="number"
                value={form.stopLoss} onChange={(e) => setForm({ ...form, stopLoss: e.target.value })} />
            </Box>

            {form.entryPrice && form.targetPrice && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Potential Gain: <strong>+{potential(form.entryPrice, form.targetPrice)}%</strong>
              </Alert>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Investment Horizon</InputLabel>
              <Select label="Investment Horizon" value={form.horizon}
                onChange={(e) => setForm({ ...form, horizon: e.target.value as Horizon })}>
                <MenuItem value="1 Year">1 Year</MenuItem>
                <MenuItem value="2 Years">2 Years</MenuItem>
                <MenuItem value="3 Years">3 Years</MenuItem>
                <MenuItem value="4 Years">4 Years</MenuItem>
                <MenuItem value="5 Years">5 Years</MenuItem>
              </Select>
            </FormControl>

            <TextField fullWidth label="Rationale / Why this stock?" multiline rows={3}
              value={form.rationale} onChange={(e) => setForm({ ...form, rationale: e.target.value })}
              sx={{ mb: 2 }} placeholder="Brief reason for recommending this stock..." />

            {/* PDF Upload */}
            <Box sx={{ border: '2px dashed #2e7d32', borderRadius: 2, p: 2, backgroundColor: '#f1f8e9' }}>
              <Typography variant="subtitle2" fontWeight="bold" color="#1b5e20" sx={{ mb: 1 }}>
                📄 Research Report (PDF) — Optional
              </Typography>
              <Button variant="outlined" component="label" startIcon={<UploadFile />} color="success" size="small">
                {pdfFile ? pdfFile.name : 'Upload PDF'}
                <input type="file" accept=".pdf" hidden onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
              </Button>
              {pdfFile && (
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                  Selected: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              )}
              {uploading && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 1 }} color="success" />}
            </Box>

          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={handleCloseModal} variant="outlined">CANCEL</Button>
            <Button type="submit" variant="contained" disabled={loading || uploading}
              sx={{ backgroundColor: '#1a3d2b', px: 4 }}>
              {loading || uploading ? <CircularProgress size={20} color="inherit" /> : editId ? 'UPDATE' : 'ADD'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
