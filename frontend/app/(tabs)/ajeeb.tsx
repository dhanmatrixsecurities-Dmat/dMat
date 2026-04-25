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

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

const SYSTEM_PROMPT = `You are Kooky, a sharp and knowledgeable ai finance agent built into the dMat trading app. You answer questions about:
- Stock market (NSE/BSE — Indian markets primarily)
- Trading strategies (intraday, swing, positional)
- Mutual funds and SIPs
- Portfolio management and allocation
- Technical analysis (chart patterns, indicators)
- Fundamental analysis (P/E, EPS, ratios)
- IPOs, F&O, derivatives
- Crypto basics
- Personal finance and investing
- Market news and macroeconomics

Rules:
- Only answer finance, investing, trading, and money-related questions
- If asked anything unrelated, say you only operate in the finance world
- Be concise, sharp, and data-aware
- Speak like a smart trading desk analyst — direct, no fluff
- Never give guaranteed return promises or specific "buy this now" advice without adding a disclaimer
- Always add a short disclaimer for specific stock tips: "This is not SEBI-registered advice."`;

const QUICK_QUESTIONS = [
  'What is intraday trading?',
  'How to read candlestick charts?',
  'What is F&O trading?',
  'SIP vs lump sum — which is better?',
  'How to pick a good stock?',
];

function KookyLogo() {
  const pulseL = useRef(new Animated.Value(0)).current;
  const pulseR = useRef(new Animated.Value(0)).current;
  const blinkL = useRef(new Animated.Value(1)).current;
  const blinkR = useRef(new Animated.Value(1)).current;

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
            Animated.timing(anim, { toValue: 0.08, duration: 80, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 1, duration: 80, useNativeDriver: true }),
          ])
        ).start();
      }, delay);
    };
    blinkLoop(blinkL, 0);
    blinkLoop(blinkR, 150);
  }, []);

  const EyeTile = ({ pulse, blink }: { pulse: Animated.Value; blink: Animated.Value }) => {
    const borderColor = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: ['#D85A30', '#EF9F27'],
    });
    const shadowOpacity = pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.9],
    });

    return (
      <Animated.View
        style={[
          logo.eyeTile,
          {
            borderColor,
            shadowColor: '#EF9F27',
            shadowOpacity,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 0 },
            elevation: 6,
          },
        ]}
      >
        <Animated.View style={[logo.eyeOuter, { transform: [{ scaleY: blink }], borderColor }]}>
          <View style={logo.eyeIris}>
            <View style={logo.eyePupil} />
          </View>
          <View style={logo.eyeShine} />
        </Animated.View>
        <View style={logo.tileLed} />
      </Animated.View>
    );
  };

  const LetterTile = ({ letter }: { letter: string }) => (
    <View style={logo.tile}>
      <View style={logo.tileTopBar} />
      <Text style={logo.tileLetter}>{letter}</Text>
      <View style={logo.tileLed} />
    </View>
  );

  return (
    <View style={logo.wrap}>
      <View style={[logo.screw, { top: 8, left: 8 }]} />
      <View style={[logo.screw, { top: 8, right: 8 }]} />
      <View style={[logo.screw, { bottom: 8, left: 8 }]} />
      <View style={[logo.screw, { bottom: 8, right: 8 }]} />
      <View style={[logo.ear, logo.earL]} />
      <View style={[logo.ear, logo.earR]} />
      <View style={logo.antennaBall} />
      <View style={logo.antenna} />
      <View style={logo.tilesRow}>
        <LetterTile letter="K" />
        <View style={logo.dot} />
        <EyeTile pulse={pulseL} blink={blinkL} />
        <View style={logo.dot} />
        <EyeTile pulse={pulseR} blink={blinkR} />
        <View style={logo.dot} />
        <LetterTile letter="K" />
        <View style={logo.dot} />
        <LetterTile letter="Y" />
      </View>
      <Text style={logo.tagline}>AI · Finance · Agent</Text>
    </View>
  );
}

const logo = StyleSheet.create({
  wrap: {
    borderWidth: 1.5,
    borderColor: '#D85A30',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
    backgroundColor: '#0d0d0d',
    position: 'relative',
  },
  screw: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#D85A30',
    opacity: 0.5,
  },
  ear: {
    position: 'absolute',
    width: 8,
    height: 18,
    backgroundColor: '#1a0a00',
    top: '50%',
    marginTop: -9,
  },
  earL: {
    left: -8,
    borderWidth: 1.5,
    borderColor: '#D85A30',
    borderRightWidth: 0,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  earR: {
    right: -8,
    borderWidth: 1.5,
    borderColor: '#D85A30',
    borderLeftWidth: 0,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  antennaBall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF9F27',
    marginBottom: 3,
    shadowColor: '#EF9F27',
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  antenna: {
    width: 2,
    height: 10,
    backgroundColor: '#D85A30',
    borderRadius: 2,
    marginBottom: 4,
  },
  tilesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tile: {
    width: 36,
    height: 44,
    backgroundColor: '#1a0a00',
    borderWidth: 1.5,
    borderColor: '#D85A30',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  tileTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#D85A30',
    opacity: 0.5,
  },
  tileLetter: {
    fontSize: 22,
    fontWeight: '900',
    color: '#D85A30',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  tileLed: {
    width: '65%',
    height: 3,
    backgroundColor: '#D85A30',
    borderRadius: 2,
    marginTop: 3,
    opacity: 0.35,
  },
  eyeTile: {
    width: 36,
    height: 44,
    backgroundColor: '#0d0300',
    borderWidth: 1.5,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EF9F27',
    backgroundColor: '#1a0500',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  eyeIris: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EF9F27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyePupil: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0d0200',
  },
  eyeShine: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
    opacity: 0.9,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D85A30',
    opacity: 0.5,
  },
  tagline: {
    marginTop: 7,
    fontSize: 7,
    letterSpacing: 3,
    color: '#F0997B',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textTransform: 'uppercase',
  },
});

export default function KookyScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'bot',
      text: 'Kooky online. Ask me anything about trading, stocks, mutual funds, or the finance world. I operate only in the money matrix.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

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
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: msgText }],
        }),
      });

      const data = await response.json();
      const botText =
        data?.content?.[0]?.text ||
        'Signal lost. Try again.\n\nNote: API key not configured yet.';

      setMessages(prev => [
        ...prev,
        { id: Date.now().toString() + 'b', role: 'bot', text: botText },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString() + 'e',
          role: 'bot',
          text: 'Signal lost. Check your connection.\n\nNote: Add EXPO_PUBLIC_ANTHROPIC_API_KEY to your .env file to activate Kooky.',
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.inProgressBanner}>
        <Text style={styles.inProgressEmoji}>🚧</Text>
        <View style={styles.inProgressTextWrap}>
          <Text style={styles.inProgressTitle}>In Progress — Coming Soon</Text>
          <Text style={styles.inProgressSub}>
            Get ready for the biggest change in the finance space. We're building something powerful.
          </Text>
        </View>
      </View>

      <View style={styles.agentBadge}>
        <View style={styles.statusDot} />
        <Text style={styles.agentBadgeText}>
          Kooky — Decoding the <Text style={styles.moneyMatrix}>Money Matrix</Text>
        </Text>
      </View>

      <View style={styles.logoContainer}>
        <KookyLogo />
      </View>

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
            {msg.role === 'bot' && (
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
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}

        {showQuick && (
          <View style={styles.quickWrap}>
            {QUICK_QUESTIONS.map(q => (
              <TouchableOpacity
                key={q}
                style={styles.quickBtn}
                onPress={() => sendMessage(q)}
              >
                <Text style={styles.quickBtnText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
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
  inProgressBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  inProgressEmoji: {
    fontSize: 20,
    marginTop: 2,
  },
  inProgressTextWrap: {
    flex: 1,
  },
  inProgressTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  inProgressSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 16,
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
  },
  logoContainer: {
    backgroundColor: Colors.background,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  quickWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  quickBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.cardBackground,
  },
  quickBtnText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
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
});
