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

// ─── BLUE ANIMATED KOOKY LOGO (header only) ──────────────────

function KookyLogo({ size = 'large' }: { size?: 'small' | 'large' }) {
  const blink = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const isSmall = size === 'small';
  const eyeSize = isSmall ? 24 : 32;
  const fontSize = isSmall ? 18 : 24;
  const irisSize = isSmall ? 10 : 14;
  const pupilSize = isSmall ? 4 : 6;

  useEffect(() => {
    // Both eyes blink together - slow and smooth
    Animated.loop(
      Animated.sequence([
        Animated.delay(4000),
        Animated.timing(blink, { toValue: 0.07, duration: 100, useNativeDriver: false }),
        Animated.timing(blink, { toValue: 1, duration: 100, useNativeDriver: false }),
      ])
    ).start();

    // Subtle glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#2979FF', '#82B1FF'],
  });

  const Eye = () => (
    <Animated.View
      style={[
        logo.eye,
        {
          width: eyeSize,
          height: eyeSize,
          borderRadius: eyeSize / 2,
          borderColor,
          transform: [{ scaleY: blink }],
          shadowColor: '#2979FF',
          shadowOpacity: 0.6,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
          elevation: 5,
        },
      ]}
    >
      <View style={[logo.iris, { width: irisSize, height: irisSize, borderRadius: irisSize / 2 }]}>
        <View style={[logo.pupil, { width: pupilSize, height: pupilSize, borderRadius: pupilSize / 2 }]} />
      </View>
      <View style={logo.shine} />
    </Animated.View>
  );

  return (
    <View style={logo.row}>
      <Text style={[logo.letter, { fontSize }]}>K</Text>
      <Eye />
      <Eye />
      <Text style={[logo.letter, { fontSize }]}>KY</Text>
    </View>
  );
}

const logo = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  letter: {
    fontWeight: '900',
    color: '#2979FF',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textShadowColor: '#2979FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  eye: {
    borderWidth: 2,
    backgroundColor: '#0D2247',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iris: {
    backgroundColor: '#1565C0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pupil: { backgroundColor: '#4A9EFF' },
  shine: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
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
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString() + 'e', role: 'assistant', text: '📡 Signal lost. Check your connection and try again.' },
      ]);
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

  // ── PORTFOLIO SCREEN ─────────────────────────────────────
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

  // ── MAIN CHAT SCREEN ─────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >

        {/* ── TOP HEADER: Animated Kooky Logo + Portfolio btn ── */}
        <View style={styles.topHeader}>
          <KookyLogo size="small" />
          <TouchableOpacity style={styles.portfolioTopBtn} onPress={() => setPortfolioMode(true)}>
            <Ionicons name="pie-chart" size={12} color="#fff" />
            <Text style={styles.portfolioTopBtnText}>Portfolio</Text>
          </TouchableOpacity>
        </View>

        {/* ── STATUS BAR ── */}
        <View style={styles.agentBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.agentBadgeText}>
            Kooky — Decoding the <Text style={styles.moneyMatrix}>Money Matrix</Text>
          </Text>
        </View>

        {/* ── Messages ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={{ paddingVertical: 12, paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => (
            <View
              key={msg.id}
              style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.botBubble]}
            >
              {msg.role === 'assistant' && <Text style={styles.senderLabel}>Kooky //</Text>}
              <Text style={msg.role === 'user' ? styles.userText : styles.botText}>{msg.text}</Text>
            </View>
          ))}

          {loading && (
            <View style={[styles.bubble, styles.botBubble]}>
              <Text style={styles.senderLabel}>Kooky //</Text>
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#2979FF" />
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
                  <Ionicons name="arrow-forward" size={11} color="#2979FF" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* ── Input Bar ── */}
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

  // ── TOP HEADER ──
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B1A2E',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#173772',
  },

  // ── STATUS BAR ──
  agentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C853' },
  agentBadgeText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', flex: 1 },
  moneyMatrix: { color: '#00C853', fontWeight: '700' },

  portfolioTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#2979FF',
  },
  portfolioTopBtnText: { fontSize: 11, color: '#4A9EFF', fontWeight: '700' },

  // ── MESSAGES ──
  messages: { flex: 1, paddingHorizontal: 12 },
  bubble: { maxWidth: '82%', marginVertical: 4, padding: 12, borderRadius: 12 },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0B1A2E',
    borderTopRightRadius: 4,
  },
  senderLabel: { fontSize: 10, color: Colors.textSecondary, letterSpacing: 1, marginBottom: 4, fontWeight: '600' },
  botText: { fontSize: 13, color: Colors.text, lineHeight: 20 },
  userText: { fontSize: 13, color: '#fff', lineHeight: 20 },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic' },

  // ── QUICK ACTIONS ──
  quickWrap: { marginTop: 12, paddingHorizontal: 4, gap: 6 },
  quickLabel: { fontSize: 9, color: Colors.textSecondary, letterSpacing: 2, fontWeight: '700', marginBottom: 2 },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBackground,
  },
  quickBtnText: { fontSize: 12, color: Colors.text, fontWeight: '500' },

  // ── INPUT ──
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.cardBackground,
  },
  portfolioIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#2979FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 13,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0B1A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },

  // ── PORTFOLIO SCREEN ──
  portfolioOverlay: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  portfolioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  portfolioHintCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  portfolioHintTitle: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6, letterSpacing: 1 },
  portfolioHint: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  portfolioTextArea: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  portfolioSubmitBtn: {
    backgroundColor: '#2979FF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  portfolioSubmitText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
});
