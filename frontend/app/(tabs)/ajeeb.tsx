import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { PremiumUpgradeScreen } from './active-trades';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://your-vercel-app.vercel.app';
const HEADER_BG   = '#0B1A2E';

interface Message {
  id: string; role: 'user' | 'assistant'; text: string;
}

const QUICK_QUESTIONS = [
  'Analyze Reliance Industries',
  'Analyze TCS',
  'What is intraday trading?',
  'How to read RSI indicator?',
  'SIP vs lump sum — which is better?',
];

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
    <Animated.View style={[logo.eye, {
      width: eyeSize, height: eyeSize, borderRadius: eyeSize / 2,
      borderColor, transform: [{ scaleY: blink }],
      shadowColor: '#2979FF', shadowOpacity: 0.6, shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 }, elevation: 5,
    }]}>
      <View style={[logo.iris, { width: irisSize, height: irisSize, borderRadius: irisSize / 2 }]}>
        <View style={[logo.pupil, { width: pupilSize, height: pupilSize, borderRadius: pupilSize / 2 }]} />
      </View>
      <View style={logo.shine} />
    </Animated.View>
  );

  return (
    <View style={logo.row}>
      <Text style={logo.letter}>K</Text>
      <Eye /><Eye />
      <Text style={logo.letter}>KY</Text>
    </View>
  );
}

const logo = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  letter: { fontWeight: '900', color: '#2979FF', fontSize: 18, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', textShadowColor: '#2979FF', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  eye:    { borderWidth: 2, backgroundColor: '#0D2247', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  iris:   { backgroundColor: '#1565C0', alignItems: 'center', justifyContent: 'center' },
  pupil:  { backgroundColor: '#4A9EFF' },
  shine:  { position: 'absolute', top: 4, right: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.85)' },
});

export default function KookyScreen() {
  const { userData } = useAuth();
  const theme = useTheme();

  const [messages, setMessages] = useState<Message[]>([{
    id: '0', role: 'assistant',
    text: 'Kooky online. Ask me anything about stocks, trading, or mutual funds.\n\nTip: Try "Analyze Reliance" or tap Portfolio to analyze your holdings.',
  }]);
  const [input,          setInput]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [showQuick,      setShowQuick]      = useState(true);
  const [portfolioMode,  setPortfolioMode]  = useState(false);
  const [portfolioInput, setPortfolioInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || loading) return;
    setInput(''); setShowQuick(false);
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: msgText };
    const updatedMessages  = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/kooky`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages.map(m => ({ role: m.role, content: m.text })), user_id: null }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { id: Date.now().toString() + 'b', role: 'assistant', text: data?.reply || 'Signal lost. Try again.' }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString() + 'e', role: 'assistant', text: '📡 Signal lost. Check your connection and try again.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const sendPortfolioAnalysis = () => {
    if (!portfolioInput.trim()) return;
    setPortfolioMode(false); setPortfolioInput('');
    sendMessage(`Analyze my stock portfolio:\n${portfolioInput}`);
  };

  // ── Portfolio mode ────────────────────────────────────────────────────────
  if (portfolioMode) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: HEADER_BG }} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[st.portfolioOverlay, { backgroundColor: theme.background }]}>
            <View style={st.portfolioHeader}>
              <TouchableOpacity onPress={() => setPortfolioMode(false)} style={[st.backBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <Ionicons name="arrow-back" size={20} color={theme.text} />
              </TouchableOpacity>
              <Text style={[st.portfolioTitle, { color: theme.text }]}>💼 Portfolio Analysis</Text>
              <View style={{ width: 36 }} />
            </View>
            <View style={[st.portfolioHintCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <Text style={[st.portfolioHintTitle, { color: theme.textSecondary }]}>HOW TO ENTER HOLDINGS</Text>
              <Text style={[st.portfolioHint, { color: theme.text }]}>
                Reliance Industries - ₹50,000{'\n'}TCS - ₹30,000{'\n'}HDFC Bank - ₹20,000{'\n'}Infosys - ₹15,000
              </Text>
            </View>
            <TextInput
              style={[st.portfolioTextArea, { backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.text }]}
              value={portfolioInput} onChangeText={setPortfolioInput}
              placeholder="Enter your stocks and amounts here..."
              placeholderTextColor={theme.textSecondary} multiline autoFocus />
            <TouchableOpacity style={st.portfolioSubmitBtn} onPress={sendPortfolioAnalysis}>
              <Ionicons name="analytics-outline" size={18} color="#fff" />
              <Text style={st.portfolioSubmitText}>Analyze My Portfolio</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Main screen — SafeAreaView ALWAYS wraps so status bar stays dark blue ──
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: HEADER_BG }} edges={['top']}>

      {/* FREE user — upgrade screen inside SafeAreaView so dark blue shows at top */}
      {userData?.status === 'FREE' ? (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <PremiumUpgradeScreen />
        </View>
      ) : (
        <>
          {/* HEADER — fixed */}
          <View style={st.topHeader}>
            <KookyLogo />
            <TouchableOpacity style={st.portfolioTopBtn} onPress={() => setPortfolioMode(true)}>
              <Ionicons name="pie-chart" size={12} color="#fff" />
              <Text style={st.portfolioTopBtnText}>Portfolio</Text>
            </TouchableOpacity>
          </View>

          <View style={[st.agentBadge, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
            <View style={st.statusDot} />
            <Text style={[st.agentBadgeText, { color: theme.textSecondary }]}>
              Kooky — Decoding the <Text style={st.moneyMatrix}>Money Matrix</Text>
            </Text>
          </View>

          {/* CHAT */}
          <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: theme.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            <ScrollView ref={scrollRef} style={[st.messages, { backgroundColor: theme.background }]}
              contentContainerStyle={{ paddingVertical: 12, paddingBottom: 8 }}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
              {messages.map(msg => (
                <View key={msg.id} style={[
                  st.bubble,
                  msg.role === 'user'
                    ? [st.userBubble, { backgroundColor: HEADER_BG }]
                    : [st.botBubble, { backgroundColor: theme.cardBackground, borderColor: theme.border }],
                ]}>
                  {msg.role === 'assistant' && <Text style={[st.senderLabel, { color: theme.textSecondary }]}>Kooky //</Text>}
                  <Text style={[msg.role === 'user' ? st.userText : st.botText, msg.role !== 'user' && { color: theme.text }]}>{msg.text}</Text>
                </View>
              ))}
              {loading && (
                <View style={[st.bubble, st.botBubble, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                  <Text style={[st.senderLabel, { color: theme.textSecondary }]}>Kooky //</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#2979FF" />
                    <Text style={[st.loadingText, { color: theme.textSecondary }]}>Analyzing markets...</Text>
                  </View>
                </View>
              )}
              {showQuick && (
                <View style={st.quickWrap}>
                  <Text style={[st.quickLabel, { color: theme.textSecondary }]}>QUICK ACTIONS</Text>
                  {QUICK_QUESTIONS.map(q => (
                    <TouchableOpacity key={q} style={[st.quickBtn, { backgroundColor: theme.cardBackground, borderColor: theme.border }]} onPress={() => sendMessage(q)}>
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
                value={input} onChangeText={setInput}
                placeholder="Ask Kooky about markets..." placeholderTextColor={theme.textSecondary}
                onSubmitEditing={() => sendMessage()} returnKeyType="send" multiline={false} />
              <TouchableOpacity style={[st.sendBtn, loading && st.sendBtnDisabled]} onPress={() => sendMessage()} disabled={loading}>
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  topHeader:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: HEADER_BG, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#173772' },
  agentBadge:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 9, borderBottomWidth: 1, gap: 8 },
  statusDot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C853' },
  agentBadgeText:     { fontSize: 12, fontWeight: '600', flex: 1 },
  moneyMatrix:        { color: '#00C853', fontWeight: '700' },
  portfolioTopBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#2979FF' },
  portfolioTopBtnText:{ fontSize: 11, color: '#4A9EFF', fontWeight: '700' },
  messages:           { flex: 1, paddingHorizontal: 12 },
  bubble:             { maxWidth: '82%', marginVertical: 4, padding: 12, borderRadius: 12 },
  botBubble:          { alignSelf: 'flex-start', borderWidth: 1, borderTopLeftRadius: 4 },
  userBubble:         { alignSelf: 'flex-end', borderTopRightRadius: 4 },
  senderLabel:        { fontSize: 10, letterSpacing: 1, marginBottom: 4, fontWeight: '600' },
  botText:            { fontSize: 13, lineHeight: 20 },
  userText:           { fontSize: 13, color: '#fff', lineHeight: 20 },
  loadingText:        { fontSize: 12, fontStyle: 'italic' },
  quickWrap:          { marginTop: 12, paddingHorizontal: 4, gap: 6 },
  quickLabel:         { fontSize: 9, letterSpacing: 2, fontWeight: '700', marginBottom: 2 },
  quickBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  quickBtnText:       { fontSize: 12, fontWeight: '500' },
  inputRow:           { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 12, borderTopWidth: 1 },
  portfolioIconBtn:   { width: 40, height: 40, borderRadius: 10, backgroundColor: '#2979FF', alignItems: 'center', justifyContent: 'center' },
  textInput:          { flex: 1, height: 40, borderRadius: 20, paddingHorizontal: 16, fontSize: 13, borderWidth: 1 },
  sendBtn:            { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0B1A2E', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:    { opacity: 0.5 },
  portfolioOverlay:   { flex: 1, padding: 16 },
  portfolioHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  backBtn:            { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  portfolioTitle:     { fontSize: 17, fontWeight: '800' },
  portfolioHintCard:  { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 12 },
  portfolioHintTitle: { fontSize: 10, fontWeight: '700', marginBottom: 6, letterSpacing: 1 },
  portfolioHint:      { fontSize: 13, lineHeight: 22, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  portfolioTextArea:  { flex: 1, borderRadius: 12, padding: 16, fontSize: 14, borderWidth: 1, textAlignVertical: 'top', marginBottom: 12 },
  portfolioSubmitBtn: { backgroundColor: '#2979FF', borderRadius: 12, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  portfolioSubmitText:{ fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
});
