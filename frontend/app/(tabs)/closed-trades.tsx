import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
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
  entryPrice: number;
  exitPrice: number;
  profitLossPercent: number;
  closedAt: string;
}

export default function ClosedTrades() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<ClosedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = () => {
    setRefreshing(true);
  };

  const renderTradeCard = ({ item }: { item: ClosedTrade }) => {
    const isBuy = item.type === 'BUY';
    const isProfit = item.profitLossPercent > 0;

    return (
      <View style={styles.tradeCard}>
        <View style={styles.tradeHeader}>
          <View style={styles.stockInfo}>
            <Text style={styles.stockName}>{item.stockName}</Text>
            <View style={[styles.typeBadge, isBuy ? styles.buyBadge : styles.sellBadge]}>
              <Text style={styles.typeText}>{item.type}</Text>
            </View>
          </View>
          <View style={[styles.resultBadge, isProfit ? styles.profitBadge : styles.lossBadge]}>
            <Ionicons 
              name={isProfit ? 'trending-up' : 'trending-down'} 
              size={20} 
              color={Colors.secondary} 
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
          <Ionicons 
            name="arrow-forward" 
            size={24} 
            color={Colors.textSecondary} 
          />
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
      {trades.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={80} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No closed trades yet</Text>
          <Text style={styles.emptySubtext}>
            Completed trades will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={trades}
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
  },
  listContent: {
    padding: 16,
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
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  profitBadge: {
    backgroundColor: Colors.success,
  },
  lossBadge: {
    backgroundColor: Colors.error,
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  profitText: {
    color: Colors.success,
  },
  lossText: {
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
});