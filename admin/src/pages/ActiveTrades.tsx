import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

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

export default function AdminActiveTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');

  useEffect(() => {
    const q = query(collection(db, 'trades'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setTrades(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trade)));
    });
    return unsub;
  }, []);

  const isFutOpt = form.tradeType === 'Futures' || form.tradeType === 'Options';
  const isOptions = form.tradeType === 'Options';

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
        setEditId(null);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'trades'), payload);
      }
      setForm(emptyForm);
    } catch (err) {
      console.error(err);
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
  };

  const handleClose = async (id: string) => {
    await updateDoc(doc(db, 'trades', id), { status: 'closed' });
  };

  const displayTrades = activeTab === 'active'
    ? trades.filter((t) => t.status === 'active')
    : trades;

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">📊 Manage Active Trades</h1>

        {/* ── FORM ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-5">
            {editId ? '✏️ Edit Trade' : '➕ Add New Trade'}
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Row 1: Symbol, Type, Action */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className={labelCls}>Symbol *</label>
                <input
                  className={inputCls}
                  placeholder="e.g. NIFTY, RELIANCE"
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Trade Type *</label>
                <select
                  className={inputCls}
                  value={form.tradeType}
                  onChange={(e) => setForm({ ...form, tradeType: e.target.value as TradeType })}
                >
                  <option value="Equity">Equity</option>
                  <option value="Futures">Futures</option>
                  <option value="Options">Options</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Action *</label>
                <select
                  className={inputCls}
                  value={form.action}
                  onChange={(e) => setForm({ ...form, action: e.target.value as Action })}
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
            </div>

            {/* Row 2: Prices */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className={labelCls}>Entry Price *</label>
                <input
                  className={inputCls}
                  type="number"
                  placeholder="0.00"
                  value={form.entryPrice}
                  onChange={(e) => setForm({ ...form, entryPrice: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Target Price *</label>
                <input
                  className={inputCls}
                  type="number"
                  placeholder="0.00"
                  value={form.targetPrice}
                  onChange={(e) => setForm({ ...form, targetPrice: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Stop Loss *</label>
                <input
                  className={inputCls}
                  type="number"
                  placeholder="0.00"
                  value={form.stopLoss}
                  onChange={(e) => setForm({ ...form, stopLoss: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* ── FUTURES & OPTIONS FIELDS ─────────────────── */}
            {isFutOpt && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <p className="text-xs font-bold text-blue-700 mb-3 uppercase tracking-wide">
                  {form.tradeType} Fields
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {/* Lot Size */}
                  <div>
                    <label className={labelCls}>Lot Size</label>
                    <input
                      className={inputCls}
                      type="number"
                      placeholder="e.g. 50"
                      value={form.lotSize}
                      onChange={(e) => setForm({ ...form, lotSize: e.target.value })}
                    />
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className={labelCls}>Expiry Date</label>
                    <input
                      className={inputCls}
                      type="date"
                      value={form.expiryDate}
                      onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className={labelCls}>Duration</label>
                    <input
                      className={inputCls}
                      placeholder="e.g. Weekly, Monthly"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    />
                  </div>
                </div>

                {/* OPTIONS ONLY: Strike + CE/PE */}
                {isOptions && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className={labelCls}>Strike Price</label>
                      <input
                        className={inputCls}
                        type="number"
                        placeholder="e.g. 25150"
                        value={form.strikePrice}
                        onChange={(e) => setForm({ ...form, strikePrice: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Option Type (CE / PE)</label>
                      <select
                        className={inputCls}
                        value={form.optionType}
                        onChange={(e) => setForm({ ...form, optionType: e.target.value as OptionType })}
                      >
                        <option value="CE">CE — Call Option</option>
                        <option value="PE">PE — Put Option</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div>
                <label className={labelCls}>Status</label>
                <select
                  className={inputCls}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition disabled:opacity-50"
              >
                {loading ? 'Saving…' : editId ? 'Update Trade' : 'Add Trade'}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={() => { setEditId(null); setForm(emptyForm); }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-2.5 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── TRADE LIST ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-800">Trades</h2>
            <div className="flex gap-2">
              {(['active', 'all'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                    activeTab === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t === 'active' ? 'Active' : 'All'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Symbol', 'Type', 'Action', 'Entry', 'Target', 'SL', 'Lot', 'Strike', 'Expiry', 'Duration', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayTrades.map((trade) => (
                  <tr key={trade.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="py-3 pr-4 font-bold text-gray-900">{trade.symbol}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        trade.tradeType === 'Options' ? 'bg-purple-100 text-purple-700' :
                        trade.tradeType === 'Futures' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {trade.tradeType}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        trade.action === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {trade.action}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">₹{trade.entryPrice}</td>
                    <td className="py-3 pr-4 text-green-600 font-semibold">₹{trade.targetPrice}</td>
                    <td className="py-3 pr-4 text-red-500 font-semibold">₹{trade.stopLoss}</td>
                    <td className="py-3 pr-4 text-gray-500">{trade.lotSize || '—'}</td>
                    <td className="py-3 pr-4">
                      {trade.strikePrice && trade.optionType ? (
                        <span className="text-purple-700 font-semibold">
                          {trade.strikePrice} {trade.optionType}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{trade.expiryDate || '—'}</td>
                    <td className="py-3 pr-4 text-gray-500">{trade.duration || '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        trade.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {trade.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(trade)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                        >
                          Edit
                        </button>
                        {trade.status === 'active' && (
                          <button
                            onClick={() => handleClose(trade.id)}
                            className="text-amber-600 hover:text-amber-800 text-xs font-semibold"
                          >
                            Close
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(trade.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {displayTrades.length === 0 && (
                  <tr>
                    <td colSpan={12} className="text-center text-gray-400 py-8">
                      No trades found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
