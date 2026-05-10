import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { PremiumUpgradeScreen } from './(tabs)/active-trades';

interface PortfolioStock {
  id: string; stockName?: string; symbol?: string;
  action?: 'BUY' | 'SELL'; type?: 'BUY' | 'SELL';
  entryPrice: number; targetPrice: number; stopLoss: number;
  horizon?: string; pdfUrl?: string; pdfName?: string;
  showInApp?: boolean; createdAt: any;
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
    if (todayFlag) return 'Today, ' + d.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
};

function PortfolioCard({ item }: { item: PortfolioStock }) {
  const action      = item.action || item.type || 'BUY';
  const isBuy       = action === 'BUY';
  const stockName   = item.stockName || item.symbol || '—';
  const entryPrice  = Number(item.entryPrice)  || 0;
  const targetPrice = Number(item.targetPrice) || 0;
  const stopLoss    = Number(item.stopLoss)    || 0;
  const potential   = entryPrice > 0 ? (isBuy ? ((targetPrice - entryPrice) / entryPrice) : ((entryPrice - targetPrice) / entryPrice)) * 100 : 0;
  const risk        = entryPrice > 0 ? (isBuy ? ((entryPrice - stopLoss) / entryPrice) : ((stopLoss - entryPrice) / entryPrice)) * 100 : 0;
  const openChart   = () => Linking.openURL(`https://www.tradingview.com/chart/?symbol=NSE:${stockName.toUpperCase().trim()}`);

  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.cardTopLeft}>
          <View style={s.stockNameRow}>
            <Text style={s.stockName}>{stockName}</Text>
            {isToday(item.createdAt) && <View style={s.todayBadge}><Text style={s.todayBadgeText}>Today</Text></View>}
          </View>
          <View style={s.badgeRow}>
            <View style={[s.typeBadge, isBuy ? s.buyBadge : s.sellBadge]}>
              <Text style={[s.typeText, isBuy ? s.buyText : s.sellText]}>{action}</Text>
            </View>
            <View style={s.portfolioBadge}><Text style={s.portfolioBadgeText}>Portfolio / Long Term</Text></View>
          </View>
        </View>
        <TouchableOpacity style={s.chartBtn} onPress={openChart} activeOpacity={0.75}>
          <Text style={s.chartBtnEmoji}>📈</Text>
          <Text style={s.chartBtnText}>Live Chart</Text>
        </TouchableOpacity>
      </View>

      <View style={s.priceGrid}>
        <View style={s.priceItem}><Text style={s.priceLabel}>Entry</Text><Text style={s.priceValue}>₹{entryPrice.toFixed(2)}</Text></View>
        <View style={[s.priceItem, s.priceBorder]}><Text style={s.priceLabel}>Target</Text><Text style={[s.priceValue, s.targetColor]}>₹{targetPrice.toFixed(2)}</Text></View>
        <View style={s.priceItem}><Text style={s.priceLabel}>Stop Loss</Text><Text style={[s.priceValue, s.slColor]}>{stopLoss > 0 ? `₹${stopLoss.toFixed(2)}` : 'N/A'}</Text></View>
      </View>

      <View style={s.metricsRow}>
        <View style={s.metricBox}><Text style={s.metricLabel}>Potential</Text><Text style={[s.metricValue, s.targetColor]}>{`+${potential.toFixed(2)}%`}</Text></View>
        <View style={s.metricBox}><Text style={s.metricLabel}>Risk</Text><Text style={[s.metricValue, s.slColor]}>{stopLoss > 0 ? `-${Math.abs(risk).toFixed(2)}%` : 'N/A'}</Text></View>
        <View style={s.metricBox}><Text style={s.metricLabel}>Horizon</Text><Text style={s.metricValue}>{item.horizon || '1–5 Yr'}</Text></View>
      </View>

      {item.pdfUrl ? (
        <TouchableOpacity style={s.pdfBanner} onPress={() => Linking.openURL(item.pdfUrl!)} activeOpacity={0.8}>
          <View style={s.pdfIconWrap}><Ionicons name="document-text-outline" size={16} color="#a5d6a7" /></View>
          <View style={s.pdfTextWrap}>
            <Text style={s.pdfTitle}>Research Report</Text>
            <Text style={s.pdfName} numberOfLines={1}>{item.pdfName || 'View Research PDF'}</Text>
          </View>
          <View style={s.pdfBtn}><Text style={s.pdfBtnText}>View PDF</Text></View>
        </TouchableOpacity>
      ) : null}

      <View style={s.footer}>
        <Ionicons name="time-outline" size={13} color="#81c784" />
        <Text style={s.footerDate}>{formatDate(item.createdAt)}</Text>
      </View>
    </View>
  );
}

// ── Header component reused in all states ─────────────────────────────────────
function PortfolioHeader({ count }: { count?: number }) {
  return (
    <View style={s.pageHeader}>
      <View style={s.pageTitleRow}>
        <Text style={s.pageTitle}>Portfolio Stocks</Text>
        {count !== undefined && <Text style={s.pageCount}>{count} active</Text>}
      </View>
      <Text style={s.pageSubtitle}>Long Term Investments</Text>
    </View>
  );
}

export default function PortfolioStocksScreen() {
  const { userData }                      = useAuth();
  const theme                             = useTheme();
  const [stocks,     setStocks]           = useState<PortfolioStock[]>([]);
  const [loading,    setLoading]          = useState(true);
  const [refreshing, setRefreshing]       = useState(false);

  useEffect(() => {
    if (userData?.status !== 'ACTIVE') { setLoading(false); return; }
    const allStocks: { [id: string]: PortfolioStock } = {};
    const unsub1 = onSnapshot(collection(db, 'activeTrades'), (snap) => {
      Object.keys(allStocks).forEach(k => { if (k.startsWith('active_')) delete allStocks[k]; });
      snap.docs.forEach(d => {
        const data = d.data();
        if ((data.segment || '').toLowerCase() === 'portfolio' && data.showInApp !== false)
          allStocks[`active_${d.id}`] = { id: d.id, ...data } as PortfolioStock;
      });
      updateList();
    });
    const unsub2 = onSnapshot(collection(db, 'portfolioStocks'), (snap) => {
      Object.keys(allStocks).forEach(k => { if (k.startsWith('port_')) delete allStocks[k]; });
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.showInApp !== false) allStocks[`port_${d.id}`] = { id: d.id, ...data } as PortfolioStock;
      });
      updateList();
    });
    function updateList() {
      const sorted = Object.values(allStocks).sort((a, b) => {
        const aT = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bT = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bT - aT;
      });
      setStocks(sorted); setLoading(false); setRefreshing(false);
    }
    return () => { unsub1(); unsub2(); };
  }, [userData]);

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0d1b3e' }} edges={['top']}>
      <StatusBar style="light" backgroundColor="#0d1b3e" translucent={false} />
      <PortfolioHeader />
      <View style={[s.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#4caf50" />
      </View>
    </SafeAreaView>
  );

  // ── BLOCKED ───────────────────────────────────────────────────────────────
  if (userData?.status === 'BLOCKED') return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0d1b3e' }} edges={['top']}>
      <StatusBar style="light" backgroundColor="#0d1b3e" translucent={false} />
      <PortfolioHeader />
      <View style={[s.center, { backgroundColor: theme.background }]}>
        <Ionicons name="lock-closed" size={64} color="#ef5350" />
        <Text style={s.blockedTitle}>Account Blocked</Text>
      </View>
    </SafeAreaView>
  );

  // ── FREE — header stays dark blue, upgrade card below ────────────────────
  if (userData?.status === 'FREE') return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0d1b3e' }} edges={['top']}>
      <StatusBar style="light" backgroundColor="#0d1b3e" translucent={false} />
      <PortfolioHeader />
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <PremiumUpgradeScreen />
      </View>
    </SafeAreaView>
  );

  // ── ACTIVE but no portfolio access — show locked screen ──────────────────
  const access = (userData as any)?.subscriptionAccess || 'none';
  const hasPortfolioAccess = access === 'portfolio' || access === 'all';

  if (!hasPortfolioAccess) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0d1b3e' }} edges={['top']}>
      <StatusBar style="light" backgroundColor="#0d1b3e" translucent={false} />
      <PortfolioHeader />
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#1a6030', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Ionicons name="lock-closed" size={40} color="#4ade80" />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text, textAlign: 'center', marginBottom: 8 }}>
          Portfolio Access Locked
        </Text>
        <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
          Your current plan does not include Portfolio Stocks access.
        </Text>
        <View style={{ backgroundColor: theme.isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' }}>
          <Ionicons name="headset-outline" size={18} color="#6366f1" />
          <Text style={{ fontSize: 13, color: '#4338ca', fontWeight: '600', flex: 1 }}>
            Contact admin to upgrade to Portfolio or All Pages plan
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );

  // ── EMPTY ─────────────────────────────────────────────────────────────────
  if (stocks.length === 0) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0d1b3e' }} edges={['top']}>
      <StatusBar style="light" backgroundColor="#0d1b3e" translucent={false} />
      <PortfolioHeader count={0} />
      <View style={[s.center, { backgroundColor: theme.background }]}>
        <Ionicons name="leaf-outline" size={72} color="#4caf50" />
        <Text style={[s.emptyTitle, { color: theme.isDark ? '#4ade80' : '#2e7d32' }]}>No Portfolio Stocks Yet</Text>
        <Text style={[s.emptySub, { color: theme.isDark ? '#86efac' : '#558b2f' }]}>Long-term picks will appear here once posted by admin</Text>
      </View>
    </SafeAreaView>
  );

  // ── ACTIVE ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0d1b3e' }} edges={['top']}>
      <StatusBar style="light" backgroundColor="#0d1b3e" translucent={false} />
      <PortfolioHeader count={stocks.length} />
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <FlatList
          style={{ flex: 1, backgroundColor: theme.background }}
          data={stocks}
          renderItem={({ item }) => <PortfolioCard item={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32, backgroundColor: theme.background }}
          refreshControl={
            <RefreshControl refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1500); }}
              colors={['#4caf50']} tintColor="#4caf50" />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  pageHeader:   { backgroundColor: '#0d1b3e', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a3460' },
  pageTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  pageTitle:    { fontSize: 18, fontWeight: '800', color: '#fff' },
  pageCount:    { fontSize: 11, color: '#4ecfa8', fontWeight: '600' },
  pageSubtitle: { fontSize: 11, color: 'rgba(180,200,255,0.6)', marginTop: 3 },
  card: { backgroundColor: '#0f4a24', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2e7d32', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  cardTop:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTopLeft:        { flex: 1 },
  stockNameRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  stockName:          { fontSize: 20, fontWeight: '900', color: '#f1f8e9' },
  todayBadge:         { backgroundColor: '#1b5e20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: '#2e7d32' },
  todayBadgeText:     { fontSize: 10, fontWeight: '700', color: '#69f0ae' },
  badgeRow:           { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeBadge:          { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  buyBadge:           { backgroundColor: '#2e7d32', borderWidth: 1, borderColor: '#43a047' },
  sellBadge:          { backgroundColor: '#b71c1c', borderWidth: 1, borderColor: '#c62828' },
  typeText:           { fontSize: 11, fontWeight: '800' },
  buyText:            { color: '#b9f6ca' },
  sellText:           { color: '#ffcdd2' },
  portfolioBadge:     { backgroundColor: '#1b5e20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#33691e' },
  portfolioBadgeText: { fontSize: 10, fontWeight: '700', color: '#ccff90' },
  chartBtn:           { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1b5e20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#2e7d32' },
  chartBtnEmoji:      { fontSize: 12 },
  chartBtnText:       { fontSize: 11, fontWeight: '700', color: '#69f0ae' },
  priceGrid:    { flexDirection: 'row', backgroundColor: '#1b5e20', borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#2e7d32' },
  priceItem:    { flex: 1, alignItems: 'center' },
  priceBorder:  { borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: '#2e7d32' },
  priceLabel:   { fontSize: 10, color: '#a5d6a7', marginBottom: 3 },
  priceValue:   { fontSize: 15, fontWeight: '800', color: '#f1f8e9' },
  targetColor:  { color: '#69f0ae' },
  slColor:      { color: '#ff8a80' },
  metricsRow:   { flexDirection: 'row', gap: 8, marginBottom: 10 },
  metricBox:    { flex: 1, backgroundColor: '#1b5e20', borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#2e7d32' },
  metricLabel:  { fontSize: 10, color: '#a5d6a7', marginBottom: 2 },
  metricValue:  { fontSize: 14, fontWeight: '800', color: '#f1f8e9' },
  pdfBanner:    { backgroundColor: '#1b3a0a', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#2e6b10', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  pdfIconWrap:  { backgroundColor: '#2e6b10', borderRadius: 6, padding: 6 },
  pdfTextWrap:  { flex: 1 },
  pdfTitle:     { fontSize: 12, fontWeight: '700', color: '#c8e6c9' },
  pdfName:      { fontSize: 10, color: '#81c784', marginTop: 1 },
  pdfBtn:       { backgroundColor: '#2e7d32', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#388e3c' },
  pdfBtnText:   { fontSize: 11, fontWeight: '700', color: '#f1f8e9' },
  footer:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerDate:   { fontSize: 11, color: '#81c784' },
  emptyTitle:   { fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  emptySub:     { fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  blockedTitle: { fontSize: 22, fontWeight: '800', color: '#ef5350', marginTop: 16 },
});
