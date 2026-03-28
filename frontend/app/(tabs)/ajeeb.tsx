import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

const SYSTEM_PROMPT = `You are Ajeeb, a sharp and knowledgeable AI finance agent built into the dMat trading app. You answer questions about:
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

export default function AjeebScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'bot',
      text: 'Ajeeb online. Ask me anything about trading, stocks, mutual funds, or the finance world. I operate only in the money matrix.',
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
        'Signal lost. Try again.\n\n⚠️ API key not configured yet — add EXPO_PUBLIC_ANTHROPIC_API_KEY to your .env file.';

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
          text: 'Signal lost. Check your connection.\n\n⚠️ API key not configured yet — add EXPO_PUBLIC_ANTHROPIC_API_KEY to your .env file to activate Ajeeb.',
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
      {/* In Progress Banner */}
      <View style={styles.inProgressBanner}>
        <Text style={styles.inProgressEmoji}>🚧</Text>
        <View style={styles.inProgressTextWrap}>
          <Text style={styles.inProgressTitle}>In Progress — Coming Soon</Text>
          <Text style={styles.inProgressSub}>
            Get ready for the biggest change in the finance space. We're building something powerful.
          </Text>
        </View>
      </View>

      {/* Agent badge */}
      <View style={styles.agentBadge}>
        <View style={styles.statusDot} />
        <Text style={styles.agentBadgeText}>Ajeeb — Decoding the <Text style={styles.moneyMatrix}>Money Matrix</Text></Text>
      </View>

      {/* Messages */}
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
              <Text style={styles.senderLabel}>AJEEB //</Text>
            )}
            <Text style={msg.role === 'user' ? styles.userText : styles.botText}>
              {msg.text}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={[styles.bubble, styles.botBubble]}>
            <Text style={styles.senderLabel}>AJEEB //</Text>
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

      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask Ajeeb about markets..."
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
    backgroundColor: Colors.primary,
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.secondary,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
