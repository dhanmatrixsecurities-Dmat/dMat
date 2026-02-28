import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
  FlatList, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

type TradeType = 'Equity' | 'Futures' | 'Options';
interface Trade {
  id: string; symbol: string; tradeType: TradeType;
  action: 'BUY' | 'SELL'; entryPrice: number; targetPrice: number; stopLoss: number;
  lotSize?: number; expiryDate?: string; strikePrice?: number;
  optionType?: 'CE' | 'PE'; duration?: string; createdAt: any; status: string;
}

export default function ActiveTradesScreen() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TradeType>('Equity');
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const blinkRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, 'subscriptions'), where('userId', '==', user.uid)),
      (snap) => {
        if (!snap.empty) {
          const d = snap.docs[0].data();
          if (d.expiryDate) {
            const expiry = d.expiryDate.toDate ? d.expiryDate.toDate() : new Date(d.expiryDate);
            setDaysLeft(Math.ceil((expiry.getTime() - Date.now()) / 86400000));
          }
        }
      }
    );
  }, [user]);

  // Blink ONLY when 3 days or less
  useEffect(() => {
    blinkRef.current?.stop();
    if (daysLeft !== null && daysLeft <= 3 && daysLeft > 0) {
      blinkRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0.1, duration: 500, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      blinkRef.current.start();
    } else {
      blinkAnim.setValue(1);
    }
    return () => blinkRef.current?.stop();
  }, [daysLeft]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(db, 'trades'), where('status', '==', 'active'), orderBy('createdAt', 'desc')),
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
        <View style={styles.cardHeader}>
          <Text style={styles.symbol}>{item.symbol}</Text>
          <Ionicons name="pulse-outline" size={22} color="#1a3c6e" />
        </View>

        <View style={styles.badgeRow}>
          <View style={[styles.badge, item.action === 'BUY' ? styles.buyBadge : styles.sellBadge]}>
            <Text style={[styles.badgeText, item.action === 'BUY' ? styles.buyText : styles.sellText]}>
              {item.action}
            </Text>
          </View>
          {isOpt && item.strikePrice != null && item.optionType && (
            <View style={styles.strikeBadge}>
              <Text style={styles.strikeText}>{item.strikePrice} {item.optionType}</Text>
            </View>
          )}
          {isFutOpt && item.lotSize != null && (
            <View style={styles.lotBadge}>
              <Text style={styles.lotText}>Lot: {item.lotSize}</Text>
            </View>
          )}
        </View>

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

        <View style={styles.priceRow}>
          <View style={styles.priceCol}><Text style={styles.priceLabel}>Entry Price</Text><Text style={styles.priceValue}>₹{item.entryPrice.toFixed(2)}</Text></View>
          <View style={styles.priceCol}><Text style={styles.priceLabel}>Target</Text><Text style={[styles.priceValue, { color: '#16a34a' }]}>₹{item.targetPrice.toFixed(2)}</Text></View>
          <View style={styles.priceCol}><Text style={styles.priceLabel}>Stop Loss</Text><Text style={[styles.priceValue, { color: '#dc2626' }]}>₹{item.stopLoss.toFixed(2)}</Text></View>
        </View>

        <View style={styles.divider} />

        <View style={styles.gainRow}>
          <View style={styles.gainCol}><Text style={styles.priceLabel}>Potential Gain</Text><Text style={[styles.gainValue, { color: '#16a34a' }]}>+{gain}%</Text></View>
          <View style={styles.gainCol}><Text style={styles.priceLabel}>Risk</Text><Text style={[styles.gainValue, { color: '#dc2626' }]}>{risk}%</Text></View>
        </View>

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
        <Text style={styles.headerTitle}>Active Trades</Text>
      </View>

      {/* ONE warning icon — blinks only when ≤ 3 days */}
      {daysLeft !== null && daysLeft <= 3 && daysLeft > 0 && (
        <Animated.View style={[styles.subWarning, { opacity: blinkAnim }]}>
          <Ionicons name="warning" size={16} color="#fff" />
          <Text style={styles.subWarningText}>
            Subscription expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}! Contact admin to renew.
          </Text>
        </Animated.View>
      )}

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
          <Text style={styles.emptyText}>No active {activeTab} trades</Text>
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
  subWarning: { backgroundColor: '#ef4444', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16 },
  subWarningText: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 14, borderRadius: 14, padding: 4, elevation: 2 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  activeTab: { backgroundColor: '#1a3c6e' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  activeTabText: { color: '#fff' },
  bubble: { backgroundColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  activeBubble: { backgroundColor: 'rgba(255,255,255,0.25)' },
  bubbleText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  activeBubbleText: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  symbol: { fontSize: 20, fontWeight: '800', color: '#111827' },
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
  priceValue: { fontSize: 15, fontWeight: '700', color: '#111827' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginBottom: 12 },
  gainRow: { flexDirection: 'row', marginBottom: 10 },
  gainCol: { flex: 1, alignItems: 'center' },
  gainValue: { fontSize: 16, fontWeight: '800' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, color: '#9ca3af' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 15, color: '#9ca3af' },
});
