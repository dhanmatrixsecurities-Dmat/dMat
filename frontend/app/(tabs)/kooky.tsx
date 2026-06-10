import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { PremiumUpgradeScreen } from './active-trades';
import KookyAnalysisCard, { KookyAnalysis } from '@/components/KookyAnalysisCard';
import KookyPortfolioCard, { PortfolioAnalysis } from '@/components/KookyPortfolioCard';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://your-vercel-app.vercel.app';
const HEADER_BG   = '#0B1A2E';

// ─── Message types ────────────────────────────────────────────────────────────

interface TextMessage      { id: string; role: 'user' | 'assistant'; type: 'text';      text: string; }
interface AnalysisMessage  { id: string; role: 'assistant';           type: 'analysis';  data: KookyAnalysis; }
interface PortfolioMessage { id: string; role: 'assistant';           type: 'portfolio'; data: PortfolioAnalysis; }
type Message = TextMessage | AnalysisMessage | PortfolioMessage;

// ─── Quick questions ──────────────────────────────────────────────────────────

const QUICK_QUESTIONS = [
  'Analyze Reliance Industries',
  'Analyze TCS',
  'What is intraday trading?',
  'How to read RSI indicator?',
  'SIP vs lump sum — which is better?',
];

// ─── Kooky Logo ───────────────────────────────────────────────────────────────

function KookyLogo() {
  const blink    = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const eyeSize = 24, irisSize = 10, pupilSize = 4;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(4000),
      Animated.timing(blink, { toValue: 0.07, duration: 100, useNativeDriver: false }),
      Animated.timing(blink, { toValue: 1,    duration: 100, useNativeDriver: false }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
      Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
    ])).start();
  }, []);

  const borderColor = glowAnim.interpolate({ inputRange: [0, 1], outputRange: ['#2979FF', '#82B1FF'] });

  const Eye = () => (
    <Animated.View style={[
      logo.eye,
      { width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2, borderColor,
        transform: [{ scaleY: blink }],
        shadowColor: '#2979FF', shadowOpacity: 0.6, shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 }, elevation: 5 },
    ]}>
      <View style={[logo.iris, { width: irisSize, height: irisSize, borderRadius: irisSize / 2 }]}>
        <View style={[logo.pupil, { width: pupilSize, height: pupilSize, borderRadius: pupilSize / 2 }]} />
      </View>
      <View style={logo.shine} />
    </Animated.View>
  );

  return (
    <View style={logo.row}>
      <Text style={logo.letter}>K</Text><Eye /><Eye /><Text style={logo.letter}>KY</Text>
    </View>
  );
}

const logo = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  letter: { fontWeight: '900', color: '#2979FF', fontSize: 18, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', textShadowColor: '#2979FF', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  eye:    { borderWidth: 2, backgroundColor: '#0D2247', alignItems: 'center', justifyContent: 'center' },
  iris:   { backgroundColor: '#1565C0', alignItems: 'center', justifyContent: 'center' },
  pupil:  { backgroundColor: '#4A9EFF' },
  shine:  { position: 'absolute', top: 4, right: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.85)' },
});

// ─── Header ───────────────────────────────────────────────────────────────────

function KookyHeader({ onPortfolioPress }: { onPortfolioPress?: () => void }) {
  return (
    <View style={st.topHeader}>
      <KookyLogo />
      <TouchableOpacity
        style={[st.portfolioTopBtn, !onPortfolioPress && { opacity: 0.4 }]}
        onPress={onPortfolioPress}
      >
        <Ionicons name="pie-chart" size={12} color="#fff" />
        <Text style={st.portfolioTopBtnText}>Portfolio</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots({ theme }: { theme: any }) {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  useEffect(() => {
    dots.forEach((d, i) => {
      Animated.loop(Animated.sequence([
        Animated.delay(i * 200),
        Animated.timing(d, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0.2, duration: 400, useNativeDriver: true }),
      ])).start();
    });
  }, []);
  return (
    <View style={[st.bubble, st.botBubble, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <Text style={[st.senderLabel, { color: theme.textSecondary }]}>Kooky //</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {dots.map((d, i) => (
          <Animated.View
            key={i}
            style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#2979FF', opacity: d }}
          />
        ))}
        <Text style={[st.loadingText, { color: theme.textSecondary }]}>Analyzing...</Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function KookyScreen() {
  const { userData } = useAuth();
  const theme        = useTheme();
  const insets       = useSafeAreaInsets();
  const params       = useLocalSearchParams();

  const [messages,       setMessages]       = useState<Message[]>([{
    id: '0', role: 'assistant', type: 'text',
    text: 'Kooky online. Ask me anything about stocks, trading, or mutual funds.\n\nTip: Try "Analyze Reliance" or tap Portfolio to analyze your holdings.',
  }]);
  const [input,          setInput]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [showQuick,      setShowQuick]      = useState(true);
  const [portfolioMode,  setPortfolioMode]  = useState(false);
  const [portfolioInput, setPortfolioInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  // ── Receive portfolio analysis from PortfolioEntryScreen ──────────────────
  useEffect(() => {
    if (params.portfolioAnalysis) {
      try {
        const data = JSON.parse(params.portfolioAnalysis as string) as PortfolioAnalysis;
        const msg: PortfolioMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          type: 'portfolio',
          data,
        };
        setMessages(prev => [...prev, msg]);
        setShowQuick(false);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
      } catch (e) {
        console.error('Portfolio parse error:', e);
      }
    }
  }, [params.portfolioAnalysis]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || loading) return;

    setInput('');
    setShowQuick(false);

    const userMsg: TextMessage = { id: Date.now().toString(), role: 'user', type: 'text', text: msgText };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    // Build history — only text messages for context
    const history = updated
      .filter((m): m is TextMessage => m.type === 'text')
      .map(m => ({ role: m.role, content: m.text }));

    try {
      const res  = await fetch(`${BACKEND_URL}/api/kooky`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, user_id: null }),
      });
      const data = await res.json();

      if (data?.type === 'analysis' && data.stockName) {
        // Stock analysis card
        const msg: AnalysisMessage = {
          id: Date.now() + 'a',
          role: 'assistant',
          type: 'analysis',
          data: data as KookyAnalysis,
        };
        setMessages(prev => [...prev, msg]);
      } else if (data?.type === 'portfolio' && data.score !== undefined) {
        // Portfolio analysis card
        const msg: PortfolioMessage = {
          id: Date.now() + 'p',
          role: 'assistant',
          type: 'portfolio',
          data: data as PortfolioAnalysis,
        };
        setMessages(prev => [...prev, msg]);
      } else {
        // Plain text reply
        const reply = data?.reply || data?.text || 'Signal lost.';
        const msg: TextMessage = {
          id: Date.now() + 'b',
          role: 'assistant',
          type: 'text',
          text: reply,
        };
        setMessages(prev => [...prev, msg]);
      }
    } catch {
      const msg: TextMessage = {
        id: Date.now() + 'e',
        role: 'assistant',
        type: 'text',
        text: '📡 Signal lost. Check your connection.',
      };
      setMessages(prev => [...prev, msg]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const sendPortfolioAnalysis = () => {
    if (!portfolioInput.trim()) return;
    setPortfolioMode(false);
    setPortfolioInput('');
    sendMessage(`Analyze my stock portfolio:\n${portfolioInput}`);
  };

  // ── FREE ──────────────────────────────────────────────────────────────────
  if (userData?.status === 'FREE') {
    return (
      <View style={{ flex: 1, backgroundColor: HEADER_BG }}>
        <StatusBar style="light" backgroundColor={HEADER_BG} translucent={false} />
        <View style={{ backgroundColor: HEADER_BG, paddingTop: insets.top }}>
          <KookyHeader />
        </View>
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <PremiumUpgradeScreen />
        </View>
      </View>
    );
  }

  // ── BLOCKED ───────────────────────────────────────────────────────────────
  if (userData?.status === 'BLOCKED') {
    return (
      <View style={{ flex: 1, backgroundColor: HEADER_BG }}>
        <StatusBar style="light" backgroundColor={HEADER_BG} translucent={false} />
        <View style={{ backgroundColor: HEADER_BG, paddingTop: insets.top }}>
          <KookyHeader />
        </View>
        <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="lock-closed" size={80} color={theme.error} />
          <Text style={{ fontSize: 22, fontWeight: '800', color: theme.error, marginTop: 16, textAlign: 'center' }}>Account Blocked</Text>
          <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 10, textAlign: 'center', lineHeight: 22 }}>
            Your account has been blocked.{'\n'}Please contact support.
          </Text>
        </View>
      </View>
    );
  }

  // ── PORTFOLIO MODE (inline text entry — kept as fallback) ─────────────────
  if (portfolioMode) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: HEADER_BG }} edges={['top']}>
        <StatusBar style="light" backgroundColor={HEADER_BG} translucent={false} />
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: theme.background }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[st.portfolioOverlay, { backgroundColor: theme.background }]}>
            <View style={st.portfolioHeader}>
              <TouchableOpacity
                onPress={() => setPortfolioMode(false)}
                style={[st.backBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              >
                <Ionicons name="arrow-back" size={20} color={theme.text} />
              </TouchableOpacity>
              <Text style={[st.portfolioTitle, { color: theme.text }]}>💼 Portfolio Analysis</Text>
              <View style={{ width: 36 }} />
            </View>
            <View style={[st.portfolioHintCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <Text style={[st.portfolioHintTitle, { color: theme.textSecondary }]}>HOW TO ENTER HOLDINGS</Text>
              <Text style={[st.portfolioHint, { color: theme.text }]}>
                Reliance Industries - ₹50,000{'\n'}TCS - ₹30,000{'\n'}HDFC Bank - ₹20,000
              </Text>
            </View>
            <TextInput
              style={[st.portfolioTextArea, { backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.text }]}
              value={portfolioInput}
              onChangeText={setPortfolioInput}
              placeholder="Enter your stocks and amounts here..."
              placeholderTextColor={theme.textSecondary}
              multiline
              autoFocus
            />
            <TouchableOpacity style={st.portfolioSubmitBtn} onPress={sendPortfolioAnalysis}>
              <Ionicons name="analytics-outline" size={18} color="#fff" />
              <Text style={st.portfolioSubmitText}>Analyze My Portfolio</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── ACTIVE — full chat UI ─────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: HEADER_BG }} edges={['top']}>
      <StatusBar style="light" backgroundColor={HEADER_BG} translucent={false} />
      <KookyHeader onPortfolioPress={() => setPortfolioMode(true)} />
      <View style={[st.agentBadge, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <View style={st.statusDot} />
        <Text style={[st.agentBadgeText, { color: theme.textSecondary }]}>
          Kooky — Decoding the <Text style={st.moneyMatrix}>Money Matrix</Text>
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={[st.messages, { backgroundColor: theme.background }]}
          contentContainerStyle={{ paddingVertical: 12, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => {

            // ── Analysis card (stock) ──
            if (msg.type === 'analysis') {
              return (
                <View key={msg.id} style={{ paddingHorizontal: 8, marginVertical: 6 }}>
                  <Text style={[st.senderLabel, { color: theme.textSecondary, marginBottom: 6 }]}>
                    Kooky //
                  </Text>
                  <KookyAnalysisCard data={msg.data} />
                </View>
              );
            }

            // ── Portfolio card ──
            if (msg.type === 'portfolio') {
              return (
                <View key={msg.id} style={{ paddingHorizontal: 8, marginVertical: 6 }}>
                  <Text style={[st.senderLabel, { color: theme.textSecondary, marginBottom: 6 }]}>
                    Kooky //
                  </Text>
                  <KookyPortfolioCard data={msg.data} />
                </View>
              );
            }

            // ── Text bubble ──
            return (
              <View
                key={msg.id}
                style={[
                  st.bubble,
                  msg.role === 'user'
                    ? [st.userBubble, { backgroundColor: HEADER_BG }]
                    : [st.botBubble, { backgroundColor: theme.cardBackground, borderColor: theme.border }],
                ]}
              >
                {msg.role === 'assistant' && (
                  <Text style={[st.senderLabel, { color: theme.textSecondary }]}>Kooky //</Text>
                )}
                <Text style={[
                  msg.role === 'user' ? st.userText : st.botText,
                  msg.role !== 'user' && { color: theme.text },
                ]}>
                  {msg.text}
                </Text>
              </View>
            );
          })}

          {loading && <TypingDots theme={theme} />}

          {showQuick && (
            <View style={st.quickWrap}>
              <Text style={[st.quickLabel, { color: theme.textSecondary }]}>QUICK ACTIONS</Text>
              {QUICK_QUESTIONS.map(q => (
                <TouchableOpacity
                  key={q}
                  style={[st.quickBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                  onPress={() => sendMessage(q)}
                >
                  <Text style={[st.quickBtnText, { color: theme.text }]}>{q}</Text>
                  <Ionicons name="arrow-forward" size={11} color="#2979FF" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={[st.inputRow, { backgroundColor: theme.cardBackground, borderTopColor: theme.border }]}>
          <TouchableOpacity style={st.portfolioIconBtn} onPress={() => setPortfolioMode(true)}>
            <Ionicons name="pie-chart" size={18} color="#fff" />
          </TouchableOpacity>
          <TextInput
            style={[st.textInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Kooky about markets..."
            placeholderTextColor={theme.textSecondary}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
            multiline={false}
          />
          <TouchableOpacity
            style={[st.sendBtn, loading && st.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={loading}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  topHeader:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: HEADER_BG, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#173772' },
  agentBadge:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 9, borderBottomWidth: 1, gap: 8 },
  statusDot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C853' },
  agentBadgeText:      { fontSize: 12, fontWeight: '600', flex: 1 },
  moneyMatrix:         { color: '#00C853', fontWeight: '700' },
  portfolioTopBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#2979FF' },
  portfolioTopBtnText: { fontSize: 11, color: '#4A9EFF', fontWeight: '700' },
  messages:            { flex: 1, paddingHorizontal: 8 },
  bubble:              { maxWidth: '88%', marginVertical: 4, padding: 12, borderRadius: 12 },
  botBubble:           { alignSelf: 'flex-start', borderWidth: 1, borderTopLeftRadius: 4 },
  userBubble:          { alignSelf: 'flex-end', borderTopRightRadius: 4 },
  senderLabel:         { fontSize: 10, letterSpacing: 1, marginBottom: 4, fontWeight: '600' },
  botText:             { fontSize: 13, lineHeight: 20 },
  userText:            { fontSize: 13, color: '#fff', lineHeight: 20 },
  loadingText:         { fontSize: 12, fontStyle: 'italic' },
  quickWrap:           { marginTop: 12, paddingHorizontal: 4, gap: 6 },
  quickLabel:          { fontSize: 9, letterSpacing: 2, fontWeight: '700', marginBottom: 2 },
  quickBtn:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  quickBtnText:        { fontSize: 12, fontWeight: '500' },
  inputRow:            { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 12, borderTopWidth: 1 },
  portfolioIconBtn:    { width: 40, height: 40, borderRadius: 10, backgroundColor: '#2979FF', alignItems: 'center', justifyContent: 'center' },
  textInput:           { flex: 1, height: 40, borderRadius: 20, paddingHorizontal: 16, fontSize: 13, borderWidth: 1 },
  sendBtn:             { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0B1A2E', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:     { opacity: 0.5 },
  portfolioOverlay:    { flex: 1, padding: 16 },
  portfolioHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  backBtn:             { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  portfolioTitle:      { fontSize: 17, fontWeight: '800' },
  portfolioHintCard:   { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 12 },
  portfolioHintTitle:  { fontSize: 10, fontWeight: '700', marginBottom: 6, letterSpacing: 1 },
  portfolioHint:       { fontSize: 13, lineHeight: 22, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  portfolioTextArea:   { flex: 1, borderRadius: 12, padding: 16, fontSize: 14, borderWidth: 1, textAlignVertical: 'top', marginBottom: 12 },
  portfolioSubmitBtn:  { backgroundColor: '#2979FF', borderRadius: 12, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  portfolioSubmitText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
});
