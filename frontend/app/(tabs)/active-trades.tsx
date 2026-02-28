import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator, Animated,
} from 'react-native';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

type Segment = 'equity' | 'futures' | 'options';

interface Trade {
  id: string;
  stockName: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  strikePrice?: number;
  optionType?: 'CE' | 'PE';
  lotSize?: number;
  expiryDate?: string;
  duration?: string;
  status: string;
  createdAt: string;
  segment?: Segment;
}

// ── Subscription Blink Banner ─────────────────────────────────────────────────
function SubscriptionBanner({ endDate }: { endDate?: string }) {
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  if (!endDate) return null;

  const end = new Date(endDate);
  const now = new Date();
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft > 7 || daysLeft <= 0) return null;

  return (
    <Animated.View style={[styles.subBanner, { opacity: blinkAnim }]}>
      <Ionicons name="warning" size={16} color="#fff" />
      <Text style={styles.subBannerText}>
        ⚠️ Subscription expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}! Contact admin to renew.
      </Text>
    </Animated.View>
  );
}

export default function ActiveTrades() {
  const { userData } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSegment, setActiveSegment] = useState<Segment>('equity');

  const prevTradeIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (userData?.status !== 'ACTIVE') {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'activeTrades'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tradesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Trade[];

      if (!isFirstLoadRef.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const newTrade = { id: change.doc.id, ...change.doc.data() } as Trade;
            if (!prevTradeIdsRef.current.has(newTrade.id)) {
              Notifications.scheduleNotificationAsync({
                content: {
                  title: `🚨 New ${newTrade.type} Trade Alert!`,
                  body: `${newTrade.stockName} | Entry: ₹${newTrade.entryPrice} | Target: ₹${newTrade.targetPrice}`,
                  sound: true,
                },
                trigger: null,
              });
            }
          }
        });
      }

      prevTradeIdsRef.current = new Set(tradesData.map((t) => t.id));
      isFirstLoadRef.current = false;
      setTrades(tradesData);
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error('Error fetching active trades:', error);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const normalizeSegment = (seg?: string): Segment => {
    if (seg === 'futures' || seg === 'options') return seg;
    return 'equity';
  };

  const filteredTrades = trades.filter((t) => normalizeSegment(t.segment) === activeSegment);
  const countBySegment = (seg: Segment) => trades.filter((t) => normalizeSegment(t.segment) === seg).length;

  const tabLabels: { key: Segment; label: string }[] = [
    { key: 'equity', label: 'Equity' },
    { key: 'futures', label: 'Futures' },
    { key: 'options', label: 'Options' },
  ];

  // ── Trade Card ──────────────────────────────────────────────────────────────
  const renderTradeCard = ({ item }: { item: Trade }) => {
    const isBuy = item.type === 'BUY';
    const entryPrice = Number(item.entryPrice) || 0;
    const targetPrice = Number(item.targetPrice) || 0;
    const stopLoss = Number(item.stopLoss) || 0;
    const seg = normalizeSegment(item.segment);

    const potential = entryPrice > 0 ? ((targetPrice - entryPrice) / entryPrice) * 100 : 0;
    const risk = entryPrice > 0 ? ((entryPrice - stopLoss) / entryPrice) * 100 : 0;

    const isFnO = seg === 'options' || seg === 'futures';

    return (
      <View style={styles.tradeCard}>
        {/* ── Header ── */}
        <View style={styles.tradeHeader}>
          <View style={styles.stockInfo}>
            <View style={styles.stockNameRow}>
              <Text style={styles.stockName}>{item.stockName}</Text>
              {/* Strike + CE/PE badge for options */}
              {seg === 'options' && item.strikePrice && (
                <View style={styles.strikeBadge}>
                  <Text style={styles.strikeText}>
                    {item.strikePrice} {item.optionType || ''}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.badgeRow}>
              <View style={[styles.typeBadge, isBuy ? styles.buyBadge : styles.sellBadge]}>
                <Text style={[styles.typeText, isBuy ? styles.buyText : styles.sellText]}>{item.type}</Text>
              </View>
              {/* Lot size badge */}
              {isFnO && item.lotSize && (
                <View style={styles.lotBadge}>
                  <Text style={styles.lotText}>Lot: {item.lotSize}</Text>
                </View>
              )}
            </View>
          </View>
          <Ionicons name="pulse" size={24} color={Colors.primary} />
        </View>

        {/* ── F&O Info Row: Expiry + Duration ── */}
        {isFnO && (item.expiryDate || item.duration) && (
          <View style={styles.fnoRow}>
            {item.expiryDate && (
              <View style={styles.fnoItem}>
                <Ionicons name="calendar-outline" size={13} color="#f59e0b" />
                <Text style={styles.fnoText}>Expiry: {item.expiryDate}</Text>
              </View>
            )}
            {item.duration && (
              <View style={styles.fnoItem}>
                <Ionicons name="time-outline" size={13} color="#f59e0b" />
                <Text style={styles.fnoText}>{item.duration}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Price Grid ── */}
        <View style={styles.priceGrid}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Entry Price</Text>
            <Text style={styles.priceValue}>₹{entryPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Target</Text>
            <Text style={[styles.priceValue, styles.targetPrice]}>₹{targetPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Stop Loss</Text>
            <Text style={[styles.priceValue, styles.stopLossText]}>
              {stopLoss > 0 ? `₹${stopLoss.toFixed(2)}` : 'N/A'}
            </Text>
          </View>
        </View>

        {/* ── Metrics ── */}
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Potential Gain</Text>
            <Text style={[styles.metricValue, styles.gainText]}>+{potential.toFixed(2)}%</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Risk</Text>
            <Text style={[styles.metricValue, styles.riskText]}>
              {stopLoss > 0 ? `-${risk.toFixed(2)}%` : 'N/A'}
            </Text>
          </View>
        </View>

        {/* ── Date ── */}
        <View style={styles.dateContainer}>
          <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleString('en-IN', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  if (userData?.status === 'BLOCKED') {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="lock-closed" size={80} color={Colors.error} />
        <Text style={styles.blockedTitle}>Account Blocked</Text>
        <Text style={styles.blockedText}>Your account has been blocked. Please contact support.</Text>
      </View>
    );
  }

  if (userData?.status === 'FREE') {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="star" size={80} color={Colors.warning} />
        <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
        <Text style={styles.upgradeText}>
          Active trades are only available to ACTIVE subscribers.{`\n\n`}Contact admin to upgrade.
        </Text>
        <View style={styles.featuresList}>
          {['Live trade alerts', 'Real-time notifications', 'Entry & exit signals'].map((f) => (
            <View key={f} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Subscription Blink Warning ── */}
      <SubscriptionBanner endDate={userData?.subscriptionEndDate} />

      {/* ── Segment Tabs ── */}
      <View style={styles.tabRow}>
        {tabLabels.map(({ key, label }) => {
          const count = countBySegment(key);
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tab, activeSegment === key && styles.tabActive]}
              onPress={() => setActiveSegment(key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeSegment === key && styles.tabTextActive]}>{label}</Text>
              {count > 0 && (
                <View style={[styles.badge, activeSegment === key && styles.badgeActive]}>
                  <Text style={[styles.badgeText, activeSegment === key && styles.badgeTextActive]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {filteredTrades.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={80} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No active {activeSegment} trades</Text>
          <Text style={styles.emptySubtext}>Pull down to refresh and check for new trades</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTrades}
          renderItem={renderTradeCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)}
              colors={[Colors.primary]} tintColor={Colors.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centerContainer: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 },
  listContent: { padding: 16 },

  // ── Subscription Banner ──
  subBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#dc2626',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
  },
  subBannerText: { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },

  // ── Tabs ──
  tabRow: {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16,
    marginTop: 14, marginBottom: 8, borderRadius: 12, padding: 4,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  tabActive: { backgroundColor: '#001F3F', elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#fff' },
  badge: { backgroundColor: '#E5E7EB', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#374151' },
  badgeTextActive: { color: '#fff' },

  // ── Trade Card ──
  tradeCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  tradeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  stockInfo: { flex: 1 },
  stockNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  stockName: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  strikeBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  strikeText: { fontSize: 13, fontWeight: '700', color: '#6D28D9' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  buyBadge: { backgroundColor: '#E8F5E9' },
  sellBadge: { backgroundColor: '#FFEBEE' },
  typeText: { fontSize: 12, fontWeight: 'bold' },
  buyText: { color: '#2E7D32' },
  sellText: { color: '#C62828' },
  lotBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  lotText: { fontSize: 12, fontWeight: '600', color: '#92400E' },

  // ── F&O Row ──
  fnoRow: {
    flexDirection: 'row', gap: 16, backgroundColor: '#FFFBEB',
    borderRadius: 8, padding: 8, marginBottom: 12,
  },
  fnoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fnoText: { fontSize: 12, color: '#92400E', fontWeight: '600' },

  // ── Prices ──
  priceGrid: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16,
    paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  priceItem: { flex: 1, alignItems: 'center' },
  priceLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  priceValue: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  targetPrice: { color: Colors.success },
  stopLossText: { color: Colors.error },

  // ── Metrics ──
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  metric: { alignItems: 'center' },
  metricLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  metricValue: { fontSize: 18, fontWeight: 'bold' },
  gainText: { color: Colors.success },
  riskText: { color: Colors.error },

  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 12, color: Colors.textSecondary, marginLeft: 4 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.text, marginTop: 16, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' },

  blockedTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.error, marginTop: 24 },
  blockedText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', marginTop: 16 },
  upgradeTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primary, marginTop: 24 },
  upgradeText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', marginTop: 16 },
  featuresList: { marginTop: 32, alignSelf: 'stretch' },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureText: { fontSize: 16, color: Colors.text, marginLeft: 12 },
});
