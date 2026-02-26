import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

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

// ── Gauge Component ───────────────────────────────────────────────────────────

const Gauge = ({
  accuracy,
  size = 160,
  color = '#22c55e',
}: {
  accuracy: number;
  size?: number;
  color?: string;
}) => {
  const stroke = size * 0.09;
  const radius = (size - stroke) / 2;
  const circumference = Math.PI * radius; // half circle
  const greenLen = (accuracy / 100) * circumference;
  const redLen = circumference - greenLen;

  return (
    <View style={{ width: size, height: size / 2 + stroke, alignItems: 'center' }}>
      {/* SVG-style using View arcs — use simple curved bar via borderRadius */}
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: stroke,
        borderColor: '#1e3a5f',
        position: 'absolute',
        top: 0,
        overflow: 'hidden',
      }} />
      {/* Green arc */}
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: stroke,
        borderColor: 'transparent',
        borderTopColor: color,
        borderLeftColor: color,
        position: 'absolute',
        top: 0,
        transform: [{ rotate: `${-180 + (accuracy / 100) * 180}deg` }],
      }} />
      {/* Red arc */}
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: stroke,
        borderColor: 'transparent',
        borderTopColor: '#ef4444',
        borderRightColor: '#ef4444',
        position: 'absolute',
        top: 0,
      }} />
    </View>
  );
};

// ── Accuracy Dial ─────────────────────────────────────────────────────────────

const AccuracyDial = ({
  accuracy,
  size = 180,
  color = '#22c55e',
}: {
  accuracy: number;
  size?: number;
  color?: string;
}) => (
  <View style={{ alignItems: 'center', marginVertical: 8 }}>
    {/* Outer ring */}
    <View style={[dialStyles.ring, {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderColor: '#1e3a5f',
    }]}>
      {/* Green portion */}
      <View style={[dialStyles.greenArc, {
        width: size - 20,
        height: size - 20,
        borderRadius: (size - 20) / 2,
        borderColor: color,
        borderRightColor: 'transparent',
        borderBottomColor: accuracy > 50 ? color : 'transparent',
        transform: [{ rotate: `-135deg` }],
      }]} />
      {/* Red portion */}
      <View style={[dialStyles.redArc, {
        width: size - 20,
        height: size - 20,
        borderRadius: (size - 20) / 2,
        borderColor: '#ef4444',
        borderLeftColor: 'transparent',
        borderBottomColor: 'transparent',
        transform: [{ rotate: `45deg` }],
      }]} />
      {/* Center content */}
      <View style={dialStyles.center}>
        <Text style={[dialStyles.label, { color: '#94a3b8' }]}>Accuracy</Text>
        <Text style={[dialStyles.value, { color: '#fff', fontSize: size * 0.22 }]}>
          {accuracy}%
        </Text>
        <View style={dialStyles.iconRow}>
          <View style={dialStyles.greenDot}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
          </View>
          <View style={dialStyles.redDot}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✕</Text>
          </View>
        </View>
      </View>
    </View>
  </View>
);

const dialStyles = StyleSheet.create({
  ring: {
    borderWidth: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a1628',
  },
  greenArc: {
    position: 'absolute',
    borderWidth: 10,
  },
  redArc: {
    position: 'absolute',
    borderWidth: 10,
  },
  center: {
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  value: {
    fontWeight: '900',
    letterSpacing: -1,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  greenDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ── Segment Card ──────────────────────────────────────────────────────────────

const SegmentCard = ({
  title,
  icon,
  stats,
  accentColor,
}: {
  title: string;
  icon: string;
  stats: SegmentStats;
  accentColor: string;
}) => (
  <View style={[cardStyles.card, { borderTopColor: accentColor }]}>
    <View style={cardStyles.header}>
      <Text style={cardStyles.icon}>{icon}</Text>
      <Text style={cardStyles.title}>{title}</Text>
    </View>
    <AccuracyDial accuracy={stats.accuracy} size={130} color={accentColor} />
    <View style={cardStyles.stats}>
      <View style={cardStyles.statRow}>
        <Text style={cardStyles.statLabel}>Total Trades</Text>
        <Text style={cardStyles.statValue}>{stats.total}</Text>
      </View>
      <View style={cardStyles.statRow}>
        <Text style={cardStyles.statLabel}>Profitable Trades</Text>
        <Text style={[cardStyles.statValue, { color: '#22c55e' }]}>
          {stats.profitable} <Text style={cardStyles.badge}>In Profit</Text>
        </Text>
      </View>
      <View style={cardStyles.statRow}>
        <Text style={cardStyles.statLabel}>Losing Trades</Text>
        <Text style={[cardStyles.statValue, { color: '#ef4444' }]}>
          {stats.losing} <Text style={cardStyles.badge}>In Loss</Text>
        </Text>
      </View>
    </View>
  </View>
);

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#0d1f38',
    borderRadius: 16,
    padding: 16,
    borderTopWidth: 3,
    marginBottom: 12,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: { fontSize: 18, marginRight: 6 },
  title: { fontSize: 14, fontWeight: '700', color: '#fff' },
  stats: { marginTop: 8 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  statValue: { fontSize: 13, fontWeight: '700', color: '#fff' },
  badge: { fontSize: 10, fontWeight: '600', color: '#94a3b8' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

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
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Title */}
      <Text style={styles.pageTitle}>Trading Performance</Text>
      <Text style={styles.pageSubtitle}>Overview</Text>

      {/* Overall Accuracy Dial */}
      <View style={styles.overallCard}>
        <AccuracyDial accuracy={overall.accuracy} size={200} color="#22c55e" />

        {/* Overall Stats Row */}
        <View style={styles.overallRow}>
          <View style={styles.overallStat}>
            <Text style={styles.overallStatLabel}>Total Trades</Text>
            <Text style={styles.overallStatValue}>{overall.total}</Text>
          </View>
          <View style={[styles.overallStat, styles.overallStatBorder]}>
            <Text style={styles.overallStatLabel}>Profitable Trades</Text>
            <Text style={[styles.overallStatValue, { color: '#22c55e' }]}>
              {overall.profitable}
            </Text>
            <Text style={styles.inProfit}>In Profit</Text>
          </View>
          <View style={styles.overallStat}>
            <Text style={styles.overallStatLabel}>Losing Trades</Text>
            <Text style={[styles.overallStatValue, { color: '#ef4444' }]}>
              {overall.losing}
            </Text>
            <Text style={styles.inLoss}>In Loss</Text>
          </View>
        </View>
      </View>

      {/* Segment Cards */}
      <View style={styles.segmentRow}>
        <SegmentCard title="Equity Performance" icon="📊" stats={equity} accentColor="#22c55e" />
        <SegmentCard title="Futures Performance" icon="🔄" stats={futures} accentColor="#f59e0b" />
      </View>
      <SegmentCard title="Options Performance" icon="💊" stats={options} accentColor="#3b82f6" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#061122',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#061122',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  overallCard: {
    backgroundColor: '#0d1f38',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  overallRow: {
    flexDirection: 'row',
    marginTop: 16,
    width: '100%',
  },
  overallStat: {
    flex: 1,
    alignItems: 'center',
  },
  overallStatBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1e3a5f',
  },
  overallStatLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '500',
  },
  overallStatValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
  },
  inProfit: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '600',
  },
  inLoss: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 0,
  },
});
