import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, query, serverTimestamp,
} from 'firebase/firestore';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, Autocomplete,
  Select, MenuItem, FormControl, InputLabel, Button,
  IconButton, Alert, Snackbar, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Menu, Switch,
} from '@mui/material';
import { Add, Edit, Delete, Close, MoreVert, UploadFile } from '@mui/icons-material';

const NSE_STOCKS = [{"symbol": "20MICRONS", "name": "20 Microns Limited"}, {"symbol": "21STCENMGM", "name": "21st Century Management Services Limited"}, {"symbol": "360ONE", "name": "360 ONE WAM LIMITED"}, {"symbol": "3IINFOLTD", "name": "3i Infotech Limited"}, {"symbol": "3MINDIA", "name": "3M India Limited"}, {"symbol": "3PLAND", "name": "3P Land Holdings Limited"}, {"symbol": "5PAISA", "name": "5Paisa Capital Limited"}, {"symbol": "63MOONS", "name": "63 moons technologies limited"}, {"symbol": "A2ZINFRA", "name": "A2Z Infra Engineering Limited"}, {"symbol": "AAATECH", "name": "AAA Technologies Limited"}, {"symbol": "AADHARHFC", "name": "Aadhar Housing Finance Limited"}, {"symbol": "AAKASH", "name": "Aakash Exploration Services Limited"}, {"symbol": "AAREYDRUGS", "name": "Aarey Drugs & Pharmaceuticals Limited"}, {"symbol": "AARNAV", "name": "Aarnav Fashions Limited"}, {"symbol": "AARON", "name": "Aaron Industries Limited"}, {"symbol": "AARTECH", "name": "Aartech Solonics Limited"}, {"symbol": "AARTIDRUGS", "name": "Aarti Drugs Limited"}, {"symbol": "AARTIIND", "name": "Aarti Industries Limited"}, {"symbol": "AARTIPHARM", "name": "Aarti Pharmalabs Limited"}, {"symbol": "AARTISURF", "name": "Aarti Surfactants Limited"}, {"symbol": "AARVI", "name": "Aarvi Encon Limited"}, {"symbol": "AAVAS", "name": "Aavas Financiers Limited"}, {"symbol": "ABAN", "name": "Aban Offshore Limited"}, {"symbol": "ABB", "name": "ABB India Limited"}, {"symbol": "ABBOTINDIA", "name": "Abbott India Limited"}, {"symbol": "ABCAPITAL", "name": "Aditya Birla Capital Limited"}, {"symbol": "ABCOTS", "name": "A B Cotspin India Limited"}, {"symbol": "ABDL", "name": "Allied Blenders and Distillers Limited"}, {"symbol": "ABFRL", "name": "Aditya Birla Fashion and Retail Limited"}, {"symbol": "ABINFRA", "name": "A B Infrabuild Limited"}, {"symbol": "ABLBL", "name": "Aditya Birla Lifestyle Brands Limited"}, {"symbol": "ABMINTLLTD", "name": "ABM International Limited"}, {"symbol": "ABREL", "name": "Aditya Birla Real Estate Limited"}, {"symbol": "ABSLAMC", "name": "Aditya Birla Sun Life AMC Limited"}, {"symbol": "ACC", "name": "ACC Limited"}, {"symbol": "ACCELYA", "name": "Accelya Solutions India Limited"}, {"symbol": "ACCURACY", "name": "Accuracy Shipping Limited"}, {"symbol": "ACE", "name": "Action Construction Equipment Limited"}, {"symbol": "ACEINTEG", "name": "Ace Integrated Solutions Limited"}, {"symbol": "ACI", "name": "Archean Chemical Industries Limited"}, {"symbol": "ACL", "name": "Andhra Cements Limited"}, {"symbol": "ACMESOLAR", "name": "Acme Solar Holdings Limited"}, {"symbol": "ACUTAAS", "name": "Acutaas Chemicals Limited"}, {"symbol": "ADANIENSOL", "name": "Adani Energy Solutions Limited"}, {"symbol": "ADANIENT", "name": "Adani Enterprises Limited"}, {"symbol": "ADANIGREEN", "name": "Adani Green Energy Limited"}, {"symbol": "ADANIPORTS", "name": "Adani Ports and Special Economic Zone Limited"}, {"symbol": "ADANIPOWER", "name": "Adani Power Limited"}, {"symbol": "ADFFOODS", "name": "ADF Foods Limited"}, {"symbol": "ADL", "name": "Archidply Decor Limited"}, {"symbol": "ADOR", "name": "Ador Welding Limited"}, {"symbol": "ADROITINFO", "name": "Adroit Infotech Limited"}, {"symbol": "ADSL", "name": "Allied Digital Services Limited"}, {"symbol": "ADVAIT", "name": "Advait Energy Transitions Limited"}, {"symbol": "ADVANCE", "name": "Advance Agrolife Limited"}, {"symbol": "ADVANIHOTR", "name": "Advani Hotels & Resorts (India) Limited"}, {"symbol": "ADVENTHTL", "name": "Advent Hotels International Limited"}, {"symbol": "ADVENZYMES", "name": "Advanced Enzyme Technologies Limited"}, {"symbol": "AEGISLOG", "name": "Aegis Logistics Limited"}, {"symbol": "AEGISVOPAK", "name": "Aegis Vopak Terminals Limited"}, {"symbol": "AEQUS", "name": "Aequs Limited"}, {"symbol": "AEROENTER", "name": "Aeroflex Enterprises Limited"}, {"symbol": "AEROFLEX", "name": "Aeroflex Industries Limited"}, {"symbol": "AERONEU", "name": "Aeroflex Neu Limited"}, {"symbol": "AETHER", "name": "Aether Industries Limited"}, {"symbol": "AFCONS", "name": "Afcons Infrastructure Limited"}, {"symbol": "AFFLE", "name": "Affle 3i Limited"}, {"symbol": "AFFORDABLE", "name": "Affordable Robotic & Automation Limited"}, {"symbol": "AFIL", "name": "Akme Fintrade (India) Limited"}, {"symbol": "AFSL", "name": "Abans Financial Services Limited"}, {"symbol": "AGARIND", "name": "Agarwal Industrial Corporation Limited"}, {"symbol": "AGARWALEYE", "name": "Dr. Agarwal's Health Care Limited"}, {"symbol": "AGI", "name": "AGI Greenpac Limited"}, {"symbol": "AGIIL", "name": "Agi Infra Limited"}, {"symbol": "AGRITECH", "name": "Agri-Tech (India) Limited"}, {"symbol": "AGROPHOS", "name": "Agro Phos India Limited"}, {"symbol": "AGSTRA", "name": "AGS Transact Technologies Limited"}, {"symbol": "AHCL", "name": "Anlon Healthcare Limited"}, {"symbol": "AHLADA", "name": "Ahlada Engineers Limited"}, {"symbol": "AHLEAST", "name": "Asian Hotels (East) Limited"}, {"symbol": "AHLUCONT", "name": "Ahluwalia Contracts (India) Limited"}, {"symbol": "AIAENG", "name": "AIA Engineering Limited"}, {"symbol": "AIIL", "name": "Authum Investment & Infrastructure Limited"}, {"symbol": "AIRAN", "name": "Airan Limited"}, {"symbol": "AIROLAM", "name": "Airo Lam limited"}, {"symbol": "AJANTPHARM", "name": "Ajanta Pharma Limited"}, {"symbol": "AJAXENGG", "name": "Ajax Engineering Limited"}, {"symbol": "AJMERA", "name": "Ajmera Realty & Infra India Limited"}, {"symbol": "AJOONI", "name": "Ajooni Biotech Limited"}, {"symbol": "AKASH", "name": "Akash Infra-Projects Limited"}, {"symbol": "AKG", "name": "Akg Exim Limited"}, {"symbol": "AKI", "name": "AKI India Limited"}, {"symbol": "AKSHAR", "name": "Akshar Spintex Limited"}, {"symbol": "AKSHARCHEM", "name": "AksharChem India Limited"}, {"symbol": "AKSHOPTFBR", "name": "Aksh Optifibre Limited"}, {"symbol": "AKUMS", "name": "Akums Drugs and Pharmaceuticals Limited"}, {"symbol": "AKZOINDIA", "name": "Akzo Nobel India Limited"}, {"symbol": "ALANKIT", "name": "Alankit Limited"}, {"symbol": "ALBERTDAVD", "name": "Albert David Limited"}, {"symbol": "ALEMBICLTD", "name": "Alembic Limited"}, {"symbol": "ALGOQUANT", "name": "Algoquant Fintech Limited"}, {"symbol": "ALICON", "name": "Alicon Castalloy Limited"}, {"symbol": "ALIVUS", "name": "Alivus Life Sciences Limited"}, {"symbol": "ALKALI", "name": "Alkali Metals Limited"}, {"symbol": "ALKEM", "name": "Alkem Laboratories Limited"}, {"symbol": "ALKYLAMINE", "name": "Alkyl Amines Chemicals Limited"}, {"symbol": "ALLCARGO", "name": "Allcargo Logistics Limited"}, {"symbol": "ALLDIGI", "name": "Alldigi Tech Limited"}, {"symbol": "ALLTIME", "name": "All Time Plastics Limited"}, {"symbol": "ALMONDZ", "name": "Almondz Global Securities Limited"}, {"symbol": "ALOKINDS", "name": "Alok Industries Limited"}, {"symbol": "ALPA", "name": "Alpa Laboratories Limited"}, {"symbol": "ALPHAGEO", "name": "Alphageo (India) Limited"}, {"symbol": "RELIANCE", "name": "Reliance Industries Limited"}, {"symbol": "TCS", "name": "Tata Consultancy Services Limited"}, {"symbol": "HDFCBANK", "name": "HDFC Bank Limited"}, {"symbol": "INFY", "name": "Infosys Limited"}, {"symbol": "ICICIBANK", "name": "ICICI Bank Limited"}, {"symbol": "SBIN", "name": "State Bank of India"}, {"symbol": "BHARTIARTL", "name": "Bharti Airtel Limited"}, {"symbol": "KOTAKBANK", "name": "Kotak Mahindra Bank Limited"}, {"symbol": "LT", "name": "Larsen & Toubro Limited"}, {"symbol": "AXISBANK", "name": "Axis Bank Limited"}, {"symbol": "WIPRO", "name": "Wipro Limited"}, {"symbol": "HCLTECH", "name": "HCL Technologies Limited"}, {"symbol": "MARUTI", "name": "Maruti Suzuki India Limited"}, {"symbol": "SUNPHARMA", "name": "Sun Pharmaceutical Industries Limited"}, {"symbol": "TATASTEEL", "name": "Tata Steel Limited"}, {"symbol": "NTPC", "name": "NTPC Limited"}, {"symbol": "ONGC", "name": "Oil & Natural Gas Corporation Limited"}, {"symbol": "BAJFINANCE", "name": "Bajaj Finance Limited"}, {"symbol": "ITC", "name": "ITC Limited"}, {"symbol": "ADANIENT", "name": "Adani Enterprises Limited"}, {"symbol": "JSWSTEEL", "name": "JSW Steel Limited"}, {"symbol": "COALINDIA", "name": "Coal India Limited"}];

type Segment = 'Equity' | 'Futures' | 'Options' | 'Portfolio';
type ActionType = 'BUY' | 'SELL';
type OptionType = 'CE' | 'PE';
type Horizon = '1 Year' | '2 Years' | '3 Years' | '4 Years' | '5 Years';

interface Trade {
  id: string;
  _collection: string;
  stockName?: string;
  symbol?: string;
  segment?: string;
  action?: ActionType;
  type?: ActionType;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  lotSize?: number;
  expiryDate?: string;
  strikePrice?: number;
  optionType?: OptionType;
  duration?: string;
  horizon?: string;
  pdfUrl?: string;
  pdfName?: string;
  status?: string;
  showInApp?: boolean;
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
  horizon: '1 Year' as Horizon,
  rationale: '',
};

export default function AdminActiveTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editCollection, setEditCollection] = useState<string>('activeTrades');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [tradeToClose, setTradeToClose] = useState<Trade | null>(null);
  const [exitPrice, setExitPrice] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuTrade, setMenuTrade] = useState<Trade | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => {
    const allTrades: { [id: string]: Trade } = {};
    const q1 = query(collection(db, 'activeTrades'));
    const unsub1 = onSnapshot(q1, (snap) => {
      Object.keys(allTrades).forEach(k => { if (allTrades[k]._collection === 'activeTrades') delete allTrades[k]; });
      snap.docs.forEach(d => { allTrades[`activeTrades_${d.id}`] = { id: d.id, _collection: 'activeTrades', ...d.data() } as Trade; });
      updateTrades();
    });
    const q2 = query(collection(db, 'trades'));
    const unsub2 = onSnapshot(q2, (snap) => {
      Object.keys(allTrades).forEach(k => { if (allTrades[k]._collection === 'trades') delete allTrades[k]; });
      snap.docs.forEach(d => {
        const data = d.data();
        if (!data.status || data.status === 'active' || data.status === 'Active')
          allTrades[`trades_${d.id}`] = { id: d.id, _collection: 'trades', ...data } as Trade;
      });
      updateTrades();
    });
    const q3 = query(collection(db, 'portfolioStocks'));
    const unsub3 = onSnapshot(q3, (snap) => {
      Object.keys(allTrades).forEach(k => { if (allTrades[k]._collection === 'portfolioStocks') delete allTrades[k]; });
      snap.docs.forEach(d => { allTrades[`portfolioStocks_${d.id}`] = { id: d.id, _collection: 'portfolioStocks', ...d.data() } as Trade; });
      updateTrades();
    });
    function updateTrades() {
      const sorted = Object.values(allTrades).sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
      setTrades(sorted);
    }
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const isFutOpt   = form.segment === 'Futures' || form.segment === 'Options';
  const isOptions  = form.segment === 'Options';
  const isPortfolio = form.segment === 'Portfolio';

  // ── Real-time potential gain & loss calculation ───────────────────────────
  const calcPotential = () => {
    const entry  = parseFloat(form.entryPrice);
    const target = parseFloat(form.targetPrice);
    const sl     = parseFloat(form.stopLoss);
    if (!entry || entry <= 0) return null;
    const gain = target > 0
      ? form.action === 'BUY'
        ? ((target - entry) / entry) * 100
        : ((entry - target) / entry) * 100
      : null;
    const loss = sl > 0
      ? form.action === 'BUY'
        ? ((entry - sl) / entry) * 100
        : ((sl - entry) / entry) * 100
      : null;
    return { gain, loss };
  };
  const calc = calcPotential();

  const showSnackbar  = (message: string, severity: 'success' | 'error') => setSnackbar({ open: true, message, severity });
  const getDisplayName = (trade: Trade) => trade.stockName || trade.symbol || '—';
  const getDisplayType = (trade: Trade) => trade.type || trade.action || 'BUY';
  const getSegmentColor = (segment?: string) => {
    const s = segment?.toLowerCase();
    if (s === 'options') return '#7b1fa2';
    if (s === 'futures') return '#1565c0';
    if (s === 'portfolio') return '#1a6030';
    return '#2e7d32';
  };
  const formatDate = (ts: any) => {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const handleToggleShowInApp = async (trade: Trade) => {
    await updateDoc(doc(db, trade._collection, trade.id), { showInApp: trade.showInApp === false ? true : false });
  };
  const handleOpenAdd    = () => { setEditId(null); setForm(emptyForm); setPdfFile(null); setModalOpen(true); };
  const handleEdit       = (trade: Trade) => {
    setEditId(trade.id); setEditCollection(trade._collection);
    const seg = trade.segment || 'equity';
    const segCapital = (seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase()) as Segment;
    setForm({ symbol: getDisplayName(trade), segment: segCapital, action: getDisplayType(trade) as ActionType, entryPrice: String(trade.entryPrice), targetPrice: String(trade.targetPrice), stopLoss: String(trade.stopLoss), lotSize: trade.lotSize ? String(trade.lotSize) : '', expiryDate: trade.expiryDate || '', strikePrice: trade.strikePrice ? String(trade.strikePrice) : '', optionType: trade.optionType || 'CE', duration: trade.duration || '', horizon: (trade.horizon as Horizon) || '1 Year', rationale: '' });
    setPdfFile(null); setModalOpen(true);
  };
  const handleCloseModal = () => { setModalOpen(false); setEditId(null); setForm(emptyForm); setPdfFile(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload: any = { stockName: form.symbol.toUpperCase(), symbol: form.symbol.toUpperCase(), segment: form.segment.toLowerCase(), type: form.action, action: form.action, entryPrice: parseFloat(form.entryPrice), targetPrice: parseFloat(form.targetPrice), stopLoss: parseFloat(form.stopLoss), status: 'active' };
      if (isFutOpt && form.lotSize)    payload.lotSize    = parseInt(form.lotSize);
      if (isFutOpt && form.expiryDate) payload.expiryDate = form.expiryDate;
      if (isFutOpt && form.duration)   payload.duration   = form.duration;
      if (isOptions && form.strikePrice) payload.strikePrice = parseFloat(form.strikePrice);
      if (isOptions) payload.optionType = form.optionType;
      if (isPortfolio) { payload.horizon = form.horizon; payload.rationale = form.rationale; if (pdfFile) payload.pdfName = pdfFile.name; }
      if (editId) {
        await updateDoc(doc(db, editCollection, editId), payload);
        showSnackbar('Trade updated!', 'success');
      } else {
        payload.createdAt = serverTimestamp(); payload.showInApp = true;
        await addDoc(collection(db, isPortfolio ? 'portfolioStocks' : 'activeTrades'), payload);
        showSnackbar(isPortfolio ? 'Portfolio stock added!' : 'Trade added!', 'success');
      }
      handleCloseModal();
    } catch (err) { showSnackbar('Error saving trade', 'error'); }
    setLoading(false);
  };

  const handleDelete = async (trade: Trade) => {
    if (!window.confirm('Delete this trade?')) return;
    await deleteDoc(doc(db, trade._collection, trade.id));
    showSnackbar('Trade deleted', 'success');
  };

  const handleOpenCloseDialog = (trade: Trade) => { setTradeToClose(trade); setExitPrice(''); setCloseDialogOpen(true); };

  const handleCloseTrade = async () => {
    if (!tradeToClose || !exitPrice) return; setLoading(true);
    try {
      const exitPriceNum = parseFloat(exitPrice);
      const profitLossPercent = ((exitPriceNum - tradeToClose.entryPrice) / tradeToClose.entryPrice) * 100;
      await addDoc(collection(db, 'closedTrades'), { stockName: getDisplayName(tradeToClose), symbol: getDisplayName(tradeToClose), type: getDisplayType(tradeToClose), action: getDisplayType(tradeToClose), segment: (tradeToClose.segment || 'equity').toLowerCase(), entryPrice: tradeToClose.entryPrice, exitPrice: exitPriceNum, profitLossPercent: parseFloat(profitLossPercent.toFixed(2)), lotSize: tradeToClose.lotSize || null, expiryDate: tradeToClose.expiryDate || null, strikePrice: tradeToClose.strikePrice || null, optionType: tradeToClose.optionType || null, closedAt: new Date().toISOString() });
      await deleteDoc(doc(db, tradeToClose._collection, tradeToClose.id));
      showSnackbar('Trade closed successfully!', 'success');
      setCloseDialogOpen(false); setTradeToClose(null); setExitPrice('');
    } catch (err) { showSnackbar('Error closing trade', 'error'); }
    setLoading(false);
  };

  const handleMenuOpen  = (e: React.MouseEvent<HTMLElement>, trade: Trade) => { setMenuAnchor(e.currentTarget); setMenuTrade(trade); };
  const handleMenuClose = () => { setMenuAnchor(null); setMenuTrade(null); };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Active Trades</Typography>
          <Typography variant="body1" color="text.secondary">Manage live trades for ACTIVE users</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd} sx={{ backgroundColor: '#1a237e', mt: 1, borderRadius: 2, px: 3 }}>ADD TRADE</Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Trades</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['Stock','Segment','Type','Entry','Target','Stop Loss','Gain%','Risk%','Details','Show In App','Created','Actions'].map(h => (
                  <TableCell key={h}><strong>{h}</strong></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {trades.map((trade) => {
                const gain = trade.entryPrice > 0 ? (((trade.targetPrice - trade.entryPrice) / trade.entryPrice) * 100).toFixed(2) : null;
                const risk = trade.entryPrice > 0 && trade.stopLoss > 0 ? (((trade.entryPrice - trade.stopLoss) / trade.entryPrice) * 100).toFixed(2) : null;
                return (
                  <TableRow key={`${trade._collection}_${trade.id}`} hover>
                    <TableCell>
                      <Box><strong>{getDisplayName(trade)}</strong>
                        {trade.segment?.toLowerCase() === 'portfolio' && <Typography variant="caption" display="block" color="success.dark">Portfolio / Long Term</Typography>}
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
                      {trade.duration    && <Typography variant="caption" display="block" color="text.secondary">{trade.duration}</Typography>}
                      {trade.horizon     && <Typography variant="caption" display="block" color="success.dark">Horizon: {trade.horizon}</Typography>}
                      {trade.pdfName     && <Typography variant="caption" display="block" color="primary">📄 {trade.pdfName}</Typography>}
                    </TableCell>
                    <TableCell><Switch checked={trade.showInApp !== false} onChange={() => handleToggleShowInApp(trade)} color="success" size="small" /></TableCell>
                    <TableCell>{formatDate(trade.createdAt)}</TableCell>
                    <TableCell><IconButton size="small" onClick={(e) => handleMenuOpen(e, trade)}><MoreVert fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                );
              })}
              {trades.length === 0 && (
                <TableRow><TableCell colSpan={12} align="center"><Typography color="text.secondary" sx={{ py: 4 }}>No active trades found</Typography></TableCell></TableRow>
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
              options={NSE_STOCKS}
              getOptionLabel={(option) => typeof option === 'string' ? option : `${option.symbol} - ${option.name}`}
              filterOptions={(options, { inputValue }) => {
                const val = inputValue.toUpperCase();
                if (!val) return [];
                return options.filter(o => o.symbol.startsWith(val) || o.name.toUpperCase().includes(val)).slice(0, 20);
              }}
              value={NSE_STOCKS.find(s => s.symbol === form.symbol) || null}
              onChange={(_, newValue) => { if (newValue && typeof newValue !== 'string') setForm({ ...form, symbol: newValue.symbol }); }}
              freeSolo
              renderInput={(params) => (
                <TextField {...params} fullWidth label="Stock Name (NSE)" required placeholder="Type to search e.g. RELIANCE"
                  value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })} sx={{ mb: 2 }} />
              )}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Segment</InputLabel>
              <Select label="Segment" value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value as Segment })}>
                <MenuItem value="Equity">Equity</MenuItem>
                <MenuItem value="Futures">Futures</MenuItem>
                <MenuItem value="Options">Options</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value as ActionType })}>
                <MenuItem value="BUY">BUY</MenuItem>
                <MenuItem value="SELL">SELL</MenuItem>
              </Select>
            </FormControl>

            <TextField fullWidth label="Entry Price *" required type="number"
              value={form.entryPrice} onChange={(e) => setForm({ ...form, entryPrice: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Target Price *" required type="number"
              value={form.targetPrice} onChange={(e) => setForm({ ...form, targetPrice: e.target.value })} sx={{ mb: 2 }} />
            <TextField fullWidth label="Stop Loss *" required type="number"
              value={form.stopLoss} onChange={(e) => setForm({ ...form, stopLoss: e.target.value })} sx={{ mb: 2 }} />

            {/* ── LIVE POTENTIAL GAIN / LOSS CALCULATION ── */}
            {calc && (calc.gain !== null || calc.loss !== null) && (
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                {calc.gain !== null && (
                  <Alert severity="success" icon="📈" sx={{ flex: 1, py: 0.5 }}>
                    <strong>Potential Gain: +{calc.gain.toFixed(2)}%</strong>
                  </Alert>
                )}
                {calc.loss !== null && (
                  <Alert severity="error" icon="📉" sx={{ flex: 1, py: 0.5 }}>
                    <strong>Risk: -{Math.abs(calc.loss).toFixed(2)}%</strong>
                  </Alert>
                )}
              </Box>
            )}

            {/* FUTURES / OPTIONS FIELDS */}
            {isFutOpt && (
              <Box sx={{ backgroundColor: '#e8f4fd', border: '1px solid #90caf9', borderRadius: 2, p: 2, mb: 2 }}>
                <Typography variant="caption" fontWeight="bold" color="primary" sx={{ textTransform: 'uppercase', display: 'block', mb: 2 }}>{form.segment} Fields</Typography>
                <TextField fullWidth label="Lot Size" type="number" size="small" value={form.lotSize} onChange={(e) => setForm({ ...form, lotSize: e.target.value })} sx={{ mb: 2 }} />
                <TextField fullWidth label="Expiry Date" type="date" size="small" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />
                <TextField fullWidth label="Duration" size="small" placeholder="e.g. Weekly" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} sx={{ mb: isOptions ? 2 : 0 }} />
                {isOptions && (
                  <>
                    <TextField fullWidth label="Strike Price" type="number" size="small" value={form.strikePrice} onChange={(e) => setForm({ ...form, strikePrice: e.target.value })} sx={{ mb: 2 }} />
                    <FormControl fullWidth size="small">
                      <InputLabel>Option Type</InputLabel>
                      <Select label="Option Type" value={form.optionType} onChange={(e) => setForm({ ...form, optionType: e.target.value as OptionType })}>
                        <MenuItem value="CE">CE</MenuItem>
                        <MenuItem value="PE">PE</MenuItem>
                      </Select>
                    </FormControl>
                  </>
                )}
              </Box>
            )}

            {/* PORTFOLIO FIELDS */}
            {isPortfolio && (
              <Box sx={{ backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 2, p: 2, mb: 2 }}>
                <Typography variant="caption" fontWeight="bold" color="success.dark" sx={{ textTransform: 'uppercase', display: 'block', mb: 2 }}>🌱 Portfolio Fields</Typography>
                <FormControl fullWidth sx={{ mb: 2 }} size="small">
                  <InputLabel>Investment Horizon</InputLabel>
                  <Select label="Investment Horizon" value={form.horizon} onChange={(e) => setForm({ ...form, horizon: e.target.value as Horizon })}>
                    <MenuItem value="1 Year">1 Year</MenuItem>
                    <MenuItem value="2 Years">2 Years</MenuItem>
                    <MenuItem value="3 Years">3 Years</MenuItem>
                    <MenuItem value="4 Years">4 Years</MenuItem>
                    <MenuItem value="5 Years">5 Years</MenuItem>
                  </Select>
                </FormControl>
                <TextField fullWidth label="Rationale (Why this stock?)" multiline rows={2} size="small" value={form.rationale} onChange={(e) => setForm({ ...form, rationale: e.target.value })} placeholder="Brief reason..." sx={{ mb: 2 }} />
                <Button variant="outlined" component="label" startIcon={<UploadFile />} color="success" size="small" fullWidth>
                  {pdfFile ? `📄 ${pdfFile.name}` : 'Upload Research Report PDF (Optional)'}
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
        <DialogTitle fontWeight="bold">Close Trade</DialogTitle>
        <DialogContent>
          {tradeToClose && (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Closing <strong>{getDisplayName(tradeToClose)}</strong> | Entry: ₹{tradeToClose.entryPrice}
              </Typography>
              <TextField fullWidth label="Exit Price" type="number" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} sx={{ mt: 2 }} autoFocus />
              {exitPrice && (
                <Alert severity={parseFloat(exitPrice) >= tradeToClose.entryPrice ? 'success' : 'error'} sx={{ mt: 2 }}>
                  P&L: <strong>{(((parseFloat(exitPrice) - tradeToClose.entryPrice) / tradeToClose.entryPrice) * 100).toFixed(2)}%</strong>
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

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
