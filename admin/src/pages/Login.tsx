import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, Animated, Dimensions, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth, db } from '@/firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ── Colors (dark theme matching HTML) ─────────────────────────────────────────
const C = {
  bg:        '#080d1a',
  card:      '#0d1628',
  border:    '#1a2540',
  blue:      '#2979FF',
  text:      '#E2E8F0',
  sub:       '#4A6A8A',
  inputBg:   '#111E33',
  green:     '#22C55E',
};

// ── Live candlestick canvas using Animated bars ───────────────────────────────
function LiveChart() {
  const bars = Array.from({ length: 28 }, (_, i) => ({
    anim: useRef(new Animated.Value(0.4 + Math.random() * 0.6)).current,
    height: 30 + Math.random() * 100,
    color: Math.random() > 0.45 ? '#22C55E' : '#EF4444',
    x: i * 12,
    delay: i * 60,
  }));

  useEffect(() => {
    bars.forEach(b => {
      Animated.loop(Animated.sequence([
        Animated.delay(b.delay),
        Animated.timing(b.anim, { toValue: 0.3 + Math.random() * 0.7, duration: 1400 + Math.random() * 800, useNativeDriver: true }),
        Animated.timing(b.anim, { toValue: 0.5 + Math.random() * 0.5, duration: 1200 + Math.random() * 600, useNativeDriver: true }),
      ])).start();
    });
  }, []);

  return (
    <View style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
      {/* Dashed line */}
      <View style={{ position: 'absolute', top: 40, left: 0, right: 0, height: 1, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed' }} />
      {/* Price tag */}
      <View style={{ position: 'absolute', top: 32, right: 0, backgroundColor: '#2979FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
        <Text style={{ fontSize: 10, color: '#fff', fontWeight: '700' }}>241.3</Text>
      </View>
      {/* Candles */}
      {bars.map((b, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', bottom: 0, left: b.x,
          width: 7, borderRadius: 2,
          backgroundColor: b.color,
          height: b.height,
          opacity: b.anim,
        }} />
      ))}
      {/* Fade overlay */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: 'transparent' }}
        pointerEvents="none"
      />
    </View>
  );
}

// ── Ticker ────────────────────────────────────────────────────────────────────
function Ticker() {
  const anim = useRef(new Animated.Value(0)).current;
  const items = [
    { name: 'NIFTY 50',   val: '+1.07%', up: true  },
    { name: 'BANK NIFTY', val: '-0.52%', up: false },
    { name: 'SENSEX',     val: '+0.93%', up: true  },
    { name: 'NIFTY 50',   val: '+1.07%', up: true  },
    { name: 'BANK NIFTY', val: '-0.52%', up: false },
    { name: 'SENSEX',     val: '+0.93%', up: true  },
  ];
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, { toValue: -width * 1.5, duration: 12000, useNativeDriver: true })
    ).start();
  }, []);
  return (
    <View style={{ height: 24, backgroundColor: '#0a0f1e', overflow: 'hidden', justifyContent: 'center' }}>
      <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: anim }], paddingLeft: width }}>
        {items.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 32 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: item.up ? '#22C55E' : '#EF4444' }}>
              {item.name} {item.up ? '▲' : '▼'} {item.val}
            </Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PhoneLogin() {
  const router = useRouter();
  const [isRegister, setIsRegister]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const [showPass, setShowPass]       = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [mobile,   setMobile]   = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Kooky AI rotating messages
  const kookyMsgs = [
    "Ask me: 'What is Bank Nifty?' or 'How does SIP work?'",
    'I can analyse any stock for you. Try "Analyze Reliance"',
    'Learn swing trading, F&O, MF concepts with me!',
    'Your AI market companion — education first, always.',
  ];
  const [kookyIdx, setKookyIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setKookyIdx(i => (i + 1) % kookyMsgs.length), 3500);
    return () => clearInterval(t);
  }, []);

  const validateMobile = (num: string) => /^[6-9]\d{9}$/.test(num.replace(/\D/g, '').replace(/^(91|0)/, ''));

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    try {
      setLoading(true);
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!userCred.user.emailVerified) {
        await auth.signOut();
        Alert.alert('Email Not Verified', 'Please verify your email first.', [
          { text: 'Resend Email', onPress: async () => {
            await signInWithEmailAndPassword(auth, email.trim(), password);
            await sendEmailVerification(auth.currentUser!);
            await auth.signOut();
            Alert.alert('Sent!', 'Verification email resent.');
          }},
          { text: 'OK', style: 'cancel' },
        ]);
        return;
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!name.trim())            return Alert.alert('Error', 'Please enter your full name');
    if (!validateMobile(mobile)) return Alert.alert('Error', 'Enter a valid 10-digit Indian mobile number');
    if (!regEmail.trim())        return Alert.alert('Error', 'Please enter your email');
    if (regPassword.length < 6)  return Alert.alert('Error', 'Password must be at least 6 characters');
    if (regPassword !== confirmPassword) return Alert.alert('Error', 'Passwords do not match');
    try {
      setLoading(true);
      const userCred = await createUserWithEmailAndPassword(auth, regEmail.trim(), regPassword);
      await sendEmailVerification(userCred.user);
      const cleanMobile = '+91' + mobile.replace(/\D/g, '').replace(/^(91|0)/, '');
      await setDoc(doc(db, 'users', userCred.user.uid), {
        name: name.trim(), mobile: cleanMobile,
        email: regEmail.trim().toLowerCase(),
        status: 'FREE', subscriptionEndDate: null, createdAt: serverTimestamp(),
      });
      await auth.signOut();
      Alert.alert('Verify Your Email 📧', `Verification link sent to ${regEmail.trim()}.`, [{
        text: 'OK', onPress: () => {
          setIsRegister(false);
          setName(''); setMobile(''); setRegEmail(''); setRegPassword(''); setConfirmPassword('');
        }
      }]);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') Alert.alert('Error', 'This email is already registered.');
      else Alert.alert('Registration Failed', error.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <Ticker />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          style={{ backgroundColor: C.bg }}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Live chart */}
          <LiveChart />

          {/* Logo */}
          <View style={s.logoWrap}>
            <View style={s.dmBadge}><Text style={s.dmText}>dm</Text></View>
            <Text style={s.brandName}>DhanMatrix</Text>
            <Text style={s.brandSub}>Explore · Track · Decide Better</Text>
          </View>

          {/* Kooky AI card */}
          <View style={s.kookyCard}>
            <View style={s.kookyAvatarWrap}>
              <View style={s.kookyAvatar}>
                <Text style={{ fontSize: 20 }}>🤖</Text>
              </View>
              <View style={s.kookyOnline} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.kookyName}>Kooky AI</Text>
              <Text style={s.kookyMsg} numberOfLines={2}>{kookyMsgs[kookyIdx]}</Text>
            </View>
          </View>

          {/* Card */}
          <View style={s.card}>
            {/* Toggle */}
            <View style={s.toggleRow}>
              <TouchableOpacity style={[s.toggleBtn, !isRegister && s.toggleActive]} onPress={() => setIsRegister(false)}>
                <Text style={[s.toggleText, !isRegister && s.toggleTextActive]}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.toggleBtn, isRegister && s.toggleActive]} onPress={() => setIsRegister(true)}>
                <Text style={[s.toggleText, isRegister && s.toggleTextActive]}>Register</Text>
              </TouchableOpacity>
            </View>

            {/* Login form */}
            {!isRegister && (<>
              <Text style={s.label}>EMAIL</Text>
              <TextInput style={s.input} placeholder="Enter your email" placeholderTextColor={C.sub}
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Text style={s.label}>PASSWORD</Text>
              <View style={{ position: 'relative' }}>
                <TextInput style={[s.input, { paddingRight: 48 }]} placeholder="Enter your password" placeholderTextColor={C.sub}
                  value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
                <TouchableOpacity onPress={() => setShowPass(p => !p)} style={s.eye}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.sub} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[s.btn, (!email || !password || loading) && s.btnDim]}
                onPress={handleLogin} disabled={!email || !password || loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsRegister(true)} style={s.switchLink}>
                <Text style={s.switchText}>New user? <Text style={s.switchBold}>Register here</Text></Text>
              </TouchableOpacity>
            </>)}

            {/* Register form */}
            {isRegister && (<>
              <Text style={s.label}>FULL NAME</Text>
              <TextInput style={s.input} placeholder="Enter your full name" placeholderTextColor={C.sub}
                value={name} onChangeText={setName} autoCapitalize="words" />

              <Text style={s.label}>MOBILE NUMBER</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={[s.input, { width: 76, justifyContent: 'center', paddingHorizontal: 10 }]}>
                  <Text style={{ color: C.text, fontWeight: '700', fontSize: 14 }}>🇮🇳 +91</Text>
                </View>
                <TextInput style={[s.input, { flex: 1 }]} placeholder="9XXXXXXXXX" placeholderTextColor={C.sub}
                  value={mobile} onChangeText={setMobile} keyboardType="phone-pad" maxLength={10} />
              </View>

              <Text style={s.label}>EMAIL</Text>
              <TextInput style={s.input} placeholder="Enter your email" placeholderTextColor={C.sub}
                value={regEmail} onChangeText={setRegEmail} keyboardType="email-address" autoCapitalize="none" />

              <Text style={s.label}>PASSWORD</Text>
              <View style={{ position: 'relative' }}>
                <TextInput style={[s.input, { paddingRight: 48 }]} placeholder="Min. 6 characters" placeholderTextColor={C.sub}
                  value={regPassword} onChangeText={setRegPassword} secureTextEntry={!showPass} />
                <TouchableOpacity onPress={() => setShowPass(p => !p)} style={s.eye}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.sub} />
                </TouchableOpacity>
              </View>

              <Text style={s.label}>CONFIRM PASSWORD</Text>
              <View style={{ position: 'relative' }}>
                <TextInput style={[s.input, { paddingRight: 48 }]} placeholder="Re-enter password" placeholderTextColor={C.sub}
                  value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPass} />
                <TouchableOpacity onPress={() => setShowConfirmPass(p => !p)} style={s.eye}>
                  <Ionicons name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.sub} />
                </TouchableOpacity>
              </View>

              <View style={s.infoNote}>
                <Ionicons name="information-circle-outline" size={14} color="#60a5fa" />
                <Text style={s.infoText}>A verification link will be sent to your email.</Text>
              </View>

              <TouchableOpacity style={[s.btn, loading && s.btnDim]} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Account</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsRegister(false)} style={s.switchLink}>
                <Text style={s.switchText}>Already have an account? <Text style={s.switchBold}>Login</Text></Text>
              </TouchableOpacity>
            </>)}
          </View>

          {/* Contact Us */}
          <View style={s.contactSection}>
            <Text style={s.contactTitle}>CONTACT US</Text>
            <TouchableOpacity style={s.contactItem} onPress={() => Linking.openURL('https://wa.me/919258303916')}>
              <View style={[s.contactIcon, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
                <Ionicons name="logo-whatsapp" size={18} color="#22C55E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.contactLabel}>WHATSAPP</Text>
                <Text style={s.contactVal}>+91 92583 03916</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={s.contactItem} onPress={() => Linking.openURL('https://wa.me/918383898886')}>
              <View style={[s.contactIcon, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
                <Ionicons name="logo-whatsapp" size={18} color="#22C55E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.contactLabel}>WHATSAPP</Text>
                <Text style={s.contactVal}>+91 83838 98886</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={s.contactItem} onPress={() => Linking.openURL('mailto:info@dhanmatrix.in')}>
              <View style={[s.contactIcon, { backgroundColor: 'rgba(41,121,255,0.12)' }]}>
                <Ionicons name="mail-outline" size={18} color="#2979FF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.contactLabel}>EMAIL</Text>
                <Text style={s.contactVal}>info@dhanmatrix.in</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={s.disc}>For education & research only. Not investment advice.{'\n'}Consult a SEBI-registered advisor before any financial decision.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  logoWrap:  { alignItems: 'center', paddingVertical: 20 },
  dmBadge:   { width: 52, height: 52, borderRadius: 14, backgroundColor: '#2979FF', alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowColor: '#2979FF', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  dmText:    { fontSize: 18, fontWeight: '800', color: '#fff' },
  brandName: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  brandSub:  { fontSize: 12, color: C.sub, marginTop: 4, letterSpacing: 0.5 },

  kookyCard:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 14, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 12 },
  kookyAvatarWrap: { position: 'relative' },
  kookyAvatar:     { width: 42, height: 42, borderRadius: 12, backgroundColor: '#1e3a8a', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#2979FF' },
  kookyOnline:     { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E', borderWidth: 2, borderColor: C.card },
  kookyName:       { fontSize: 13, fontWeight: '700', color: '#93C5FD', marginBottom: 3 },
  kookyMsg:        { fontSize: 11, color: C.sub, lineHeight: 16 },

  card:         { marginHorizontal: 16, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 16 },
  toggleRow:    { flexDirection: 'row', backgroundColor: C.bg, borderRadius: 12, padding: 3, marginBottom: 18 },
  toggleBtn:    { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleActive: { backgroundColor: '#2979FF', shadowColor: '#2979FF', shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  toggleText:   { fontSize: 14, fontWeight: '700', color: C.sub },
  toggleTextActive: { color: '#fff' },

  label:   { fontSize: 10, fontWeight: '700', color: C.sub, letterSpacing: 0.8, marginBottom: 6, marginTop: 4 },
  input:   { backgroundColor: C.inputBg, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: C.text, marginBottom: 4 },
  eye:     { position: 'absolute', right: 14, top: 0, bottom: 4, justifyContent: 'center' },
  infoNote:{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(96,165,250,0.1)', borderRadius: 10, padding: 10, marginTop: 8, marginBottom: 4 },
  infoText:{ flex: 1, fontSize: 12, color: '#60a5fa', fontWeight: '500' },

  btn:      { backgroundColor: '#2979FF', paddingVertical: 15, borderRadius: 13, alignItems: 'center', marginTop: 12, shadowColor: '#2979FF', shadowOpacity: 0.5, shadowRadius: 12, elevation: 6 },
  btnDim:   { backgroundColor: C.border, shadowOpacity: 0, elevation: 0 },
  btnText:  { color: '#fff', fontSize: 16, fontWeight: '800' },
  switchLink:{ marginTop: 14, alignItems: 'center' },
  switchText:{ fontSize: 13, color: C.sub },
  switchBold:{ color: '#2979FF', fontWeight: '700' },

  contactSection:{ marginHorizontal: 16, marginBottom: 16 },
  contactTitle:  { fontSize: 10, fontWeight: '700', color: C.sub, letterSpacing: 1, textAlign: 'center', marginBottom: 12 },
  contactItem:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 13, marginBottom: 8 },
  contactIcon:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  contactLabel:  { fontSize: 9, color: C.sub, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  contactVal:    { fontSize: 14, color: C.text, fontWeight: '700' },

  disc: { fontSize: 10, color: C.sub, textAlign: 'center', lineHeight: 16, paddingHorizontal: 20, paddingBottom: 10 },
});
