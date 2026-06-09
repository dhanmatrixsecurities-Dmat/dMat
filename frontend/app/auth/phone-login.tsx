import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, SafeAreaView, Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '@/firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

// ── Animated candlestick background ──────────────────────────────────────────
function CandleBar({ delay, height, color, x }: { delay: number; height: number; color: string; x: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', bottom: 0, left: x,
      width: 6, height,
      backgroundColor: color,
      borderRadius: 3,
      opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.35] }),
      transform: [{ scaleY: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
    }} />
  );
}

function AnimatedBackground() {
  const candles = [
    { x: 20,  h: 60,  color: '#22C55E', delay: 0 },
    { x: 36,  h: 90,  color: '#2979FF', delay: 200 },
    { x: 52,  h: 45,  color: '#22C55E', delay: 400 },
    { x: 68,  h: 110, color: '#EF4444', delay: 100 },
    { x: 84,  h: 70,  color: '#2979FF', delay: 600 },
    { x: 100, h: 130, color: '#22C55E', delay: 300 },
    { x: 116, h: 55,  color: '#EF4444', delay: 500 },
    { x: 132, h: 95,  color: '#2979FF', delay: 150 },
    { x: 148, h: 75,  color: '#22C55E', delay: 700 },
    { x: 164, h: 120, color: '#EF4444', delay: 250 },
    { x: 200, h: 80,  color: '#22C55E', delay: 350 },
    { x: 216, h: 100, color: '#2979FF', delay: 450 },
    { x: 232, h: 60,  color: '#22C55E', delay: 550 },
    { x: 248, h: 140, color: '#EF4444', delay: 650 },
    { x: 264, h: 85,  color: '#2979FF', delay: 50  },
    { x: 280, h: 110, color: '#22C55E', delay: 750 },
    { x: 296, h: 65,  color: '#EF4444', delay: 180 },
    { x: 312, h: 95,  color: '#2979FF', delay: 420 },
    { x: 328, h: 50,  color: '#22C55E', delay: 620 },
    { x: 344, h: 125, color: '#EF4444', delay: 320 },
  ];
  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, overflow: 'hidden', opacity: 0.5 }}>
      {candles.map((c, i) => (
        <CandleBar key={i} x={c.x} height={c.h} color={c.color} delay={c.delay} />
      ))}
    </View>
  );
}

// ── Ticker strip ──────────────────────────────────────────────────────────────
function TickerStrip() {
  const anim = useRef(new Animated.Value(0)).current;
  const items = [
    { name: 'NIFTY 50', val: '+1.24%', up: true },
    { name: 'BANK NIFTY', val: '-0.68%', up: false },
    { name: 'SENSEX', val: '+0.93%', up: true },
    { name: 'NIFTY 50', val: '+1.24%', up: true },
    { name: 'BANK NIFTY', val: '-0.68%', up: false },
    { name: 'SENSEX', val: '+0.93%', up: true },
  ];
  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, { toValue: -width, duration: 12000, useNativeDriver: true })
    ).start();
  }, []);
  return (
    <View style={{ overflow: 'hidden', height: 26, backgroundColor: Colors.primary + '18', borderBottomWidth: 1, borderBottomColor: Colors.primary + '22' }}>
      <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: anim }], paddingLeft: width }}>
        {items.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 28 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.textSecondary }}>{item.name} </Text>
            <Text style={{ fontSize: 11, fontWeight: '800', color: item.up ? '#22C55E' : '#EF4444' }}>
              {item.up ? '▲' : '▼'} {item.val}
            </Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// ── Kooky Robot logo ──────────────────────────────────────────────────────────
function KookyRobotLogo() {
  const blink = useRef(new Animated.Value(1)).current;
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(3000),
      Animated.timing(blink, { toValue: 0.05, duration: 80, useNativeDriver: false }),
      Animated.timing(blink, { toValue: 1,    duration: 80, useNativeDriver: false }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: -6, duration: 1800, useNativeDriver: true }),
      Animated.timing(float, { toValue: 0,  duration: 1800, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={{ alignItems: 'center', transform: [{ translateY: float }] }}>
      {/* Head */}
      <View style={{
        width: 70, height: 70, borderRadius: 18,
        backgroundColor: Colors.primary,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: Colors.primary, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 8,
      }}>
        {/* Eyes row */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 6 }}>
          {[0, 1].map(i => (
            <Animated.View key={i} style={{
              width: 18, height: 18, borderRadius: 9,
              backgroundColor: '#fff',
              transform: [{ scaleY: blink }],
              alignItems: 'center', justifyContent: 'center',
            }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary }} />
              <View style={{ position: 'absolute', top: 3, right: 3, width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.9)' }} />
            </Animated.View>
          ))}
        </View>
        {/* Mouth */}
        <View style={{ width: 24, height: 4, backgroundColor: '#fff', borderRadius: 2, opacity: 0.8 }} />
      </View>
      {/* Antenna */}
      <View style={{ position: 'absolute', top: -10, width: 3, height: 14, backgroundColor: Colors.primary, borderRadius: 2 }} />
      <View style={{ position: 'absolute', top: -16, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, opacity: 0.6 }} />
    </Animated.View>
  );
}

// ── Main Login Screen ─────────────────────────────────────────────────────────
export default function PhoneLogin() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [mobile, setMobile]     = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Slide animation between login/register
  const slideAnim = useRef(new Animated.Value(0)).current;
  const switchTab = (toRegister: boolean) => {
    Animated.timing(slideAnim, {
      toValue: toRegister ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
    setIsRegister(toRegister);
  };

  const validateMobile = (num: string) => {
    const cleaned = num.replace(/\D/g, '').replace(/^(91|0)/, '');
    return /^[6-9]\d{9}$/.test(cleaned);
  };

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
    if (!name.trim()) return Alert.alert('Error', 'Please enter your full name');
    if (!validateMobile(mobile)) return Alert.alert('Error', 'Enter a valid 10-digit Indian mobile number');
    if (!regEmail.trim()) return Alert.alert('Error', 'Please enter your email');
    if (regPassword.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');
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
          switchTab(false);
          setName(''); setMobile(''); setRegEmail(''); setRegPassword(''); setConfirmPassword('');
        }
      }]);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') Alert.alert('Error', 'This email is already registered.');
      else Alert.alert('Registration Failed', error.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const InputField = ({ label, value, onChange, placeholder, keyboard = 'default', secure = false, showToggle = false, onToggle, maxLen }: any) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passRow}>
        <TextInput
          style={[styles.input, showToggle && { paddingRight: 48 }]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboard}
          secureTextEntry={secure}
          autoCapitalize="none"
          maxLength={maxLen}
        />
        {showToggle && (
          <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
            <Ionicons name={!secure ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TickerStrip />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Robot + Brand */}
          <View style={styles.header}>
            <KookyRobotLogo />
            <Text style={styles.title}>DhanMatrix</Text>
            <Text style={styles.subtitle}>Explore · Track · Decide Better</Text>

            {/* Kooky AI chip */}
            <View style={styles.kookyChip}>
              <View style={styles.kookyDot} />
              <Text style={styles.kookyChipText}>Powered by Kooky AI</Text>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Toggle */}
            <View style={styles.toggleRow}>
              <TouchableOpacity style={[styles.toggleBtn, !isRegister && styles.toggleBtnActive]} onPress={() => switchTab(false)} activeOpacity={0.8}>
                <Text style={[styles.toggleText, !isRegister && styles.toggleTextActive]}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, isRegister && styles.toggleBtnActive]} onPress={() => switchTab(true)} activeOpacity={0.8}>
                <Text style={[styles.toggleText, isRegister && styles.toggleTextActive]}>Register</Text>
              </TouchableOpacity>
            </View>

            {/* Login form */}
            {!isRegister && (
              <View>
                <InputField label="Email" value={email} onChange={setEmail} placeholder="Enter your email" keyboard="email-address" />
                <InputField label="Password" value={password} onChange={setPassword} placeholder="Enter your password" secure={!showPass} showToggle onToggle={() => setShowPass(p => !p)} />
                <TouchableOpacity
                  style={[styles.button, (loading || !email || !password) && styles.buttonDisabled]}
                  onPress={handleLogin} disabled={loading || !email || !password} activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="log-in-outline" size={18} color="#fff" />
                      <Text style={styles.buttonText}>Sign In</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => switchTab(true)} style={styles.switchLink}>
                  <Text style={styles.switchText}>New user? <Text style={styles.switchTextBold}>Register here</Text></Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Register form */}
            {isRegister && (
              <View>
                <InputField label="Full Name" value={name} onChange={setName} placeholder="Enter your full name" />
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Mobile Number</Text>
                  <View style={styles.mobileRow}>
                    <View style={styles.countryCode}>
                      <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                    </View>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="9XXXXXXXXX" placeholderTextColor={Colors.textSecondary}
                      value={mobile} onChangeText={setMobile} keyboardType="phone-pad" maxLength={10}
                    />
                  </View>
                </View>
                <InputField label="Email" value={regEmail} onChange={setRegEmail} placeholder="Enter your email" keyboard="email-address" />
                <InputField label="Password" value={regPassword} onChange={setRegPassword} placeholder="Min. 6 characters" secure={!showPass} showToggle onToggle={() => setShowPass(p => !p)} />
                <InputField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter password" secure={!showConfirmPass} showToggle onToggle={() => setShowConfirmPass(p => !p)} />

                <View style={styles.infoNote}>
                  <Ionicons name="information-circle-outline" size={15} color="#3b82f6" />
                  <Text style={styles.infoNoteText}>A verification link will be sent to your email.</Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="person-add-outline" size={18} color="#fff" />
                      <Text style={styles.buttonText}>Create Account</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => switchTab(false)} style={styles.switchLink}>
                  <Text style={styles.switchText}>Already have an account? <Text style={styles.switchTextBold}>Login</Text></Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Contact */}
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactBtn}>
              <Ionicons name="logo-whatsapp" size={14} color="#22C55E" />
              <Text style={styles.contactText}>+91 92583 03916</Text>
            </TouchableOpacity>
            <View style={styles.contactDivider} />
            <TouchableOpacity style={styles.contactBtn}>
              <Ionicons name="mail-outline" size={14} color={Colors.primary} />
              <Text style={styles.contactText}>info@dhanmatrix.in</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disc}>For education & research only. Not investment advice.{'\n'}Consult a SEBI-registered advisor before any financial decision.</Text>
          <AnimatedBackground />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.background },
  scrollContent:   { flexGrow: 1, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40 },
  header:          { alignItems: 'center', marginBottom: 24 },
  title:           { fontSize: 28, fontWeight: '900', color: Colors.primary, marginTop: 14, letterSpacing: -0.5 },
  subtitle:        { fontSize: 13, color: Colors.textSecondary, marginTop: 4, letterSpacing: 0.3 },
  kookyChip:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: Colors.primary + '14', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: Colors.primary + '30' },
  kookyDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  kookyChipText:   { fontSize: 11, fontWeight: '700', color: Colors.primary },
  card:            { backgroundColor: Colors.cardBackground, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4, marginBottom: 16 },
  toggleRow:       { flexDirection: 'row', backgroundColor: Colors.background, borderRadius: 12, padding: 3, marginBottom: 20 },
  toggleBtn:       { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  toggleText:      { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  toggleTextActive:{ color: '#fff' },
  inputContainer:  { marginBottom: 16 },
  label:           { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 7 },
  input:           { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: Colors.text },
  passRow:         { position: 'relative' },
  eyeBtn:          { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  mobileRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countryCode:     { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 13 },
  countryCodeText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  infoNote:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEF3FF', borderRadius: 10, padding: 10, marginBottom: 14 },
  infoNoteText:    { flex: 1, fontSize: 12, color: '#3B52CC', fontWeight: '600' },
  button:          { backgroundColor: Colors.primary, paddingVertical: 15, borderRadius: 13, alignItems: 'center', marginTop: 4, shadowColor: Colors.primary, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  buttonDisabled:  { backgroundColor: Colors.border, shadowOpacity: 0, elevation: 0 },
  buttonText:      { color: '#fff', fontSize: 16, fontWeight: '800' },
  switchLink:      { marginTop: 16, alignItems: 'center' },
  switchText:      { fontSize: 13, color: Colors.textSecondary },
  switchTextBold:  { color: Colors.primary, fontWeight: '700' },
  contactRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  contactBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 8 },
  contactText:     { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  contactDivider:  { width: 1, height: 14, backgroundColor: Colors.border },
  disc:            { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', lineHeight: 15, marginBottom: 60 },
});
