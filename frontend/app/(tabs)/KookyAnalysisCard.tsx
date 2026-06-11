import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FinancialData {
  revenueGrowth:   { label: string; value: string; tag: 'green' | 'amber' | 'red'; note: string };
  profitability:   { label: string; value: string; tag: 'green' | 'amber' | 'red'; note: string };
  debtPosition:    { label: string; value: string; tag: 'green' | 'amber' | 'red'; note: string };
  valuation:       { label: string; value: string; tag: 'green' | 'amber' | 'red'; note: string };
  bars: { label: string; value: string; pct: number; color: string }[];
}

export interface EventItem {
  tag:    string;
  name:   string;
  detail: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface IndicatorItem {
  name:   string;
  value:  string;
  signal: 'Positive' | 'Favourable' | 'Watch' | 'Caution' | 'Neutral';
  note:   string;
}

export interface SupportResistance {
  resistance2: string;
  resistance1: string;
  current:     string;
  support1:    string;
  support2:    string;
}

export interface ReportData {
  zone:       'green' | 'amber' | 'red';
  score:      number;
  signal:     string;
  signalSub:  string;
  insight:    string;
  longTerm:   string;
  scorecard: { label: string; filled: number; color: string }[];
}

export interface KookyAnalysis {
  stockName: string;
  exchange:  string;
  price:     string;
  change:    string;
  changeDir: 'up' | 'down';
  financials: FinancialData;
  events:     EventItem[];
  indicators: IndicatorItem[];
  support:    SupportResistance;
  report:     ReportData;
}

// ─── Colors ──────────────────────────────────────────────────────────────────

const C = {
  bg:       '#0B1A2E',
  card:     '#111E33',
  border:   '#1A2E4A',
  green:    '#22C55E',
  greenBg:  '#0A2A0A',
  amber:    '#F59E0B',
  amberBg:  '#2A1A0A',
  red:      '#EF4444',
  redBg:    '#2A0A0A',
  blue:     '#2979FF',
  blueBg:   '#0A1A3A',
  text:     '#E2E8F0',
  sub:      '#4A6A8A',
  accent:   '#4A9EFF',
};

const TAG_COLORS = {
  green: { bg: C.greenBg, text: C.green },
  amber: { bg: C.amberBg, text: C.amber },
  red:   { bg: C.redBg,   text: C.red   },
};

const SIG_COLORS = {
  Positive:   { bg: C.greenBg, text: C.green },
  Favourable: { bg: C.greenBg, text: C.green },
  Watch:      { bg: C.amberBg, text: C.amber },
  Caution:    { bg: C.redBg,   text: C.red   },
  Neutral:    { bg: '#1A2040', text: C.accent },
};

const ZONE_COLORS = {
  green: { bg: '#0A2A1A', border: '#1A4A2A', text: C.green },
  amber: { bg: C.amberBg, border: '#3A2A0A', text: C.amber },
  red:   { bg: C.redBg,   border: '#3A0A0A', text: C.red   },
};

const STEPS = ['Financials', 'Events', 'Technical', 'Report'];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <View style={s.sectionLabel}>
      <Ionicons name={icon as any} size={13} color={C.green} />
      <Text style={s.sectionTitle}>{title}</Text>
      <Text style={s.sectionSub}>{sub}</Text>
    </View>
  );
}

function Tag({ type, label }: { type: 'green' | 'amber' | 'red'; label: string }) {
  const c = TAG_COLORS[type];
  return (
    <View style={[s.tag, { backgroundColor: c.bg }]}>
      <Text style={[s.tagText, { color: c.text }]}>{label}</Text>
    </View>
  );
}

function AnimatedBar({ pct, color, delay }: { pct: number; color: string; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct / 100,
      duration: 900,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, []);
  return (
    <View style={s.barTrack}>
      <Animated.View style={[s.barFill, { backgroundColor: color, flex: anim }]} />
      <Animated.View style={{ flex: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }} />
    </View>
  );
}

function AnimatedScore({ target }: { target: number }) {
  const val = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    Animated.timing(val, {
      toValue: target,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    val.addListener(({ value }) => setDisplay(Math.round(value)));
    return () => val.removeAllListeners();
  }, []);
  return (
    <Text style={s.scoreNum}>{display}<Text style={s.scoreDenom}>/100</Text></Text>
  );
}

function TypewriterText({ text, onDone }: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) { clearInterval(t); onDone?.(); }
    }, 16);
    return () => clearInterval(t);
  }, [text]);
  return <Text style={s.insightText}>{displayed}</Text>;
}

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepBar({ current }: { current: number }) {
  return (
    <View style={s.stepRow}>
      {STEPS.map((label, i) => (
        <React.Fragment key={i}>
          <View style={s.stepItem}>
            <View style={[s.stepCircle,
              i < current  && { backgroundColor: C.green, borderColor: C.green },
              i === current && { borderColor: C.green },
            ]}>
              {i < current
                ? <Ionicons name="checkmark" size={10} color={C.bg} />
                : <Text style={[s.stepNum, i === current && { color: C.green }]}>{i + 1}</Text>
              }
            </View>
            <Text style={[s.stepLabel, i <= current && { color: C.green }]}>{label}</Text>
          </View>
          {i < STEPS.length - 1 && (
            <View style={s.stepLine}>
              <View style={[s.stepLineFill, { width: i < current ? '100%' : '0%' }]} />
            </View>
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Panels ──────────────────────────────────────────────────────────────────

function FinancialsPanel({ data }: { data: FinancialData }) {
  const cards = [data.revenueGrowth, data.profitability, data.debtPosition, data.valuation];
  return (
    <View>
      <SectionLabel icon="bar-chart-outline" title="Financial strength" sub="Core fundamentals" />
      <View style={s.grid2}>
        {cards.map((c, i) => (
          <View key={i} style={s.finCard}>
            <Text style={s.finCardLabel}>{c.label}</Text>
            <Text style={[s.finCardVal, { color: TAG_COLORS[c.tag].text }]}>{c.value}</Text>
            <Text style={s.finCardNote}>{c.note}</Text>
          </View>
        ))}
      </View>
      <View style={[s.card, { marginTop: 8 }]}>
        {data.bars.map((b, i) => (
          <View key={i} style={[s.barRow, i === data.bars.length - 1 && { marginBottom: 0 }]}>
            <Text style={s.barLabel}>{b.label}</Text>
            <AnimatedBar pct={b.pct} color={b.color} delay={i * 150} />
            <Text style={s.barVal}>{b.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function EventsPanel({ events }: { events: EventItem[] }) {
  const impactColor = (i: string) =>
    i === 'High' ? C.amber : i === 'Medium' ? C.accent : C.green;
  const impactBg = (i: string) =>
    i === 'High' ? C.amberBg : i === 'Medium' ? C.blueBg : C.greenBg;
  return (
    <View>
      <SectionLabel icon="calendar-outline" title="Upcoming events" sub="Market triggers" />
      {events.map((e, i) => (
        <View key={i} style={[s.evtRow, i === events.length - 1 && { marginBottom: 0 }]}>
          <View style={s.evtTag}><Text style={s.evtTagText}>{e.tag}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.evtName}>{e.name}</Text>
            <Text style={s.evtDetail}>{e.detail}</Text>
          </View>
          <View style={[s.impactBadge, { backgroundColor: impactBg(e.impact) }]}>
            <Text style={[s.impactText, { color: impactColor(e.impact) }]}>{e.impact}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function TechnicalPanel({ indicators, support }: { indicators: IndicatorItem[]; support: SupportResistance }) {
  return (
    <View>
      <SectionLabel icon="pulse-outline" title="Technical picture" sub="Key indicators" />
      <View style={s.grid2}>
        {indicators.map((ind, i) => {
          const sc = SIG_COLORS[ind.signal] || SIG_COLORS.Neutral;
          return (
            <View key={i} style={s.indBox}>
              <Text style={s.indName}>{ind.name}</Text>
              <View style={s.indRow}>
                <Text style={s.indVal}>{ind.value}</Text>
                <View style={[s.indBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[s.indBadgeText, { color: sc.text }]}>{ind.signal}</Text>
                </View>
              </View>
              <Text style={s.indNote}>{ind.note}</Text>
            </View>
          );
        })}
      </View>
      <View style={[s.card, { marginTop: 8 }]}>
        <Text style={s.cardMiniLabel}>Support & resistance</Text>
        <View style={s.srRow}>
          <Text style={[s.srKey, { color: C.red }]}>Resistance</Text>
          <Text style={s.srVal}>{support.resistance1} — {support.resistance2}</Text>
        </View>
        <View style={[s.srRow, s.srCurrent]}>
          <Text style={[s.srKey, { color: C.accent }]}>Current</Text>
          <Text style={[s.srVal, { color: C.accent, fontWeight: '700' }]}>{support.current}</Text>
        </View>
        <View style={s.srRow}>
          <Text style={[s.srKey, { color: C.green }]}>Support</Text>
          <Text style={s.srVal}>{support.support1} — {support.support2}</Text>
        </View>
      </View>
    </View>
  );
}

function ReportPanel({ report }: { report: ReportData }) {
  const zc = ZONE_COLORS[report.zone];
  return (
    <View>
      <SectionLabel icon="flag-outline" title="Analysis report" sub="Kooky AI summary" />
      <View style={[s.signalBanner, { backgroundColor: zc.bg, borderColor: zc.border }]}>
        <View style={s.signalRow}>
          <View style={[s.signalDot, { backgroundColor: zc.text }]} />
          <View>
            <Text style={[s.signalTitle, { color: zc.text }]}>{report.signal}</Text>
            <Text style={[s.signalSub, { color: zc.text }]}>{report.signalSub}</Text>
          </View>
          <View style={{ marginLeft: 'auto' }}>
            <AnimatedScore target={report.score} />
          </View>
        </View>
      </View>

      <View style={[s.card, { marginTop: 8 }]}>
        <Text style={s.cardMiniLabel}>
          <Ionicons name="hardware-chip-outline" size={11} color={C.sub} /> Kooky insight
        </Text>
        <TypewriterText text={report.insight} />
      </View>

      <View style={[s.ltBox]}>
        <Ionicons name="time-outline" size={14} color={C.accent} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={s.ltTitle}>Long-term perspective</Text>
          <Text style={s.ltDesc}>{report.longTerm}</Text>
        </View>
      </View>

      <View style={[s.card, { marginTop: 8 }]}>
        <Text style={s.cardMiniLabel}>Scorecard</Text>
        {report.scorecard.map((sc, i) => (
          <View key={i} style={s.scRow}>
            <Text style={s.scLabel}>{sc.label}</Text>
            <View style={s.scDots}>
              {[0, 1, 2, 3, 4].map(d => (
                <View
                  key={d}
                  style={[s.scDot, { backgroundColor: d < sc.filled ? sc.color : C.border }]}
                />
              ))}
            </View>
          </View>
        ))}
      </View>

      <Text style={s.disclaimer}>
        For education & research only. Not investment advice. No entry/exit recommendations.{'\n'}
        Consult a SEBI-registered advisor before any financial decision.
      </Text>
    </View>
  );
}

// ─── Main Card ───────────────────────────────────────────────────────────────

export default function KookyAnalysisCard({ data }: { data: KookyAnalysis }) {
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const changeStep = (next: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0, duration: 150, useNativeDriver: true,
    }).start(() => {
      setStep(next);
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 250, useNativeDriver: true,
      }).start();
    });
  };

  const isLast = step === STEPS.length - 1;
  const zoneColor = ZONE_COLORS[data.report.zone];

  return (
    <View style={s.wrapper}>

      {/* Hero */}
      <View style={s.hero}>
        <View>
          <Text style={s.stockName}>{data.stockName}</Text>
          <Text style={s.stockMeta}>{data.exchange}</Text>
        </View>
        <View style={[s.scorePill, { backgroundColor: zoneColor.bg, borderColor: zoneColor.border }]}>
          <View style={[s.scorePillDot, { backgroundColor: zoneColor.text }]} />
          <Text style={[s.scorePillText, { color: zoneColor.text }]}>
            {data.report.zone === 'green' ? 'GREEN SIGNAL' : data.report.zone === 'red' ? 'RED ALERT' : 'WATCH ZONE'}
          </Text>
        </View>
      </View>

      <View style={s.priceRow}>
        <Text style={s.price}>{data.price}</Text>
        <Text style={[s.change, { color: data.changeDir === 'up' ? C.green : C.red }]}>
          {data.changeDir === 'up' ? '▲' : '▼'} {data.change}
        </Text>
      </View>

      {/* Step bar */}
      <StepBar current={step} />

      {/* Panel */}
      <Animated.View style={{ opacity: fadeAnim }}>
        {step === 0 && <FinancialsPanel data={data.financials} />}
        {step === 1 && <EventsPanel events={data.events} />}
        {step === 2 && <TechnicalPanel indicators={data.indicators} support={data.support} />}
        {step === 3 && <ReportPanel report={data.report} />}
      </Animated.View>

      {/* Nav */}
      <View style={s.navRow}>
        {step > 0 && (
          <TouchableOpacity style={s.navBack} onPress={() => changeStep(step - 1)}>
            <Ionicons name="arrow-back" size={14} color={C.sub} />
            <Text style={s.navBackText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.navNext, { marginLeft: step > 0 ? 8 : 0, flex: 1 }]}
          onPress={() => !isLast && changeStep(step + 1)}
          disabled={isLast}
        >
          <Text style={s.navNextText}>
            {isLast ? 'Analysis complete' : `Next: ${STEPS[step + 1]}`}
          </Text>
          {!isLast && <Ionicons name="arrow-forward" size={14} color={C.bg} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  wrapper:       { backgroundColor: C.bg, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginVertical: 4 },
  hero:          { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 14, paddingBottom: 6 },
  stockName:     { fontSize: 18, fontWeight: '800', color: '#fff' },
  stockMeta:     { fontSize: 11, color: C.sub, marginTop: 2 },
  scorePill:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  scorePillDot:  { width: 6, height: 6, borderRadius: 3 },
  scorePillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  priceRow:      { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingHorizontal: 14, marginBottom: 12 },
  price:         { fontSize: 22, fontWeight: '800', color: '#fff' },
  change:        { fontSize: 13, fontWeight: '600' },

  stepRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 14 },
  stepItem:      { alignItems: 'center', gap: 4 },
  stepCircle:    { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card },
  stepNum:       { fontSize: 11, fontWeight: '700', color: C.sub },
  stepLabel:     { fontSize: 9, color: C.sub, fontWeight: '600' },
  stepLine:      { flex: 1, height: 2, backgroundColor: C.border, marginBottom: 14, overflow: 'hidden' },
  stepLineFill:  { height: '100%', backgroundColor: C.green },

  sectionLabel:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, marginBottom: 10 },
  sectionTitle:  { fontSize: 12, fontWeight: '700', color: C.green, flex: 1 },
  sectionSub:    { fontSize: 10, color: C.sub },

  grid2:         { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 6 },
  card:          { marginHorizontal: 14, backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12 },
  cardMiniLabel: { fontSize: 10, color: C.sub, marginBottom: 8, fontWeight: '600', letterSpacing: 0.5 },

  finCard:       { width: '47%', backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 10 },
  finCardLabel:  { fontSize: 10, color: C.sub, marginBottom: 3 },
  finCardVal:    { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  finCardNote:   { fontSize: 10, color: C.sub, lineHeight: 14 },

  tag:           { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  tagText:       { fontSize: 9, fontWeight: '700' },

  barRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  barLabel:      { fontSize: 10, color: C.sub, width: 72 },
  barTrack:      { flex: 1, height: 5, borderRadius: 99, backgroundColor: C.border, flexDirection: 'row', overflow: 'hidden' },
  barFill:       { borderRadius: 99 },
  barVal:        { fontSize: 10, color: C.text, width: 36, textAlign: 'right', fontWeight: '600' },

  evtRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 14, marginBottom: 8, backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 10 },
  evtTag:        { minWidth: 42, backgroundColor: '#1A2A0A', borderRadius: 7, padding: 5, alignItems: 'center' },
  evtTagText:    { fontSize: 9, fontWeight: '800', color: '#C8E66A', textAlign: 'center', lineHeight: 13 },
  evtName:       { fontSize: 12, fontWeight: '700', color: '#fff', marginBottom: 2 },
  evtDetail:     { fontSize: 10, color: C.sub, lineHeight: 14 },
  impactBadge:   { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  impactText:    { fontSize: 9, fontWeight: '800' },

  indBox:        { width: '47%', backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 9 },
  indName:       { fontSize: 10, color: C.sub, marginBottom: 2 },
  indRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  indVal:        { fontSize: 13, fontWeight: '700', color: '#fff' },
  indBadge:      { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  indBadgeText:  { fontSize: 9, fontWeight: '700' },
  indNote:       { fontSize: 10, color: C.sub, lineHeight: 13 },

  srRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  srCurrent:     { backgroundColor: '#0A1A2A', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  srKey:         { fontSize: 11, fontWeight: '600', width: 80 },
  srVal:         { fontSize: 11, fontWeight: '600', color: C.text },

  signalBanner:  { marginHorizontal: 14, borderRadius: 12, borderWidth: 1, padding: 14 },
  signalRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  signalDot:     { width: 8, height: 8, borderRadius: 4 },
  signalTitle:   { fontSize: 14, fontWeight: '800' },
  signalSub:     { fontSize: 11, opacity: 0.8, marginTop: 2 },
  scoreNum:      { fontSize: 28, fontWeight: '900', color: '#fff' },
  scoreDenom:    { fontSize: 13, fontWeight: '400', color: C.sub },

  insightText:   { fontSize: 12, color: C.text, lineHeight: 18 },

  ltBox:         { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 14, marginTop: 8, backgroundColor: C.blueBg, borderRadius: 10, borderWidth: 1, borderColor: '#1A3A5A', padding: 11 },
  ltTitle:       { fontSize: 12, fontWeight: '700', color: C.accent, marginBottom: 3 },
  ltDesc:        { fontSize: 11, color: '#6A9ABF', lineHeight: 16 },

  scRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  scLabel:       { fontSize: 11, color: C.sub, width: 90 },
  scDots:        { flexDirection: 'row', gap: 4 },
  scDot:         { width: 9, height: 9, borderRadius: 5 },

  disclaimer:    { fontSize: 9, color: C.sub, textAlign: 'center', padding: 12, lineHeight: 14 },

  navRow:        { flexDirection: 'row', padding: 12, paddingTop: 8, gap: 0 },
  navBack:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  navBackText:   { fontSize: 12, color: C.sub, fontWeight: '600' },
  navNext:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: C.blue },
  navNextText:   { fontSize: 12, fontWeight: '800', color: C.bg },
});
