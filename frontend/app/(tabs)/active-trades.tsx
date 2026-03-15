import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator, Animated, Linking,
} from 'react-native';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

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
  stockName?: string;
  symbol?: string;
  type?: 'BUY' | 'SELL';
  action?: 'BUY' | 'SELL';
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
        Animated.timing(blinkAnim, { toValue: 0.15, duration: 500, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  if (!endDate) return null;
  const daysLeft = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (daysLeft > 3 || daysLeft <= 0) return null;

  return (
    <Animated.View style={[styles.subBanner, { opacity: blinkAnim }]}>
      <Ionicons name="warning" size={16} color="#fff" />
      <Text style={styles.subBannerText}>
        Subscription expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}! Contact admin to renew.
      </Text>
    </Animated.View>
  );
}

// ── Segment label helper ──────────────────────────────────────────────────────
const segmentLabel = (seg?: string): string => {
  if (seg === 'futures') return 'Futures';
  if (seg === 'options') return 'Options';
  return 'Equity';
};

export default function ActiveTrades() {
  const { userData } = useAuth();
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSegment, setActiveSegment] = useState<Segment>('equity');

  const prevTradeIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  // ── BUG 3 FIX: Handle notification tap → navigate to Active Trades ─────────
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { tradeId?: string; segment?: string };
      // Navigate to ActiveTrades tab; segment can be used to pre-select the tab
      router.push({
        pathname: '/(tabs)/active-trades',
        params: { tradeId: data?.tradeId, segment: data?.segment },
      });
    });
    return () => subscription.remove();
  }, []);
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (userData?.status !== 'ACTIVE') { setLoading(false); return; }

    const q = query(collection(db, 'activeTrades'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tradesData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((t: any) => t.showInApp !== false) as Trade[];

      if (!isFirstLoadRef.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const t = { id: change.doc.id, ...change.doc.data() } as Trade;
            if (!prevTradeIdsRef.current.has(t.id)) {
              const tradeType = t.type || t.action || 'TRADE';
              const seg = segmentLabel(t.segment);

              // ── BUG 2 FIX: Include segment in notification + tradeId in data ──
              Notifications.scheduleNotificationAsync({
                content: {
                  title: `New ${tradeType} Trade Alert! [${seg}]`,
                  body: `${t.stockName} | ${seg} | Entry: ₹${t.entryPrice} | Target: ₹${t.targetPrice}`,
                  sound: true,
                  data: { tradeId: t.id, segment: t.segment ?? 'equity' }, // used by Bug 3 handler
                },
                trigger: null,
              });
              // ────────────────────────────────────────────────────────────────
            }
          }
        });
      }

      prevTradeIdsRef.current = new Set(tradesData.map((t) => t.id));
      isFirstLoadRef.current = false;
      const getTime = (val: any) => {
        if (!val) return 0;
        if (typeof val.toDate === 'function') return val.toDate().getTime();
        const d = new Date(val);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      };
      const sorted = [...tradesData].sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
      setTrades(sorted);
      setLoading(false);
      setRefreshing(false);
    }, () => { setLoading(false); setRefreshing(false); });

    return () => unsubscribe();
  }, [userData]);

  const normalizeSegment = (seg?: string): Segment => {
    const s = seg?.toLowerCase();
    if (s === 'futures') return 'futures';
    if (s === 'options') return 'options';
    return 'equity';
  };

  const filteredTrades = trades.filter((t) => normalizeSegment(t.segment) === activeSegment);
  const countBySegment = (seg: Segment) => trades.filter((t) => normalizeSegment(t.segment) === seg).length;

  const tabLabels: { key: Segment; label: string }[] = [
    { key: 'equity', label: 'Equity' },
    { key: 'futures', label: 'Futures' },
    { key: 'options', label: 'Options' },
  ];

  const openChart = (stockName: string) => {
    const symbol = `NSE:${stockName.toUpperCase().trim()}`;
    Linking.openURL(`https://www.tradingview.com/chart/?symbol=${symbol}`);
  };

  const renderTradeCard = ({ item }: { item: Trade }) => {
    const isBuy = (item.type || item.action) === 'BUY';
    const entryPrice = Number(item.entryPrice) || 0;
    const targetPrice = Number(item.targetPrice) || 0;
    const stopLoss = Number(item.stopLoss) || 0;
    const seg = normalizeSegment(item.segment);
    const isFnO = seg === 'options' || seg === 'futures';

    // Potential gain: always positive means moving toward target
    const potential = entryPrice > 0
      ? isBuy
        ? ((targetPrice - entryPrice) / entryPrice) * 100   // BUY: target > entry
        : ((entryPrice - targetPrice) / entryPrice) * 100   // SELL: entry > target
      : 0;

    // Risk: always a positive magnitude (displayed with explicit − sign below)
    const risk = entryPrice > 0
      ? isBuy
        ? ((entryPrice - stopLoss) / entryPrice) * 100      // BUY: stop below entry
        : ((stopLoss - entryPrice) / entryPrice) * 100      // SELL: stop above entry
      : 0;

    // ── BUG 4 FIX: format signs safely so we never get +- or -- ─────────────
    const potentialDisplay = `${potential >= 0 ? '+' : ''}${potential.toFixed(2)}%`;
    const riskDisplay = stopLoss > 0 ? `-${Math.abs(risk).toFixed(2)}%` : 'N/A';
    // ─────────────────────────────────────────────────────────────────────────

    return (
      <View style={styles.tradeCard}>
        <View style={styles.tradeHeader}>
          <View style={styles.stockInfo}>
            <View style={styles.stockNameRow}>
              <Text style={styles.stockName}>{item.stockName || item.symbol}</Text>
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
                <View style={styles.lotBadge}>
                  <Text style={styles.lotText}>Lot: {item.lotSize}</Text>
                </View>
              )}
            </View>
          </View>
          <Ionicons name="pulse" size={24} color={Colors.primary} />
        </View>

        {isFnO && (item.expiryDate || item.duration) && (
          <View style={styles.fnoRow}>
            {item.expiryDate && (
              <View style={styles.fnoItem}>
                <Ionicons name="calendar-outline" size={13} color="#92400E" />
                <Text style={styles.fnoText}>Expiry: {item.expiryDate}</Text>
              </View>
            )}
            {item.duration && (
              <View style={styles.fnoItem}>
                <Ionicons name="time-outline" size={13} color="#92400E" />
                <Text style={styles.fnoText}>{item.duration}</Text>
              </View>
            )}
          </View>
        )}

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

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Potential Gain</Text>
            {/* BUG 4 FIX: use pre-computed potentialDisplay — never +- */}
            <Text style={[styles.metricValue, potential >= 0 ? styles.gainText : styles.riskText]}>
              {potentialDisplay}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Risk</Text>
            {/* BUG 4 FIX: use pre-computed riskDisplay — never -- */}
            <Text style={[styles.metricValue, styles.riskText]}>{riskDisplay}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.dateContainer}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.dateText}>
              {(() => {
                const d = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt || Date.now());
                return isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
              })()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.chartBtn}
            onPress={() => openChart(item.stockName || item.symbol || '')}
            activeOpacity={0.75}
          >
            <Text style={styles.chartBtnEmoji}>📈</Text>
            <Text style={styles.chartBtnText}>Live Chart</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color={Colors.primary} /></View>;

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
      <SubscriptionBanner endDate={userData?.subscriptionEndDate} />

      <View style={styles.tabRow}>
        {tabLabels.map(({ key, label }) => {
          const count = countBySegment(key);
          return (
            <TouchableOpacity key={key}
              style={[styles.tab, activeSegment === key && styles.tabActive]}
              onPress={() => setActiveSegment(key)} activeOpacity={0.8}>
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
        <FlatList data={filteredTrades} renderItem={renderTradeCard} keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1500); }}
            colors={[Colors.primary]} tintColor={Colors.primary} />} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centerContainer: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 },
  listContent: { padding: 16 },
  subBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dc2626', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  subBannerText: { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 14, marginBottom: 8, borderRadius: 12, padding: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  tabActive: { backgroundColor: '#001F3F', elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#fff' },
  badge: { backgroundColor: '#E5E7EB', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#374151' },
  badgeTextActive: { color: '#fff' },
  tradeCard: { backgroundColor: Colors.cardBackground, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
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
  fnoRow: { flexDirection: 'row', gap: 16, backgroundColor: '#FFFBEB', borderRadius: 8, padding: 8, marginBottom: 12 },
  fnoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fnoText: { fontSize: 12, color: '#92400E', fontWeight: '600' },
  priceGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  priceItem: { flex: 1, alignItems: 'center' },
  priceLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  priceValue: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  targetPrice: { color: Colors.success },
  stopLossText: { color: Colors.error },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  metric: { alignItems: 'center' },
  metricLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  metricValue: { fontSize: 18, fontWeight: 'bold' },
  gainText: { color: Colors.success },
  riskText: { color: Colors.error },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  chartBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fff', borderRadius: 7, borderWidth: 1.5, borderColor: '#3b82f6', paddingHorizontal: 8, paddingVertical: 4 },
  chartBtnEmoji: { fontSize: 12 },
  chartBtnText: { fontSize: 10, fontWeight: '700', color: '#3b82f6' },
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
