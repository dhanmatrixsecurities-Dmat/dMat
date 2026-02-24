import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

type Segment = 'equity' | 'futures' | 'options';

interface Trade {
  id: string;
  stockName: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  status: string;
  createdAt: string;
  segment: Segment;
}

export default function ActiveTrades() {
  const { userData } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSegment, setActiveSegment] = useState<Segment>('equity');

  useEffect(() => {
    if (userData?.status !== 'ACTIVE') {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'activeTrades'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tradesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Trade[];
        setTrades(tradesData);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error fetching active trades:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [userData]);

  const onRefresh = () => {
    setRefreshing(true);
  };

  // Filter trades by selected segment tab
  const filteredTrades = trades.filter((t) => t.segment === activeSegment);

  const renderTradeCard = ({ item }: { item: Trade }) => {
    const isBuy = item.type === 'BUY';
    const potential = ((item.targetPrice - item.entryPrice) / item.entryPrice) * 100;
    const risk = ((item.entryPrice - item.stopLoss) / item.entryPrice) * 100;

    return (
      <View style={styles.tradeCard}>
        <View style={styles.tradeHeader}>
          <View style={styles.stockInfo}>
            <Text style={styles.stockName}>{item.stockName}</Text>
            <View style={[styles.typeBadge, isBuy ? styles.buyBadge : styles.sellBadge]}>
              <Text style={styles.typeText}>{item.type}</Text>
            </View>
          </View>
          <Ionicons name="pulse" size={24} color={Colors.primary} />
        </View>

        <View style={styles.priceGrid}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Entry Price</Text>
            <Text style={styles.priceValue}>₹{item.entryPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Target</Text>
            <Text style={[styles.priceValue, styles.targetPrice]}>
              ₹{item.targetPrice.toFixed(2)}
            </Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Stop Loss</Text>
            <Text style={[styles.priceValue, styles.stopLoss]}>
              ₹{item.stopLoss.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Potential Gain</Text>
            <Text style={[styles.metricValue, styles.gainText]}>
              +{potential.toFixed(2)}%
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Risk</Text>
            <Text style={[styles.metricValue, styles.riskText]}>
              -{risk.toFixed(2)}%
            </Text>
          </View>
        </View>

        <View style={styles.dateContainer}>
          <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (userData?.status === 'BLOCKED') {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="lock-closed" size={80} color={Colors.error} />
        <Text style={styles.blockedTitle}>Account Blocked</Text>
        <Text style={styles.blockedText}>
          Your account has been blocked. Please contact support for assistance.
        </Text>
      </View>
    );
  }

  if (userData?.status === 'FREE') {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="star" size={80} color={Colors.warning} />
        <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
        <Text style={styles.upgradeText}>
          Active trades are only available to ACTIVE subscribers.
          {`\n\n`}Contact admin to upgrade your account.
        </Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.featureText}>Live trade alerts</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.featureText}>Real-time notifications</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.featureText}>Entry & exit signals</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── SEGMENT TABS ── */}
      <View style={styles.tabRow}>
        {(['equity', 'futures', 'options'] as Segment[]).map((seg) => (
          <TouchableOpacity
            key={seg}
            style={[styles.tab, activeSegment === seg && styles.tabActive]}
            onPress={() => setActiveSegment(seg)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeSegment === seg && styles.tabTextActive]}>
              {seg.charAt(0).toUpperCase() + seg.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredTrades.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={80} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No active {activeSegment} trades</Text>
          <Text style={styles.emptySubtext}>
            Pull down to refresh and check for new trades
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTrades}
          renderItem={renderTradeCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  listContent: {
    padding: 16,
  },

  // ── TABS ──
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: '#001F3F',
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#fff',
  },

  tradeCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stockInfo: {
    flex: 1,
  },
  stockName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  buyBadge: {
    backgroundColor: '#E8F5E9',
  },
  sellBadge: {
    backgroundColor: '#FFEBEE',
  },
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  targetPrice: {
    color: Colors.success,
  },
  stopLoss: {
    color: Colors.error,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  gainText: {
    color: Colors.success,
  },
  riskText: {
    color: Colors.error,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  blockedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.error,
    marginTop: 24,
  },
  blockedText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 24,
  },
  upgradeText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  featuresList: {
    marginTop: 32,
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
});
