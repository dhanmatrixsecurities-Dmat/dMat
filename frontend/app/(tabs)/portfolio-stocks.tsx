import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator, Animated, Linking,
} from 'react-native';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { PremiumUpgradeScreen } from './active-trades';

interface PortfolioStock {
  id: string;
  stockName: string;
  symbol: string;
  action: 'BUY' | 'SELL';
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

const isToday = (val: any): boolean => {
  try {
    let d: Date;
    if (val && typeof val.toDate === 'function') d = val.toDate();
    else d = new Date(val || 0);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  } catch { return false; }
};

const formatDate = (val: any): string => {
  try {
    let d: Date;
    if (val && typeof val.toDate === 'function') d = val.toDate();
    else d = new Date(val || 0);
    if (isNaN(d.getTime())) return '—';
    const now = new Date();
    const todayFlag = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    if (todayFlag) {
      return 'Today, ' + d.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
};

function PortfolioCard({ item }: { item: PortfolioStock }) {
  const isBuy = item.action === 'BUY';
  const entryPrice  = Number(item.entryPrice)  || 0;
  const targetPrice = Number(item.targetPrice) || 0;
  const stopLoss    = Number(item.stopLoss)    || 0;

  const potential = entryPrice > 0
    ? isBuy ? ((targetPrice - entryPrice) / entryPrice) * 100
             : ((entryPrice - targetPrice) / entryPrice) * 100
    : 0;
  const risk = entryPrice > 0
    ? isBuy ? ((entryPrice - stopLoss) / entryPrice) * 100
             : ((stopLoss - entryPrice) / entryPrice) * 100
    : 0;

  const openChart = () => {
    const symbol = `NSE:${item.stockName.toUpperCase().trim()}`;
    Linking.openURL(`https://www.tradingview.com/chart/?symbol=${symbol}`);
  };

  return (
    <View style={s.card}>

      {/* TOP ROW: name + badges + Live Chart */}
      <View style={s.cardTop}>
        <View style={s.cardTopLeft}>
          <View style={s.stockNameRow}>
            <Text style={s.stockName}>{item.stockName}</Text>
            {isToday(item.createdAt) && (
              <View style={s.todayBadge}><Text style={s.todayBadgeText}>Today</Text></View>
            )}
          </View>
          <View style={s.badgeRow}>
            <View style={[s.typeBadge, isBuy ? s.buyBadge : s.sellBadge]}>
              <Text style={[s.typeText, isBuy ? s.buyText : s.sellText]}>{item.action}</Text>
            </View>
            <View style={s.portfolioBadge}>
              <Text style={s.portfolioBadgeText}>Portfolio / Long Term</Text>
            </View>
          </View>
        </View>

        {/* Live Chart top-right */}
        <TouchableOpacity style={s.chartBtn} onPress={openChart} activeOpacity={0.75}>
          <Text style={s.chartBtnEmoji}>📈</Text>
          <Text style={s.chartBtnText}>Live Chart</Text>
        </TouchableOpacity>
      </View>

      {/* PRICE GRID */}
      <View style={s.priceGrid}>
        <View style={s.priceItem}>
          <Text style={s.priceLabel}>Entry</Text>
          <Text style={s.priceValue}>₹{entryPrice.toFixed(2)}</Text>
        </View>
        <View style={[s.priceItem, s.priceBorder]}>
          <Text style={s.priceLabel}>Target</Text>
          <Text style={[s.priceValue, s.targetColor]}>₹{targetPrice.toFixed(2)}</Text>
        </View>
        <View style={s.priceItem}>
          <Text style={s.priceLabel}>Stop Loss</Text>
          <Text style={[s.priceValue, s.slColor]}>{stopLoss > 0 ? `₹${stopLoss.toFixed(2)}` : 'N/A'}</Text>
        </View>
      </View>

      {/* METRICS */}
      <View style={s.metricsRow}>
        <View style={s.metricBox}>
          <Text style={s.metricLabel}>Potential</Text>
          <Text style={[s.metricValue, s.targetColor]}>{`+${potential.toFixed(2)}%`}</Text>
        </View>
        <View style={s.metricBox}>
          <Text style={s.metricLabel}>Risk</Text>
          <Text style={[s.metricValue, s.slColor]}>{stopLoss > 0 ? `-${Math.abs(risk).toFixed(2)}%` : 'N/A'}</Text>
        </View>
        <View style={s.metricBox}>
          <Text style={s.metricLabel}>Horizon</Text>
          <Text style={s.metricValue}>{item.horizon || '1–5 Yr'}</Text>
        </View>
      </View>

      {/* PDF BANNER */}
      {item.pdfUrl && (
        <TouchableOpacity
          style={s.pdfBanner}
          onPress={() => Linking.openURL(item.pdfUrl!)}
          activeOpacity={0.8}
        >
          <View style={s.pdfIconWrap}>
            <Ionicons name="document-text-outline" size={16} color="#a5d6a7" />
          </View>
          <View style={s.pdfTextWrap}>
            <Text style={s.pdfTitle}>Research Report</Text>
            <Text style={s.pdfName} numberOfLines={1}>{item.pdfName || 'View Research PDF'}</Text>
          </View>
          <View style={s.pdfBtn}>
            <Text style={s.pdfBtnText}>View PDF</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* FOOTER: date */}
      <View style={s.footer}>
        <Ionicons name="time-outline" size={13} color="#81c784" />
        <Text style={s.footerDate}>{formatDate(item.createdAt)}</Text>
      </View>
    </View>
  );
}

export default function PortfolioStocksScreen() {
  const { userData } = useAuth();
  const [stocks, setStocks]       = useState<PortfolioStock[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (userData?.status !== 'ACTIVE') { setLoading(false); return; }
    const q = query(collection(db, 'portfolioStocks'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((s: any) => s.showInApp !== false) as PortfolioStock[];
      const sorted = [...data].sort((a, b) => {
        const aT = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bT = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bT - aT;
      });
      setStocks(sorted);
      setLoading(false);
      setRefreshing(false);
    }, () => { setLoading(false); setRefreshing(false); });
    return () => unsub();
  }, [userData]);

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#4caf50" />
    </View>
  );

  if (userData?.status === 'BLOCKED') return (
    <View style={s.center}>
      <Ionicons name="lock-closed" size={64} color="#ef5350" />
      <Text style={s.blockedTitle}>Account Blocked</Text>
      <Text style={s.blockedSub}>Please contact support.</Text>
    </View>
  );

  if (userData?.status === 'FREE') return <PremiumUpgradeScreen />;

  if (stocks.length === 0) return (
    <View style={s.center}>
      <Ionicons name="leaf-outline" size={72} color="#4caf50" />
      <Text style={s.emptyTitle}>No Portfolio Stocks Yet</Text>
      <Text style={s.emptySub}>Long-term picks will appear here once posted by admin</Text>
    </View>
  );

  return (
    <View style={s.screen}>
      {/* Header banner */}
      <View style={s.headerBanner}>
        <View style={s.headerLeft}>
          <Text style={s.headerTitle}>Portfolio Stocks</Text>
          <Text style={s.headerSub}>Long-term wealth creation picks</Text>
        </View>
        <View style={s.countBadge}>
          <Text style={s.countText}>{stocks.length}</Text>
          <Text style={s.countLabel}>Stocks</Text>
        </View>
      </View>

      <FlatList
        data={stocks}
        renderItem={({ item }) => <PortfolioCard item={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1500); }}
            colors={['#4caf50']}
            tintColor="#4caf50"
          />
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: '#f1f8f4' },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#f1f8f4' },

  headerBanner: {
    backgroundColor: '#0f4a24',
    paddingHorizontal: 18, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: '#1a6030',
  },
  headerLeft:  {},
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#e8f5e9' },
  headerSub:   { fontSize: 12, color: '#81c784', marginTop: 2 },
  countBadge:  { backgroundColor: '#1b5e20', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', borderWidth: 1, borderColor: '#2e7d32' },
  countText:   { fontSize: 20, fontWeight: '900', color: '#69f0ae' },
  countLabel:  { fontSize: 10, color: '#a5d6a7', fontWeight: '600' },

  // ── CARD ──
  card: {
    backgroundColor: '#0f4a24',
    borderRadius: 16, padding: 16,
    marginBottom: 16,
    borderWidth: 1, borderColor: '#2e7d32',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },

  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTopLeft: { flex: 1 },

  stockNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  stockName:    { fontSize: 20, fontWeight: '900', color: '#f1f8e9' },
  todayBadge:   { backgroundColor: '#1b5e20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: '#2e7d32' },
  todayBadgeText: { fontSize: 10, fontWeight: '700', color: '#69f0ae' },

  badgeRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeBadge:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  buyBadge:      { backgroundColor: '#2e7d32', borderWidth: 1, borderColor: '#43a047' },
  sellBadge:     { backgroundColor: '#b71c1c', borderWidth: 1, borderColor: '#c62828' },
  typeText:      { fontSize: 11, fontWeight: '800' },
  buyText:       { color: '#b9f6ca' },
  sellText:      { color: '#ffcdd2' },
  portfolioBadge: { backgroundColor: '#1b5e20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#33691e' },
  portfolioBadgeText: { fontSize: 10, fontWeight: '700', color: '#ccff90' },

  chartBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1b5e20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#2e7d32' },
  chartBtnEmoji: { fontSize: 12 },
  chartBtnText:  { fontSize: 11, fontWeight: '700', color: '#69f0ae' },

  // PRICE GRID
  priceGrid: { flexDirection: 'row', backgroundColor: '#1b5e20', borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#2e7d32' },
  priceItem:  { flex: 1, alignItems: 'center' },
  priceBorder: { borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: '#2e7d32' },
  priceLabel: { fontSize: 10, color: '#a5d6a7', marginBottom: 3 },
  priceValue: { fontSize: 15, fontWeight: '800', color: '#f1f8e9' },
  targetColor: { color: '#69f0ae' },
  slColor:     { color: '#ff8a80' },

  // METRICS
  metricsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  metricBox:  { flex: 1, backgroundColor: '#1b5e20', borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#2e7d32' },
  metricLabel: { fontSize: 10, color: '#a5d6a7', marginBottom: 2 },
  metricValue: { fontSize: 14, fontWeight: '800', color: '#f1f8e9' },

  // PDF BANNER
  pdfBanner: { backgroundColor: '#1b3a0a', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#2e6b10', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  pdfIconWrap: { backgroundColor: '#2e6b10', borderRadius: 6, padding: 6 },
  pdfTextWrap: { flex: 1 },
  pdfTitle:    { fontSize: 12, fontWeight: '700', color: '#c8e6c9' },
  pdfName:     { fontSize: 10, color: '#81c784', marginTop: 1 },
  pdfBtn:      { backgroundColor: '#2e7d32', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#388e3c' },
  pdfBtnText:  { fontSize: 11, fontWeight: '700', color: '#f1f8e9' },

  // FOOTER
  footer:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerDate: { fontSize: 11, color: '#81c784' },

  // EMPTY / BLOCKED
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: '#2e7d32', marginTop: 16, textAlign: 'center' },
  emptySub:     { fontSize: 13, color: '#558b2f', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  blockedTitle: { fontSize: 22, fontWeight: '800', color: '#ef5350', marginTop: 16 },
  blockedSub:   { fontSize: 14, color: '#9e9e9e', marginTop: 8 },
});
