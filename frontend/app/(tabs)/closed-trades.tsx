import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface ClosedTrade {
  id: string;
  stockName: string;
  type: 'BUY' | 'SELL';
  segment?: 'equity' | 'futures' | 'options';
  entryPrice: number;
  exitPrice: number;
  profitLossPercent: number;
  closedAt: string;
}

type SegmentFilter = 'equity' | 'futures' | 'options';

const TABS: { label: string; value: SegmentFilter; color: string }[] = [
  { label: 'Equity', value: 'equity', color: '#22c55e' },
  { label: 'Futures', value: 'futures', color: '#f59e0b' },
  { label: 'Options', value: 'options', color: '#a855f7' },
];

export default function ClosedTrades() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<ClosedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<SegmentFilter>('equity');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'closedTrades'),
      orderBy('closedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tradesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ClosedTrade[];
        setTrades(tradesData);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error fetching closed trades:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const filteredTrades = trades.filter((t) => {
    if (activeTab === 'equity') return !t.segment || t.segment === 'equity';
    return t.segment === activeTab;
  });

  const onRefresh = () => setRefreshing(true);

  const activeColor = TABS.find(t => t.value === activeTab)?.color || '#22c55e';

  const renderTradeCard = ({ item }: { item: ClosedTrade }) => {
    const isBuy = item.type === 'BUY';
    const isProfit = item.profitLossPercent > 0;
    const segmentColor =
      item.segment === 'futures' ? '#f59e0b' :
      item.segment === 'options' ? '#a855f7' : '#22c55e';

    return (
      <View style={styles.tradeCard}>
        <View style={styles.tradeHeader}>
          <View style={styles.stockInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.stockName}>{item.stockName}</Text>
              <View style={[styles.segmentBadge, { backgroundColor: segmentColor + '22', borderColor: segmentColor }]}>
                <Text style={[styles.segmentText, { color: segmentColor }]}>
                  {(item.segment || 'equity').toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={[styles.typeBadge, isBuy ? styles.buyBadge : styles.sellBadge]}>
              <Text style={[styles.typeText, { color: isBuy ? '#22c55e' : '#ef4444' }]}>{item.type}</Text>
            </View>
          </View>
          <View style={[styles.resultBadge, isProfit ? styles.profitBadge : styles.lossBadge]}>
            <Ionicons
              name={isProfit ? 'trending-up' : 'trending-down'}
              size={20}
              color="#fff"
            />
            <Text style={styles.resultText}>
              {isProfit ? '+' : ''}{item.profitLossPercent.toFixed(2)}%
            </Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Entry Price</Text>
            <Text style={styles.priceValue}>₹{item.entryPrice.toFixed(2)}</Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color={Colors.textSecondary} />
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>Exit Price</Text>
            <Text style={[styles.priceValue, isProfit ? styles.profitText : styles.lossText]}>
              ₹{item.exitPrice.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.dateText}>
            Closed: {new Date(item.closedAt).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
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

  return (
    <View style={styles.container}>

      {/* ── Segment Tabs ── */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[
              styles.tab,
              activeTab === tab.value && { backgroundColor: tab.color, borderColor: tab.color },
            ]}
            onPress={() => setActiveTab(tab.value)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.value ? { color: '#fff' } : { color: Colors.textSecondary },
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredTrades.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={80} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No {activeTab} trades yet</Text>
          <Text style={styles.emptySubtext}>Completed {activeTab} trades will appear here</Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
  centerContainer: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },

  // Tabs
  tabRow: {
    flexDirection: 'row', padding: 12, gap: 8,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  tabText: { fontSize: 13, fontWeight: '700' },

  // List
  listContent: { padding: 16 },
  tradeCard: {
    backgroundColor: Colors.cardBackground, borderRadius: 16,
    padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  tradeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  stockInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' },
  stockName: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  segmentBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  segmentText: { fontSize: 10, fontWeight: '800' },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  buyBadge: { backgroundColor: '#E8F5E9' },
  sellBadge: { backgroundColor: '#FFEBEE' },
  typeText: { fontSize: 12, fontWeight: 'bold' },
  resultBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  profitBadge: { backgroundColor: Colors.success },
  lossBadge: { backgroundColor: Colors.error },
  resultText: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginLeft: 4 },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  priceItem: { flex: 1, alignItems: 'center' },
  priceLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  priceValue: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  profitText: { color: Colors.success },
  lossText: { color: Colors.error },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 12, color: Colors.textSecondary, marginLeft: 4 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.text, marginTop: 16, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' },
});
