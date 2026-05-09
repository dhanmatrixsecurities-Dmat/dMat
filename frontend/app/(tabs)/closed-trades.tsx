import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  ActivityIndicator, TouchableOpacity, Linking,
} from 'react-native';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface ClosedTrade {
  id: string;
  stockName: string;
  type: 'BUY' | 'SELL';
  segment?: 'equity' | 'futures' | 'options';
  entryPrice: number;
  exitPrice: number;
  profitLossPercent: number;
  strikePrice?: number;
  optionType?: 'CE' | 'PE';
  lotSize?: number;
  expiryDate?: string;
  closedAt: string;
}

type SegmentFilter = 'equity' | 'futures' | 'options';

const TABS: { label: string; value: SegmentFilter; color: string }[] = [
  { label: 'Equity',  value: 'equity',  color: '#22c55e' },
  { label: 'Futures', value: 'futures', color: '#f59e0b' },
  { label: 'Options', value: 'options', color: '#a855f7' },
];

export default function ClosedTrades() {
  const { user }  = useAuth();
  const theme     = useTheme();

  const [trades,     setTrades]     = useState<ClosedTrade[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState<SegmentFilter>('equity');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const q = query(collection(db, 'closedTrades'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tradesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ClosedTrade[];
      const sorted = [...tradesData].sort((a, b) =>
        new Date(b.closedAt || 0).getTime() - new Date(a.closedAt || 0).getTime()
      );
      setTrades(sorted);
      setLoading(false);
      setRefreshing(false);
    }, () => { setLoading(false); setRefreshing(false); });
    return () => unsubscribe();
  }, [user]);

  const filteredTrades = trades.filter((t) => {
    const s = t.segment?.toLowerCase();
    if (activeTab === 'equity') return !s || s === 'equity';
    return s === activeTab;
  });

  const openChart = (stockName: string) =>
    Linking.openURL(`https://www.tradingview.com/chart/?symbol=NSE:${stockName.toUpperCase().trim()}`);

  const renderTradeCard = ({ item }: { item: ClosedTrade }) => {
    const isBuy  = item.type === 'BUY';
    const seg    = item.segment || 'equity';
    const isFnO  = seg === 'options' || seg === 'futures';
    const displayPercent = item.entryPrice > 0
      ? isBuy
        ? ((item.exitPrice - item.entryPrice) / item.entryPrice) * 100
        : ((item.entryPrice - item.exitPrice) / item.entryPrice) * 100
      : item.profitLossPercent;
    const isProfit = displayPercent > 0;

    return (
      <View style={[styles.tradeCard, { backgroundColor: theme.cardBackground }]}>
        {/* Header */}
        <View style={styles.tradeHeader}>
          <View style={styles.stockInfo}>
            <View style={styles.stockNameRow}>
              <Text style={[styles.stockName, { color: theme.text }]}>{item.stockName}</Text>
              {seg === 'options' && item.strikePrice && (
                <View style={styles.strikeBadge}>
                  <Text style={styles.strikeText}>{item.strikePrice} {item.optionType || ''}</Text>
                </View>
              )}
            </View>
            <View style={styles.badgeRow}>
              <View style={[styles.typeBadge, isBuy ? styles.buyBadge : styles.sellBadge]}>
                <Text style={[styles.typeText, isBuy ? styles.buyText : styles.sellText]}>{item.type}</Text>
              </View>
              {isFnO && item.lotSize && (
                <View style={styles.lotBadge}><Text style={styles.lotText}>Lot: {item.lotSize}</Text></View>
              )}
            </View>
          </View>

          <View style={[styles.resultBadge, { backgroundColor: isProfit ? theme.success : theme.error }]}>
            <Ionicons name={isProfit ? 'trending-up' : 'trending-down'} size={18} color="#fff" />
            <Text style={styles.resultText}>{isProfit ? '+' : ''}{displayPercent.toFixed(2)}%</Text>
          </View>
        </View>

        {/* F&O Row */}
        {isFnO && item.expiryDate && (
          <View style={[styles.fnoRow, { backgroundColor: theme.isDark ? 'rgba(146,64,14,0.15)' : '#FFFBEB' }]}>
            <View style={styles.fnoItem}>
              <Ionicons name="calendar-outline" size={13} color="#92400E" />
              <Text style={styles.fnoText}>Expiry: {item.expiryDate}</Text>
            </View>
          </View>
        )}

        {/* Prices */}
        <View style={[styles.priceGrid, { borderBottomColor: theme.border }]}>
          <View style={styles.priceItem}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Entry Price</Text>
            <Text style={[styles.priceValue, { color: theme.text }]}>₹{item.entryPrice.toFixed(2)}</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={theme.textSecondary} />
          <View style={styles.priceItem}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Exit Price</Text>
            <Text style={[styles.priceValue, { color: isProfit ? theme.success : theme.error }]}>
              ₹{item.exitPrice.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.dateText, { color: theme.textSecondary }]}>
              Closed: {new Date(item.closedAt || Date.now()).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
          <TouchableOpacity style={[styles.chartBtn, { backgroundColor: theme.cardBackground }]} onPress={() => openChart(item.stockName)} activeOpacity={0.75}>
            <Text style={styles.chartBtnEmoji}>📈</Text>
            <Text style={styles.chartBtnText}>Live Chart</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return (
    <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Segment Tabs */}
      <View style={[styles.tabRow, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, { borderColor: theme.border }, activeTab === tab.value && { backgroundColor: tab.color, borderColor: tab.color }]}
            onPress={() => setActiveTab(tab.value)} activeOpacity={0.8}
          >
            <Text style={[styles.tabText, { color: activeTab === tab.value ? '#fff' : theme.textSecondary }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredTrades.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
          <Ionicons name="document-text-outline" size={80} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.text }]}>No {activeTab} trades yet</Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Completed {activeTab} trades will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTrades}
          renderItem={renderTradeCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1500); }}
              colors={[theme.primary]} tintColor={theme.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  centerContainer:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent:    { padding: 16 },
  tabRow:         { flexDirection: 'row', padding: 12, gap: 8, borderBottomWidth: 1 },
  tab:            { flex: 1, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tabText:        { fontSize: 13, fontWeight: '700' },
  tradeCard:      { borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  tradeHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  stockInfo:      { flex: 1 },
  stockNameRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  stockName:      { fontSize: 20, fontWeight: 'bold' },
  strikeBadge:    { backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  strikeText:     { fontSize: 13, fontWeight: '700', color: '#6D28D9' },
  badgeRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge:      { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  buyBadge:       { backgroundColor: '#E8F5E9' },
  sellBadge:      { backgroundColor: '#FFEBEE' },
  typeText:       { fontSize: 12, fontWeight: 'bold' },
  buyText:        { color: '#2E7D32' },
  sellText:       { color: '#C62828' },
  lotBadge:       { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  lotText:        { fontSize: 12, fontWeight: '600', color: '#92400E' },
  resultBadge:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 4 },
  resultText:     { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  fnoRow:         { flexDirection: 'row', gap: 16, borderRadius: 8, padding: 8, marginBottom: 12 },
  fnoItem:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fnoText:        { fontSize: 12, color: '#92400E', fontWeight: '600' },
  priceGrid:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1 },
  priceItem:      { flex: 1, alignItems: 'center' },
  priceLabel:     { fontSize: 12, marginBottom: 4 },
  priceValue:     { fontSize: 16, fontWeight: 'bold' },
  cardFooter:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  dateContainer:  { flexDirection: 'row', alignItems: 'center' },
  dateText:       { fontSize: 12, marginLeft: 4 },
  chartBtn:       { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 7, borderWidth: 1.5, borderColor: '#3b82f6', paddingHorizontal: 8, paddingVertical: 4 },
  chartBtnEmoji:  { fontSize: 12 },
  chartBtnText:   { fontSize: 10, fontWeight: '700', color: '#3b82f6' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText:      { fontSize: 18, fontWeight: '600', marginTop: 16, textAlign: 'center' },
  emptySubtext:   { fontSize: 14, marginTop: 8, textAlign: 'center' },
});
