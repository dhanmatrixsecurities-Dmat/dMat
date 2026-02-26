import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import Svg, { Circle, G } from 'react-native-svg';

const { width } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClosedTrade {
  id: string;
  stockName: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  profitLossPercent: number;
  segment?: 'equity' | 'futures' | 'options';
  closedAt: string;
}

interface SegmentStats {
  total: number;
  profitable: number;
  losing: number;
  accuracy: number;
}

// ─── Animated SVG Donut Gauge ────────────────────────────────────────────────
// Uses react-native-svg for a crisp, smooth animated arc

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const DonutGauge = ({
  accuracy,
  size = 160,
  strokeWidth = 14,
  fillColor = '#3b82f6',
  trackColor = '#1e3a5f',
  centerFontSize,
  showLabel = false,
}: {
  accuracy: number;
  size?: number;
  strokeWidth?: number;
  fillColor?: string;
  trackColor?: string;
  centerFontSize?: number;
  showLabel?: boolean;
}) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: accuracy,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [accuracy]);

  const strokeDashoffset = animValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, circumference - (accuracy / 100) * circumference],
  });

  const fontSize = centerFontSize ?? size * 0.22;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated fill */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={fillColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      {/* Center text */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {showLabel && (
            <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600', marginBottom: 2 }}>
              Accuracy
            </Text>
          )}
          <Text style={{ color: '#fff', fontSize, fontWeight: '900', letterSpacing: -1 }}>
            {accuracy}%
          </Text>
        </View>
      </View>
    </View>
  );
};

// ─── Overall Big Donut Card ───────────────────────────────────────────────────

const OverallCard = ({ stats }: { stats: SegmentStats }) => (
  <View style={styles.overallCard}>
    <Text style={styles.cardHeading}>Overall Performance</Text>
    <DonutGauge
      accuracy={stats.accuracy}
      size={200}
      strokeWidth={18}
      fillColor="#3b82f6"
      trackColor="#1e3a5f"
      centerFontSize={36}
    />
    <View style={styles.overallRow}>
      <View style={styles.overallStat}>
        <Text style={styles.overallStatLabel}>Winning Trades</Text>
        <Text style={[styles.overallStatValue, { color: '#22c55e' }]}>{stats.profitable}</Text>
      </View>
      <View style={[styles.overallStat, styles.statDivider]}>
        <Text style={styles.overallStatLabel}>Losing Trades</Text>
        <Text style={[styles.overallStatValue, { color: '#ef4444' }]}>{stats.losing}</Text>
      </View>
    </View>
  </View>
);

// ─── Segment Accuracy Card ────────────────────────────────────────────────────

const SegmentAccuracyCard = ({
  label,
  stats,
  fillColor,
}: {
  label: string;
  stats: SegmentStats;
  fillColor: string;
}) => (
  <View style={[styles.segCard, { borderTopColor: fillColor }]}>
    <Text style={styles.segCardTitle}>{label}</Text>
    <DonutGauge
      accuracy={stats.accuracy}
      size={110}
      strokeWidth={11}
      fillColor={fillColor}
      trackColor="#1e3a5f"
      centerFontSize={22}
    />
    <Text style={[styles.segLabel, { color: fillColor }]}>{label}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [overall, setOverall] = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });
  const [equity, setEquity] = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });
  const [futures, setFutures] = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });
  const [options, setOptions] = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const calcStats = (trades: ClosedTrade[]): SegmentStats => {
    const total = trades.length;
    const profitable = trades.filter((t) => t.profitLossPercent > 0).length;
    const losing = total - profitable;
    const accuracy = total > 0 ? Math.round((profitable / total) * 100) : 0;
    return { total, profitable, losing, accuracy };
  };

  const fetchStats = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'closedTrades'));
      const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ClosedTrade[];

      setOverall(calcStats(all));
      setEquity(calcStats(all.filter((t) => !t.segment || t.segment === 'equity')));
      setFutures(calcStats(all.filter((t) => t.segment === 'futures')));
      setOptions(calcStats(all.filter((t) => t.segment === 'options')));
    } catch (e) {
      console.error('Error fetching stats:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Overall Performance */}
      <OverallCard stats={overall} />

      {/* Segment Accuracy Row */}
      <View style={styles.segRow}>
        <SegmentAccuracyCard label="Equity Accuracy" stats={equity} fillColor="#22c55e" />
        <SegmentAccuracyCard label="Future Accuracy" stats={futures} fillColor="#f59e0b" />
        <SegmentAccuracyCard label="Option Accuracy" stats={options} fillColor="#3b82f6" />
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#e8edf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#e8edf5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },

  // ── Overall card
  overallCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e3a5f',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  overallRow: {
    flexDirection: 'row',
    marginTop: 20,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
  },
  overallStat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
  },
  overallStatLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  overallStatValue: {
    fontSize: 32,
    fontWeight: '900',
  },

  // ── Segment row
  segRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  segCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  segCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e3a5f',
    textAlign: 'center',
    marginBottom: 8,
  },
  segLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
});
