import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated, TouchableOpacity, Linking,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import Svg, { Circle, G } from 'react-native-svg';
import { useAuth } from '@/contexts/AuthContext';

interface ClosedTrade {
  id: string;
  profitLossPercent: number;
  segment?: 'equity' | 'futures' | 'options';
}
interface SegmentStats {
  total: number;
  profitable: number;
  losing: number;
  accuracy: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const DonutGauge = ({ accuracy, size = 160, strokeWidth = 14, fillColor = '#3b82f6' }: {
  accuracy: number; size?: number; strokeWidth?: number; fillColor?: string;
}) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animValue, { toValue: accuracy, duration: 1200, useNativeDriver: false }).start();
  }, [accuracy]);

  const strokeDashoffset = animValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, circumference - (accuracy / 100) * circumference],
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle cx={size/2} cy={size/2} r={radius} stroke="#e2e8f0" strokeWidth={strokeWidth} fill="transparent" />
          <AnimatedCircle cx={size/2} cy={size/2} r={radius} stroke={fillColor} strokeWidth={strokeWidth}
            fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
        </G>
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#1e3a5f', fontSize: size * 0.22, fontWeight: '900' }}>{accuracy}%</Text>
        </View>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overall, setOverall] = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });
  const [equity, setEquity] = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });
  const [futures, setFutures] = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });
  const [options, setOptions] = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });

  const calcStats = (trades: ClosedTrade[]): SegmentStats => {
    const total = trades.length;
    const profitable = trades.filter(t => t.profitLossPercent > 0).length;
    const losing = total - profitable;
    const accuracy = total > 0 ? Math.round((profitable / total) * 100) : 0;
    return { total, profitable, losing, accuracy };
  };

  useEffect(() => {
    (async () => {
      try {
        const snapshot = await getDocs(collection(db, 'closedTrades'));
        const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ClosedTrade[];
        setOverall(calcStats(all));
        setEquity(calcStats(all.filter(t => !t.segment || t.segment === 'equity')));
        setFutures(calcStats(all.filter(t => t.segment === 'futures')));
        setOptions(calcStats(all.filter(t => t.segment === 'options')));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const isActive = userData?.status === 'ACTIVE';

  if (loading) return <View style={s.loading}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>

      {/* Overall Card */}
      <View style={s.overallCard}>
        <Text style={s.heading}>Overall Performance</Text>
        <DonutGauge accuracy={overall.accuracy} size={150} strokeWidth={15} fillColor="#3b82f6" />
        <View style={s.row}>
          <View style={s.stat}>
            <Text style={s.statLabel}>Winning Trades</Text>
            <Text style={[s.statVal, { color: '#22c55e' }]}>{overall.profitable}</Text>
          </View>
          <View style={[s.stat, s.divider]}>
            <Text style={s.statLabel}>Losing Trades</Text>
            <Text style={[s.statVal, { color: '#ef4444' }]}>{overall.losing}</Text>
          </View>
        </View>
      </View>

      {/* Segment Cards */}
      <View style={s.segRow}>
        <View style={[s.segCard, { borderTopColor: '#22c55e' }]}>
          <Text style={s.segTitle}>Equity Accuracy</Text>
          <DonutGauge accuracy={equity.accuracy} size={95} strokeWidth={9} fillColor="#22c55e" />
          <View style={s.segStats}>
            <View style={s.segStat}>
              <Text style={s.segStatLabel}>Win</Text>
              <Text style={[s.segStatVal, { color: '#22c55e' }]}>{equity.profitable}</Text>
            </View>
            <View style={[s.segStat, s.segDivider]}>
              <Text style={s.segStatLabel}>Loss</Text>
              <Text style={[s.segStatVal, { color: '#ef4444' }]}>{equity.losing}</Text>
            </View>
          </View>
        </View>

        <View style={[s.segCard, { borderTopColor: '#f59e0b' }]}>
          <Text style={s.segTitle}>Future Accuracy</Text>
          <DonutGauge accuracy={futures.accuracy} size={95} strokeWidth={9} fillColor="#f59e0b" />
          <View style={s.segStats}>
            <View style={s.segStat}>
              <Text style={s.segStatLabel}>Win</Text>
              <Text style={[s.segStatVal, { color: '#22c55e' }]}>{futures.profitable}</Text>
            </View>
            <View style={[s.segStat, s.segDivider]}>
              <Text style={s.segStatLabel}>Loss</Text>
              <Text style={[s.segStatVal, { color: '#ef4444' }]}>{futures.losing}</Text>
            </View>
          </View>
        </View>

        <View style={[s.segCard, { borderTopColor: '#a855f7' }]}>
          <Text style={s.segTitle}>Option Accuracy</Text>
          <DonutGauge accuracy={options.accuracy} size={95} strokeWidth={9} fillColor="#a855f7" />
          <View style={s.segStats}>
            <View style={s.segStat}>
              <Text style={s.segStatLabel}>Win</Text>
              <Text style={[s.segStatVal, { color: '#22c55e' }]}>{options.profitable}</Text>
            </View>
            <View style={[s.segStat, s.segDivider]}>
              <Text style={s.segStatLabel}>Loss</Text>
              <Text style={[s.segStatVal, { color: '#ef4444' }]}>{options.losing}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* IPO & Mutual Fund Cards */}
      <View style={s.quickRow}>
        <TouchableOpacity
          style={[s.quickCard, { borderLeftColor: '#3b82f6' }]}
          onPress={() => Linking.openURL('https://www.nseindia.com/market-data/all-upcoming-issues-ipo')}
          activeOpacity={0.85}
        >
          <View style={s.quickIconBox}>
            <Text style={s.quickEmoji}>📋</Text>
          </View>
          <View style={s.quickText}>
            <Text style={s.quickTitle}>IPO</Text>
            <Text style={s.quickSub}>View Upcoming IPOs</Text>
          </View>
          <Text style={s.quickArrow}>›</Text>
        </TouchableOpacity>

        <View style={[s.quickCard, { borderLeftColor: '#22c55e' }]}>
          <View style={s.quickIconBox}>
            <Text style={s.quickEmoji}>💼</Text>
          </View>
          <View style={s.quickText}>
            <Text style={s.quickTitle}>Mutual Fund</Text>
            <Text style={s.quickSub}>Explore Mutual Funds</Text>
          </View>
        </View>
      </View>

      {/* Subscription Card — only show if not active */}
      {!isActive && (
        <View style={s.subCard}>
          <View style={s.subTop}>
            <View style={s.subTitleWrap}>
              <Text style={s.crown}>👑</Text>
              <Text style={s.subHeading}>Subscription Plan</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.price}><Text style={s.priceSmall}>₹</Text>5,000</Text>
              <Text style={s.gst}>✅ Incl. of GST</Text>
              <View style={s.badge}><Text style={s.badgeText}>Quarterly · 3 Months</Text></View>
            </View>
          </View>

          <View style={s.subDivider} />

          <View style={s.features}>
            {[
              { icon: '📊', label: 'Swing Trade' },
              { icon: '📈', label: 'Option Trades' },
              { icon: '🔮', label: 'Future Trades' },
            ].map((f) => (
              <View key={f.label} style={s.featurePill}>
                <Text style={s.featureIcon}>{f.icon}</Text>
                <Text style={s.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.subBtn} activeOpacity={0.85}
            onPress={() => Linking.openURL('https://wa.me/919999999999')}>
            <Text style={s.subBtnText}>Subscribe Now  →</Text>
          </TouchableOpacity>
        </View>
      )}

    </ScrollView>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#e8edf5', alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, backgroundColor: '#e8edf5' },
  content: { padding: 12, paddingBottom: 24, alignItems: 'center', gap: 10 },
  overallCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 12, alignItems: 'center',
    width: '100%', elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  heading: { fontSize: 16, fontWeight: '800', color: '#1e3a5f', marginBottom: 8 },
  row: {
    flexDirection: 'row', marginTop: 10, width: '100%',
    borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10,
  },
  stat: { flex: 1, alignItems: 'center' },
  divider: { borderLeftWidth: 1, borderLeftColor: '#e2e8f0' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', marginBottom: 2 },
  statVal: { fontSize: 26, fontWeight: '900' },
  segRow: { flexDirection: 'row', gap: 6, width: '100%' },
  segCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 8,
    alignItems: 'center', borderTopWidth: 4, elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  segTitle: { fontSize: 10, fontWeight: '800', color: '#1e3a5f', textAlign: 'center', marginBottom: 4 },
  segStats: {
    flexDirection: 'row', marginTop: 6, width: '100%',
    borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 6,
  },
  segStat: { flex: 1, alignItems: 'center' },
  segDivider: { borderLeftWidth: 1, borderLeftColor: '#e2e8f0' },
  segStatLabel: { fontSize: 9, color: '#64748b', fontWeight: '600', marginBottom: 2 },
  segStatVal: { fontSize: 14, fontWeight: '900' },
  quickRow: { width: '100%', gap: 8 },
  quickCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  quickIconBox: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  quickEmoji: { fontSize: 20 },
  quickText: { flex: 1 },
  quickTitle: { fontSize: 14, fontWeight: '800', color: '#1e3a5f' },
  quickSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  quickArrow: { fontSize: 24, color: '#94a3b8', fontWeight: '300' },
  // Subscription Card
  subCard: {
    width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 14,
    borderLeftWidth: 4, borderLeftColor: '#3b82f6', elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  subTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  crown: { fontSize: 20 },
  subHeading: { fontSize: 15, fontWeight: '800', color: '#1e3a5f' },
  price: { fontSize: 18, fontWeight: '900', color: '#1e3a5f' },
  priceSmall: { fontSize: 12 },
  gst: { fontSize: 10, fontWeight: '700', color: '#16a34a', marginTop: 2 },
  badge: { backgroundColor: '#eef1f7', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginTop: 3 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#1e3a5f' },
  subDivider: { borderTopWidth: 1, borderTopColor: '#eee', marginVertical: 8 },
  features: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  featurePill: {
    flex: 1, backgroundColor: '#f5f7fc', borderRadius: 10,
    padding: 6, alignItems: 'center',
  },
  featureIcon: { fontSize: 14, marginBottom: 2 },
  featureLabel: { fontSize: 10, fontWeight: '700', color: '#1e3a5f' },
  subBtn: {
    backgroundColor: '#3b82f6', borderRadius: 10, padding: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  subBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
