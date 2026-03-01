import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Animated, TouchableOpacity, Linking,
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

const DonutGauge = ({ accuracy, size = 100, strokeWidth = 10, fillColor = '#3b82f6' }: {
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

  const crownAnim = useRef(new Animated.Value(0)).current;

  const calcStats = (trades: ClosedTrade[]): SegmentStats => {
    const total = trades.length;
    const profitable = trades.filter(t => t.profitLossPercent > 0).length;
    const losing = total - profitable;
    const accuracy = total > 0 ? Math.round((profitable / total) * 100) : 0;
    return { total, profitable, losing, accuracy };
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(crownAnim, { toValue: -4, duration: 400, useNativeDriver: true }),
        Animated.timing(crownAnim, { toValue: 4, duration: 400, useNativeDriver: true }),
        Animated.timing(crownAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

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
    <View style={s.container}>

      {/* Overall Card */}
      <View style={s.overallCard}>
        <Text style={s.heading}>Overall Performance</Text>
        <View style={s.overallInner}>
          <DonutGauge accuracy={overall.accuracy} size={80} strokeWidth={9} fillColor="#3b82f6" />
          <View style={s.overallStats}>
            <View style={s.overallStat}>
              <Text style={s.statLabel}>Winning Trades</Text>
              <Text style={[s.statVal, { color: '#22c55e' }]}>{overall.profitable}</Text>
            </View>
            <View style={[s.overallStat, { borderLeftWidth: 1, borderLeftColor: '#e2e8f0' }]}>
              <Text style={s.statLabel}>Losing Trades</Text>
              <Text style={[s.statVal, { color: '#ef4444' }]}>{overall.losing}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Segment Cards */}
      <View style={s.segRow}>
        {[
          { label: 'Equity', stats: equity, color: '#22c55e' },
          { label: 'Futures', stats: futures, color: '#f59e0b' },
          { label: 'Options', stats: options, color: '#a855f7' },
        ].map((seg) => (
          <View key={seg.label} style={[s.segCard, { borderTopColor: seg.color }]}>
            <Text style={s.segTitle}>{seg.label}</Text>
            <DonutGauge accuracy={seg.stats.accuracy} size={60} strokeWidth={7} fillColor={seg.color} />
            <View style={s.segStats}>
              <View style={s.segStat}>
                <Text style={s.segStatLabel}>Win</Text>
                <Text style={[s.segStatVal, { color: '#22c55e' }]}>{seg.stats.profitable}</Text>
              </View>
              <View style={[s.segStat, { borderLeftWidth: 1, borderLeftColor: '#e2e8f0' }]}>
                <Text style={s.segStatLabel}>Loss</Text>
                <Text style={[s.segStatVal, { color: '#ef4444' }]}>{seg.stats.losing}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* IPO & Mutual Fund */}
      <View style={s.quickRow}>
        <TouchableOpacity
          style={[s.quickCard, { borderLeftColor: '#3b82f6' }]}
          onPress={() => Linking.openURL('https://www.nseindia.com/market-data/all-upcoming-issues-ipo')}
          activeOpacity={0.85}
        >
          <Text style={s.quickEmoji}>📋</Text>
          <View style={s.quickText}>
            <Text style={s.quickTitle}>IPO</Text>
            <Text style={s.quickSub}>View Upcoming IPOs</Text>
          </View>
          <Text style={s.quickArrow}>›</Text>
        </TouchableOpacity>

        <View style={[s.quickCard, { borderLeftColor: '#22c55e' }]}>
          <Text style={s.quickEmoji}>💼</Text>
          <View style={s.quickText}>
            <Text style={s.quickTitle}>Mutual Fund</Text>
            <Text style={s.quickSub}>Explore Mutual Funds</Text>
          </View>
        </View>
      </View>

      {/* Subscription Card - only for FREE users */}
      {!isActive && (
        <View style={s.subCard}>
          <View style={s.subTop}>
            <View style={s.subTitleWrap}>
              <Animated.Text style={[s.crown, { transform: [{ translateY: crownAnim }] }]}>👑</Animated.Text>
              <Text style={s.subHeading}>Subscription Plan</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.price}><Text style={s.priceSmall}>₹</Text>5,000</Text>
              <Text style={s.gst}>✅ Incl. of GST</Text>
              <View style={s.planBadge}><Text style={s.planBadgeText}>Quarterly · 3 Months</Text></View>
            </View>
          </View>
          <View style={s.subDivider} />
          <View style={s.features}>
            {[
              { icon: '📊', label: 'Swing Trade' },
              { icon: '📈', label: 'Options' },
              { icon: '🔮', label: 'Futures' },
            ].map((f) => (
              <View key={f.label} style={s.featurePill}>
                <Text style={s.featureIcon}>{f.icon}</Text>
                <Text style={s.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={s.subBtn} activeOpacity={0.85}
            onPress={() => Linking.openURL('https://wa.me/918383898886')}>
            <Text style={s.subBtnText}>Subscribe Now  →</Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#e8edf5', alignItems: 'center', justifyContent: 'center' },
  container: {
    flex: 1,
    backgroundColor: '#e8edf5',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },

  // Overall
  overallCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 10,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  heading: { fontSize: 13, fontWeight: '800', color: '#1e3a5f', marginBottom: 6, textAlign: 'center' },
  overallInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  overallStats: { flexDirection: 'row', flex: 1, marginLeft: 10 },
  overallStat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, color: '#64748b', fontWeight: '600', marginBottom: 2 },
  statVal: { fontSize: 24, fontWeight: '900' },

  // Segments
  segRow: { flexDirection: 'row', gap: 6 },
  segCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 6,
    alignItems: 'center', borderTopWidth: 4, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  segTitle: { fontSize: 9, fontWeight: '800', color: '#1e3a5f', textAlign: 'center', marginBottom: 2 },
  segStats: { flexDirection: 'row', marginTop: 3, width: '100%', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 3 },
  segStat: { flex: 1, alignItems: 'center' },
  segStatLabel: { fontSize: 9, color: '#64748b', fontWeight: '600' },
  segStatVal: { fontSize: 12, fontWeight: '900' },

  // Quick cards
  quickRow: { flexDirection: 'row', gap: 6 },
  quickCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 8,
    flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  quickEmoji: { fontSize: 20, marginRight: 8 },
  quickText: { flex: 1 },
  quickTitle: { fontSize: 12, fontWeight: '800', color: '#1e3a5f' },
  quickSub: { fontSize: 9, color: '#64748b', marginTop: 1 },
  quickArrow: { fontSize: 20, color: '#94a3b8' },

  // Subscription
  subCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 10,
    borderLeftWidth: 4, borderLeftColor: '#3b82f6', elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  subTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  subTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  crown: { fontSize: 16 },
  subHeading: { fontSize: 13, fontWeight: '800', color: '#1e3a5f' },
  price: { fontSize: 15, fontWeight: '900', color: '#1e3a5f' },
  priceSmall: { fontSize: 10 },
  gst: { fontSize: 9, fontWeight: '700', color: '#16a34a', marginTop: 1 },
  planBadge: { backgroundColor: '#eef1f7', borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  planBadgeText: { fontSize: 9, fontWeight: '700', color: '#1e3a5f' },
  subDivider: { borderTopWidth: 1, borderTopColor: '#eee', marginVertical: 5 },
  features: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  featurePill: { flex: 1, backgroundColor: '#f5f7fc', borderRadius: 8, padding: 5, alignItems: 'center' },
  featureIcon: { fontSize: 12, marginBottom: 1 },
  featureLabel: { fontSize: 9, fontWeight: '700', color: '#1e3a5f' },
  subBtn: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 7, alignItems: 'center' },
  subBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
