import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

// ─── CHANGE THIS TO YOUR VERCEL BACKEND URL ───────────────────
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://your-vercel-app.vercel.app';
// ──────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const QUICK_QUESTIONS = [
  'Analyze Reliance Industries',
  'Analyze TCS',
  'What is intraday trading?',
  'How to read RSI indicator?',
  'SIP vs lump sum — which is better?',
];

// ─── ANIMATED KOOKY HEADER ────────────────────────────────────

function KookyHeader() {
  const pulseL = useRef(new Animated.Value(0)).current;
  const pulseR = useRef(new Animated.Value(0)).current;
  const blinkL = useRef(new Animated.Value(1)).current;
  const blinkR = useRef(new Animated.Value(1)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseL, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(pulseL, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseR, { toValue: 1, duration: 1000, useNativeDriver: false }),
          Animated.timing(pulseR, { toValue: 0, duration: 1000, useNativeDriver: false }),
        ])
      ).start();
    }, 300);

    const blinkLoop = (anim: Animated.Value, delay: number) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(3500),
            Animated.timing(anim, { toValue: 0.08, duration: 80, useNativeDriver: false }),
            Animated.timing(anim, { toValue: 1, duration: 80, useNativeDriver: false }),
          ])
        ).start();
      }, delay);
    };
    blinkLoop(blinkL, 0);
    blinkLoop(blinkR, 150);

    Animated.loop(
      Animated.timing(scanAnim, { toValue: 1, duration: 2400, useNativeDriver: false })
    ).start();
  }, []);

  const Eye = ({ pulse, blink }: { pulse: Animated.Value; blink: Animated.Value }) => {
    const borderColor = pulse.interpolate({ inputRange: [0, 1], outputRange: ['#D85A30', '#EF9F27'] });
    const shadowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
    return (
      <Animated.View style={[header.eye, { borderColor, transform: [{ scaleY: blink }], shadowColor: '#EF9F27', shadowOpacity, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 6 }]}>
        <Animated.View style={[header.iris, { backgroundColor: borderColor }]}>
          <View style={header.pupil} />
        </Animated.View>
        <View style={header.eyeShine} />
      </Animated.View>
    );
  };

  const scanTop = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 70] });

  return (
    <View style={header.wrap}>
      <Animated.View style={[header.scanLine, { top: scanTop }]} />
      <View style={header.row}>
        <Text style={header.letter}>K</Text>
        <Eye pulse={pulseL} blink={blinkL} />
        <Eye pulse={pulseR} blink={blinkR} />
        <Text style={header.letter}>KY</Text>
      </View>
      <Text style={header.tagline}>AI · FINANCE · AGENT</Text>
    </View>
  );
}

const header = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.background,
    paddingVertical: 14,
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    position: 'relative',
  },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#EF9F2744' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  letter: {
    fontSize: 30, fontWeight: '900', color: '#EF9F27',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textShadowColor: '#EF9F27', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10,
  },
  eye: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 2,
    borderColor: '#EF9F27', backgroundColor: '#1a0500',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  iris: { width: 17, height: 17, borderRadius: 9, backgroundColor: '#EF9F27', alignItems: 'center', justifyContent: 'center' },
  pupil: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#0d0200' },
  eyeShine: { position: 'absolute', top: 4, right: 4, width: 5, height: 5, borderRadius: 3, backgroundColor: 'white', opacity: 0.9 },
  tagline: {
    fontSize: 7, letterSpacing: 4, color: '#D85A30', marginTop: 6,
    fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────

export default function KookyScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: 'Kooky online. Ask me anything about stocks, trading, or mutual funds.\n\nTip: Try "Analyze Reliance" or tap Portfolio to analyze your holdings.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const [portfolioMode, setPortfolioMode] = useState(false);
  const [portfolioInput, setPortfolioInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || loading) return;
    setInput('');
    setShowQuick(false);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: msgText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/kooky`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.text })),
          user_id: null,
        }),
      });

      const data = await response.json();
      const botText = data?.reply || 'Signal lost. Try again.';
      setMessages(prev => [...prev, { id: Date.now().toString() + 'b', role: 'assistant', text: botText }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString() + 'e', role: 'assistant', text: '📡 Signal lost. Check your connection and try again.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const sendPortfolioAnalysis = () => {
    if (!portfolioInput.trim()) return;
    const prompt = `Analyze my stock portfolio:\n${portfolioInput}`;
    setPortfolioMode(false);
    setPortfolioInput('');
    sendMessage(prompt);
  };

  // ── PORTFOLIO SCREEN ──────────────────────────────────────
  if (portfolioMode) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.portfolioOverlay}>
            <View style={styles.portfolioHeader}>
              <TouchableOpacity onPress={() => setPortfolioMode(false)} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={20} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.portfolioTitle}>💼 Portfolio Analysis</Text>
              <View style={{ width: 36 }} />
            </View>

            <View style={styles.portfolioHintCard}>
              <Text style={styles.portfolioHintTitle}>HOW TO ENTER HOLDINGS</Text>
              <Text style={styles.portfolioHint}>
                Reliance Industries - ₹50,000{'\n'}
                TCS - ₹30,000{'\n'}
                HDFC Bank - ₹20,000{'\n'}
                Infosys - ₹15,000
              </Text>
            </View>

            <TextInput
              style={styles.portfolioTextArea}
              value={portfolioInput}
              onChangeText={setPortfolioInput}
              placeholder="Enter your stocks and amounts here..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              autoFocus
            />

            <TouchableOpacity style={styles.portfolioSubmitBtn} onPress={sendPortfolioAnalysis}>
              <Ionicons name="analytics-outline" size={18} color="#fff" />
              <Text style={styles.portfolioSubmitText}>Analyze My Portfolio</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── MAIN CHAT SCREEN ──────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Top bar */}
        <View style={styles.agentBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.agentBadgeText}>
            Kooky — <Text style={styles.moneyMatrix}>Money Matrix</Text>
          </Text>
          <TouchableOpacity style={styles.portfolioTopBtn} onPress={() => setPortfolioMode(true)}>
            <Ionicons name="pie-chart" size={12} color="#fff" />
            <Text style={styles.portfolioTopBtnText}>Portfolio</Text>
          </TouchableOpacity>
        </View>

        {/* In Progress — just 2 words */}
        <View style={styles.inProgressBanner}>
          <Text style={styles.inProgressText}>🚧 In Progress</Text>
        </View>

        <KookyHeader />

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={{ paddingVertical: 12, paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => (
            <View key={msg.id} style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.botBubble]}>
              {msg.role === 'assistant' && <Text style={styles.senderLabel}>Kooky //</Text>}
              <Text style={msg.role === 'user' ? styles.userText : styles.botText}>{msg.text}</Text>
            </View>
          ))}

          {loading && (
            <View style={[styles.bubble, styles.botBubble]}>
              <Text style={styles.senderLabel}>Kooky //</Text>
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#EF9F27" />
                <Text style={styles.loadingText}>Analyzing markets...</Text>
              </View>
            </View>
          )}

          {showQuick && (
            <View style={styles.quickWrap}>
              <Text style={styles.quickLabel}>QUICK ACTIONS</Text>
              {QUICK_QUESTIONS.map(q => (
                <TouchableOpacity key={q} style={styles.quickBtn} onPress={() => sendMessage(q)}>
                  <Text style={styles.quickBtnText}>{q}</Text>
                  <Ionicons name="arrow-forward" size={11} color={Colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input — fixed right above keyboard, zero gap */}
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.portfolioIconBtn} onPress={() => setPortfolioMode(true)}>
            <Ionicons name="pie-chart" size={18} color="#fff" />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Kooky about markets..."
            placeholderTextColor={Colors.textSecondary}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
            multiline={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
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

const styles = StyleSheet.create({
  agentBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C853' },
  moneyMatrix: { color: Colors.success, fontWeight: '700' },
  agentBadgeText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', flex: 1 },
  portfolioTopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, backgroundColor: Colors.primary,
  },
  portfolioTopBtnText: { fontSize: 11, color: '#fff', fontWeight: '700' },

  inProgressBanner: { backgroundColor: Colors.primary, paddingVertical: 5, alignItems: 'center' },
  inProgressText: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '700', letterSpacing: 1 },

  messages: { flex: 1, paddingHorizontal: 12 },
  bubble: { maxWidth: '82%', marginVertical: 4, padding: 12, borderRadius: 12 },
  botBubble: {
    alignSelf: 'flex-start', backgroundColor: Colors.cardBackground,
    borderWidth: 1, borderColor: Colors.border, borderTopLeftRadius: 4,
  },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderTopRightRadius: 4 },
  senderLabel: { fontSize: 10, color: Colors.textSecondary, letterSpacing: 1, marginBottom: 4, fontWeight: '600' },
  botText: { fontSize: 13, color: Colors.text, lineHeight: 20 },
  userText: { fontSize: 13, color: '#fff', lineHeight: 20 },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic' },

  quickWrap: { marginTop: 12, paddingHorizontal: 4, gap: 6 },
  quickLabel: { fontSize: 9, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '700', marginBottom: 2 },
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBackground,
  },
  quickBtnText: { fontSize: 12, color: Colors.text, fontWeight: '500' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.cardBackground,
  },
  portfolioIconBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  textInput: {
    flex: 1, height: 40, backgroundColor: Colors.background,
    borderRadius: 20, paddingHorizontal: 16, fontSize: 13,
    color: Colors.text, borderWidth: 1, borderColor: Colors.border,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.5 },

  portfolioOverlay: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  portfolioHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.cardBackground, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  portfolioTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  portfolioHintCard: { backgroundColor: Colors.cardBackground, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  portfolioHintTitle: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6, letterSpacing: 1 },
  portfolioHint: { fontSize: 13, color: Colors.text, lineHeight: 22, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  portfolioTextArea: { flex: 1, backgroundColor: Colors.cardBackground, borderRadius: 12, padding: 16, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border, textAlignVertical: 'top', marginBottom: 12 },
  portfolioSubmitBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  portfolioSubmitText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
});
