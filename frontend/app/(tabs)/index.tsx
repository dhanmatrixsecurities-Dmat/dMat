import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import Svg, { Circle, G } from 'react-native-svg';

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

  if (loading) return <View style={s.loading}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}>

      {/* Overall Card */}
      <View style={s.overallCard}>
        <Text style={s.heading}>Overall Performance</Text>
        <DonutGauge accuracy={overall.accuracy} size={200} strokeWidth={20} fillColor="#3b82f6" />
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

        {/* Equity */}
        <View style={[s.segCard, { borderTopColor: '#22c55e' }]}>
          <Text style={s.segTitle}>Equity Accuracy</Text>
          <DonutGauge accuracy={equity.accuracy} size={110} strokeWidth={10} fillColor="#22c55e" />
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

        {/* Futures */}
        <View style={[s.segCard, { borderTopColor: '#f59e0b' }]}>
          <Text style={s.segTitle}>Future Accuracy</Text>
          <DonutGauge accuracy={futures.accuracy} size={110} strokeWidth={10} fillColor="#f59e0b" />
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

        {/* Options - Purple */}
        <View style={[s.segCard, { borderTopColor: '#a855f7' }]}>
          <Text style={s.segTitle}>Option Accuracy</Text>
          <DonutGauge accuracy={options.accuracy} size={110} strokeWidth={10} fillColor="#a855f7" />
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
    </ScrollView>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#e8edf5', alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, backgroundColor: '#e8edf5' },
  content: { padding: 16, paddingBottom: 40, alignItems: 'center' },
  overallCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center',
    width: '100%', marginBottom: 16, elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  heading: { fontSize: 20, fontWeight: '800', color: '#1e3a5f', marginBottom: 16 },
  row: {
    flexDirection: 'row', marginTop: 16, width: '100%',
    borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  divider: { borderLeftWidth: 1, borderLeftColor: '#e2e8f0' },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 4 },
  statVal: { fontSize: 32, fontWeight: '900' },
  segRow: { flexDirection: 'row', gap: 8, width: '100%' },
  segCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 10,
    alignItems: 'center', borderTopWidth: 4, elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  segTitle: { fontSize: 11, fontWeight: '800', color: '#1e3a5f', textAlign: 'center', marginBottom: 6 },
  segStats: {
    flexDirection: 'row', marginTop: 8, width: '100%',
    borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8,
  },
  segStat: { flex: 1, alignItems: 'center' },
  segDivider: { borderLeftWidth: 1, borderLeftColor: '#e2e8f0' },
  segStatLabel: { fontSize: 10, color: '#64748b', fontWeight: '600', marginBottom: 2 },
  segStatVal: { fontSize: 16, fontWeight: '900' },
});
