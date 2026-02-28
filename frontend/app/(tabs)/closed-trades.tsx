import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

type TradeType = 'Equity' | 'Futures' | 'Options';
interface Trade {
  id: string; symbol: string; tradeType: TradeType;
  action: 'BUY' | 'SELL'; entryPrice: number; targetPrice: number; stopLoss: number;
  lotSize?: number; expiryDate?: string; strikePrice?: number;
  optionType?: 'CE' | 'PE'; duration?: string; createdAt: any; closedAt?: any;
  status: string; exitPrice?: number; profitLoss?: number;
}

export default function ClosedTradesScreen() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TradeType>('Equity');

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, 'trades'), where('status', '==', 'closed'), orderBy('createdAt', 'desc')),
      (snap) => { setTrades(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trade))); setLoading(false); }
    );
  }, [user]);

  const filtered = trades.filter((t) => t.tradeType === activeTab);
  const counts = {
    Equity: trades.filter((t) => t.tradeType === 'Equity').length,
    Futures: trades.filter((t) => t.tradeType === 'Futures').length,
    Options: trades.filter((t) => t.tradeType === 'Options').length,
  };

  const fmtDate = (ts: any) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ', ' +
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const renderTrade = ({ item }: { item: Trade }) => {
    const isOpt = item.tradeType === 'Options';
    const isFutOpt = item.tradeType === 'Futures' || isOpt;
    const gain = (((item.targetPrice - item.entryPrice) / item.entryPrice) * 100).toFixed(2);
    const risk = (((item.stopLoss - item.entryPrice) / item.entryPrice) * 100).toFixed(2);

    return (
      <View style={styles.card}>
        {/* CLOSED ribbon */}
        <View style={styles.closedRibbon}>
          <Text style={styles.closedRibbonText}>CLOSED</Text>
        </View>

        <View style={styles.cardHeader}>
          <Text style={styles.symbol}>{item.symbol}</Text>
          <Ionicons name="checkmark-circle-outline" size={22} color="#6b7280" />
        </View>

        {/* Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, item.action === 'BUY' ? styles.buyBadge : styles.sellBadge]}>
            <Text style={[styles.badgeText, item.action === 'BUY' ? styles.buyText : styles.sellText]}>
              {item.action}
            </Text>
          </View>
          {/* Options: Strike + CE/PE badge */}
          {isOpt && item.strikePrice != null && item.optionType && (
            <View style={styles.strikeBadge}>
              <Text style={styles.strikeText}>{item.strikePrice} {item.optionType}</Text>
            </View>
          )}
          {/* Futures/Options: Lot size badge */}
          {isFutOpt && item.lotSize != null && (
            <View style={styles.lotBadge}>
              <Text style={styles.lotText}>Lot: {item.lotSize}</Text>
            </View>
          )}
        </View>

        {/* Expiry + Duration for Futures & Options */}
        {isFutOpt && (item.expiryDate || item.duration) && (
          <View style={styles.expiryRow}>
            {item.expiryDate ? (
              <View style={styles.chip}>
                <Ionicons name="calendar-outline" size={12} color="#b45309" />
                <Text style={styles.chipText}>Exp: {item.expiryDate}</Text>
              </View>
            ) : null}
            {item.duration ? (
              <View style={styles.chip}>
                <Ionicons name="time-outline" size={12} color="#b45309" />
                <Text style={styles.chipText}>{item.duration}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Prices */}
        <View style={styles.priceRow}>
          <View style={styles.priceCol}><Text style={styles.priceLabel}>Entry Price</Text><Text style={styles.priceValue}>₹{item.entryPrice.toFixed(2)}</Text></View>
          <View style={styles.priceCol}><Text style={styles.priceLabel}>Target</Text><Text style={[styles.priceValue, { color: '#16a34a' }]}>₹{item.targetPrice.toFixed(2)}</Text></View>
          <View style={styles.priceCol}><Text style={styles.priceLabel}>Stop Loss</Text><Text style={[styles.priceValue, { color: '#dc2626' }]}>₹{item.stopLoss.toFixed(2)}</Text></View>
        </View>

        <View style={styles.divider} />

        {/* Gain / Risk */}
        <View style={styles.gainRow}>
          <View style={styles.gainCol}><Text style={styles.priceLabel}>Potential Gain</Text><Text style={[styles.gainValue, { color: '#16a34a' }]}>+{gain}%</Text></View>
          <View style={styles.gainCol}><Text style={styles.priceLabel}>Risk</Text><Text style={[styles.gainValue, { color: '#dc2626' }]}>{risk}%</Text></View>
        </View>

        {/* Exit Price if available */}
        {item.exitPrice != null && (
          <View style={styles.exitRow}>
            <Text style={styles.exitLabel}>Exit Price: </Text>
            <Text style={styles.exitValue}>₹{item.exitPrice.toFixed(2)}</Text>
            {item.profitLoss != null && (
              <Text style={[styles.plValue, { color: item.profitLoss >= 0 ? '#16a34a' : '#dc2626' }]}>
                {' '}({item.profitLoss >= 0 ? '+' : ''}{item.profitLoss.toFixed(2)}%)
              </Text>
            )}
          </View>
        )}

        {/* Date */}
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={13} color="#9ca3af" />
          <Text style={styles.timeText}>{fmtDate(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Closed Trades</Text>
      </View>

      <View style={styles.tabBar}>
        {(['Equity', 'Futures', 'Options'] as TradeType[]).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            <View style={[styles.bubble, activeTab === tab && styles.activeBubble]}>
              <Text style={[styles.bubbleText, activeTab === tab && styles.activeBubbleText]}>{counts[tab as TradeType]}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1a3c6e" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bar-chart-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No closed {activeTab} trades</Text>
        </View>
      ) : (
        <FlatList data={filtered} keyExtractor={(i) => i.id} renderItem={renderTrade} contentContainerStyle={{ padding: 16, paddingBottom: 90 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { backgroundColor: '#1a3c6e', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 14, borderRadius: 14, padding: 4, elevation: 2 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  activeTab: { backgroundColor: '#1a3c6e' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  activeTabText: { color: '#fff' },
  bubble: { backgroundColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  activeBubble: { backgroundColor: 'rgba(255,255,255,0.25)' },
  bubbleText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  activeBubbleText: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2, opacity: 0.92 },
  closedRibbon: { alignSelf: 'flex-end', backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6 },
  closedRibbonText: { fontSize: 10, fontWeight: '700', color: '#6b7280', letterSpacing: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  symbol: { fontSize: 20, fontWeight: '800', color: '#374151' },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  buyBadge: { backgroundColor: '#dcfce7' }, sellBadge: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  buyText: { color: '#16a34a' }, sellText: { color: '#dc2626' },
  strikeBadge: { backgroundColor: '#ede9fe', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  strikeText: { fontSize: 12, fontWeight: '700', color: '#7c3aed' },
  lotBadge: { backgroundColor: '#fef9c3', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  lotText: { fontSize: 12, fontWeight: '700', color: '#a16207' },
  expiryRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  chipText: { fontSize: 11, color: '#b45309', fontWeight: '600' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  priceCol: { flex: 1, alignItems: 'center' },
  priceLabel: { fontSize: 11, color: '#9ca3af', marginBottom: 3 },
  priceValue: { fontSize: 15, fontWeight: '700', color: '#374151' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginBottom: 12 },
  gainRow: { flexDirection: 'row', marginBottom: 10 },
  gainCol: { flex: 1, alignItems: 'center' },
  gainValue: { fontSize: 16, fontWeight: '800' },
  exitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  exitLabel: { fontSize: 12, color: '#9ca3af' },
  exitValue: { fontSize: 13, fontWeight: '700', color: '#374151' },
  plValue: { fontSize: 13, fontWeight: '700' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, color: '#9ca3af' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 15, color: '#9ca3af' },
});
