import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Animated, TouchableOpacity,
  Linking, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import Svg, { Circle, G, Ellipse, Polygon, Rect, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';  // ← ADDED

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

const getGreeting = (): { text: string; emoji: string } => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12)  return { text: 'Good morning',   emoji: '☀️' };
  if (hour >= 12 && hour < 17) return { text: 'Good afternoon', emoji: '🌤️' };
  if (hour >= 17 && hour < 21) return { text: 'Good evening',   emoji: '🌙' };
  return                               { text: 'Good night',     emoji: '🌙' };
};

const getTodayKey = (): string => {
  const d = new Date();
  return `greeting_shown_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
};

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

const EvilEye = () => {
  const swayAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(swayAnim, { toValue: -1, duration: 700, useNativeDriver: true }),
        Animated.timing(swayAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const rotate = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-15deg', '15deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }], marginLeft: 4 }}>
      <Svg width={18} height={18} viewBox="0 0 100 100">
        <Ellipse cx="50" cy="50" rx="46" ry="30" fill="#1565C0" />
        <Ellipse cx="50" cy="50" rx="34" ry="22" fill="#ffffff" />
        <Ellipse cx="50" cy="50" rx="24" ry="16" fill="#42A5F5" />
        <Ellipse cx="50" cy="50" rx="13" ry="13" fill="#1a237e" />
        <Ellipse cx="44" cy="44" rx="4" ry="4" fill="white" opacity="0.85" />
        <Ellipse cx="50" cy="24" rx="10" ry="5" fill="#FFD700" opacity="0.7" />
      </Svg>
    </Animated.View>
  );
};

const RoadSVG = () => (
  <Svg width="100%" height="75" viewBox="0 0 300 110" preserveAspectRatio="xMidYMid slice">
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
    <Circle cx="212" cy="64" r="4.5" fill="#1a2a4a"/>
    <Rect x="207.5" y="68.5" width="9" height="13" rx="2" fill="#1a2a4a"/>
  </Svg>
);

const GreetingToast = ({ name }: { name: string }) => {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const { text, emoji } = getGreeting();
  const firstName = name?.trim().split(' ')[0] || 'there';
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -120, duration: 350, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <Animated.View style={[s.toast, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
      <Text style={s.toastEmoji}>{emoji}</Text>
      <View>
        <Text style={s.toastText}>{text}, {firstName}!</Text>
        <Text style={s.toastSub}>Welcome to DhanMatrix</Text>
      </View>
    </Animated.View>
  );
};

// ── KOOKY Robot SVG (inline, no external asset needed) ────────────────
const KookyRobotSVG = () => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -5, duration: 1450, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,  duration: 1450, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
      <Svg width={72} height={96} viewBox="0 0 84 112" fill="none">
        {/* Antenna */}
        <Line x1="42" y1="4" x2="42" y2="16" stroke="#60aaff" strokeWidth="2.4" strokeLinecap="round" />
        <Polygon points="42,1 43.6,5.5 48.5,5.5 44.6,8.3 46,13 42,10.2 38,13 39.4,8.3 35.5,5.5 40.4,5.5" fill="#90ccff" />
        {/* Head */}
        <Rect x="9" y="16" width="66" height="48" rx="23" fill="#0e3580" stroke="#4080ff" strokeWidth="1.8" />
        {/* Ears */}
        <Circle cx="9"  cy="40" r="7" fill="#0a2a6e" stroke="#4080ff" strokeWidth="1.4" />
        <Circle cx="75" cy="40" r="7" fill="#0a2a6e" stroke="#4080ff" strokeWidth="1.4" />
        {/* Eye sockets */}
        <Rect x="24" y="27" width="16" height="14" rx="7" fill="#0a2060" />
        <Rect x="44" y="27" width="16" height="14" rx="7" fill="#0a2060" />
        {/* Eyes */}
        <Rect x="25.5" y="28.5" width="13" height="11" rx="5.5" fill="#3d7fff" />
        <Circle cx="29.5" cy="33" r="3" fill="white" opacity="0.75" />
        <Circle cx="34"   cy="30" r="1.4" fill="white" opacity="0.35" />
        <Rect x="45.5" y="28.5" width="13" height="11" rx="5.5" fill="#00c6ff" />
        <Circle cx="49.5" cy="33" r="3" fill="white" opacity="0.75" />
        <Circle cx="54"   cy="30" r="1.4" fill="white" opacity="0.35" />
        {/* Smile */}
        <Line x1="27" y1="56" x2="57" y2="56" stroke="#60aaff" strokeWidth="2.2" strokeLinecap="round" />
        {/* Neck */}
        <Rect x="35" y="64" width="14" height="9" rx="4" fill="#0c2d7a" />
        {/* Body */}
        <Rect x="11" y="73" width="62" height="37" rx="16" fill="#0c2d7a" stroke="#3060c0" strokeWidth="1.5" />
        {/* Chest panel */}
        <Rect x="27" y="81" width="30" height="18" rx="8" fill="#0e3580" stroke="#3060c0" strokeWidth="1.1" />
        <Polygon points="30,93 34,88 38,91 42,85 46,89 50,86" fill="none" stroke="#60c0ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        {/* Arms */}
        <Rect x="0"  y="76" width="10" height="22" rx="5" fill="#0c2d7a" stroke="#3060c0" strokeWidth="1.3" />
        <Rect x="74" y="76" width="10" height="22" rx="5" fill="#0c2d7a" stroke="#3060c0" strokeWidth="1.3" />
        <Circle cx="5"  cy="101" r="4.5" fill="#0c2d7a" stroke="#3060c0" strokeWidth="1.3" />
        <Circle cx="79" cy="101" r="4.5" fill="#0c2d7a" stroke="#3060c0" strokeWidth="1.3" />
      </Svg>
    </Animated.View>
  );
};

// ── Animated ticker chip ──────────────────────────────────────────────
const TickerChip = ({ delay = 0 }: { delay?: number }) => {
  const glowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    }, delay);
  }, []);
  const opacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  return (
    <Animated.View style={[s.tradeChip, { opacity }]}>
      <View style={s.tradeChipDot} />
      <Text style={s.tradeChipText}>New Trade Posted</Text>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const { userData } = useAuth();
  const router = useRouter();  // ← ADDED
  const [loading, setLoading] = useState(true);
  const [overall, setOverall] = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });
  const [equity, setEquity] = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });
  const [futures, setFutures] = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });
  const [options, setOptions] = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });
  const crownAnim = useRef(new Animated.Value(0)).current;
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState({ name: '', whatsapp: '', stock: '', buyingPrice: '', qty: '' });
  const [showGreeting, setShowGreeting] = useState(false);

  // Ticker scroll animation
  const tickerAnim = useRef(new Animated.Value(0)).current;
  const TICKER_WIDTH = 600; // approx total width of chips row

  useEffect(() => {
    Animated.loop(
      Animated.timing(tickerAnim, {
        toValue: -TICKER_WIDTH / 2,
        duration: 6000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

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

  useEffect(() => {
    const checkGreeting = async () => {
      try {
        const key = getTodayKey();
        const shown = await AsyncStorage.getItem(key);
        if (!shown) { setShowGreeting(true); await AsyncStorage.setItem(key, 'true'); }
      } catch (e) { console.error('Greeting error:', e); }
    };
    checkGreeting();
  }, []);

  const handleSubmit = () => {
    if (!form.name || !form.whatsapp || !form.stock || !form.buyingPrice || !form.qty) return;
    setShowForm(false);
    setShowSuccess(true);
    setForm({ name: '', whatsapp: '', stock: '', buyingPrice: '', qty: '' });
  };

  const isActive = isSubscriptionActive(userData);
  const firstName = userData?.name?.trim().split(' ')[0] || 'there';

  if (loading) return <View style={s.loading}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <View style={s.outer}>
      {showGreeting && <GreetingToast name={userData?.name || ''} />}

      {/* ════════════════════════════════════════════
          HEADER — gradient with greeting + VIEW pill
          ════════════════════════════════════════════ */}
      <View style={s.header}>
        {/* Top row: greeting + avatar */}
        <View style={s.hdrRow}>
          <View>
            <Text style={s.hdrHello}>Hi {firstName} 👋</Text>
            <Text style={s.hdrSub}>
              DhanMatrix · <Text style={s.hdrSubAccent}>Your Market Assistant</Text>
            </Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{(userData?.name || 'U')[0].toUpperCase()}</Text>
          </View>
        </View>

        {/* ── VIEW pill — tapping goes to Active Trades ── */}
        <TouchableOpacity
          style={s.tickerPill}
          onPress={() => router.push('/(tabs)/active-trades')}  // ← NAVIGATION
          activeOpacity={0.82}
        >
          {/* Check icon */}
          <View style={s.tickerIcon}>
            <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
              <Polygon points="2,6 5,9 10,3" fill="none" stroke="#4ecfa8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <Text style={s.tickerTag}>View</Text>
          {/* Scrolling chips */}
          <View style={s.tickerScroll}>
            <Animated.View style={[s.tickerInner, { transform: [{ translateX: tickerAnim }] }]}>
              {[0, 400, 800, 1200].map((delay, i) => (
                <TickerChip key={i} delay={delay} />
              ))}
            </Animated.View>
          </View>
        </TouchableOpacity>
      </View>

      {/* ════════════════════════════════════════════
          SCROLLABLE CONTENT
          ════════════════════════════════════════════ */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Performance */}
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
            { label: 'Equity',  stats: equity,  color: '#22c55e' },
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

        {/* Subscription / Welcome card */}
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

        {isActive && (
          <View style={s.welcomeCard}>
            <View style={s.roadTop}><RoadSVG /></View>
            <View style={s.welcomeContent}>
              <View style={s.titleRow}>
                <Text style={s.welcomeTitle}>
                  Welcome to <Text style={s.welcomeBrand}>DhanMatrix</Text> family!
                </Text>
                <EvilEye />
              </View>
              <View style={s.quoteBox}>
                <Text style={s.quoteIcon}>❝</Text>
                <Text style={s.quoteText}>
                  "<Text style={{ fontWeight: '900' }}>No loss</Text> is also a <Text style={{ fontWeight: '900' }}>profit</Text> in trading"
                </Text>
                <Text style={s.quoteAuthor}>— DhanMatrix</Text>
              </View>
              <View style={[s.quoteBox, { marginBottom: 0 }]}>
                <Text style={s.quoteIcon}>❝</Text>
                <Text style={s.quoteText}>
                  "When everyone is greedy be <Text style={{ fontWeight: '900' }}>fearful</Text>, and when everyone is fearful be <Text style={{ fontWeight: '900' }}>greedy</Text>"
                </Text>
                <Text style={s.quoteAuthor}>— Warren Buffett</Text>
              </View>
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════════
            KOOKY AI CARD — tapping goes to ajeeb tab
            ════════════════════════════════════════════ */}
        <TouchableOpacity
          style={s.kookyCard}
          onPress={() => router.push('/(tabs)/ajeeb')}  // ← NAVIGATION
          activeOpacity={0.88}
        >
          {/* Orb decorations */}
          <View style={s.kOrb1} pointerEvents="none" />
          <View style={s.kOrb2} pointerEvents="none" />

          {/* Robot */}
          <View style={s.kRobot}>
            <KookyRobotSVG />
          </View>

          {/* Text side */}
          <View style={s.kText}>
            <View style={s.kLivePill}>
              <View style={s.kLiveDot} />
              <Text style={s.kLiveTxt}>AI ASSISTANT</Text>
            </View>
            <Text style={s.kName}>
              <Text style={s.k1}>K</Text>
              <Text style={s.kOO}>OO</Text>
              <Text style={s.k2}>K</Text>
              <Text style={s.kY}>Y</Text>
            </Text>
            <View style={s.kBracket}>
              <View style={s.kBracketTick} />
              <View style={s.kBracketLine} />
              <View style={s.kBracketTick} />
            </View>
            <Text style={s.kSub}>
              Ask me anything about your portfolio and financial market.
            </Text>
            <View style={s.kBtn}>
              <Text style={s.kBtnText}>✦  Ask Me</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ height: 12 }} />
      </ScrollView>

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
  outer:    { flex: 1, backgroundColor: '#eef1f8' },
  loading:  { flex: 1, backgroundColor: '#eef1f8', alignItems: 'center', justifyContent: 'center' },
  container:{ padding: 10, gap: 8, paddingBottom: 20 },

  // ── HEADER ──────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#0d1b3e',
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  hdrRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 12,
  },
  hdrHello: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 2 },
  hdrSub:   { color: 'rgba(180,200,255,0.6)', fontSize: 11, fontWeight: '500' },
  hdrSubAccent: { color: '#4ecfa8', fontWeight: '700' },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#3b7ef8',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // ── TICKER / VIEW PILL ───────────────────────────────────────────────
  tickerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 40, paddingVertical: 6, paddingHorizontal: 12,
    overflow: 'hidden',
  },
  tickerIcon: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(78,207,168,0.2)',
    borderWidth: 1, borderColor: 'rgba(78,207,168,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  tickerTag: {
    fontSize: 9.5, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase',
    color: '#4ecfa8',
  },
  tickerScroll: { flex: 1, overflow: 'hidden', height: 24 },
  tickerInner: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    position: 'absolute',
  },
  tradeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(78,207,168,0.13)',
    borderWidth: 1, borderColor: 'rgba(78,207,168,0.3)',
    borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10,
  },
  tradeChipDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4ecfa8' },
  tradeChipText: { fontSize: 10, fontWeight: '700', color: '#4ecfa8' },

  // ── GREETING TOAST ───────────────────────────────────────────────────
  toast: {
    position: 'absolute', top: 10, left: 16, right: 16, zIndex: 999,
    backgroundColor: '#001F3F', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  toastEmoji: { fontSize: 26 },
  toastText:  { fontSize: 15, fontWeight: '800', color: '#ffffff' },
  toastSub:   { fontSize: 11, color: '#a0b4cc', marginTop: 1 },

  // ── OVERALL ─────────────────────────────────────────────────────────
  overallCard: { backgroundColor: '#fff', borderRadius: 16, padding: 10, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  overallTitle: { fontSize: 15, fontWeight: '800', color: '#1e3a5f', marginBottom: 6 },
  divider: { width: '100%', height: 1, backgroundColor: '#e2e8f0', marginVertical: 6 },
  overallRow: { flexDirection: 'row', width: '100%' },
  overallStat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', marginBottom: 1 },
  statVal: { fontSize: 24, fontWeight: '900' },
  sep: { width: 1, backgroundColor: '#e2e8f0' },

  // ── SEGMENTS ────────────────────────────────────────────────────────
  segRow: { flexDirection: 'row', gap: 7 },
  segCard: { flex: 1, backgroundColor: '#fff', borderRadius: 13, padding: 7, alignItems: 'center', borderTopWidth: 4, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  segTitle: { fontSize: 10, fontWeight: '800', color: '#1e3a5f', marginBottom: 3 },
  segDivider: { width: '100%', height: 1, backgroundColor: '#e2e8f0', marginVertical: 4 },
  segRow2: { flexDirection: 'row', width: '100%' },
  segStat: { flex: 1, alignItems: 'center' },
  segStatLabel: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  segStatVal: { fontSize: 14, fontWeight: '900' },
  segSep: { width: 1, backgroundColor: '#e2e8f0' },

  // ── QUICK CARDS ─────────────────────────────────────────────────────
  quickRow: { flexDirection: 'row', gap: 7 },
  quickCard: { flex: 1, backgroundColor: '#fff', borderRadius: 13, padding: 9, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  quickIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 7 },
  quickEmoji: { fontSize: 17 },
  quickText: { flex: 1 },
  quickTitle: { fontSize: 13, fontWeight: '800', color: '#1e3a5f' },
  quickSub: { fontSize: 10, color: '#64748b', marginTop: 1 },
  quickArrow: { fontSize: 22, color: '#94a3b8' },

  // ── PORTFOLIO ───────────────────────────────────────────────────────
  portfolioCard: { backgroundColor: '#eef3ff', borderRadius: 14, padding: 11, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#3b82f6', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  portfolioEmoji: { fontSize: 28, marginRight: 10 },
  portfolioText: { flex: 1 },
  portfolioTitle: { fontSize: 12, fontWeight: '800', color: '#1e3a5f' },
  portfolioSub: { fontSize: 10, color: '#64748b', marginTop: 2 },
  checkBtn: { backgroundColor: '#3b82f6', borderRadius: 8, paddingHorizontal: 11, paddingVertical: 7 },
  checkBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // ── SUBSCRIPTION ────────────────────────────────────────────────────
  subCard: { backgroundColor: '#fff', borderRadius: 15, padding: 11, borderLeftWidth: 4, borderLeftColor: '#3b82f6', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
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

  // ── WELCOME ─────────────────────────────────────────────────────────
  welcomeCard: { borderRadius: 13, overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: '#3b82f6', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  roadTop: { height: 75, backgroundColor: '#c8d8f0' },
  welcomeContent: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 6 },
  welcomeTitle: { fontSize: 13, fontWeight: '700', color: '#1e3a5f', textAlign: 'center' },
  welcomeBrand: { fontSize: 13, fontWeight: '900', color: '#3b82f6' },
  quoteBox: { backgroundColor: '#eef2ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, marginBottom: 6 },
  quoteIcon: { fontSize: 13, color: '#f59e0b' },
  quoteText: { fontSize: 11, color: '#1e3a5f', fontWeight: '600', lineHeight: 15, textAlign: 'center', marginTop: 1 },
  quoteAuthor: { fontSize: 10, color: '#64748b', fontWeight: '600', textAlign: 'right', marginTop: 2 },

  // ── KOOKY CARD ──────────────────────────────────────────────────────
  kookyCard: {
    backgroundColor: '#0a2a6e',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(80,140,255,0.25)',
    elevation: 6,
    shadowColor: '#0a2a6e',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  kOrb1: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(80,140,255,0.10)',
  },
  kOrb2: {
    position: 'absolute', bottom: -25, left: -20,
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(30,80,200,0.13)',
  },
  kRobot: { width: 80, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  kText:  { flex: 1, zIndex: 2 },
  kLivePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(100,160,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)',
    borderRadius: 20, paddingVertical: 3, paddingHorizontal: 9,
    alignSelf: 'flex-start', marginBottom: 7,
  },
  kLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#60aaff' },
  kLiveTxt: { fontSize: 9, fontWeight: '700', color: '#90c8ff', letterSpacing: 0.5 },
  kName:    { fontSize: 26, fontWeight: '900', lineHeight: 28, letterSpacing: -0.5 },
  k1:  { color: '#7eb8ff' },
  kOO: { color: '#ffffff' },
  k2:  { color: '#7eb8ff' },
  kY:  { color: '#60d4ff' },
  kBracket: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, marginBottom: 8 },
  kBracketLine: { flex: 1, height: 2, maxWidth: 80, backgroundColor: 'rgba(100,180,255,0.5)', borderRadius: 2 },
  kBracketTick: { width: 2, height: 7, backgroundColor: 'rgba(100,180,255,0.6)', borderRadius: 2 },
  kSub: { fontSize: 11, color: '#8ab4e8', lineHeight: 16, marginBottom: 12 },
  kBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#3d7fff',
    borderRadius: 22, paddingVertical: 8, paddingHorizontal: 18,
    alignSelf: 'flex-start',
    elevation: 4, shadowColor: '#3d7fff', shadowOpacity: 0.4, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  kBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // ── MODALS ──────────────────────────────────────────────────────────
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
