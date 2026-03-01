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
  total: number; profitable: number; losing: number; accuracy: number;
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
    return { total, profitable, losing: total - profitable, accuracy: total > 0 ? Math.round((profitable / total) * 100) : 0 };
  };

  useEffect(() => {
    // Bouncing crown animation
    Animated.loop(Animated.sequence([
      Animated.timing(crownAnim, { toValue: -5, duration: 350, useNativeDriver: true }),
      Animated.timing(crownAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ])).start();
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

      {/* ── Overall Performance ── */}
      <View style={s.overallCard}>
        <Text style={s.overallTitle}>Overall Performance</Text>
        <DonutGauge accuracy={overall.accuracy} size={110} strokeWidth={12} fillColor="#3b82f6" />
        <View style={s.overallDivider} />
        <View style={s.overallRow}>
          <View style={s.overallStat}>
            <Text style={s.statLabel}>Winning Trades</Text>
            <Text style={[s.statVal, { color: '#22c55e' }]}>{overall.profitable}</Text>
          </View>
          <View style={s.statSep} />
          <View style={s.overallStat}>
            <Text style={s.statLabel}>Losing Trades</Text>
            <Text style={[s.statVal, { color: '#ef4444' }]}>{overall.losing}</Text>
          </View>
        </View>
      </View>

      {/* ── Segment Cards ── */}
      <View style={s.segRow}>
        {[
          { label: 'Equity', stats: equity, color: '#22c55e' },
          { label: 'Futures', stats: futures, color: '#f59e0b' },
          { label: 'Options', stats: options, color: '#a855f7' },
        ].map((seg) => (
          <View key={seg.label} style={[s.segCard, { borderTopColor: seg.color }]}>
            <Text style={s.segTitle}>{seg.label}</Text>
            <DonutGauge accuracy={seg.stats.accuracy} size={72} strokeWidth={8} fillColor={seg.color} />
            <View style={s.segDivider} />
            <View style={s.segStatsRow}>
              <View style={s.segStat}>
                <Text style={s.segStatLabel}>Win</Text>
                <Text style={[s.segStatVal, { color: '#22c55e' }]}>{seg.stats.profitable}</Text>
              </View>
              <View style={s.segStatSep} />
              <View style={s.segStat}>
                <Text style={s.segStatLabel}>Loss</Text>
                <Text style={[s.segStatVal, { color: '#ef4444' }]}>{seg.stats.losing}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* ── IPO & Mutual Fund ── */}
      <View style={s.quickRow}>
        <TouchableOpacity
          style={[s.quickCard, { borderLeftColor: '#3b82f6' }]}
          onPress={() => Linking.openURL('https://www.nseindia.com/market-data/all-upcoming-issues-ipo')}
          activeOpacity={0.85}
        >
          <View style={s.quickIcon}><Text style={s.quickEmoji}>📋</Text></View>
          <View style={s.quickText}>
            <Text style={s.quickTitle}>IPO</Text>
            <Text style={s.quickSub}>View Upcoming IPOs</Text>
          </View>
          <Text style={s.quickArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.quickCard, { borderLeftColor: '#22c55e' }]} activeOpacity={0.85}>
          <View style={s.quickIcon}><Text style={s.quickEmoji}>💼</Text></View>
          <View style={s.quickText}>
            <Text style={s.quickTitle}>Mutual Fund</Text>
            <Text style={s.quickSub}>Explore Mutual Funds</Text>
          </View>
          <Text style={s.quickArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* ── Subscription Card (FREE users only) ── */}
      {!isActive && (
        <View style={s.subCard}>
          <View style={s.subTop}>
            <View style={s.subTitleWrap}>
              <Animated.Text style={[s.crown, { transform: [{ translateY: crownAnim }] }]}>👑</Animated.Text>
              <Text style={s.subHeading}>Subscription Plan</Text>
            </View>
            <View style={s.priceWrap}>
              <Text style={s.gst}>Incl. of GST  </Text>
              <Text style={s.price}>₹5,000</Text>
            </View>
          </View>
          <Text style={s.planLabel}>Quarterly · 3 Months</Text>
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
            onPress={() => Linking.openURL('https://wa.me/918383898886')}>
            <Text style={s.subBtnText}>Subscribe Now  →</Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#eef1f8', alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#eef1f8', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, gap: 10 },

  // Overall
  overallCard: { backgroundColor: '#fff', borderRadius: 18, padding: 14, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  overallTitle: { fontSize: 16, fontWeight: '800', color: '#1e3a5f', marginBottom: 8 },
  overallDivider: { width: '100%', height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },
  overallRow: { flexDirection: 'row', width: '100%' },
  overallStat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', marginBottom: 2 },
  statVal: { fontSize: 26, fontWeight: '900' },
  statSep: { width: 1, backgroundColor: '#e2e8f0', marginHorizontal: 8 },

  // Segments
  segRow: { flexDirection: 'row', gap: 8 },
  segCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 8, alignItems: 'center', borderTopWidth: 4, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  segTitle: { fontSize: 10, fontWeight: '800', color: '#1e3a5f', textAlign: 'center', marginBottom: 4 },
  segDivider: { width: '100%', height: 1, backgroundColor: '#e2e8f0', marginVertical: 5 },
  segStatsRow: { flexDirection: 'row', width: '100%' },
  segStat: { flex: 1, alignItems: 'center' },
  segStatLabel: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  segStatVal: { fontSize: 14, fontWeight: '900' },
  segStatSep: { width: 1, backgroundColor: '#e2e8f0' },

  // Quick
  quickRow: { flexDirection: 'row', gap: 8 },
  quickCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  quickIcon: { width: 36, height: 36, borderRadius: 9, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  quickEmoji: { fontSize: 18 },
  quickText: { flex: 1 },
  quickTitle: { fontSize: 13, fontWeight: '800', color: '#1e3a5f' },
  quickSub: { fontSize: 10, color: '#64748b', marginTop: 1 },
  quickArrow: { fontSize: 22, color: '#94a3b8' },

  // Subscription
  subCard: { backgroundColor: '#fff', borderRadius: 16, padding: 12, borderLeftWidth: 4, borderLeftColor: '#3b82f6', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  subTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  crown: { fontSize: 20 },
  subHeading: { fontSize: 15, fontWeight: '800', color: '#1e3a5f' },
  priceWrap: { flexDirection: 'row', alignItems: 'center' },
  gst: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  price: { fontSize: 17, fontWeight: '900', color: '#1e3a5f' },
  planLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600', marginTop: 2, marginBottom: 6 },
  subDivider: { height: 1, backgroundColor: '#e2e8f0', marginBottom: 8 },
  features: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  featurePill: { flex: 1, backgroundColor: '#f5f7fc', borderRadius: 10, padding: 8, alignItems: 'center' },
  featureIcon: { fontSize: 16, marginBottom: 3 },
  featureLabel: { fontSize: 10, fontWeight: '700', color: '#1e3a5f' },
  subBtn: { backgroundColor: '#3b82f6', borderRadius: 10, padding: 11, alignItems: 'center' },
  subBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
