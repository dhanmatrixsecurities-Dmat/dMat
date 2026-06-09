import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, Easing,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Holding {
  symbol:   string;
  name:     string;
  sector:   string;
  cap:      string;
  value:    number;
  returnPct: number;
  weight:   number;
  weightLabel: string;
  weightColor: 'green' | 'amber' | 'red';
  pe:       string;
  roe:      string;
  de:       string;
  peColor:  'green' | 'amber' | 'red';
  roeColor: 'green' | 'amber' | 'red';
  deColor:  'green' | 'amber' | 'red';
  logoColor: string;
  logoText:  string;
  logoTextColor: string;
}

export interface PortfolioAnalysis {
  totalValue:     number;
  returnPct:      number;
  zone:           'green' | 'amber' | 'red';
  zoneLabel:      string;
  score:          number;
  scoreLabel:     string;
  scoreSubtitle:  string;
  chips: { label: string; type: 'green' | 'amber' | 'red' }[];
  kookyTake:      string;
  holdings:       Holding[];
  metrics: {
    totalValueFmt:  string;
    returnFmt:      string;
    returnVsNifty:  string;
    beta:           string;
    betaNote:       string;
    betaSub:        string;
    sharpe:         string;
    sharpeNote:     string;
    sharpeSub:      string;
    maxDrawdown:    string;
    drawdownNote:   string;
    drawdownSub:    string;
    var95:          string;
    varNote:        string;
    varSub:         string;
  };
  benchmarks: { name: string; value: string; pct: number; color: string; valColor: string }[];
  healthBars: { label: string; pct: number; color: string }[];
  observations: { type: 'green' | 'amber' | 'red'; title: string; body: string }[];
  nextSteps: { head: string; desc: string }[];
  longTerm: string;
}

// ─── Colors ──────────────────────────────────────────────────────────────────

const C = {
  bg:         '#0B1A2E',
  card:       '#111E33',
  border:     '#1A2E4A',
  blue:       '#2979FF',
  green:      '#22C55E',
  greenBg:    '#0A2A0A',
  greenBorder:'#1A4A1A',
  amber:      '#F59E0B',
  amberBg:    '#2A1A0A',
  amberBorder:'#3A2A00',
  red:        '#EF4444',
  redBg:      '#2A0A0A',
  redBorder:  '#3A0A0A',
  infoBg:     '#0A1A3A',
  infoBorder: '#1A2E5A',
  text:       '#E2E8F0',
  sub:        '#4A6A8A',
  muted:      '#2E4060',
};

const TAG: Record<string, { bg: string; text: string }> = {
  green: { bg: C.greenBg,  text: C.green },
  amber: { bg: C.amberBg,  text: C.amber },
  red:   { bg: C.redBg,    text: C.red   },
};

const OBS: Record<string, { bg: string; border: string; titleColor: string; textColor: string; iconBg: string }> = {
  green: { bg: '#0A1E10', border: '#1A3A20', titleColor: C.green, textColor: '#4A8A5A', iconBg: '#1A4A2A' },
  amber: { bg: '#1E1600', border: '#3A2A00', titleColor: C.amber, textColor: '#8A6A2A', iconBg: '#3A2A0A' },
  red:   { bg: '#1E0A0A', border: '#3A1A1A', titleColor: C.red,   textColor: '#8A3A3A', iconBg: '#3A1A1A' },
};

const CHIP_ICON: Record<string, string> = { green: 'checkmark', amber: 'warning-outline', red: 'close' };

// ─── Animated bar ─────────────────────────────────────────────────────────────

function AnimBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct / 100,
      duration: 1000,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, []);
  const { width } = Dimensions.get('window');
  const trackW = width - 32 - 16 - 100 - 36;
  return (
    <View style={[s.barTrack, { width: trackW }]}>
      <Animated.View style={[s.barFill, { backgroundColor: color, flex: anim }]} />
      <Animated.View style={{ flex: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }} />
    </View>
  );
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ target, size = 64 }: { target: number; size?: number }) {
  const [n, setN] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: target,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    anim.addListener(({ value }) => setN(Math.round(value)));
    return () => anim.removeAllListeners();
  }, []);

  const offset = circ - (circ * (n / 100));

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={8} />
      <Circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={C.blue} strokeWidth={8}
        strokeDasharray={`${circ}`}
        strokeDashoffset={`${offset}`}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size/2},${size/2}`}
      />
      <SvgText x={size/2} y={size/2 - 5} textAnchor="middle" fontSize="15" fontWeight="700" fill={C.text}>{n}</SvgText>
      <SvgText x={size/2} y={size/2 + 10} textAnchor="middle" fontSize="8" fill={C.sub}>/100</SvgText>
    </Svg>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SecLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={s.secLabel}>
      <Ionicons name={icon as any} size={14} color={C.sub} />
      <Text style={s.secLabelText}>{label}</Text>
    </View>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ label, type }: { label: string; type: 'green' | 'amber' | 'red' | 'info' }) {
  const colors = {
    green: { bg: C.greenBg, text: C.green },
    amber: { bg: C.amberBg, text: C.amber },
    red:   { bg: C.redBg,   text: C.red   },
    info:  { bg: C.infoBg,  text: '#60A5FA' },
  };
  const c = colors[type];
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      <Text style={[s.badgeText, { color: c.text }]}>{label}</Text>
    </View>
  );
}

// ─── Holding card ─────────────────────────────────────────────────────────────

function HoldingCard({ h, delay }: { h: Holding; delay: number }) {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, delay, useNativeDriver: true }).start();
  }, []);
  const wColor = TAG[h.weightColor].text;
  const { width } = Dimensions.get('window');
  const barW = width - 32 - 16 - 16 - 80;

  return (
    <Animated.View style={[s.holdCard, { opacity: fade }]}>
      <View style={s.holdRow1}>
        <View style={s.holdLeft}>
          <View style={[s.holdLogo, { backgroundColor: h.logoColor }]}>
            <Text style={[s.holdLogoText, { color: h.logoTextColor }]}>{h.logoText}</Text>
          </View>
          <View>
            <Text style={s.holdName}>{h.name}</Text>
            <Text style={s.holdSector}>{h.sector} · {h.cap} · NSE</Text>
          </View>
        </View>
        <View style={s.holdRight}>
          <Text style={s.holdVal}>₹{h.value.toLocaleString('en-IN')}</Text>
          <Text style={[s.holdRet, { color: h.returnPct >= 0 ? C.green : C.red }]}>
            {h.returnPct >= 0 ? '▲' : '▼'} {Math.abs(h.returnPct).toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={s.holdTags}>
        <View style={[s.holdTag, { backgroundColor: TAG[h.peColor].bg }]}>
          <Text style={[s.holdTagText, { color: TAG[h.peColor].text }]}>PE {h.pe}</Text>
        </View>
        <View style={[s.holdTag, { backgroundColor: TAG[h.roeColor].bg }]}>
          <Text style={[s.holdTagText, { color: TAG[h.roeColor].text }]}>ROE {h.roe}</Text>
        </View>
        <View style={[s.holdTag, { backgroundColor: TAG[h.deColor].bg }]}>
          <Text style={[s.holdTagText, { color: TAG[h.deColor].text }]}>D/E {h.de}</Text>
        </View>
      </View>

      <View style={s.holdBarWrap}>
        <View style={s.holdBarLabel}>
          <Text style={s.holdBarKey}>Portfolio weight</Text>
          <Text style={[s.holdBarVal, { color: wColor }]}>{h.weight}% — {h.weightLabel}</Text>
        </View>
        <View style={[s.holdBarTrack, { width: barW }]}>
          <AnimBar pct={h.weight} color={wColor} delay={delay + 200} />
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Metric box ───────────────────────────────────────────────────────────────

function MetBox({ label, value, valueColor, badge, badgeType, sub }:
  { label: string; value: string; valueColor?: string; badge: string; badgeType: 'green'|'amber'|'red'|'info'; sub?: string }) {
  return (
    <View style={s.metBox}>
      <Text style={s.metLabel}>{label}</Text>
      <Text style={[s.metValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
      <Badge label={badge} type={badgeType} />
      {sub && <Text style={s.metSub}>{sub}</Text>}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function KookyPortfolioCard({ data }: { data: PortfolioAnalysis }) {
  const signalColors = {
    green: { bg: '#0A2A1A', border: '#1A4A2A', dot: C.green, text: C.green, label: 'HEALTHY' },
    amber: { bg: C.amberBg, border: '#3A2A0A', dot: C.amber, text: C.amber, label: 'MODERATE' },
    red:   { bg: C.redBg,   border: '#3A0A0A', dot: C.red,   text: C.red,   label: 'CAUTION' },
  };
  const sc = signalColors[data.zone];

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.hdrTop}>
          <View style={s.kBrand}>
            <View style={s.kBox}>
              <Text style={s.kBoxText}>K</Text>
              <View style={s.kOnline} />
            </View>
            <View>
              <Text style={s.kTitle}>Kooky AI</Text>
              <Text style={s.kSub}>Portfolio analysis report</Text>
            </View>
          </View>
          <View style={[s.signalPill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <View style={[s.signalDot, { backgroundColor: sc.dot }]} />
            <Text style={[s.signalText, { color: sc.text }]}>{sc.label}</Text>
          </View>
        </View>

        {/* Score strip */}
        <View style={s.scoreStrip}>
          <ScoreRing target={data.score} size={64} />
          <View style={s.scoreInfo}>
            <Text style={s.scoreLabel}>{data.scoreLabel}</Text>
            <Text style={s.scoreSub}>{data.scoreSubtitle}</Text>
          </View>
        </View>
      </View>

      {/* ── Chips ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsScroll} contentContainerStyle={s.chipsContent}>
        {data.chips.map((chip, i) => (
          <View key={i} style={[s.chip, {
            backgroundColor: TAG[chip.type].bg,
            borderColor: chip.type === 'green' ? C.greenBorder : chip.type === 'amber' ? C.amberBorder : C.redBorder,
          }]}>
            <Ionicons name={CHIP_ICON[chip.type] as any} size={11} color={TAG[chip.type].text} />
            <Text style={[s.chipText, { color: TAG[chip.type].text }]}>{chip.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* ── Kooky take ── */}
      <View style={s.kookyTake}>
        <Text style={s.kookyTakeLabel}>Kooky's take</Text>
        <View style={s.kookyTakeBody}>
          <View style={s.kookyAvatar}><Text style={s.kookyAvatarText}>K</Text></View>
          <Text style={s.kookyTakeText}>{data.kookyTake}</Text>
        </View>
      </View>

      {/* ── Holdings ── */}
      <View style={s.section}>
        <SecLabel icon="briefcase-outline" label="Your holdings" />
        {data.holdings.map((h, i) => (
          <HoldingCard key={i} h={h} delay={i * 100} />
        ))}
      </View>

      {/* ── Key numbers ── */}
      <View style={s.section}>
        <SecLabel icon="bar-chart-outline" label="Key numbers" />
        <View style={s.metGrid}>
          <MetBox label="Total value"    value={data.metrics.totalValueFmt}  badge={`${data.holdings.length} stocks`} badgeType="info" />
          <MetBox label="Overall return" value={data.metrics.returnFmt} valueColor={C.green} badge={data.metrics.returnVsNifty} badgeType="green" />
          <MetBox label="Portfolio beta" value={data.metrics.beta} badge={data.metrics.betaNote} badgeType="amber" sub={data.metrics.betaSub} />
          <MetBox label="Sharpe ratio"   value={data.metrics.sharpe} badge={data.metrics.sharpeNote} badgeType="green" sub={data.metrics.sharpeSub} />
          <MetBox label="Max drawdown"   value={data.metrics.maxDrawdown} valueColor={C.red} badge={data.metrics.drawdownNote} badgeType="red" sub={data.metrics.drawdownSub} />
          <MetBox label="VaR (95%)"      value={data.metrics.var95} valueColor={C.amber} badge={data.metrics.varNote} badgeType="amber" sub={data.metrics.varSub} />
        </View>
      </View>

      {/* ── Benchmark ── */}
      <View style={s.section}>
        <SecLabel icon="trending-up-outline" label="vs benchmark" />
        <View style={s.benchCard}>
          {data.benchmarks.map((b, i) => (
            <View key={i} style={[s.benchRow, i === data.benchmarks.length - 1 && { marginBottom: 0 }]}>
              <Text style={[s.benchName, i === 0 && { color: C.blue, fontWeight: '700' }]}>{b.name}</Text>
              <View style={s.benchTrack}>
                <AnimBar pct={b.pct} color={b.color} delay={i * 150 + 300} />
              </View>
              <Text style={[s.benchVal, { color: b.valColor }]}>{b.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Health breakdown ── */}
      <View style={s.section}>
        <SecLabel icon="shield-outline" label="Portfolio health breakdown" />
        <View style={s.healthCard}>
          {data.healthBars.map((hb, i) => (
            <View key={i} style={[s.benchRow, i === data.healthBars.length - 1 && { marginBottom: 0 }]}>
              <Text style={s.benchName}>{hb.label}</Text>
              <View style={s.benchTrack}>
                <AnimBar pct={hb.pct} color={hb.color} delay={i * 120 + 200} />
              </View>
              <Text style={[s.benchVal, { color: hb.color }]}>{hb.pct}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Observations ── */}
      <View style={s.section}>
        <SecLabel icon="eye-outline" label="What Kooky sees" />
        {data.observations.map((obs, i) => {
          const oc = OBS[obs.type];
          const icon = obs.type === 'green' ? 'checkmark' : obs.type === 'amber' ? 'warning-outline' : 'close';
          return (
            <View key={i} style={[s.obsCard, { backgroundColor: oc.bg, borderColor: oc.border }]}>
              <View style={s.obsTop}>
                <View style={[s.obsIcon, { backgroundColor: oc.iconBg }]}>
                  <Ionicons name={icon as any} size={11} color={oc.titleColor} />
                </View>
                <Text style={[s.obsTitle, { color: oc.titleColor }]}>{obs.title}</Text>
              </View>
              <Text style={[s.obsBody, { color: oc.textColor }]}>{obs.body}</Text>
            </View>
          );
        })}
      </View>

      {/* ── Next steps ── */}
      <View style={s.section}>
        <SecLabel icon="map-outline" label="What to research next" />
        {data.nextSteps.map((ns, i) => (
          <View key={i} style={s.stepCard}>
            <View style={s.stepNum}><Text style={s.stepNumText}>{i + 1}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.stepHead}>{ns.head}</Text>
              <Text style={s.stepDesc}>{ns.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Long term ── */}
      <View style={[s.section, { marginBottom: 0 }]}>
        <View style={s.ltBox}>
          <Ionicons name="time-outline" size={20} color="#60A5FA" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={s.ltHead}>Long-term view (3–5 years)</Text>
            <Text style={s.ltTxt}>{data.longTerm}</Text>
          </View>
        </View>
      </View>

      <Text style={s.disc}>
        For education & research only · Not investment advice · No entry/exit recommendations{'\n'}
        Consult a SEBI-registered advisor before any financial decision
      </Text>

    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: C.bg },
  header:          { padding: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  hdrTop:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  kBrand:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kBox:            { width: 36, height: 36, backgroundColor: '#1E3A8A', borderRadius: 10, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  kBoxText:        { fontSize: 14, fontWeight: '800', color: '#93C5FD' },
  kOnline:         { position: 'absolute', bottom: -2, right: -2, width: 9, height: 9, backgroundColor: C.green, borderRadius: 5, borderWidth: 2, borderColor: C.bg },
  kTitle:          { fontSize: 14, fontWeight: '700', color: '#fff' },
  kSub:            { fontSize: 10, color: C.sub, marginTop: 1 },
  signalPill:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  signalDot:       { width: 7, height: 7, borderRadius: 4 },
  signalText:      { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  scoreStrip:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  scoreInfo:       { flex: 1 },
  scoreLabel:      { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  scoreSub:        { fontSize: 12, color: C.sub, lineHeight: 17 },

  chipsScroll:     { borderBottomWidth: 1, borderBottomColor: C.border },
  chipsContent:    { paddingHorizontal: 16, paddingVertical: 10, gap: 7 },
  chip:            { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  chipText:        { fontSize: 11, fontWeight: '600' },

  kookyTake:       { margin: 14, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12 },
  kookyTakeLabel:  { fontSize: 10, fontWeight: '700', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 },
  kookyTakeBody:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  kookyAvatar:     { width: 28, height: 28, backgroundColor: '#1E3A8A', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  kookyAvatarText: { fontSize: 11, fontWeight: '700', color: '#93C5FD' },
  kookyTakeText:   { flex: 1, fontSize: 13, color: C.text, lineHeight: 20 },

  section:         { marginHorizontal: 14, marginTop: 18 },
  secLabel:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  secLabelText:    { fontSize: 11, fontWeight: '700', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.7 },

  holdCard:        { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, marginBottom: 8 },
  holdRow1:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  holdLeft:        { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  holdLogo:        { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  holdLogoText:    { fontSize: 12, fontWeight: '800' },
  holdName:        { fontSize: 13, fontWeight: '700', color: '#fff' },
  holdSector:      { fontSize: 10, color: C.sub, marginTop: 1 },
  holdRight:       { alignItems: 'flex-end' },
  holdVal:         { fontSize: 14, fontWeight: '700', color: '#fff' },
  holdRet:         { fontSize: 11, fontWeight: '600', marginTop: 2 },
  holdTags:        { flexDirection: 'row', gap: 6, marginBottom: 10 },
  holdTag:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  holdTagText:     { fontSize: 9, fontWeight: '700' },
  holdBarWrap:     {},
  holdBarLabel:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  holdBarKey:      { fontSize: 10, color: C.sub },
  holdBarVal:      { fontSize: 10, fontWeight: '700' },
  holdBarTrack:    { height: 5, backgroundColor: C.border, borderRadius: 99, overflow: 'hidden', flexDirection: 'row' },

  metGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metBox:          { width: '47.5%', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 11 },
  metLabel:        { fontSize: 10, color: C.sub, marginBottom: 4 },
  metValue:        { fontSize: 18, fontWeight: '800', color: '#fff' },
  metSub:          { fontSize: 10, color: C.sub, marginTop: 4, lineHeight: 14 },

  badge:           { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, marginTop: 5, alignSelf: 'flex-start' },
  badgeText:       { fontSize: 9, fontWeight: '700' },

  benchCard:       { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12 },
  healthCard:      { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12 },
  benchRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  benchName:       { fontSize: 11, color: '#94A3B8', width: 100 },
  benchTrack:      { flex: 1, height: 5, backgroundColor: C.border, borderRadius: 99, overflow: 'hidden', flexDirection: 'row' },
  benchVal:        { fontSize: 12, fontWeight: '700', width: 40, textAlign: 'right' },
  barTrack:        { height: '100%', flexDirection: 'row' },
  barFill:         { borderRadius: 99 },

  obsCard:         { borderWidth: 1, borderRadius: 12, padding: 11, marginBottom: 8 },
  obsTop:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  obsIcon:         { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  obsTitle:        { fontSize: 12, fontWeight: '700', flex: 1 },
  obsBody:         { fontSize: 11, lineHeight: 17, paddingLeft: 28 },

  stepCard:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, marginBottom: 8 },
  stepNum:         { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1E3A8A', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText:     { fontSize: 11, fontWeight: '800', color: '#93C5FD' },
  stepHead:        { fontSize: 12, fontWeight: '700', color: '#fff', marginBottom: 3 },
  stepDesc:        { fontSize: 11, color: C.sub, lineHeight: 17 },

  ltBox:           { backgroundColor: C.infoBg, borderWidth: 1, borderColor: C.infoBorder, borderRadius: 12, padding: 13, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ltHead:          { fontSize: 12, fontWeight: '700', color: '#60A5FA', marginBottom: 5 },
  ltTxt:           { fontSize: 11, color: C.sub, lineHeight: 18 },

  disc:            { fontSize: 10, color: C.muted, textAlign: 'center', padding: 16, lineHeight: 16 },
});
