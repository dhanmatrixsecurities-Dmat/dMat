import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, SectionList, RefreshControl,
  TouchableOpacity, ActivityIndicator, Linking, LayoutAnimation,
  Platform, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { PremiumUpgradeScreen } from './(tabs)/active-trades';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental)
  UIManager.setLayoutAnimationEnabledExperimental(true);

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortfolioStock {
  id: string;
  stockName?: string; symbol?: string;
  action?: 'BUY' | 'SELL'; type?: 'BUY' | 'SELL';
  entryPrice: number; targetPrice: number; stopLoss: number;
  horizon?: string; pdfUrl?: string; pdfName?: string;
  showInApp?: boolean; createdAt: any;
  rationale?: string;
  // Exit fields — admin sets these to close a trade
  status?: 'active' | 'closed' | 'exited';
  exitPrice?: number;
  exitDate?: any;
  exitNote?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isToday = (val: any): boolean => {
  try {
    let d: Date;
    if (val && typeof val.toDate === 'function') d = val.toDate();
    else d = new Date(val || 0);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return d.getFullYear() === now.getFullYear() &&
           d.getMonth()    === now.getMonth()    &&
           d.getDate()     === now.getDate();
  } catch { return false; }
};

const formatDate = (val: any): string => {
  try {
    let d: Date;
    if (val && typeof val.toDate === 'function') d = val.toDate();
    else d = new Date(val || 0);
    if (isNaN(d.getTime())) return '—';
    const now = new Date();
    const todayFlag =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth()    === now.getMonth()    &&
      d.getDate()     === now.getDate();
    if (todayFlag)
      return 'Today, ' + d.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return '—'; }
};

const isClosed = (item: PortfolioStock) =>
  item.status === 'closed' || item.status === 'exited' ||
  (item.exitPrice !== undefined && item.exitPrice > 0);

// ─── Active card ──────────────────────────────────────────────────────────────

function ActiveCard({ item }: { item: PortfolioStock }) {
  const [expanded, setExpanded] = useState(false);

  const action      = item.action || item.type || 'BUY';
  const isBuy       = action === 'BUY';
  const stockName   = item.stockName || item.symbol || '—';
  const entryPrice  = Number(item.entryPrice)  || 0;
  const targetPrice = Number(item.targetPrice) || 0;
  const stopLoss    = Number(item.stopLoss)    || 0;
  const potential   = entryPrice > 0
    ? (isBuy ? (targetPrice - entryPrice) / entryPrice : (entryPrice - targetPrice) / entryPrice) * 100
    : 0;
  const risk = entryPrice > 0 && stopLoss > 0
    ? (isBuy ? (entryPrice - stopLoss) / entryPrice : (stopLoss - entryPrice) / entryPrice) * 100
    : 0;

  const openChart = () =>
    Linking.openURL(`https://www.tradingview.com/chart/?symbol=NSE:${stockName.toUpperCase().trim()}`);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(p => !p);
  };

  return (
    <View style={s.card}>

      {/* Top */}
      <View style={s.cardTop}>
        <View style={s.cardTopLeft}>
          <View style={s.stockNameRow}>
            <Text style={s.stockName}>{stockName}</Text>
            {isToday(item.createdAt) && (
              <View style={s.todayBadge}><Text style={s.todayBadgeText}>Today</Text></View>
            )}
          </View>
          <View style={s.badgeRow}>
            <View style={[s.typeBadge, isBuy ? s.buyBadge : s.sellBadge]}>
              <Text style={[s.typeText, isBuy ? s.buyText : s.sellText]}>{action}</Text>
            </View>
            <View style={s.portfolioBadge}>
              <Text style={s.portfolioBadgeText}>Portfolio / Long Term</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={s.chartBtn} onPress={openChart} activeOpacity={0.75}>
          <Text style={s.chartBtnEmoji}>📈</Text>
          <Text style={s.chartBtnText}>Live Chart</Text>
        </TouchableOpacity>
      </View>

      {/* Price grid */}
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
          <Text style={[s.priceValue, s.slColor]}>
            {stopLoss > 0 ? `₹${stopLoss.toFixed(2)}` : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Metrics */}
      <View style={s.metricsRow}>
        <View style={s.metricBox}>
          <Text style={s.metricLabel}>Potential</Text>
          <Text style={[s.metricValue, s.targetColor]}>{`+${potential.toFixed(2)}%`}</Text>
        </View>
        <View style={s.metricBox}>
          <Text style={s.metricLabel}>Risk</Text>
          <Text style={[s.metricValue, s.slColor]}>
            {stopLoss > 0 ? `-${Math.abs(risk).toFixed(2)}%` : 'N/A'}
          </Text>
        </View>
        <View style={s.metricBox}>
          <Text style={s.metricLabel}>Horizon</Text>
          <Text style={s.metricValue}>{item.horizon || '1–5 Yr'}</Text>
        </View>
      </View>

      {/* Rationale — collapsible */}
      {item.rationale ? (
        <View style={s.rationaleWrap}>
          <TouchableOpacity style={s.rationaleToggle} onPress={toggle} activeOpacity={0.75}>
            <View style={s.rationaleDotRow}>
              <View style={s.rationaleDot} />
              <Text style={s.rationaleToggleText}>Why this stock?</Text>
            </View>
            <View style={s.rationaleChevronWrap}>
              {!expanded && (
                <Text style={s.rationalePreview} numberOfLines={1}>{item.rationale}</Text>
              )}
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={14} color="#69f0ae"
              />
            </View>
          </TouchableOpacity>
          {expanded && (
            <View style={s.rationaleBody}>
              <Text style={s.rationaleText}>{item.rationale}</Text>
            </View>
          )}
        </View>
      ) : null}

      {/* PDF */}
      {item.pdfUrl ? (
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
          <View style={s.pdfBtn}><Text style={s.pdfBtnText}>View PDF</Text></View>
        </TouchableOpacity>
      ) : null}

      {/* Footer */}
      <View style={s.footer}>
        <Ionicons name="time-outline" size={13} color="#81c784" />
        <Text style={s.footerDate}>{formatDate(item.createdAt)}</Text>
      </View>

    </View>
  );
}

// ─── Closed / Exited card ─────────────────────────────────────────────────────

function ClosedCard({ item }: { item: PortfolioStock }) {
  const [expanded, setExpanded] = useState(false);

  const action      = item.action || item.type || 'BUY';
  const isBuy       = action === 'BUY';
  const stockName   = item.stockName || item.symbol || '—';
  const entryPrice  = Number(item.entryPrice) || 0;
  const exitPrice   = Number(item.exitPrice)  || 0;

  const gainPct = entryPrice > 0
    ? (isBuy
        ? (exitPrice - entryPrice) / entryPrice
        : (entryPrice - exitPrice) / entryPrice) * 100
    : 0;
  const isGain  = gainPct >= 0;
  const gainStr = `${isGain ? '+' : ''}${gainPct.toFixed(2)}%`;
  const gainAmt = exitPrice - entryPrice;
  const gainAmtStr = `${gainAmt >= 0 ? '+' : ''}₹${Math.abs(gainAmt).toFixed(2)}`;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(p => !p);
  };

  return (
    <View style={s.closedCard}>

      {/* Header row */}
      <View style={s.closedTop}>
        <View style={{ flex: 1 }}>
          <View style={s.stockNameRow}>
            <Text style={s.closedStockName}>{stockName}</Text>
            <View style={s.exitedBadge}>
              <Ionicons name="checkmark-circle-outline" size={11} color="#90caf9" />
              <Text style={s.exitedBadgeText}>EXITED</Text>
            </View>
          </View>
          <View style={s.badgeRow}>
            <View style={[s.typeBadge, isBuy ? s.buyBadgeDim : s.sellBadgeDim]}>
              <Text style={[s.typeText, { color: '#90a4ae' }]}>{action}</Text>
            </View>
            <View style={s.portfolioBadgeDim}>
              <Text style={s.portfolioBadgeDimText}>Portfolio / Long Term</Text>
            </View>
          </View>
        </View>
        {/* Final P&L */}
        <View style={[s.plBox, isGain ? s.plBoxGain : s.plBoxLoss]}>
          <Text style={s.plLabel}>Final P&L</Text>
          <Text style={[s.plPct, isGain ? s.plGain : s.plLoss]}>{gainStr}</Text>
          <Text style={[s.plAmt, isGain ? s.plGain : s.plLoss]}>{gainAmtStr}</Text>
        </View>
      </View>

      {/* Price comparison */}
      <View style={s.closedPriceRow}>
        <View style={s.closedPriceBox}>
          <Text style={s.closedPriceLabel}>Entry price</Text>
          <Text style={s.closedPriceVal}>₹{entryPrice.toFixed(2)}</Text>
        </View>
        <View style={s.closedArrow}>
          <Ionicons name="arrow-forward" size={16} color="#546e7a" />
        </View>
        <View style={s.closedPriceBox}>
          <Text style={s.closedPriceLabel}>Exit price</Text>
          <Text style={[s.closedPriceVal, isGain ? s.plGain : s.plLoss]}>
            ₹{exitPrice.toFixed(2)}
          </Text>
        </View>
        <View style={s.closedPriceBox}>
          <Text style={s.closedPriceLabel}>Horizon</Text>
          <Text style={s.closedPriceVal}>{item.horizon || '—'}</Text>
        </View>
      </View>

      {/* Exit note — collapsible */}
      {(item.exitNote || item.rationale) ? (
        <View style={s.exitNoteWrap}>
          <TouchableOpacity style={s.exitNoteToggle} onPress={toggle} activeOpacity={0.75}>
            <Ionicons name="information-circle-outline" size={14} color="#90a4ae" />
            <Text style={s.exitNoteToggleText}>
              {item.exitNote ? 'Exit reason' : 'Why this stock was added'}
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={13} color="#546e7a" style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>
          {expanded && (
            <Text style={s.exitNoteText}>{item.exitNote || item.rationale}</Text>
          )}
        </View>
      ) : null}

      {/* Footer */}
      <View style={[s.footer, { marginTop: 8 }]}>
        <Ionicons name="calendar-outline" size={13} color="#546e7a" />
        <Text style={s.closedFooterDate}>
          Added {formatDate(item.createdAt)}
          {item.exitDate ? `  ·  Exited ${formatDate(item.exitDate)}` : ''}
        </Text>
      </View>

    </View>
  );
}

// ─── Section headers ──────────────────────────────────────────────────────────

function SectionHeader({ title, count, icon }: { title: string; count: number; icon: string }) {
  return (
    <View style={s.sectionHeader}>
      <Ionicons name={icon as any} size={14} color="#4ecfa8" />
      <Text style={s.sectionHeaderText}>{title}</Text>
      <View style={s.sectionHeaderBadge}>
        <Text style={s.sectionHeaderCount}>{count}</Text>
      </View>
    </View>
  );
}

// ─── Page header ──────────────────────────────────────────────────────────────

function PortfolioHeader({ active, closed }: { active?: number; closed?: number }) {
  return (
    <View style={s.pageHeader}>
      <View style={s.pageTitleRow}>
        <Text style={s.pageTitle}>Portfolio Stocks</Text>
        {active !== undefined && (
          <Text style={s.pageCount}>{active} active</Text>
        )}
      </View>
      <Text style={s.pageSubtitle}>Long Term Investments</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PortfolioStocksScreen() {
  const { userData }                = useAuth();
  const theme                       = useTheme();
  const [active,  setActive]        = useState<PortfolioStock[]>([]);
  const [closed,  setClosed]        = useState<PortfolioStock[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        if (data.showInApp !== false)
          allStocks[`port_${d.id}`] = { id: d.id, ...data } as PortfolioStock;
      });
      updateList();
    });

    function updateList() {
      const all = Object.values(allStocks).sort((a, b) => {
        const aT = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bT = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bT - aT;
      });
      setActive(all.filter(s => !isClosed(s)));
      setClosed(all.filter(s => isClosed(s)));
      setLoading(false);
      setRefreshing(false);
    }

    return () => { unsub1(); unsub2(); };
  }, [userData]);

  // ── Loading ──
  if (loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0d1b3e' }} edges={['top']}>
      <StatusBar style="light" backgroundColor="#0d1b3e" translucent={false} />
      <PortfolioHeader />
      <View style={[s.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#4caf50" />
      </View>
    </SafeAreaView>
  );

  // ── Blocked ──
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

  // ── Free ──
  if (userData?.status === 'FREE') return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0d1b3e' }} edges={['top']}>
      <StatusBar style="light" backgroundColor="#0d1b3e" translucent={false} />
      <PortfolioHeader />
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <PremiumUpgradeScreen />
      </View>
    </SafeAreaView>
  );

  // ── No plan access ──
  const access = (userData as any)?.subscriptionAccess || 'none';
  const hasAccess = access === 'portfolio' || access === 'all';
  if (!hasAccess) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0d1b3e' }} edges={['top']}>
      <StatusBar style="light" backgroundColor="#0d1b3e" translucent={false} />
      <PortfolioHeader />
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#1a6030', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Ionicons name="lock-closed" size={40} color="#4ade80" />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text, textAlign: 'center', marginBottom: 8 }}>Portfolio Access Locked</Text>
        <Text style={{ fontSize: 13, color: theme.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>Your current plan does not include Portfolio Stocks access.</Text>
        <View style={{ backgroundColor: theme.isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' }}>
          <Ionicons name="headset-outline" size={18} color="#6366f1" />
          <Text style={{ fontSize: 13, color: '#4338ca', fontWeight: '600', flex: 1 }}>Contact admin to upgrade to Portfolio or All Pages plan</Text>
        </View>
      </View>
    </SafeAreaView>
  );

  // ── Empty ──
  if (active.length === 0 && closed.length === 0) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0d1b3e' }} edges={['top']}>
      <StatusBar style="light" backgroundColor="#0d1b3e" translucent={false} />
      <PortfolioHeader active={0} closed={0} />
      <View style={[s.center, { backgroundColor: theme.background }]}>
        <Ionicons name="leaf-outline" size={72} color="#4caf50" />
        <Text style={[s.emptyTitle, { color: theme.isDark ? '#4ade80' : '#2e7d32' }]}>No Portfolio Stocks Yet</Text>
        <Text style={[s.emptySub, { color: theme.isDark ? '#86efac' : '#558b2f' }]}>Long-term picks will appear here once posted by admin</Text>
      </View>
    </SafeAreaView>
  );

  // ── Build sections for SectionList ──
  const sections: { title: string; icon: string; data: PortfolioStock[] }[] = [];
  if (active.length > 0)
    sections.push({ title: 'Active', icon: 'trending-up-outline', data: active });
  if (closed.length > 0)
    sections.push({ title: 'Exited', icon: 'checkmark-done-circle-outline', data: closed });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0d1b3e' }} edges={['top']}>
      <StatusBar style="light" backgroundColor="#0d1b3e" translucent={false} />
      <PortfolioHeader active={active.length} closed={closed.length} />
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <SectionList
          style={{ flex: 1, backgroundColor: theme.background }}
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <SectionHeader
              title={section.title === 'Active' ? `Active Holdings (${active.length})` : `Exited Trades (${closed.length})`}
              count={section.data.length}
              icon={section.icon}
            />
          )}
          renderItem={({ item, section }) =>
            section.title === 'Active'
              ? <ActiveCard item={item} />
              : <ClosedCard item={item} />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1500); }}
              colors={['#4caf50']} tintColor="#4caf50"
            />
          }
          SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  pageHeader:   { backgroundColor: '#0d1b3e', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a3460' },
  pageTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  pageTitle:    { fontSize: 18, fontWeight: '800', color: '#fff' },
  pageCount:    { fontSize: 11, color: '#4ecfa8', fontWeight: '600' },
  pageSubtitle: { fontSize: 11, color: 'rgba(180,200,255,0.6)', marginTop: 3 },

  // Section header
  sectionHeader:      { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10, marginTop: 4 },
  sectionHeaderText:  { fontSize: 12, fontWeight: '700', color: '#4ecfa8', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 },
  sectionHeaderBadge: { backgroundColor: '#0d3320', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, borderWidth: 1, borderColor: '#1a4a2a' },
  sectionHeaderCount: { fontSize: 10, fontWeight: '700', color: '#4ecfa8' },

  // ── Active card ──
  card:               { backgroundColor: '#0f4a24', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2e7d32', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5 },
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
  buyBadgeDim:        { backgroundColor: '#1a2e1a', borderWidth: 1, borderColor: '#2a3e2a' },
  sellBadgeDim:       { backgroundColor: '#2e1a1a', borderWidth: 1, borderColor: '#3e2a2a' },
  typeText:           { fontSize: 11, fontWeight: '800' },
  buyText:            { color: '#b9f6ca' },
  sellText:           { color: '#ffcdd2' },
  portfolioBadge:     { backgroundColor: '#1b5e20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#33691e' },
  portfolioBadgeText: { fontSize: 10, fontWeight: '700', color: '#ccff90' },
  portfolioBadgeDim:  { backgroundColor: '#1a2a1a', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#2a3a2a' },
  portfolioBadgeDimText:{ fontSize: 10, fontWeight: '700', color: '#607060' },
  chartBtn:           { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1b5e20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#2e7d32' },
  chartBtnEmoji:      { fontSize: 12 },
  chartBtnText:       { fontSize: 11, fontWeight: '700', color: '#69f0ae' },
  priceGrid:          { flexDirection: 'row', backgroundColor: '#1b5e20', borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#2e7d32' },
  priceItem:          { flex: 1, alignItems: 'center' },
  priceBorder:        { borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: '#2e7d32' },
  priceLabel:         { fontSize: 10, color: '#a5d6a7', marginBottom: 3 },
  priceValue:         { fontSize: 15, fontWeight: '800', color: '#f1f8e9' },
  targetColor:        { color: '#69f0ae' },
  slColor:            { color: '#ff8a80' },
  metricsRow:         { flexDirection: 'row', gap: 8, marginBottom: 10 },
  metricBox:          { flex: 1, backgroundColor: '#1b5e20', borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#2e7d32' },
  metricLabel:        { fontSize: 10, color: '#a5d6a7', marginBottom: 2 },
  metricValue:        { fontSize: 14, fontWeight: '800', color: '#f1f8e9' },

  // Rationale
  rationaleWrap:        { backgroundColor: '#0a3018', borderRadius: 10, borderWidth: 1, borderColor: '#1e5c2a', marginBottom: 10, overflow: 'hidden' },
  rationaleToggle:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10 },
  rationaleDotRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rationaleDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: '#69f0ae' },
  rationaleToggleText:  { fontSize: 11, fontWeight: '700', color: '#69f0ae', letterSpacing: 0.3 },
  rationaleChevronWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' },
  rationalePreview:     { fontSize: 11, color: '#81c784', flex: 1, textAlign: 'right', marginRight: 4 },
  rationaleBody:        { paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#1e5c2a', paddingTop: 10 },
  rationaleText:        { fontSize: 13, color: '#c8e6c9', lineHeight: 20 },

  // PDF
  pdfBanner:  { backgroundColor: '#1b3a0a', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#2e6b10', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  pdfIconWrap:{ backgroundColor: '#2e6b10', borderRadius: 6, padding: 6 },
  pdfTextWrap:{ flex: 1 },
  pdfTitle:   { fontSize: 12, fontWeight: '700', color: '#c8e6c9' },
  pdfName:    { fontSize: 10, color: '#81c784', marginTop: 1 },
  pdfBtn:     { backgroundColor: '#2e7d32', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#388e3c' },
  pdfBtnText: { fontSize: 11, fontWeight: '700', color: '#f1f8e9' },
  footer:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerDate: { fontSize: 11, color: '#81c784' },

  // ── Closed card ──
  closedCard:       { backgroundColor: '#0d1a1f', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#1e2e38', elevation: 3 },
  closedTop:        { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  closedStockName:  { fontSize: 18, fontWeight: '900', color: '#90a4ae' },
  exitedBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0d2030', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: '#1a3a50' },
  exitedBadgeText:  { fontSize: 10, fontWeight: '700', color: '#90caf9' },
  plBox:            { borderRadius: 10, padding: 10, alignItems: 'center', minWidth: 80 },
  plBoxGain:        { backgroundColor: '#0a2a0a', borderWidth: 1, borderColor: '#1a4a1a' },
  plBoxLoss:        { backgroundColor: '#2a0a0a', borderWidth: 1, borderColor: '#4a1a1a' },
  plLabel:          { fontSize: 9, fontWeight: '600', color: '#546e7a', marginBottom: 2 },
  plPct:            { fontSize: 16, fontWeight: '900' },
  plAmt:            { fontSize: 10, fontWeight: '600', marginTop: 2 },
  plGain:           { color: '#69f0ae' },
  plLoss:           { color: '#ff8a80' },
  closedPriceRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111e24', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#1e2e38' },
  closedPriceBox:   { flex: 1, alignItems: 'center' },
  closedArrow:      { paddingHorizontal: 4 },
  closedPriceLabel: { fontSize: 10, color: '#546e7a', marginBottom: 3 },
  closedPriceVal:   { fontSize: 14, fontWeight: '800', color: '#78909c' },
  exitNoteWrap:     { backgroundColor: '#111e24', borderRadius: 10, borderWidth: 1, borderColor: '#1e2e38', marginBottom: 8, overflow: 'hidden' },
  exitNoteToggle:   { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 9 },
  exitNoteToggleText:{ fontSize: 11, fontWeight: '600', color: '#78909c' },
  exitNoteText:     { fontSize: 12, color: '#607d8b', lineHeight: 19, paddingHorizontal: 12, paddingBottom: 10 },
  closedFooterDate: { fontSize: 10, color: '#37474f' },

  emptyTitle:   { fontSize: 18, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  emptySub:     { fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  blockedTitle: { fontSize: 22, fontWeight: '800', color: '#ef5350', marginTop: 16 },
});
