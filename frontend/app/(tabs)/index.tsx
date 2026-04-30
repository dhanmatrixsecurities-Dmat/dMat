import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Animated,
  TouchableOpacity, Linking, ScrollView,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import Svg, {
  Circle, G, Ellipse, Polygon, Rect, Line, Polyline, Path,
  Defs, LinearGradient, Stop,
} from 'react-native-svg';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ClosedTrade {
  id: string;
  profitLossPercent: number;
  segment?: 'equity' | 'futures' | 'options';
}
interface SegmentStats {
  total: number; profitable: number; losing: number; accuracy: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { text: 'Good morning',   emoji: '☀️' };
  if (h >= 12 && h < 17) return { text: 'Good afternoon', emoji: '🌤️' };
  if (h >= 17 && h < 21) return { text: 'Good evening',   emoji: '🌙' };
  return                         { text: 'Good night',     emoji: '🌙' };
};

const getTodayKey = () => {
  const d = new Date();
  return `greeting_shown_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
};

// ─── Animated Circle for donut ────────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Donut Gauge — matches poster exactly ────────────────────────────────────
const DonutGauge = ({
  accuracy, size, strokeWidth, fillColor, trackColor,
}: {
  accuracy: number; size: number; strokeWidth: number;
  fillColor: string; trackColor: string;
}) => {
  const anim   = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circum = 2 * Math.PI * radius;
  useEffect(() => {
    Animated.timing(anim, { toValue: accuracy, duration: 1200, useNativeDriver: false }).start();
  }, [accuracy]);
  const dashOffset = anim.interpolate({
    inputRange:  [0, 100],
    outputRange: [circum, circum - (accuracy / 100) * circum],
  });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2},${size / 2}`}>
          <Circle cx={size/2} cy={size/2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="transparent" />
          <AnimatedCircle cx={size/2} cy={size/2} r={radius} stroke={fillColor} strokeWidth={strokeWidth}
            fill="transparent" strokeDasharray={circum} strokeDashoffset={dashOffset} strokeLinecap="round" />
        </G>
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#1a1a3e', fontSize: size * 0.2, fontWeight: '700' }}>{accuracy}%</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Greeting Toast ───────────────────────────────────────────────────────────
const GreetingToast = ({ name }: { name: string }) => {
  const slide   = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { text, emoji } = getGreeting();
  const first = name?.trim().split(' ')[0] || 'there';
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slide,   { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slide,   { toValue: -120, duration: 350, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0,    duration: 350, useNativeDriver: true }),
      ]).start();
    }, 5000);
    return () => clearTimeout(t);
  }, []);
  return (
    <Animated.View style={[s.toast, { transform: [{ translateY: slide }], opacity }]}>
      <Text style={s.toastEmoji}>{emoji}</Text>
      <View>
        <Text style={s.toastText}>{text}, {first}!</Text>
        <Text style={s.toastSub}>Welcome to DhanMatrix</Text>
      </View>
    </Animated.View>
  );
};

// ─── Ticker chip ──────────────────────────────────────────────────────────────
const TickerChip = () => (
  <View style={s.chip}>
    <View style={s.chipDot} />
    <Text style={s.chipText}>New Trade Posted</Text>
  </View>
);

// ─── KOOKY Robot — exact copy of poster SVG with float animation ──────────────
const KookyRobot = () => {
  const float   = useRef(new Animated.Value(0)).current;
  const liveDot = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: -6, duration: 1450, useNativeDriver: true }),
      Animated.timing(float, { toValue: 0,  duration: 1450, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(liveDot, { toValue: 1,   duration: 650, useNativeDriver: true }),
      Animated.timing(liveDot, { toValue: 0.3, duration: 650, useNativeDriver: true }),
    ])).start();
  }, []);
  return { float, liveDot };
};

// ═════════════════════════════════════════════════════════════════════════════
//  HOME SCREEN
// ═════════════════════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const { userData } = useAuth();
  const router = useRouter();

  const [loading,  setLoading]  = useState(true);
  const [overall,  setOverall]  = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });
  const [equity,   setEquity]   = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });
  const [futures,  setFutures]  = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });
  const [options,  setOptions]  = useState<SegmentStats>({ total: 0, profitable: 0, losing: 0, accuracy: 0 });
  const [showGreeting, setShowGreeting] = useState(false);

  const tickerAnim = useRef(new Animated.Value(0)).current;
  const robotFloat = useRef(new Animated.Value(0)).current;
  const liveDotAnim = useRef(new Animated.Value(0.3)).current;
  const iconPopAnim = useRef(new Animated.Value(1)).current;

  const calcStats = (trades: ClosedTrade[]): SegmentStats => {
    const total      = trades.length;
    const profitable = trades.filter(t => t.profitLossPercent > 0).length;
    return { total, profitable, losing: total - profitable, accuracy: total > 0 ? Math.round((profitable / total) * 100) : 0 };
  };

  useEffect(() => {
    // Ticker scroll — continuous loop
    Animated.loop(
      Animated.timing(tickerAnim, { toValue: -600, duration: 5000, useNativeDriver: true })
    ).start();

    // Robot float
    Animated.loop(Animated.sequence([
      Animated.timing(robotFloat, { toValue: -6, duration: 1450, useNativeDriver: true }),
      Animated.timing(robotFloat, { toValue: 0,  duration: 1450, useNativeDriver: true }),
    ])).start();

    // Live dot pulse
    Animated.loop(Animated.sequence([
      Animated.timing(liveDotAnim, { toValue: 1,   duration: 650, useNativeDriver: true }),
      Animated.timing(liveDotAnim, { toValue: 0.3, duration: 650, useNativeDriver: true }),
    ])).start();

    // Icon pop on ticker
    Animated.loop(Animated.sequence([
      Animated.timing(iconPopAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
      Animated.timing(iconPopAnim, { toValue: 1,    duration: 1000, useNativeDriver: true }),
    ])).start();
  }, []);

  // Load trades from Firebase
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'closedTrades'));
        const all  = snap.docs.map(d => ({ id: d.id, ...d.data() })) as ClosedTrade[];
        setOverall(calcStats(all));
        setEquity(calcStats(all.filter(t => !t.segment || t.segment === 'equity')));
        setFutures(calcStats(all.filter(t => t.segment === 'futures')));
        setOptions(calcStats(all.filter(t => t.segment === 'options')));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  // Greeting once per day
  useEffect(() => {
    (async () => {
      try {
        const key   = getTodayKey();
        const shown = await AsyncStorage.getItem(key);
        if (!shown) { setShowGreeting(true); await AsyncStorage.setItem(key, 'true'); }
      } catch (e) { console.error(e); }
    })();
  }, []);

  const firstName    = userData?.name?.trim().split(' ')[0] || 'there';
  const avatarLetter = (userData?.name || 'U')[0].toUpperCase();

  if (loading) return (
    <View style={s.loading}>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );

  const segments = [
    { label: 'Equity',  stats: equity,  color: '#22a85a', trackColor: '#e2f4ea', borderColor: '#22a85a' },
    { label: 'Futures', stats: futures, color: '#f5a623', trackColor: '#fdf0de', borderColor: '#f5a623' },
    { label: 'Options', stats: options, color: '#8b5cf6', trackColor: '#f0eaff', borderColor: '#8b5cf6' },
  ];

  return (
    <View style={s.outer}>
      {showGreeting && <GreetingToast name={userData?.name || ''} />}

      {/* ══════════════════════════════════════════════
          HEADER — dark navy gradient, exact as poster
          ══════════════════════════════════════════════ */}
      <View style={s.header}>
        {/* Greeting row */}
        <View style={s.hdrRow}>
          <View>
            <Text style={s.hdrHello}>Hi {firstName} 👋</Text>
            <Text style={s.hdrSub}>
              Kooky AI · <Text style={s.hdrAccent}>Your Stock Market</Text> Assistant
            </Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{avatarLetter}</Text>
          </View>
        </View>

        {/* VIEW ticker pill → Active Trades */}
        <TouchableOpacity
          style={s.tickerPill}
          onPress={() => router.push('/(tabs)/active-trades')}
          activeOpacity={0.82}
        >
          <Animated.View style={[s.tickerIcon, { transform: [{ scale: iconPopAnim }] }]}>
            <Svg width={10} height={10} viewBox="0 0 12 12" fill="none">
              <Polyline points="2,6 5,9 10,3" stroke="#4ecfa8" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Animated.View>
          <Text style={s.tickerTag}>View</Text>
          <View style={s.tickerTrack}>
            <Animated.View style={[s.tickerInner, { transform: [{ translateX: tickerAnim }] }]}>
              {[0,1,2,3,4,5,6,7].map(i => <TickerChip key={i} />)}
            </Animated.View>
          </View>
        </TouchableOpacity>
      </View>

      {/* ══════════════════════════════════════════════
          SCROLLABLE CONTENT — same order as poster
          ══════════════════════════════════════════════ */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── 1. Overall Performance ── */}
        <View style={s.perfCard}>
          <Text style={s.perfTitle}>Overall Performance</Text>
          <DonutGauge
            accuracy={overall.accuracy} size={88}
            strokeWidth={9} fillColor="#2563eb" trackColor="#eaecf5"
          />
          <View style={s.perfDivider} />
          <View style={s.perfRow}>
            <View style={s.perfCol}>
              <Text style={s.perfLbl}>Winning Trades</Text>
              <Text style={[s.perfVal, { color: '#22a85a' }]}>{overall.profitable}</Text>
            </View>
            <View style={s.perfSep} />
            <View style={s.perfCol}>
              <Text style={s.perfLbl}>Losing Trades</Text>
              <Text style={[s.perfVal, { color: '#e03030' }]}>{overall.losing}</Text>
            </View>
          </View>
        </View>

        {/* ── 2. Segment cards (Equity, Futures, Options) ── */}
        <View style={s.segRow}>
          {segments.map(seg => (
            <View key={seg.label} style={[s.segCard, { borderTopColor: seg.borderColor }]}>
              <Text style={s.segName}>{seg.label}</Text>
              <DonutGauge
                accuracy={seg.stats.accuracy} size={62}
                strokeWidth={7} fillColor={seg.color} trackColor={seg.trackColor}
              />
              <View style={s.segDivider} />
              <View style={s.segWL}>
                <View style={s.segStat}>
                  <Text style={[s.segVal, { color: '#22a85a' }]}>{seg.stats.profitable}</Text>
                  <Text style={s.segLbl}>Win</Text>
                </View>
                <View style={s.segSep} />
                <View style={s.segStat}>
                  <Text style={[s.segVal, { color: '#e03030' }]}>{seg.stats.losing}</Text>
                  <Text style={s.segLbl}>Loss</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ── 3. Round icon cards (Portfolio Stocks, Mutual Funds, IPO) ── */}
        <View style={s.roundRow}>
          {/* Portfolio Stocks — green circle */}
          <TouchableOpacity style={s.rc} activeOpacity={0.82}>
            <View style={[s.circle, { backgroundColor: '#1a6030', shadowColor: '#1a6030' }]}>
              <Svg width={32} height={32} viewBox="0 0 34 34" fill="none">
                <Polyline points="4,25 11,14 17,19 26,8" stroke="#c8f5d0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <Polyline points="21,8 26,8 26,13" stroke="#c8f5d0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <Circle cx="11" cy="14" r="2" fill="#c8f5d0" />
                <Circle cx="17" cy="19" r="2" fill="#c8f5d0" />
                <Circle cx="26" cy="8"  r="2" fill="#c8f5d0" />
              </Svg>
            </View>
            <Text style={s.rcLabel}>Portfolio{'\n'}Stocks</Text>
          </TouchableOpacity>

          {/* Mutual Funds — amber circle */}
          <TouchableOpacity style={s.rc} activeOpacity={0.82}>
            <View style={[s.circle, { backgroundColor: '#8c5000', shadowColor: '#8c5000' }]}>
              <Svg width={32} height={32} viewBox="0 0 34 34" fill="none">
                <Circle cx="17" cy="18" r="10" fill="none" stroke="#ffd080" strokeWidth="2.2" />
                <Path d="M17 18 L17 8 A10 10 0 0 1 25.66 23 Z" fill="#ffd080" opacity="0.85" />
                <Path d="M17 18 L25.66 23 A10 10 0 0 1 8.34 23 Z" fill="#ffd080" opacity="0.45" />
                <Line x1="17" y1="5" x2="17" y2="8" stroke="#ffd080" strokeWidth="2" strokeLinecap="round" />
              </Svg>
            </View>
            <Text style={s.rcLabel}>Mutual{'\n'}Funds</Text>
          </TouchableOpacity>

          {/* IPO — blue circle */}
          <TouchableOpacity
            style={s.rc}
            onPress={() => Linking.openURL('https://www.nseindia.com/market-data/all-upcoming-issues-ipo')}
            activeOpacity={0.82}
          >
            <View style={[s.circle, { backgroundColor: '#1030a0', shadowColor: '#1030a0' }]}>
              <Svg width={32} height={32} viewBox="0 0 34 34" fill="none">
                <Path d="M17 6C17 6 22 10 22 17L17 20L12 17C12 10 17 6 17 6Z" fill="#a0c4ff" />
                <Path d="M12 17L10 22L14 20Z" fill="#80aaff" />
                <Path d="M22 17L24 22L20 20Z" fill="#80aaff" />
                <Circle cx="17" cy="15" r="2.5" fill="#0b1e5c" />
                <Line x1="14"  y1="22" x2="20"  y2="22" stroke="#a0c4ff" strokeWidth="1.8" strokeLinecap="round" />
                <Line x1="15.5" y1="25" x2="18.5" y2="25" stroke="#a0c4ff" strokeWidth="1.5" strokeLinecap="round" />
              </Svg>
            </View>
            <Text style={s.rcLabel}>IPO</Text>
          </TouchableOpacity>
        </View>

        {/* ── 4. KOOKY AI Card → ajeeb tab ── */}
        <TouchableOpacity
          style={s.kookyCard}
          onPress={() => router.push('/(tabs)/ajeeb')}
          activeOpacity={0.88}
        >
          {/* Background orbs */}
          <View style={s.kOrb1} pointerEvents="none" />
          <View style={s.kOrb2} pointerEvents="none" />

          {/* Robot with float animation */}
          <Animated.View style={[s.kRobot, { transform: [{ translateY: robotFloat }] }]}>
            <Svg width={84} height={112} viewBox="0 0 84 112" fill="none">
              {/* Antenna */}
              <Line x1="42" y1="4" x2="42" y2="16" stroke="#60aaff" strokeWidth="2.4" strokeLinecap="round" />
              <Polygon points="42,1 43.6,5.5 48.5,5.5 44.6,8.3 46,13 42,10.2 38,13 39.4,8.3 35.5,5.5 40.4,5.5" fill="#90ccff" />
              {/* Head */}
              <Rect x="9" y="16" width="66" height="48" rx="23" fill="#0e3580" stroke="#4080ff" strokeWidth="1.8" />
              {/* Ears */}
              <Circle cx="9"  cy="40" r="7" fill="#0a2a6e" stroke="#4080ff" strokeWidth="1.4" />
              <Circle cx="75" cy="40" r="7" fill="#0a2a6e" stroke="#4080ff" strokeWidth="1.4" />
              {/* Cheek glows */}
              <Ellipse cx="20" cy="52" rx="7" ry="4" fill="#60a0ff" opacity="0.14" />
              <Ellipse cx="64" cy="52" rx="7" ry="4" fill="#60a0ff" opacity="0.14" />
              {/* Eye sockets */}
              <Rect x="24" y="27" width="16" height="14" rx="7" fill="#0a2060" />
              <Rect x="44" y="27" width="16" height="14" rx="7" fill="#0a2060" />
              {/* Left eye */}
              <Rect x="25.5" y="28.5" width="13" height="11" rx="5.5" fill="#3d7fff" />
              <Circle cx="29.5" cy="33" r="3"   fill="white" opacity="0.75" />
              <Circle cx="34"   cy="30" r="1.4" fill="white" opacity="0.35" />
              {/* Right eye */}
              <Rect x="45.5" y="28.5" width="13" height="11" rx="5.5" fill="#00c6ff" />
              <Circle cx="49.5" cy="33" r="3"   fill="white" opacity="0.75" />
              <Circle cx="54"   cy="30" r="1.4" fill="white" opacity="0.35" />
              {/* Smile */}
              <Path d="M27 56 Q42 66 57 56" stroke="#60aaff" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              {/* Neck */}
              <Rect x="35" y="64" width="14" height="9" rx="4" fill="#0c2d7a" />
              {/* Body */}
              <Rect x="11" y="73" width="62" height="37" rx="16" fill="#0c2d7a" stroke="#3060c0" strokeWidth="1.5" />
              {/* Chest */}
              <Circle cx="42" cy="89" r="14" fill="#3d7fff" opacity="0.25" />
              <Rect x="27" y="81" width="30" height="18" rx="8" fill="#0e3580" stroke="#3060c0" strokeWidth="1.1" />
              <Polyline points="30,93 34,88 38,91 42,85 46,89 50,86" stroke="#60c0ff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {/* Arms */}
              <Rect x="0"  y="76" width="10" height="22" rx="5" fill="#0c2d7a" stroke="#3060c0" strokeWidth="1.3" />
              <Rect x="74" y="76" width="10" height="22" rx="5" fill="#0c2d7a" stroke="#3060c0" strokeWidth="1.3" />
              <Circle cx="5"  cy="101" r="4.5" fill="#0c2d7a" stroke="#3060c0" strokeWidth="1.3" />
              <Circle cx="79" cy="101" r="4.5" fill="#0c2d7a" stroke="#3060c0" strokeWidth="1.3" />
              {/* Feet */}
              <Rect x="18" y="110" width="14" height="2" rx="1" fill="#3060c0" />
              <Rect x="52" y="110" width="14" height="2" rx="1" fill="#3060c0" />
            </Svg>
          </Animated.View>

          {/* Text side */}
          <View style={s.kText}>
            {/* AI Assistant pill */}
            <View style={s.kLivePill}>
              <Animated.View style={[s.kLiveDot, { opacity: liveDotAnim }]} />
              <Text style={s.kLiveTxt}>AI Assistant</Text>
            </View>

            {/* KOOKY name — exact colors from poster */}
            <Text style={s.kName}>
              <Text style={{ color: '#7eb8ff' }}>K</Text>
              <Text style={{ color: '#ffffff' }}>OO</Text>
              <Text style={{ color: '#7eb8ff' }}>K</Text>
              <Text style={{ color: '#60d4ff' }}>Y</Text>
            </Text>

            {/* Bracket divider */}
            <View style={s.kBracket}>
              <View style={s.kBracketTick} />
              <View style={s.kBracketLine} />
              <View style={s.kBracketTick} />
            </View>

            {/* Subtitle */}
            <Text style={s.kSub}>
              Ask me anything about your portfolio and financial market.
            </Text>

            {/* Ask Me button */}
            <View style={s.kBtn}>
              <Svg width={13} height={13} viewBox="0 0 16 16" fill="none">
                <Circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1.5" />
                <Path d="M5.5 8.5l2 2 3-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={s.kBtnText}>Ask Me</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES — match HTML poster pixel-perfect
// ═════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  outer:   { flex: 1, backgroundColor: '#eef1f6' },
  loading: { flex: 1, backgroundColor: '#eef1f6', alignItems: 'center', justifyContent: 'center' },
  scroll:  { padding: 8, gap: 7, paddingBottom: 24 },

  // ── Greeting Toast ──────────────────────────────────────────────────────────
  toast: {
    position: 'absolute', top: 10, left: 16, right: 16, zIndex: 999,
    backgroundColor: '#001F3F', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  toastEmoji: { fontSize: 26 },
  toastText:  { fontSize: 15, fontWeight: '800', color: '#fff' },
  toastSub:   { fontSize: 11, color: '#a0b4cc', marginTop: 1 },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    paddingTop: 12, paddingHorizontal: 18, paddingBottom: 14,
    backgroundColor: '#0d1b3e',
    // gradient simulation — RN doesn't support CSS gradients natively,
    // but LinearGradient from expo-linear-gradient can be used if available.
    // Falls back to solid dark navy which matches the poster well.
  },
  hdrRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 11,
  },
  hdrHello:  { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 2, lineHeight: 22 },
  hdrSub:    { color: 'rgba(180,200,255,0.65)', fontSize: 11, fontWeight: '400', lineHeight: 16 },
  hdrAccent: { color: '#4ecfa8', fontWeight: '500' },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#3b7ef8',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: 'rgba(100,150,255,0.25)', shadowOpacity: 1,
    shadowRadius: 0, shadowOffset: { width: 0, height: 0 },
  },
  avatarTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // ── Ticker Pill ──────────────────────────────────────────────────────────────
  tickerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)',
    borderRadius: 40, paddingVertical: 6, paddingHorizontal: 12,
    overflow: 'hidden',
  },
  tickerIcon: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(78,207,168,0.18)',
    borderWidth: 1, borderColor: 'rgba(78,207,168,0.5)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  tickerTag: {
    fontSize: 9.5, fontWeight: '700', letterSpacing: 1,
    textTransform: 'uppercase', color: '#4ecfa8', flexShrink: 0,
  },
  tickerTrack:  { flex: 1, overflow: 'hidden', height: 24 },
  tickerInner:  { flexDirection: 'row', alignItems: 'center', gap: 16, position: 'absolute' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(78,207,168,0.13)',
    borderWidth: 1, borderColor: 'rgba(78,207,168,0.28)',
    borderRadius: 20, paddingVertical: 3, paddingHorizontal: 9,
  },
  chipDot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: '#4ecfa8' },
  chipText: { fontSize: 10, fontWeight: '700', color: '#4ecfa8' },

  // ── Overall Performance card ─────────────────────────────────────────────────
  perfCard: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 10, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  perfTitle:   { fontSize: 12, fontWeight: '600', color: '#1a1a3e', marginBottom: 7 },
  perfDivider: { width: '100%', height: 1, backgroundColor: '#f0f2f8', marginTop: 7, marginBottom: 7 },
  perfRow:     { flexDirection: 'row', width: '100%' },
  perfCol:     { flex: 1, alignItems: 'center' },
  perfLbl:     { fontSize: 9.5, color: '#999', marginBottom: 1 },
  perfVal:     { fontSize: 20, fontWeight: '700' },
  perfSep:     { width: 1, backgroundColor: '#f0f2f8' },

  // ── Segment cards ────────────────────────────────────────────────────────────
  segRow:    { flexDirection: 'row', gap: 6 },
  segCard:   {
    flex: 1, backgroundColor: '#fff', borderRadius: 13,
    padding: 7, alignItems: 'center', borderTopWidth: 3,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  segName:    { fontSize: 10, fontWeight: '600', color: '#1a1a3e', marginBottom: 3 },
  segDivider: { width: '100%', height: 1, backgroundColor: '#f0f2f8', marginVertical: 4 },
  segWL:      { flexDirection: 'row', width: '100%' },
  segStat:    { flex: 1, alignItems: 'center' },
  segVal:     { fontSize: 10.5, fontWeight: '700' },
  segLbl:     { fontSize: 8, color: '#bbb' },
  segSep:     { width: 1, backgroundColor: '#f0f2f8' },

  // ── Round icon cards row ─────────────────────────────────────────────────────
  roundRow: {
    backgroundColor: '#fff', borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 6,
    flexDirection: 'row', justifyContent: 'space-around',
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  rc:      { alignItems: 'center', gap: 6 },
  circle:  {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.4, shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 }, elevation: 5,
  },
  rcLabel: { fontSize: 11, fontWeight: '700', color: '#1a1a3e', textAlign: 'center', lineHeight: 15 },

  // ── KOOKY Card ───────────────────────────────────────────────────────────────
  kookyCard: {
    backgroundColor: '#0a2a6e',
    borderRadius: 20, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    overflow: 'hidden', position: 'relative',
    borderWidth: 1.5, borderColor: 'rgba(80,140,255,0.25)',
    shadowColor: '#0a2a6e', shadowOpacity: 0.4,
    shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  kOrb1: {
    position: 'absolute', top: -30, right: -30,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(80,140,255,0.12)',
  },
  kOrb2: {
    position: 'absolute', bottom: -25, left: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(30,80,200,0.15)',
  },
  kRobot: { width: 92, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  kText:  { flex: 1, zIndex: 2 },

  kLivePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(100,160,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(100,160,255,0.3)',
    borderRadius: 20, paddingVertical: 3, paddingHorizontal: 9,
    alignSelf: 'flex-start', marginBottom: 7,
  },
  kLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#60aaff' },
  kLiveTxt: { fontSize: 9, fontWeight: '700', color: '#90c8ff', letterSpacing: 0.5, textTransform: 'uppercase' },

  kName: { fontSize: 24, fontWeight: '900', lineHeight: 24, letterSpacing: -0.5 },

  kBracket:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5, marginBottom: 8 },
  kBracketLine: { flex: 1, height: 2, maxWidth: 80, backgroundColor: 'rgba(100,180,255,0.55)', borderRadius: 2 },
  kBracketTick: { width: 2, height: 7, backgroundColor: 'rgba(100,180,255,0.6)', borderRadius: 2 },

  kSub: { fontSize: 11, color: '#8ab4e8', lineHeight: 17, marginBottom: 12 },

  kBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#3d7fff',
    borderRadius: 22, paddingVertical: 8, paddingHorizontal: 18,
    alignSelf: 'flex-start',
    shadowColor: 'rgba(30,100,255,0.4)', shadowOpacity: 1,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  kBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
