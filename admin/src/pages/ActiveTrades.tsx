import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, serverTimestamp, getDoc,
} from 'firebase/firestore';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, Autocomplete,
  Select, MenuItem, FormControl, InputLabel, Button,
  IconButton, Alert, Snackbar, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Menu, Switch,
} from '@mui/material';
import { Add, Edit, Delete, Close, MoreVert, UploadFile } from '@mui/icons-material';

const NSE_STOCKS = [{"symbol":"20MICRONS","name":"20 Microns Limited"},{"symbol":"360ONE","name":"360 ONE WAM LIMITED"},{"symbol":"5PAISA","name":"5Paisa Capital Limited"},{"symbol":"ABB","name":"ABB India Limited"},{"symbol":"ABBOTINDIA","name":"Abbott India Limited"},{"symbol":"ABCAPITAL","name":"Aditya Birla Capital Limited"},{"symbol":"ABFRL","name":"Aditya Birla Fashion and Retail Limited"},{"symbol":"ACC","name":"ACC Limited"},{"symbol":"ACE","name":"Action Construction Equipment Limited"},{"symbol":"ADANIENSOL","name":"Adani Energy Solutions Limited"},{"symbol":"ADANIENT","name":"Adani Enterprises Limited"},{"symbol":"ADANIGREEN","name":"Adani Green Energy Limited"},{"symbol":"ADANIPORTS","name":"Adani Ports and Special Economic Zone Limited"},{"symbol":"ADANIPOWER","name":"Adani Power Limited"},{"symbol":"ADFFOODS","name":"ADF Foods Limited"},{"symbol":"AEGISLOG","name":"Aegis Logistics Limited"},{"symbol":"AETHER","name":"Aether Industries Limited"},{"symbol":"AFFLE","name":"Affle 3i Limited"},{"symbol":"AJANTPHARM","name":"Ajanta Pharma Limited"},{"symbol":"ALKEM","name":"Alkem Laboratories Limited"},{"symbol":"RELIANCE","name":"Reliance Industries Limited"},{"symbol":"TCS","name":"Tata Consultancy Services Limited"},{"symbol":"HDFCBANK","name":"HDFC Bank Limited"},{"symbol":"INFY","name":"Infosys Limited"},{"symbol":"ITC","name":"ITC Limited"},{"symbol":"SBIN","name":"State Bank of India"},{"symbol":"WIPRO","name":"Wipro Limited"},{"symbol":"AXISBANK","name":"Axis Bank Limited"},{"symbol":"KOTAKBANK","name":"Kotak Mahindra Bank Limited"},{"symbol":"BAJFINANCE","name":"Bajaj Finance Limited"},{"symbol":"TATASTEEL","name":"Tata Steel Limited"},{"symbol":"SUNPHARMA","name":"Sun Pharmaceutical Industries Limited"},{"symbol":"MARUTI","name":"Maruti Suzuki India Limited"},{"symbol":"TITAN","name":"Titan Company Limited"},{"symbol":"NESTLEIND","name":"Nestle India Limited"},{"symbol":"ULTRACEMCO","name":"UltraTech Cement Limited"},{"symbol":"NTPC","name":"NTPC Limited"},{"symbol":"POWERGRID","name":"Power Grid Corporation of India Limited"},{"symbol":"COALINDIA","name":"Coal India Limited"},{"symbol":"ONGC","name":"Oil & Natural Gas Corporation Limited"},{"symbol":"JAINREC","name":"Jain Irrigation Systems Limited"}];

type Segment  = 'Equity' | 'Futures' | 'Options' | 'Portfolio';
type ActionType = 'BUY' | 'SELL';
type OptionType = 'CE' | 'PE';
type Horizon  = '1 Year' | '2 Years' | '3 Years' | '4 Years' | '5 Years';
type AdminRole = 'master' | 'admin';

interface Trade {
  id: string; _collection: string;
  stockName?: string; symbol?: string;
  segment?: string; action?: ActionType; type?: ActionType;
  entryPrice: number; targetPrice: number; stopLoss: number;
  lotSize?: number; expiryDate?: string; strikePrice?: number;
  optionType?: OptionType; duration?: string; horizon?: string;
  pdfUrl?: string; pdfName?: string; rationale?: string;
  status?: string; showInApp?: boolean;
  postedBy?: string; postedByEmail?: string; createdAt: any;
  exitPrice?: number; exitDate?: any; exitNote?: string;
}

const emptyForm = {
  symbol: '', segment: 'Equity' as Segment, action: 'BUY' as ActionType,
  entryPrice: '', targetPrice: '', stopLoss: '', lotSize: '',
  expiryDate: '', strikePrice: '', optionType: 'CE' as OptionType,
  duration: '', horizon: '1 Year' as Horizon, rationale: '',
};

export default function AdminActiveTrades() {
  const [trades,         setTrades]         = useState<Trade[]>([]);
  const [adminRole,      setAdminRole]      = useState<AdminRole | null>(null);
  const [currentUid,     setCurrentUid]     = useState('');
  const [currentEmail,   setCurrentEmail]   = useState('');
  const [form,           setForm]           = useState(emptyForm);
  const [editId,         setEditId]         = useState<string | null>(null);
  const [editCollection, setEditCollection] = useState('activeTrades');
  const [loading,        setLoading]        = useState(false);
  const [roleLoading,    setRoleLoading]    = useState(true);
  const [modalOpen,      setModalOpen]      = useState(false);
  const [closeDialogOpen,setCloseDialogOpen]= useState(false);
  const [tradeToClose,   setTradeToClose]   = useState<Trade | null>(null);
  const [exitPrice,      setExitPrice]      = useState('');
  const [exitNote,       setExitNote]       = useState('');
  const [menuAnchor,     setMenuAnchor]     = useState<HTMLElement | null>(null);
  const [menuTrade,      setMenuTrade]      = useState<Trade | null>(null);
  const [pdfFile,        setPdfFile]        = useState<File | null>(null);
  const [stockSearch,    setStockSearch]    = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    setCurrentUid(user.uid); setCurrentEmail(user.email || '');
    getDoc(doc(db, 'adminUsers', user.uid)).then((snap) => {
      setAdminRole(snap.exists() && snap.data()?.role === 'master' ? 'master' : 'admin');
      setRoleLoading(false);
    }).catch(() => { setAdminRole('admin'); setRoleLoading(false); });
  }, []);

  useEffect(() => {
    if (roleLoading || !adminRole) return;
    const allTrades: { [id: string]: Trade } = {};

    const unsub1 = onSnapshot(query(collection(db, 'activeTrades')), (snap) => {
      Object.keys(allTrades).forEach(k => { if (allTrades[k]._collection === 'activeTrades') delete allTrades[k]; });
      snap.docs.forEach(d => { allTrades[`activeTrades_${d.id}`] = { id: d.id, _collection: 'activeTrades', ...d.data() } as Trade; });
      updateList();
    });
    const unsub2 = onSnapshot(query(collection(db, 'trades')), (snap) => {
      Object.keys(allTrades).forEach(k => { if (allTrades[k]._collection === 'trades') delete allTrades[k]; });
      snap.docs.forEach(d => {
        const data = d.data();
        if (!data.status || data.status === 'active' || data.status === 'Active')
          allTrades[`trades_${d.id}`] = { id: d.id, _collection: 'trades', ...data } as Trade;
      });
      updateList();
    });
    const unsub3 = onSnapshot(query(collection(db, 'portfolioStocks')), (snap) => {
      Object.keys(allTrades).forEach(k => { if (allTrades[k]._collection === 'portfolioStocks') delete allTrades[k]; });
      snap.docs.forEach(d => { allTrades[`portfolioStocks_${d.id}`] = { id: d.id, _collection: 'portfolioStocks', ...d.data() } as Trade; });
      updateList();
    });

    function updateList() {
      let filtered = Object.values(allTrades);
      if (adminRole === 'admin') filtered = filtered.filter(t => t.postedBy === currentUid);
      setTrades(filtered.sort((a, b) => {
        const aT = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const bT = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return bT - aT;
      }));
    }
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [adminRole, roleLoading, currentUid]);

  const isFutOpt    = form.segment === 'Futures' || form.segment === 'Options';
  const isOptions   = form.segment === 'Options';
  const isPortfolio = form.segment === 'Portfolio';

  const filteredStocks = stockSearch.length > 0
    ? NSE_STOCKS.filter(o => o.symbol.startsWith(stockSearch.toUpperCase()) || o.name.toUpperCase().includes(stockSearch.toUpperCase())).slice(0, 50)
    : [];

  const calcPotential = () => {
    const entry = parseFloat(form.entryPrice), target = parseFloat(form.targetPrice), sl = parseFloat(form.stopLoss);
    if (!entry || entry <= 0) return null;
    const gain = target > 0 ? (form.action === 'BUY' ? ((target - entry) / entry) : ((entry - target) / entry)) * 100 : null;
    const loss = sl > 0     ? (form.action === 'BUY' ? ((entry - sl)    / entry) : ((sl - entry)    / entry)) * 100 : null;
    return { gain, loss };
  };
  const calc = calcPotential();

  const showSnackbar   = (message: string, severity: 'success' | 'error') => setSnackbar({ open: true, message, severity });
  const getDisplayName = (t: Trade) => t.stockName || t.symbol || '—';
  const getDisplayType = (t: Trade) => t.type || t.action || 'BUY';
  const getSegmentColor = (s?: string) => {
    const seg = s?.toLowerCase();
    if (seg === 'options')   return '#7b1fa2';
    if (seg === 'futures')   return '#1565c0';
    if (seg === 'portfolio') return '#1a6030';
    return '#2e7d32';
  };
  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const handleToggleShowInApp = async (trade: Trade) => {
    await updateDoc(doc(db, trade._collection, trade.id), { showInApp: trade.showInApp === false ? true : false });
  };

  const handleOpenAdd = () => { setEditId(null); setForm(emptyForm); setPdfFile(null); setStockSearch(''); setModalOpen(true); };

  const handleEdit = (trade: Trade) => {
    setEditId(trade.id); setEditCollection(trade._collection);
    const seg = trade.segment || 'equity';
    setForm({
      symbol: getDisplayName(trade),
      segment: (seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase()) as Segment,
      action: getDisplayType(trade) as ActionType,
      entryPrice: String(trade.entryPrice), targetPrice: String(trade.targetPrice), stopLoss: String(trade.stopLoss),
      lotSize: trade.lotSize ? String(trade.lotSize) : '',
      expiryDate: trade.expiryDate || '', strikePrice: trade.strikePrice ? String(trade.strikePrice) : '',
      optionType: trade.optionType || 'CE', duration: trade.duration || '',
      horizon: (trade.horizon as Horizon) || '1 Year', rationale: trade.rationale || '',
    });
    setStockSearch(getDisplayName(trade)); setPdfFile(null); setModalOpen(true);
  };

  const handleCloseModal = () => { setModalOpen(false); setEditId(null); setForm(emptyForm); setPdfFile(null); setStockSearch(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload: any = {
        stockName: form.symbol.toUpperCase(), symbol: form.symbol.toUpperCase(),
        segment: form.segment.toLowerCase(), type: form.action, action: form.action,
        entryPrice: parseFloat(form.entryPrice), targetPrice: parseFloat(form.targetPrice),
        stopLoss: parseFloat(form.stopLoss), status: 'active',
        postedBy: currentUid, postedByEmail: currentEmail,
      };
      if (isFutOpt && form.lotSize)      payload.lotSize     = parseInt(form.lotSize);
      if (isFutOpt && form.expiryDate)   payload.expiryDate  = form.expiryDate;
      if (isFutOpt && form.duration)     payload.duration    = form.duration;
      if (isOptions && form.strikePrice) payload.strikePrice = parseFloat(form.strikePrice);
      if (isOptions)                     payload.optionType  = form.optionType;
      if (isPortfolio) {
        payload.horizon   = form.horizon;
        payload.rationale = form.rationale;
        if (pdfFile) payload.pdfName = pdfFile.name;
      }
      if (editId) {
        await updateDoc(doc(db, editCollection, editId), payload);
        showSnackbar('Trade updated!', 'success');
      } else {
        payload.createdAt = serverTimestamp(); payload.showInApp = true;
        await addDoc(collection(db, isPortfolio ? 'portfolioStocks' : 'activeTrades'), payload);
        showSnackbar(isPortfolio ? 'Portfolio stock added!' : 'Trade added!', 'success');
      }
      handleCloseModal();
    } catch { showSnackbar('Error saving trade', 'error'); }
    setLoading(false);
  };

  const handleDelete = async (trade: Trade) => {
    if (!window.confirm('Delete this trade?')) return;
    await deleteDoc(doc(db, trade._collection, trade.id));
    showSnackbar('Trade deleted', 'success');
  };

  const handleOpenCloseDialog = (trade: Trade) => {
    setTradeToClose(trade); setExitPrice(''); setExitNote(''); setCloseDialogOpen(true);
  };

  // ── KEY FIX: Portfolio trades stay in Firebase with status=closed ──────────
  const handleCloseTrade = async () => {
    if (!tradeToClose || !exitPrice) return;
    setLoading(true);
    try {
      const exitPriceNum      = parseFloat(exitPrice);
      const profitLossPercent = ((exitPriceNum - tradeToClose.entryPrice) / tradeToClose.entryPrice) * 100;
      const isPortfolioTrade  = (tradeToClose.segment || '').toLowerCase() === 'portfolio'
                                || tradeToClose._collection === 'portfolioStocks';

      if (isPortfolioTrade) {
        // Update in place → app shows it in Exited section automatically
        await updateDoc(doc(db, tradeToClose._collection, tradeToClose.id), {
          status:            'closed',
          exitPrice:         exitPriceNum,
          exitDate:          serverTimestamp(),
          exitNote:          exitNote || '',
          profitLossPercent: parseFloat(profitLossPercent.toFixed(2)),
        });
        showSnackbar('Portfolio trade closed! Visible in Exited section on app.', 'success');
      } else {
        // Regular trade: move to closedTrades and delete original
        await addDoc(collection(db, 'closedTrades'), {
          stockName: getDisplayName(tradeToClose), symbol: getDisplayName(tradeToClose),
          type: getDisplayType(tradeToClose), action: getDisplayType(tradeToClose),
          segment: (tradeToClose.segment || 'equity').toLowerCase(),
          entryPrice: tradeToClose.entryPrice, exitPrice: exitPriceNum,
          profitLossPercent: parseFloat(profitLossPercent.toFixed(2)),
          lotSize: tradeToClose.lotSize || null, expiryDate: tradeToClose.expiryDate || null,
          strikePrice: tradeToClose.strikePrice || null, optionType: tradeToClose.optionType || null,
          postedBy: tradeToClose.postedBy || null, postedByEmail: tradeToClose.postedByEmail || null,
          closedAt: new Date().toISOString(),
        });
        await deleteDoc(doc(db, tradeToClose._collection, tradeToClose.id));
        showSnackbar('Trade closed successfully!', 'success');
      }
      setCloseDialogOpen(false); setTradeToClose(null); setExitPrice(''); setExitNote('');
    } catch { showSnackbar('Error closing trade', 'error'); }
    setLoading(false);
  };

  const handleMenuOpen  = (e: React.MouseEvent<HTMLElement>, trade: Trade) => { setMenuAnchor(e.currentTarget); setMenuTrade(trade); };
  const handleMenuClose = () => { setMenuAnchor(null); setMenuTrade(null); };

  if (roleLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Active Trades</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" color="text.secondary">
              {adminRole === 'master' ? 'Viewing all trades from all admins' : 'Viewing your trades only'}
            </Typography>
            <Chip size="small" label={adminRole === 'master' ? 'MASTER' : 'ADMIN'}
              sx={{ backgroundColor: adminRole === 'master' ? '#1a237e' : '#2e7d32', color: '#fff', fontWeight: 'bold', fontSize: 10 }} />
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}
          sx={{ backgroundColor: '#1a237e', mt: 1, borderRadius: 2, px: 3 }}>ADD TRADE</Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Trades {adminRole === 'master' && `(${trades.length} total)`}</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['Stock','Segment','Type','Entry','Target','Stop Loss','Gain%','Risk%','Details',
                  ...(adminRole === 'master' ? ['Posted By'] : []),'Show In App','Created','Actions'
                ].map(h => <TableCell key={h}><strong>{h}</strong></TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {trades.map((trade) => {
                const gain = trade.entryPrice > 0 ? (((trade.targetPrice - trade.entryPrice) / trade.entryPrice) * 100).toFixed(2) : null;
                const risk = trade.entryPrice > 0 && trade.stopLoss > 0 ? (((trade.entryPrice - trade.stopLoss) / trade.entryPrice) * 100).toFixed(2) : null;
                const isClosed = trade.status === 'closed' || trade.status === 'exited';
                return (
                  <TableRow key={`${trade._collection}_${trade.id}`} hover sx={{ opacity: isClosed ? 0.6 : 1 }}>
                    <TableCell>
                      <Box>
                        <strong>{getDisplayName(trade)}</strong>
                        {trade.segment?.toLowerCase() === 'portfolio' && <Typography variant="caption" display="block" color="success.dark">Portfolio / Long Term</Typography>}
                        {isClosed && <Chip size="small" label="EXITED" sx={{ backgroundColor: '#1a3a5a', color: '#90caf9', fontSize: 9, height: 18, mt: 0.5 }} />}
                      </Box>
                    </TableCell>
                    <TableCell><Chip size="small" label={(trade.segment || 'equity').toUpperCase()} sx={{ backgroundColor: getSegmentColor(trade.segment), color: '#fff', fontWeight: 'bold', fontSize: 11 }} /></TableCell>
                    <TableCell><Chip size="small" label={getDisplayType(trade)} sx={{ backgroundColor: getDisplayType(trade) === 'BUY' ? '#2e7d32' : '#c62828', color: '#fff', fontWeight: 'bold', fontSize: 11 }} /></TableCell>
                    <TableCell>₹{trade.entryPrice}</TableCell>
                    <TableCell sx={{ color: 'green', fontWeight: 'bold' }}>₹{trade.targetPrice}</TableCell>
                    <TableCell sx={{ color: 'red', fontWeight: 'bold' }}>₹{trade.stopLoss}</TableCell>
                    <TableCell sx={{ color: 'green', fontWeight: 'bold' }}>{gain ? `+${gain}%` : '—'}</TableCell>
                    <TableCell sx={{ color: 'red', fontWeight: 'bold' }}>{risk ? `-${risk}%` : '—'}</TableCell>
                    <TableCell>
                      {trade.strikePrice && <Typography variant="caption" display="block">Strike: ₹{trade.strikePrice} {trade.optionType}</Typography>}
                      {trade.expiryDate  && <Typography variant="caption" display="block" color="text.secondary">Expiry: {trade.expiryDate}</Typography>}
                      {trade.lotSize     && <Typography variant="caption" display="block" color="text.secondary">Lot: {trade.lotSize}</Typography>}
                      {trade.horizon     && <Typography variant="caption" display="block" color="success.dark">Horizon: {trade.horizon}</Typography>}
                      {trade.exitPrice   && <Typography variant="caption" display="block" color="info.main">Exit: ₹{trade.exitPrice}</Typography>}
                      {trade.rationale   && <Typography variant="caption" display="block" color="text.secondary" sx={{ maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{trade.rationale}</Typography>}
                    </TableCell>
                    {adminRole === 'master' && <TableCell><Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{trade.postedByEmail || '—'}</Typography></TableCell>}
                    <TableCell><Switch checked={trade.showInApp !== false} onChange={() => handleToggleShowInApp(trade)} color="success" size="small" /></TableCell>
                    <TableCell>{formatDate(trade.createdAt)}</TableCell>
                    <TableCell><IconButton size="small" onClick={(e) => handleMenuOpen(e, trade)}><MoreVert fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                );
              })}
              {trades.length === 0 && (
                <TableRow><TableCell colSpan={adminRole === 'master' ? 13 : 12} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>{adminRole === 'admin' ? 'You have not posted any trades yet' : 'No active trades found'}</Typography>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { if (menuTrade) handleEdit(menuTrade); handleMenuClose(); }}><Edit fontSize="small" sx={{ mr: 1, color: '#1a237e' }} /> Edit</MenuItem>
        <MenuItem onClick={() => { if (menuTrade) handleOpenCloseDialog(menuTrade); handleMenuClose(); }}><Close fontSize="small" sx={{ mr: 1, color: '#ed6c02' }} /> Close Trade</MenuItem>
        <MenuItem onClick={() => { if (menuTrade) handleDelete(menuTrade); handleMenuClose(); }}><Delete fontSize="small" sx={{ mr: 1, color: '#d32f2f' }} /> Delete</MenuItem>
      </Menu>

      {/* ADD / EDIT MODAL */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: 22 }}>{editId ? 'Edit Trade' : 'Add New Trade'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            <Autocomplete
              options={filteredStocks}
              getOptionLabel={(o) => typeof o === 'string' ? o : `${o.symbol} - ${o.name}`}
              filterOptions={(x) => x}
              onInputChange={(_, v, reason) => { if (reason === 'input') { setStockSearch(v); setForm({ ...form, symbol: v.toUpperCase() }); } }}
              onChange={(_, v) => { if (v && typeof v !== 'string') { setForm({ ...form, symbol: v.symbol }); setStockSearch(v.symbol); } }}
              freeSolo
              renderInput={(params) => <TextField {...params} fullWidth label="Stock Name (NSE)" required placeholder="Type to search e.g. RELIANCE" sx={{ mb: 2 }} />}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Segment</InputLabel>
              <Select label="Segment" value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value as Segment })}>
                <MenuItem value="Equity">Equity</MenuItem><MenuItem value="Futures">Futures</MenuItem>
                <MenuItem value="Options">Options</MenuItem><MenuItem value="Portfolio">Portfolio</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value as ActionType })}>
                <MenuItem value="BUY">BUY</MenuItem><MenuItem value="SELL">SELL</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="Entry Price"  required type="number" value={form.entryPrice}  onChange={(e) => setForm({ ...form, entryPrice:  e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Target Price" required type="number" value={form.targetPrice} onChange={(e) => setForm({ ...form, targetPrice: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Stop Loss"    required type="number" value={form.stopLoss}    onChange={(e) => setForm({ ...form, stopLoss:    e.target.value })} sx={{ mb: 2 }} />
            {calc && (calc.gain !== null || calc.loss !== null) && (
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                {calc.gain !== null && <Alert severity="success" sx={{ flex: 1, py: 0.5 }}><strong>Potential Gain: +{calc.gain.toFixed(2)}%</strong></Alert>}
                {calc.loss !== null && <Alert severity="error"   sx={{ flex: 1, py: 0.5 }}><strong>Risk: -{Math.abs(calc.loss).toFixed(2)}%</strong></Alert>}
              </Box>
            )}
            {isFutOpt && (
              <Box sx={{ backgroundColor: '#e8f4fd', border: '1px solid #90caf9', borderRadius: 2, p: 2, mb: 2 }}>
                <Typography variant="caption" fontWeight="bold" color="primary" sx={{ textTransform: 'uppercase', display: 'block', mb: 2 }}>{form.segment} Fields</Typography>
                <TextField fullWidth label="Lot Size" type="number" size="small" value={form.lotSize} onChange={(e) => setForm({ ...form, lotSize: e.target.value })} sx={{ mb: 2 }} />
                <TextField fullWidth label="Expiry Date" type="date" size="small" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />
                <TextField fullWidth label="Duration" size="small" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} sx={{ mb: isOptions ? 2 : 0 }} />
                {isOptions && <>
                  <TextField fullWidth label="Strike Price" type="number" size="small" value={form.strikePrice} onChange={(e) => setForm({ ...form, strikePrice: e.target.value })} sx={{ mb: 2 }} />
                  <FormControl fullWidth size="small"><InputLabel>Option Type</InputLabel>
                    <Select label="Option Type" value={form.optionType} onChange={(e) => setForm({ ...form, optionType: e.target.value as OptionType })}>
                      <MenuItem value="CE">CE</MenuItem><MenuItem value="PE">PE</MenuItem>
                    </Select>
                  </FormControl>
                </>}
              </Box>
            )}
            {isPortfolio && (
              <Box sx={{ backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 2, p: 2, mb: 2 }}>
                <Typography variant="caption" fontWeight="bold" color="success.dark" sx={{ textTransform: 'uppercase', display: 'block', mb: 2 }}>Portfolio Fields</Typography>
                <FormControl fullWidth sx={{ mb: 2 }} size="small">
                  <InputLabel>Investment Horizon</InputLabel>
                  <Select label="Investment Horizon" value={form.horizon} onChange={(e) => setForm({ ...form, horizon: e.target.value as Horizon })}>
                    <MenuItem value="1 Year">1 Year</MenuItem><MenuItem value="2 Years">2 Years</MenuItem>
                    <MenuItem value="3 Years">3 Years</MenuItem><MenuItem value="4 Years">4 Years</MenuItem>
                    <MenuItem value="5 Years">5 Years</MenuItem>
                  </Select>
                </FormControl>
                <TextField fullWidth label="Rationale / Why this stock?" multiline rows={2} size="small" value={form.rationale} onChange={(e) => setForm({ ...form, rationale: e.target.value })} placeholder="Brief reason..." sx={{ mb: 2 }} />
                <Button variant="outlined" component="label" startIcon={<UploadFile />} color="success" size="small" fullWidth>
                  {pdfFile ? pdfFile.name : 'Upload Research Report PDF (Optional)'}
                  <input type="file" accept=".pdf" hidden onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
                </Button>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={handleCloseModal} variant="outlined">CANCEL</Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ backgroundColor: isPortfolio ? '#1a6030' : '#1a237e', px: 4 }}>
              {loading ? <CircularProgress size={20} color="inherit" /> : editId ? 'UPDATE' : 'ADD'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* CLOSE TRADE DIALOG */}
      <Dialog open={closeDialogOpen} onClose={() => setCloseDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="bold">
          {tradeToClose && (tradeToClose.segment || '').toLowerCase() === 'portfolio' ? '📊 Close Portfolio Trade' : '🔒 Close Trade'}
        </DialogTitle>
        <DialogContent>
          {tradeToClose && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Closing <strong>{getDisplayName(tradeToClose)}</strong> | Entry: ₹{tradeToClose.entryPrice}
                {(tradeToClose.segment || '').toLowerCase() === 'portfolio' && (
                  <Chip size="small" label="Portfolio" sx={{ ml: 1, backgroundColor: '#1a6030', color: '#fff', fontSize: 10 }} />
                )}
              </Typography>
              <TextField fullWidth label="Exit Price" type="number" value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)} sx={{ mt: 2 }} autoFocus />
              {exitPrice && (
                <Alert severity={parseFloat(exitPrice) >= tradeToClose.entryPrice ? 'success' : 'error'} sx={{ mt: 2 }}>
                  P&L: <strong>{(((parseFloat(exitPrice) - tradeToClose.entryPrice) / tradeToClose.entryPrice) * 100).toFixed(2)}%</strong>
                </Alert>
              )}
              {(tradeToClose.segment || '').toLowerCase() === 'portfolio' && (
                <>
                  <TextField fullWidth label="Exit note (optional)" multiline rows={2} value={exitNote}
                    onChange={(e) => setExitNote(e.target.value)} sx={{ mt: 2 }}
                    placeholder="e.g. Target achieved. Business fundamentals remain strong." />
                  <Alert severity="info" sx={{ mt: 2, fontSize: 12 }}>
                    This portfolio stock will move to the <strong>Exited</strong> section on the app automatically.
                  </Alert>
                </>
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

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
