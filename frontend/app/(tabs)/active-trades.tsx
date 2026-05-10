import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator, Animated, Linking,
} from 'react-native';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useRouter, useLocalSearchParams } from 'expo-router';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true,
  }),
});

type Segment = 'equity' | 'futures' | 'options';

interface Trade {
  id: string; stockName?: string; symbol?: string;
  type?: 'BUY' | 'SELL'; action?: 'BUY' | 'SELL';
  entryPrice: number; targetPrice: number; stopLoss: number;
  strikePrice?: number; optionType?: 'CE' | 'PE'; lotSize?: number;
  expiryDate?: string; duration?: string; status: string;
  createdAt: any; segment?: Segment;
}

const getAccessibleSegments = (subscriptionAccess?: string): Segment[] => {
  if (subscriptionAccess === 'equity') return ['equity'];
  if (subscriptionAccess === 'fno')    return ['futures', 'options'];
  if (subscriptionAccess === 'all')    return ['equity', 'futures', 'options'];
  return [];
};

// ─── PREMIUM UPGRADE SCREEN ───────────────────────────────────────────────────
export function PremiumUpgradeScreen() {
  const theme     = useTheme();
  const crownAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(crownAnim, { toValue: -5, duration: 700, useNativeDriver: true }),
      Animated.timing(crownAnim, { toValue: 0,  duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);

  const features = [
    { title: 'Kooky AI',         titleColor: '#4f46e5', desc: 'Portfolio analysis & expert stock insights' },
    { title: 'Portfolio Stocks', titleColor: '#f59e0b', desc: '3–10 stocks/month · FA + TA analysis' },
    { title: 'Swing Trading',    titleColor: '#22c55e', desc: '10–50 stocks/month · market conditions' },
    { title: 'Future Trading',   titleColor: '#f59e0b', desc: '10–30 calls/month · entry, exit & SL' },
    { title: 'Option Trading',   titleColor: '#a855f7', desc: '30–70 calls/month · risk-managed' },
    { title: 'Mutual Fund',      titleColor: '#3b82f6', desc: 'Personal SIP management' },
  ];

  return (
    <View style={[up.container, { backgroundColor: theme.background }]}>
      <Animated.View style={[up.crownWrap, { transform: [{ translateY: crownAnim }] }]}>
        <Text style={up.crownEmoji}>👑</Text>
      </Animated.View>
      <Text style={[up.title, { color: theme.text }]}>Upgrade to Premium</Text>
      <View style={up.banner}>
        <Text style={up.bannerIcon}>🔒</Text>
        <Text style={up.bannerText}>
          Available only to <Text style={up.bannerBold}>Premium subscribers</Text>
        </Text>
      </View>
      <View style={[up.featureList, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        {features.map((f, i) => (
          <View key={i} style={[up.featureRow, i < features.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.divider }]}>
            <View style={up.checkCircle}>
              <Ionicons name="checkmark" size={11} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[up.featureTitle, { color: f.titleColor }]}>{f.title}</Text>
              <Text style={[up.featureDesc, { color: theme.textSecondary }]}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>
      <TouchableOpacity style={up.btn} onPress={() => Linking.openURL('https://wa.me/918383898886')} activeOpacity={0.87}>
        <Ionicons name="logo-whatsapp" size={16} color="#fff" style={{ marginRight: 6 }} />
        <Text style={up.btnText}>Upgrade to Premium</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[up.websiteBtn, { backgroundColor: theme.isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', borderColor: theme.isDark ? '#1d4ed8' : '#bfdbfe' }]} onPress={() => Linking.openURL('https://dhanmatrix.in')} activeOpacity={0.8}>
        <Ionicons name="globe-outline" size={14} color="#3b82f6" />
        <Text style={up.websiteTxt}>For more details visit dhanmatrix.in</Text>
        <Ionicons name="arrow-forward" size={12} color="#3b82f6" />
      </TouchableOpacity>
      <Text style={[up.footerNote, { color: theme.textSecondary }]}>Contact admin for subscription</Text>
    </View>
  );
}

// ─── LOCKED SEGMENT SCREEN ────────────────────────────────────────────────────
function LockedSegmentScreen({ segment }: { segment: Segment }) {
  const theme     = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
    ]));
    a.start(); return () => a.stop();
  }, []);
  const label = segment === 'equity' ? 'Equity' : segment === 'futures' ? 'Futures' : 'Options';
  const isFno = segment === 'futures' || segment === 'options';
  return (
    <View style={[styles.lockedContainer, { backgroundColor: theme.background }]}>
      <Animated.View style={[styles.lockedIconWrap, { transform: [{ scale: pulseAnim }] }]}>
        <Ionicons name="lock-closed" size={52} color="#fff" />
      </Animated.View>
      <Text style={[styles.lockedTitle,    { color: theme.text }]}>{label} Access Locked</Text>
      <Text style={[styles.lockedSubtitle, { color: theme.textSecondary }]}>
        Your current plan does not include <Text style={styles.lockedHighlight}>{label}</Text> trading signals.
      </Text>
      <View style={[styles.lockedCard, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.lockedCardTitle, { color: theme.text }]}>
          {isFno ? '📈 Upgrade to F&O Plan' : '📊 Upgrade to Equity Plan'}
        </Text>
        <Text style={[styles.lockedCardDesc, { color: theme.textSecondary }]}>
          {isFno ? 'Get access to Futures & Options trade signals.' : 'Get access to Equity trade signals.'}
        </Text>
        <View style={styles.lockedFeatures}>
          {(isFno
            ? ['Futures trade signals', 'Options CE & PE calls', 'Expiry & strike details', 'Lot size guidance']
            : ['Live equity trade alerts', 'Entry & exit signals', 'Target & stop loss', 'Real-time notifications']
          ).map((f) => (
            <View key={f} style={styles.lockedFeatureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={[styles.lockedFeatureText, { color: theme.text }]}>{f}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={[styles.lockedContactBox, { backgroundColor: theme.isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff' }]}>
        <Ionicons name="headset-outline" size={18} color="#6366f1" />
        <Text style={styles.lockedContactText}>Contact admin to upgrade your subscription plan</Text>
      </View>
    </View>
  );
}

// ─── SUBSCRIPTION BANNER ──────────────────────────────────────────────────────
function SubscriptionBanner({ endDate }: { endDate?: string }) {
  const blinkAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(blinkAnim, { toValue: 0.15, duration: 500, useNativeDriver: true }),
      Animated.timing(blinkAnim, { toValue: 1,    duration: 500, useNativeDriver: true }),
    ]));
    a.start(); return () => a.stop();
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

const segmentLabel = (seg?: string) => seg === 'futures' ? 'Futures' : seg === 'options' ? 'Options' : 'Equity';

const isToday = (val: any): boolean => {
  try {
    let d: Date;
    if (val && typeof val.toDate === 'function') d = val.toDate();
    else if (val && typeof val.seconds === 'number') d = new Date(val.seconds * 1000);
    else d = new Date(val || 0);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  } catch { return false; }
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function ActiveTrades() {
  const { userData } = useAuth();
  const router  = useRouter();
  const theme   = useTheme();
  const { segment: segmentParam } = useLocalSearchParams<{ segment?: string }>();

  const [trades,        setTrades]        = useState<Trade[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [activeSegment, setActiveSegment] = useState<Segment>('equity');

  const prevTradeIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef  = useRef(true);
  const accessibleSegments = getAccessibleSegments(userData?.subscriptionAccess);

  useEffect(() => {
    if (segmentParam) {
      const normalized: Segment = segmentParam === 'futures' ? 'futures' : segmentParam === 'options' ? 'options' : 'equity';
      setActiveSegment(normalized);
    }
  }, [segmentParam]);

  useEffect(() => {
    if (accessibleSegments.length > 0 && !accessibleSegments.includes(activeSegment))
      setActiveSegment(accessibleSegments[0]);
  }, [userData?.subscriptionAccess]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { tradeId?: string; segment?: string };
      router.push({ pathname: '/(tabs)/active-trades', params: { segment: data?.segment } });
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (userData?.status !== 'ACTIVE') { setLoading(false); return; }

    // ── FIX: Reset refs every time listener is set up ──────────────────────
    // This prevents old trades from firing notifications when user
    // upgrades from FREE to ACTIVE (listener restarts, Firestore sends
    // all existing docs as "added" — we treat them as first load)
    isFirstLoadRef.current  = true;
    prevTradeIdsRef.current = new Set();
    // ───────────────────────────────────────────────────────────────────────

    const q = query(collection(db, 'activeTrades'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tradesData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((t: any) => t.showInApp !== false) as Trade[];

      if (!isFirstLoadRef.current) {
        // Only send notifications for genuinely new trades
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const t = { id: change.doc.id, ...change.doc.data() } as Trade;
            if (!prevTradeIdsRef.current.has(t.id)) {
              const tradeSeg = normalizeSegment(t.segment);
              if (accessibleSegments.includes(tradeSeg)) {
                Notifications.scheduleNotificationAsync({
                  content: {
                    title: `New ${t.type || t.action || 'TRADE'} Trade Alert! [${segmentLabel(t.segment)}]`,
                    body:  `${t.stockName} | Entry: ₹${t.entryPrice} | Target: ₹${t.targetPrice} | SL: ₹${t.stopLoss}`,
                    sound: true,
                    data:  { tradeId: t.id, segment: t.segment ?? 'equity' },
                  },
                  trigger: null,
                });
              }
            }
          }
        });
      }

      prevTradeIdsRef.current = new Set(tradesData.map((t) => t.id));
      isFirstLoadRef.current  = false;

      const getTime = (val: any) => {
        if (!val) return 0;
        if (typeof val.toDate === 'function') return val.toDate().getTime();
        const d = new Date(val); return isNaN(d.getTime()) ? 0 : d.getTime();
      };
      setTrades([...tradesData].sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt)));
      setLoading(false); setRefreshing(false);
    }, () => { setLoading(false); setRefreshing(false); });

    return () => unsubscribe();
  }, [userData]); // re-runs when userData changes (FREE → ACTIVE)

  const normalizeSegment = (seg?: string): Segment => {
    const s = seg?.toLowerCase();
    if (s === 'futures') return 'futures';
    if (s === 'options') return 'options';
    return 'equity';
  };

  const filteredTrades     = trades.filter((t) => normalizeSegment(t.segment) === activeSegment);
  const countBySegment     = (seg: Segment) => trades.filter((t) => normalizeSegment(t.segment) === seg).length;
  const tabLabels: { key: Segment; label: string }[] = [
    { key: 'equity', label: 'Equity' }, { key: 'futures', label: 'Futures' }, { key: 'options', label: 'Options' },
  ];
  const openChart = (stockName: string) => Linking.openURL(`https://www.tradingview.com/chart/?symbol=NSE:${stockName.toUpperCase().trim()}`);

  const renderTradeCard = ({ item }: { item: Trade }) => {
    const isBuy       = (item.type || item.action) === 'BUY';
    const entryPrice  = Number(item.entryPrice)  || 0;
    const targetPrice = Number(item.targetPrice) || 0;
    const stopLoss    = Number(item.stopLoss)    || 0;
    const seg         = normalizeSegment(item.segment);
    const isFnO       = seg === 'options' || seg === 'futures';
    const potential   = entryPrice > 0 ? (isBuy ? ((targetPrice - entryPrice) / entryPrice) : ((entryPrice - targetPrice) / entryPrice)) * 100 : 0;
    const risk        = entryPrice > 0 ? (isBuy ? ((entryPrice - stopLoss) / entryPrice) : ((stopLoss - entryPrice) / entryPrice)) * 100 : 0;
    return (
      <View style={[styles.tradeCard, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.tradeHeader}>
          <View style={styles.stockInfo}>
            <View style={styles.stockNameRow}>
              <Text style={[styles.stockName, { color: theme.text }]}>{item.stockName || item.symbol}</Text>
              {isToday(item.createdAt) && <View style={styles.todayBadge}><Text style={styles.todayBadgeText}>Today</Text></View>}
              {seg === 'options' && item.strikePrice && (
                <View style={styles.strikeBadge}><Text style={styles.strikeText}>{item.strikePrice} {item.optionType || ''}</Text></View>
              )}
            </View>
            <View style={styles.badgeRow}>
              <View style={[styles.typeBadge, isBuy ? styles.buyBadge : styles.sellBadge]}>
                <Text style={[styles.typeText, isBuy ? styles.buyText : styles.sellText]}>{item.type || item.action}</Text>
              </View>
              {isFnO && item.lotSize && <View style={styles.lotBadge}><Text style={styles.lotText}>Lot: {item.lotSize}</Text></View>}
            </View>
          </View>
          <Ionicons name="pulse" size={24} color={theme.primary} />
        </View>
        {isFnO && (item.expiryDate || item.duration) && (
          <View style={[styles.fnoRow, { backgroundColor: theme.isDark ? 'rgba(146,64,14,0.15)' : '#FFFBEB' }]}>
            {item.expiryDate && <View style={styles.fnoItem}><Ionicons name="calendar-outline" size={13} color="#92400E" /><Text style={styles.fnoText}>Expiry: {item.expiryDate}</Text></View>}
            {item.duration   && <View style={styles.fnoItem}><Ionicons name="time-outline"     size={13} color="#92400E" /><Text style={styles.fnoText}>{item.duration}</Text></View>}
          </View>
        )}
        <View style={[styles.priceGrid, { borderBottomColor: theme.border }]}>
          <View style={styles.priceItem}><Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Entry Price</Text><Text style={[styles.priceValue, { color: theme.text }]}>₹{entryPrice.toFixed(2)}</Text></View>
          <View style={styles.priceItem}><Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Target</Text><Text style={[styles.priceValue, { color: theme.success }]}>₹{targetPrice.toFixed(2)}</Text></View>
          <View style={styles.priceItem}><Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Stop Loss</Text><Text style={[styles.priceValue, { color: theme.error }]}>{stopLoss > 0 ? `₹${stopLoss.toFixed(2)}` : 'N/A'}</Text></View>
        </View>
        <View style={styles.metricsRow}>
          <View style={styles.metric}><Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Potential Gain</Text><Text style={[styles.metricValue, { color: potential >= 0 ? theme.success : theme.error }]}>{potential >= 0 ? '+' : ''}{potential.toFixed(2)}%</Text></View>
          <View style={styles.metric}><Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Risk</Text><Text style={[styles.metricValue, { color: theme.error }]}>{stopLoss > 0 ? `-${Math.abs(risk).toFixed(2)}%` : 'N/A'}</Text></View>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.dateContainer}>
            <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.dateText, { color: theme.textSecondary }]}>
              {(() => {
                const d = item.createdAt?.toDate ? item.createdAt.toDate() : new Date(item.createdAt || Date.now());
                if (isNaN(d.getTime())) return '—';
                const now = new Date();
                const todayFlag = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
                return todayFlag ? `Today, ${d.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
              })()}
            </Text>
          </View>
          <TouchableOpacity style={[styles.chartBtn, { backgroundColor: theme.cardBackground }]} onPress={() => openChart(item.stockName || item.symbol || '')} activeOpacity={0.75}>
            <Text style={styles.chartBtnEmoji}>📈</Text>
            <Text style={styles.chartBtnText}>Live Chart</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <View style={[styles.centerContainer, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color={theme.primary} /></View>;

  if (userData?.status === 'BLOCKED') {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="lock-closed" size={80} color={theme.error} />
        <Text style={[styles.blockedTitle, { color: theme.error }]}>Account Blocked</Text>
        <Text style={[styles.blockedText, { color: theme.textSecondary }]}>Your account has been blocked. Please contact support.</Text>
      </View>
    );
  }

  if (userData?.status === 'FREE') return <PremiumUpgradeScreen />;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SubscriptionBanner endDate={userData?.subscriptionEndDate} />
      <View style={[styles.tabRow, { backgroundColor: theme.cardBackground }]}>
        {tabLabels.map(({ key, label }) => {
          const count    = countBySegment(key);
          const hasToday = trades.some((t) => normalizeSegment(t.segment) === key && isToday(t.createdAt));
          const isLocked = !accessibleSegments.includes(key);
          return (
            <TouchableOpacity key={key} style={[styles.tab, activeSegment === key && styles.tabActive, isLocked && styles.tabLocked]} onPress={() => setActiveSegment(key)} activeOpacity={0.8}>
              {isLocked && <Ionicons name="lock-closed" size={11} color={activeSegment === key ? '#fff' : '#9ca3af'} style={{ marginRight: 2 }} />}
              <Text style={[styles.tabText, { color: theme.textSecondary }, activeSegment === key && styles.tabTextActive]}>{label}</Text>
              {!isLocked && count > 0 && <View style={[styles.badge, activeSegment === key && styles.badgeActive]}><Text style={[styles.badgeText, activeSegment === key && styles.badgeTextActive]}>{count}</Text></View>}
              {!isLocked && hasToday && <View style={styles.todayDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
      {!accessibleSegments.includes(activeSegment) ? (
        <LockedSegmentScreen segment={activeSegment} />
      ) : filteredTrades.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
          <Ionicons name="bar-chart-outline" size={80} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.text }]}>No active {activeSegment} trades</Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Pull down to refresh</Text>
        </View>
      ) : (
        <FlatList data={filteredTrades} renderItem={renderTradeCard} keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1500); }} colors={[theme.primary]} tintColor={theme.primary} />}
        />
      )}
    </View>
  );
}

export const up = StyleSheet.create({
  container:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  crownWrap:    { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff8e7', alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowColor: '#f59e0b', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  crownEmoji:   { fontSize: 28 },
  title:        { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  banner:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, width: '100%', marginBottom: 12 },
  bannerIcon:   { fontSize: 14 },
  bannerText:   { flex: 1, fontSize: 12, color: '#ea580c', lineHeight: 16 },
  bannerBold:   { fontWeight: '800', color: '#ea580c' },
  featureList:  { width: '100%', borderRadius: 12, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  checkCircle:  { width: 20, height: 20, borderRadius: 10, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureTitle: { fontSize: 13, fontWeight: '800', marginBottom: 1 },
  featureDesc:  { fontSize: 11, lineHeight: 14 },
  btn:          { width: '100%', backgroundColor: '#f97316', borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 10, shadowColor: '#f97316', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  btnText:      { color: '#fff', fontSize: 15, fontWeight: '900' },
  websiteBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, width: '100%', marginBottom: 10 },
  websiteTxt:   { flex: 1, fontSize: 12, color: '#3b82f6', fontWeight: '600' },
  footerNote:   { fontSize: 11, textAlign: 'center' },
});

const styles = StyleSheet.create({
  container:         { flex: 1 },
  centerContainer:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  listContent:       { padding: 16 },
  subBanner:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dc2626', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  subBannerText:     { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },
  tabRow:            { flexDirection: 'row', marginHorizontal: 16, marginTop: 14, marginBottom: 8, borderRadius: 12, padding: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  tab:               { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  tabActive:         { backgroundColor: '#001F3F', elevation: 2 },
  tabLocked:         { opacity: 0.6 },
  tabText:           { fontSize: 13, fontWeight: '600' },
  tabTextActive:     { color: '#fff' },
  badge:             { backgroundColor: '#E5E7EB', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeActive:       { backgroundColor: 'rgba(255,255,255,0.25)' },
  badgeText:         { fontSize: 10, fontWeight: '700', color: '#374151' },
  badgeTextActive:   { color: '#fff' },
  lockedContainer:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  lockedIconWrap:    { width: 96, height: 96, borderRadius: 48, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  lockedTitle:       { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  lockedSubtitle:    { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  lockedHighlight:   { fontWeight: '700', color: '#6366f1' },
  lockedCard:        { borderRadius: 16, padding: 20, width: '100%', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  lockedCardTitle:   { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  lockedCardDesc:    { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  lockedFeatures:    { gap: 8 },
  lockedFeatureItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lockedFeatureText: { fontSize: 13, fontWeight: '500' },
  lockedContactBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, width: '100%' },
  lockedContactText: { fontSize: 13, color: '#4338ca', fontWeight: '600', flex: 1 },
  tradeCard:         { borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  tradeHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  stockInfo:         { flex: 1 },
  stockNameRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  stockName:         { fontSize: 20, fontWeight: 'bold' },
  strikeBadge:       { backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  strikeText:        { fontSize: 13, fontWeight: '700', color: '#6D28D9' },
  badgeRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge:         { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  buyBadge:          { backgroundColor: '#E8F5E9' },
  sellBadge:         { backgroundColor: '#FFEBEE' },
  typeText:          { fontSize: 12, fontWeight: 'bold' },
  buyText:           { color: '#2E7D32' },
  sellText:          { color: '#C62828' },
  lotBadge:          { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  lotText:           { fontSize: 12, fontWeight: '600', color: '#92400E' },
  fnoRow:            { flexDirection: 'row', gap: 16, borderRadius: 8, padding: 8, marginBottom: 12 },
  fnoItem:           { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fnoText:           { fontSize: 12, color: '#92400E', fontWeight: '600' },
  priceGrid:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1 },
  priceItem:         { flex: 1, alignItems: 'center' },
  priceLabel:        { fontSize: 12, marginBottom: 4 },
  priceValue:        { fontSize: 16, fontWeight: 'bold' },
  metricsRow:        { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  metric:            { alignItems: 'center' },
  metricLabel:       { fontSize: 12, marginBottom: 4 },
  metricValue:       { fontSize: 18, fontWeight: 'bold' },
  cardFooter:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  dateContainer:     { flexDirection: 'row', alignItems: 'center' },
  chartBtn:          { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 7, borderWidth: 1.5, borderColor: '#3b82f6', paddingHorizontal: 8, paddingVertical: 4 },
  chartBtnEmoji:     { fontSize: 12 },
  chartBtnText:      { fontSize: 10, fontWeight: '700', color: '#3b82f6' },
  dateText:          { fontSize: 12, marginLeft: 4 },
  emptyContainer:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText:         { fontSize: 18, fontWeight: '600', marginTop: 16, textAlign: 'center' },
  emptySubtext:      { fontSize: 14, marginTop: 8, textAlign: 'center' },
  blockedTitle:      { fontSize: 24, fontWeight: 'bold', marginTop: 24 },
  blockedText:       { fontSize: 16, textAlign: 'center', marginTop: 16 },
  todayBadge:        { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  todayBadgeText:    { fontSize: 11, fontWeight: '700', color: '#15803d' },
  todayDot:          { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80', marginLeft: 2 },
});
