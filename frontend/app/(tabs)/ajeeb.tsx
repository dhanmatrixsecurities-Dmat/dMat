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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

// ─── CHANGE THIS TO YOUR VERCEL BACKEND URL ───────────────────
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://your-vercel-app.vercel.app';
// ──────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant'; // changed 'bot' → 'assistant' to match Anthropic API
  text: string;
}

const QUICK_QUESTIONS = [
  'Analyze Reliance Industries',
  'What is intraday trading?',
  'How to read RSI indicator?',
  'Analyze my portfolio',
  'SIP vs lump sum — which is better?',
];

// ─── ANIMATED KOOKY HEADER (unchanged — your design is great) ─

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
    const borderColor = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: ['#D85A30', '#EF9F27'],
    });
    const shadowOpacity = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    });

    return (
      <Animated.View
        style={[
          header.eye,
          {
            borderColor,
            transform: [{ scaleY: blink }],
            shadowColor: '#EF9F27',
            shadowOpacity,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 0 },
            elevation: 6,
          },
        ]}
      >
        <Animated.View style={[header.iris, { backgroundColor: borderColor }]}>
          <View style={header.pupil} />
        </Animated.View>
        <View style={header.eyeShine} />
      </Animated.View>
    );
  };

  const scanTop = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 70],
  });

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
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#EF9F2744',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  letter: {
    fontSize: 30,
    fontWeight: '900',
    color: '#EF9F27',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textShadowColor: '#EF9F27',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  eye: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#EF9F27',
    backgroundColor: '#1a0500',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iris: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#EF9F27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pupil: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#0d0200',
  },
  eyeShine: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'white',
    opacity: 0.9,
  },
  tagline: {
    fontSize: 7,
    letterSpacing: 4,
    color: '#D85A30',
    marginTop: 6,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────

export default function KookyScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: 'Kooky online. Ask me anything about trading, stocks, or mutual funds.\n\nTry: "Analyze Reliance" or share your portfolio holdings for a full analysis.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  // ── PORTFOLIO MODE ─────────────────────────────────────────
  const [portfolioMode, setPortfolioMode] = useState(false);
  const [portfolioInput, setPortfolioInput] = useState('');

  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || loading) return;
    setInput('');
    setShowQuick(false);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: msgText,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // ── Calls YOUR backend — API key stays safe on server ──
      const response = await fetch(`${BACKEND_URL}/api/kooky`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Send full conversation history — Kooky now remembers context
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.text,
          })),
          user_id: null, // Add user ID here if you have auth
        }),
      });

      const data = await response.json();
      const botText = data?.reply || 'Signal lost. Try again.';

      setMessages(prev => [
        ...prev,
        { id: Date.now().toString() + 'b', role: 'assistant', text: botText },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString() + 'e',
          role: 'assistant',
          text: '📡 Signal lost. Check your connection and try again.',
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const sendPortfolioAnalysis = () => {
    if (!portfolioInput.trim()) return;
    const prompt = `Analyze my portfolio:\n${portfolioInput}`;
    setPortfolioMode(false);
    setPortfolioInput('');
    sendMessage(prompt);
  };

  // ── PORTFOLIO INPUT OVERLAY ────────────────────────────────
  if (portfolioMode) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={styles.portfolioOverlay}>
          <View style={styles.portfolioHeader}>
            <Text style={styles.portfolioTitle}>💼 Portfolio Analysis</Text>
            <TouchableOpacity onPress={() => setPortfolioMode(false)}>
              <Ionicons name="close" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.portfolioHint}>
            Enter your holdings (one per line){'\n'}
            Example:{'\n'}
            Reliance - ₹50,000{'\n'}
            TCS - ₹30,000{'\n'}
            HDFC Bank - ₹20,000
          </Text>
          <TextInput
            style={styles.portfolioTextArea}
            value={portfolioInput}
            onChangeText={setPortfolioInput}
            placeholder="Enter your stocks and amounts..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            autoFocus
          />
          <TouchableOpacity
            style={styles.portfolioSubmitBtn}
            onPress={sendPortfolioAnalysis}
          >
            <Text style={styles.portfolioSubmitText}>Analyze My Portfolio →</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── MAIN CHAT UI ───────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Status bar */}
      <View style={styles.agentBadge}>
        <View style={styles.statusDot} />
        <Text style={styles.agentBadgeText}>
          Kooky — Decoding the <Text style={styles.moneyMatrix}>Money Matrix</Text>
        </Text>
        {/* Portfolio button */}
        <TouchableOpacity
          style={styles.portfolioBtn}
          onPress={() => setPortfolioMode(true)}
        >
          <Ionicons name="pie-chart-outline" size={14} color={Colors.primary} />
          <Text style={styles.portfolioBtnText}>Portfolio</Text>
        </TouchableOpacity>
      </View>

      <KookyHeader />

      {/* Chat messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={{ paddingVertical: 12 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.bubble,
              msg.role === 'user' ? styles.userBubble : styles.botBubble,
            ]}
          >
            {msg.role === 'assistant' && (
              <Text style={styles.senderLabel}>Kooky //</Text>
            )}
            <Text style={msg.role === 'user' ? styles.userText : styles.botText}>
              {msg.text}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={[styles.bubble, styles.botBubble]}>
            <Text style={styles.senderLabel}>Kooky //</Text>
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#EF9F27" />
              <Text style={styles.loadingText}>Analyzing...</Text>
            </View>
          </View>
        )}

        {showQuick && (
          <View style={styles.quickWrap}>
            <Text style={styles.quickLabel}>Quick Actions</Text>
            {QUICK_QUESTIONS.map(q => (
              <TouchableOpacity
                key={q}
                style={styles.quickBtn}
                onPress={() => sendMessage(q)}
              >
                <Text style={styles.quickBtnText}>{q}</Text>
                <Ionicons name="arrow-forward" size={10} color={Colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Input row */}
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.portfolioIconBtn}
          onPress={() => setPortfolioMode(true)}
        >
          <Ionicons name="pie-chart-outline" size={20} color={Colors.primary} />
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
          <Ionicons name="send" size={18} color={Colors.secondary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  agentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00C853',
  },
  moneyMatrix: {
    color: Colors.success,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  agentBadgeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
    flex: 1,
  },
  portfolioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  portfolioBtnText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  messages: {
    flex: 1,
    paddingHorizontal: 12,
  },
  bubble: {
    maxWidth: '82%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 12,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderTopRightRadius: 4,
  },
  senderLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
    fontWeight: '600',
  },
  botText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  userText: {
    fontSize: 13,
    color: Colors.secondary,
    lineHeight: 20,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  quickWrap: {
    marginTop: 12,
    paddingHorizontal: 4,
    gap: 6,
  },
  quickLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 4,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBackground,
  },
  quickBtnText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.cardBackground,
  },
  portfolioIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
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
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  // ── Portfolio overlay styles ─────────────────────────────
  portfolioOverlay: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 20,
  },
  portfolioTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  portfolioHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
    backgroundColor: Colors.cardBackground,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
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
    marginBottom: 16,
  },
  portfolioSubmitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  portfolioSubmitText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.secondary,
    letterSpacing: 0.5,
  },
});
