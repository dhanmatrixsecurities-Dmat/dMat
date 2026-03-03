import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Animated, TouchableOpacity,
  Linking, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import Svg, { Circle, G, Ellipse, Polygon, Rect, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAuth } from '@/contexts/AuthContext';

interface ClosedTrade {
  id: string; profitLossPercent: number; segment?: 'equity' | 'futures' | 'options';
}
interface SegmentStats {
  total: number; profitable: number; losing: number; accuracy: number;
}

function isSubscriptionActive(userData: any): boolean {
  if (!userData) return false;
  if (userData.status !== 'ACTIVE') return false;
  if (!userData.subscriptionEndDate) return false;
  const end = new Date(userData.subscriptionEndDate);
  end.setHours(23, 59, 59, 999);
  return end >= new Date();
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

const RotatingDiamond = () => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 2500, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={{ transform: [{ rotate: spin }, { scale: scaleAnim }] }}>
      <Svg width={52} height={52} viewBox="0 0 54 54">
        <Defs>
          <LinearGradient id="dTop" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#a5f3fc" />
            <Stop offset="100%" stopColor="#3b82f6" />
          </LinearGradient>
          <LinearGradient id="dLeft" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#1d4ed8" />
            <Stop offset="100%" stopColor="#6366f1" />
          </LinearGradient>
          <LinearGradient id="dRight" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#60a5fa" />
            <Stop offset="100%" stopColor="#93c5fd" />
          </LinearGradient>
        </Defs>
        <Polygon points="27,4 10,22 27,28 44,22" fill="url(#dTop)" opacity="0.95" />
        <Polygon points="10,22 27,28 27,50" fill="url(#dLeft)" opacity="0.9" />
        <Polygon points="44,22 27,28 27,50" fill="url(#dRight)" opacity="0.85" />
        <Polygon points="27,4 10,22 18,14" fill="#bfdbfe" opacity="0.5" />
        <Polygon points="20,14 27,4 34,14 27,18" fill="white" opacity="0.35" />
      </Svg>
    </Animated.View>
  );
};

const RoadSVG = () => (
  <Svg width="100%" height="110" viewBox="0 0 300 110" preserveAspectRatio="xMidYMid slice">
    <Defs>
      <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#b8cce8" /><Stop offset="100%" stopColor="#dce8f5" />
      </LinearGradient>
      <LinearGradient id="rd1" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#8899aa" /><Stop offset="100%" stopColor="#aabbcc" />
      </LinearGradient>
      <LinearGradient id="rd2" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#aabbcc" /><Stop offset="100%" stopColor="#bbccdd" />
      </LinearGradient>
    </Defs>
    <Rect width="300" height="110" fill="url(#sky)" />
    <Ellipse cx="150" cy="38" rx="55" ry="22" fill="white" opacity="0.7" />
    <Ellipse cx="150" cy="38" rx="25" ry="10" fill="white" opacity="0.9" />
    <Polygon points="0,110 108,110 150,38 62,38" fill="url(#rd1)" opacity="0.85" />
    <Line x1="0" y1="110" x2="150" y2="38" stroke="white" strokeWidth="1" opacity="0.4" />
    <Line x1="108" y1="110" x2="150" y2="38" stroke="white" strokeWidth="1" opacity="0.4" />
    <Polygon points="192,110 300,110 238,38 150,38" fill="url(#rd2)" opacity="0.85" />
    <Line x1="192" y1="110" x2="150" y2="38" stroke="white" strokeWidth="1" opacity="0.4" />
    <Line x1="300" y1="110" x2="238" y2="38" stroke="white" strokeWidth="1" opacity="0.4" />
    <G opacity="0.5">
      <Circle cx="100" cy="55" r="2.5" fill="#556688"/><Rect x="98" y="57.5" width="5" height="7" rx="1" fill="#445577"/>
      <Circle cx="110" cy="56" r="2.5" fill="#667799"/><Rect x="108" y="58.5" width="5" height="7" rx="1" fill="#556688"/>
      <Circle cx="120" cy="55" r="2.5" fill="#556688"/><Rect x="118" y="57.5" width="5" height="7" rx="1" fill="#445577"/>
    </G>
    <G opacity="0.85">
      <Circle cx="55" cy="80" r="3.5" fill="#334466"/><Rect x="51.5" y="83.5" width="7" height="10" rx="1" fill="#223355"/>
      <Circle cx="68" cy="81" r="3.5" fill="#556688"/><Rect x="64.5" y="84.5" width="7" height="10" rx="1" fill="#445577"/>
      <Circle cx="81" cy="80" r="3.5" fill="#334466"/><Rect x="77.5" y="83.5" width="7" height="10" rx="1" fill="#223355"/>
      <Circle cx="94" cy="81" r="3.5" fill="#667799"/><Rect x="90.5" y="84.5" width="7" height="10" rx="1" fill="#556688"/>
    </G>
    {/* Diamond placed where person figure was */}
    <Circle cx="212" cy="64" r="4.5" fill="#1a2a4a"/>
    <Rect x="207.5" y="68.5" width="9" height="13" rx="2" fill="#1a2a4a"/>
  </Svg>
);

export default function HomeScreen() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overall, setOverall] = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });
  const [equity, setEquity] = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });
  const [futures, setFutures] = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });
  const [options, setOptions] = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });
  const crownAnim = useRef(new Animated.Value(0)).current;
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState({ name: '', whatsapp: '', stock: '', buyingPrice: '', qty: '' });

  const calcStats = (trades: ClosedTrade[]): SegmentStats => {
    const total = trades.length;
    const profitable = trades.filter(t => t.profitLossPercent > 0).length;
    return { total, profitable, losing: total - profitable, accuracy: total > 0 ? Math.round((profitable / total) * 100) : 0 };
  };

  useEffect(() => {
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

  const handleSubmit = () => {
    if (!form.name || !form.whatsapp || !form.stock || !form.buyingPrice || !form.qty) return;
    setShowForm(false);
    setShowSuccess(true);
    setForm({ name: '', whatsapp: '', stock: '', buyingPrice: '', qty: '' });
  };

  const isActive = isSubscriptionActive(userData);
  if (loading) return <View style={s.loading}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <View style={s.container}>

      {/* Overall */}
      <View style={s.overallCard}>
        <Text style={s.overallTitle}>Overall Performance</Text>
        <DonutGauge accuracy={overall.accuracy} size={90} strokeWidth={10} fillColor="#3b82f6" />
        <View style={s.divider} />
        <View style={s.overallRow}>
          <View style={s.overallStat}>
            <Text style={s.statLabel}>Winning Trades</Text>
            <Text style={[s.statVal, { color: '#22c55e' }]}>{overall.profitable}</Text>
          </View>
          <View style={s.sep} />
          <View style={s.overallStat}>
            <Text style={s.statLabel}>Losing Trades</Text>
            <Text style={[s.statVal, { color: '#ef4444' }]}>{overall.losing}</Text>
          </View>
        </View>
      </View>

      {/* Segments */}
      <View style={s.segRow}>
        {[
          { label: 'Equity', stats: equity, color: '#22c55e' },
          { label: 'Futures', stats: futures, color: '#f59e0b' },
          { label: 'Options', stats: options, color: '#a855f7' },
        ].map((seg) => (
          <View key={seg.label} style={[s.segCard, { borderTopColor: seg.color }]}>
            <Text style={s.segTitle}>{seg.label}</Text>
            <DonutGauge accuracy={seg.stats.accuracy} size={65} strokeWidth={7} fillColor={seg.color} />
            <View style={s.segDivider} />
            <View style={s.segRow2}>
              <View style={s.segStat}>
                <Text style={s.segStatLabel}>Win</Text>
                <Text style={[s.segStatVal, { color: '#22c55e' }]}>{seg.stats.profitable}</Text>
              </View>
              <View style={s.segSep} />
              <View style={s.segStat}>
                <Text style={s.segStatLabel}>Loss</Text>
                <Text style={[s.segStatVal, { color: '#ef4444' }]}>{seg.stats.losing}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* IPO & Mutual Fund */}
      <View style={s.quickRow}>
        <TouchableOpacity style={[s.quickCard, { borderLeftColor: '#3b82f6' }]}
          onPress={() => Linking.openURL('https://www.nseindia.com/market-data/all-upcoming-issues-ipo')} activeOpacity={0.85}>
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

      {/* Portfolio Checkup */}
      <View style={s.portfolioCard}>
        <Text style={s.portfolioEmoji}>🩺</Text>
        <View style={s.portfolioText}>
          <Text style={s.portfolioTitle}>FREE Portfolio Health Checkup</Text>
          <Text style={s.portfolioSub}>Analyze your investment portfolio for free!</Text>
        </View>
        <TouchableOpacity style={s.checkBtn} onPress={() => setShowForm(true)} activeOpacity={0.85}>
          <Text style={s.checkBtnText}>Check Now</Text>
        </TouchableOpacity>
      </View>

      {/* FREE / EXPIRED → Subscription */}
      {!isActive && (
        <View style={s.subCard}>
          <View style={s.subTop}>
            <View style={s.subLeft}>
              <Animated.Text style={[s.crown, { transform: [{ translateY: crownAnim }] }]}>👑</Animated.Text>
              <Text style={s.subHeading}>Subscription Plan</Text>
            </View>
            <View style={s.subRight}>
              <Text style={s.gst}>Incl. of GST </Text>
              <Text style={s.price}>₹5,000</Text>
            </View>
          </View>
          <Text style={s.planLabel}>Quarterly · 3 Months</Text>
          <View style={s.subDivider} />
          <View style={s.features}>
            {[{ icon: '📊', label: 'Swing Trade' }, { icon: '📈', label: 'Option Trades' }, { icon: '🔮', label: 'Future Trades' }].map((f) => (
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

      {/* ACTIVE → DhanMatrix Welcome Card */}
      {isActive && (
        <View style={s.welcomeCard}>
          {/* Road SVG with diamond floating on top of it */}
          <View style={s.roadWrapper}>
            <RoadSVG />
            {/* Diamond overlaid on the road, centered */}
            <View style={s.diamondOnRoad} pointerEvents="none">
              <RotatingDiamond />
            </View>
          </View>

          <View style={s.welcomeContent}>
            <Text style={s.welcomeTitle}>
              Welcome to <Text style={s.welcomeBrand}>DhanMatrix</Text> family!
            </Text>
            <View style={s.quoteBox}>
              <Text style={s.quoteIcon}>❝</Text>
              <Text style={s.quoteText}>"No loss is also a profit in trading"</Text>
              <Text style={s.quoteAuthor}>— DhanMatrix</Text>
            </View>
            <View style={s.quoteBox}>
              <Text style={s.quoteIcon}>❝</Text>
              <Text style={s.quoteText}>"When everyone is greedy be <Text style={{ fontWeight: '900' }}>fearful</Text>, and when everyone is fearful be <Text style={{ fontWeight: '900' }}>greedy</Text>"</Text>
              <Text style={s.quoteAuthor}>— Warren Buffett</Text>
            </View>
          </View>
        </View>
      )}

      {/* Form Modal */}
      <Modal visible={showForm} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>🩺 Portfolio Health Checkup</Text>
            <Text style={s.modalSub}>Fill in details — we'll send a free analysis on WhatsApp</Text>
            <TextInput style={s.input} placeholder="Your Name" placeholderTextColor="#94a3b8" value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
            <TextInput style={s.input} placeholder="WhatsApp Number" placeholderTextColor="#94a3b8" keyboardType="phone-pad" value={form.whatsapp} onChangeText={v => setForm({ ...form, whatsapp: v })} />
            <TextInput style={s.input} placeholder="Stock Name (e.g. RELIANCE)" placeholderTextColor="#94a3b8" value={form.stock} onChangeText={v => setForm({ ...form, stock: v })} />
            <TextInput style={s.input} placeholder="Buying Price (₹)" placeholderTextColor="#94a3b8" keyboardType="numeric" value={form.buyingPrice} onChangeText={v => setForm({ ...form, buyingPrice: v })} />
            <TextInput style={s.input} placeholder="Quantity Bought" placeholderTextColor="#94a3b8" keyboardType="numeric" value={form.qty} onChangeText={v => setForm({ ...form, qty: v })} />
            <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
              <Text style={s.submitBtnText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowForm(false)} style={{ marginTop: 10, alignItems: 'center' }}>
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.successBox}>
            <Text style={s.successEmoji}>✅</Text>
            <Text style={s.successTitle}>Request Received!</Text>
            <Text style={s.successMsg}>We'll research your portfolio and send you a detailed report on WhatsApp within 24 hours.</Text>
            <TouchableOpacity style={s.submitBtn} onPress={() => setShowSuccess(false)} activeOpacity={0.85}>
              <Text style={s.submitBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#eef1f8', alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#eef1f8', padding: 10, gap: 8 },
  overallCard: { backgroundColor: '#fff', borderRadius: 16, padding: 10, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  overallTitle: { fontSize: 15, fontWeight: '800', color: '#1e3a5f', marginBottom: 6 },
  divider: { width: '100%', height: 1, backgroundColor: '#e2e8f0', marginVertical: 6 },
  overallRow: { flexDirection: 'row', width: '100%' },
  overallStat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', marginBottom: 1 },
  statVal: { fontSize: 24, fontWeight: '900' },
  sep: { width: 1, backgroundColor: '#e2e8f0' },
  segRow: { flexDirection: 'row', gap: 7 },
  segCard: { flex: 1, backgroundColor: '#fff', borderRadius: 13, padding: 7, alignItems: 'center', borderTopWidth: 4, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  segTitle: { fontSize: 10, fontWeight: '800', color: '#1e3a5f', marginBottom: 3 },
  segDivider: { width: '100%', height: 1, backgroundColor: '#e2e8f0', marginVertical: 4 },
  segRow2: { flexDirection: 'row', width: '100%' },
  segStat: { flex: 1, alignItems: 'center' },
  segStatLabel: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  segStatVal: { fontSize: 14, fontWeight: '900' },
  segSep: { width: 1, backgroundColor: '#e2e8f0' },
  quickRow: { flexDirection: 'row', gap: 7 },
  quickCard: { flex: 1, backgroundColor: '#fff', borderRadius: 13, padding: 9, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  quickIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 7 },
  quickEmoji: { fontSize: 17 },
  quickText: { flex: 1 },
  quickTitle: { fontSize: 13, fontWeight: '800', color: '#1e3a5f' },
  quickSub: { fontSize: 10, color: '#64748b', marginTop: 1 },
  quickArrow: { fontSize: 22, color: '#94a3b8' },
  portfolioCard: { backgroundColor: '#eef3ff', borderRadius: 14, padding: 11, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#3b82f6', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  portfolioEmoji: { fontSize: 28, marginRight: 10 },
  portfolioText: { flex: 1 },
  portfolioTitle: { fontSize: 12, fontWeight: '800', color: '#1e3a5f' },
  portfolioSub: { fontSize: 10, color: '#64748b', marginTop: 2 },
  checkBtn: { backgroundColor: '#3b82f6', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 7 },
  checkBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  subCard: { flex: 1, backgroundColor: '#fff', borderRadius: 15, padding: 11, borderLeftWidth: 4, borderLeftColor: '#3b82f6', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  subTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  crown: { fontSize: 20 },
  subHeading: { fontSize: 14, fontWeight: '800', color: '#1e3a5f' },
  subRight: { flexDirection: 'row', alignItems: 'center' },
  gst: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  price: { fontSize: 17, fontWeight: '900', color: '#1e3a5f' },
  planLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600', marginTop: 2, marginBottom: 7 },
  subDivider: { height: 1, backgroundColor: '#e2e8f0', marginBottom: 8 },
  features: { flexDirection: 'row', gap: 7, marginBottom: 9 },
  featurePill: { flex: 1, backgroundColor: '#f5f7fc', borderRadius: 9, padding: 7, alignItems: 'center' },
  featureIcon: { fontSize: 15, marginBottom: 3 },
  featureLabel: { fontSize: 10, fontWeight: '700', color: '#1e3a5f' },
  subBtn: { backgroundColor: '#3b82f6', borderRadius: 10, padding: 10, alignItems: 'center' },
  subBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Welcome card
  welcomeCard: { borderRadius: 15, overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: '#3b82f6', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  roadWrapper: { height: 110, backgroundColor: '#c8d8f0' },
  // Diamond absolutely centered over the road
  diamondOnRoad: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  welcomeContent: { backgroundColor: '#fff', padding: 12 },
  welcomeTitle: { fontSize: 15, fontWeight: '700', color: '#1e3a5f', textAlign: 'center', marginBottom: 10 },
  welcomeBrand: { fontSize: 15, fontWeight: '900', color: '#3b82f6' },
  quoteBox: { backgroundColor: '#eef2ff', borderRadius: 10, padding: 9, marginBottom: 7 },
  quoteIcon: { fontSize: 20, color: '#f59e0b', fontWeight: '900' },
  quoteText: { fontSize: 14, color: '#1e3a5f', fontWeight: '600', lineHeight: 20, textAlign: 'center', marginTop: 3 },
  quoteAuthor: { fontSize: 12, color: '#64748b', fontWeight: '600', textAlign: 'right', marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1e3a5f', marginBottom: 4 },
  modalSub: { fontSize: 12, color: '#64748b', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#1e3a5f', marginBottom: 10, backgroundColor: '#f8fafc' },
  submitBtn: { backgroundColor: '#3b82f6', borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  successBox: { backgroundColor: '#fff', borderRadius: 20, padding: 28, margin: 30, alignItems: 'center' },
  successEmoji: { fontSize: 48, marginBottom: 12 },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#1e3a5f', marginBottom: 8 },
  successMsg: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
});
