import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, SafeAreaView, Animated, Image, Dimensions,
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

const { width, height } = Dimensions.get('window');

export default function PhoneLogin() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ── Animations ──────────────────────────────────────────────────────────
  const dotOpacity = useRef(new Animated.Value(1)).current;
  // subtle corner glow animations
  const glow1 = useRef(new Animated.Value(0)).current;
  const glow2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Blinking dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(dotOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    // Subtle corner glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow1, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(glow1, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow2, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(glow2, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Validate Indian mobile ──────────────────────────────────────────────
  const validateMobile = (num: string) => {
    const cleaned = num.replace(/\D/g, '').replace(/^(91|0)/, '');
    return /^[6-9]\d{9}$/.test(cleaned);
  };

  // ── Login ───────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    try {
      setLoading(true);
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!userCred.user.emailVerified) {
        await auth.signOut();
        Alert.alert(
          'Email Not Verified',
          'Please verify your email first. Check your inbox for the verification link.',
          [
            {
              text: 'Resend Email',
              onPress: async () => {
                await signInWithEmailAndPassword(auth, email.trim(), password);
                await sendEmailVerification(auth.currentUser!);
                await auth.signOut();
                Alert.alert('Sent!', 'Verification email resent. Please check your inbox.');
              },
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
        return;
      }
      router.replace('/(tabs)/active-trades');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // ── Register ────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Please enter your full name');
    if (!validateMobile(mobile)) return Alert.alert('Error', 'Enter a valid 10-digit Indian mobile number (starts with 6-9)');
    if (!regEmail.trim()) return Alert.alert('Error', 'Please enter your email');
    if (regPassword.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');
    if (regPassword !== confirmPassword) return Alert.alert('Error', 'Passwords do not match');

    try {
      setLoading(true);
      const userCred = await createUserWithEmailAndPassword(auth, regEmail.trim(), regPassword);
      const uid = userCred.user.uid;

      // Send verification email
      await sendEmailVerification(userCred.user);

      // Clean mobile — store as +91XXXXXXXXXX
      const cleanMobile = '+91' + mobile.replace(/\D/g, '').replace(/^(91|0)/, '');

      await setDoc(doc(db, 'users', uid), {
        name: name.trim(),
        mobile: cleanMobile,
        email: regEmail.trim().toLowerCase(),
        status: 'FREE',
        subscriptionEndDate: null,
        createdAt: serverTimestamp(),
      });

      // Sign out until email is verified
      await auth.signOut();

      Alert.alert(
        'Verify Your Email 📧',
        `A verification link has been sent to ${regEmail.trim()}. Please verify your email before logging in.`,
        [{
          text: 'OK', onPress: () => {
            setIsRegister(false);
            setName(''); setMobile(''); setRegEmail(''); setRegPassword(''); setConfirmPassword('');
          }
        }]
      );
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'This email is already registered. Please login.');
      } else {
        Alert.alert('Registration Failed', error.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Subtle corner glows only — no big circles */}
      <Animated.View style={[styles.glowTopRight, { opacity: glow1.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }]} />
      <Animated.View style={[styles.glowBottomLeft, { opacity: glow2.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] }) }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* Header — small logo + brand name in a row */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Image source={require('../../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
              <Text style={styles.brandName}>DhanMatrix</Text>
            </View>
            <Text style={styles.title}>
              {isRegister ? 'Create Your' : 'Investing'}{'\n'}
              {isRegister ? (
                <Text style={styles.titleAccent}>Account<Animated.Text style={[styles.dot, { opacity: dotOpacity }]}>.</Animated.Text></Text>
              ) : (
                <Text style={styles.titleAccent}>Your Trust<Animated.Text style={[styles.dot, { opacity: dotOpacity }]}>.</Animated.Text></Text>
              )}
            </Text>
            <Text style={styles.subtitle}>{isRegister ? 'Join DhanMatrix and stay ahead of the market.' : 'Smart market insights, every day.'}</Text>
          </View>

          {/* Toggle tabs */}
          <View style={styles.toggleRow}>
            <TouchableOpacity style={[styles.toggleBtn, !isRegister && styles.toggleBtnActive]}
              onPress={() => setIsRegister(false)} activeOpacity={0.8}>
              <Text style={[styles.toggleText, !isRegister && styles.toggleTextActive]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, isRegister && styles.toggleBtnActiveGreen]}
              onPress={() => setIsRegister(true)} activeOpacity={0.8}>
              <Text style={[styles.toggleText, isRegister && styles.toggleTextActive]}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* ── LOGIN FORM ── */}
          {!isRegister && (
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput style={styles.input} placeholder="Enter your email"
                  placeholderTextColor="rgba(255,255,255,0.25)" value={email} onChangeText={setEmail}
                  keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passRow}>
                  <TextInput style={[styles.input, { flex: 1, paddingRight: 48 }]}
                    placeholder="Enter your password" placeholderTextColor="rgba(255,255,255,0.25)"
                    value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={22} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={[styles.button, (loading || !email || !password) && styles.buttonDisabled]}
                onPress={handleLogin} disabled={loading || !email || !password} activeOpacity={0.8}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In →</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsRegister(true)} style={styles.switchLink}>
                <Text style={styles.switchText}>New user? <Text style={styles.switchTextBold}>Register here</Text></Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── REGISTER FORM ── */}
          {isRegister && (
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput style={styles.input} placeholder="Enter your full name"
                  placeholderTextColor="rgba(255,255,255,0.25)" value={name} onChangeText={setName}
                  autoCapitalize="words" />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.mobileRow}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                  </View>
                  <TextInput style={[styles.input, styles.mobileInput]}
                    placeholder="9XXXXXXXXX" placeholderTextColor="rgba(255,255,255,0.25)"
                    value={mobile} onChangeText={setMobile} keyboardType="phone-pad" maxLength={10} />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput style={styles.input} placeholder="Enter your email"
                  placeholderTextColor="rgba(255,255,255,0.25)" value={regEmail} onChangeText={setRegEmail}
                  keyboardType="email-address" autoCapitalize="none" />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passRow}>
                  <TextInput style={[styles.input, { flex: 1, paddingRight: 48 }]}
                    placeholder="Min. 6 characters" placeholderTextColor="rgba(255,255,255,0.25)"
                    value={regPassword} onChangeText={setRegPassword} secureTextEntry={!showPass} />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={22} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passRow}>
                  <TextInput style={[styles.input, { flex: 1, paddingRight: 48 }]}
                    placeholder="Re-enter password" placeholderTextColor="rgba(255,255,255,0.25)"
                    value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPass} />
                  <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)} style={styles.eyeBtn}>
                    <Ionicons name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'} size={22} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Info note */}
              <View style={styles.infoNote}>
                <Ionicons name="information-circle-outline" size={16} color="#3b82f6" />
                <Text style={styles.infoNoteText}>A verification link will be sent to your email after registration.</Text>
              </View>

              <TouchableOpacity style={[styles.button, styles.buttonGreen, loading && styles.buttonDisabled]}
                onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account →</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsRegister(false)} style={styles.switchLink}>
                <Text style={styles.switchText}>Already have an account? <Text style={styles.switchTextBold}>Sign In</Text></Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060c1a' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 40 },

  // ── Subtle corner glows only ──
  glowTopRight: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(59,130,246,0.15)', top: -80, right: -80,
  },
  glowBottomLeft: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(34,197,94,0.1)', bottom: -60, left: -60,
  },

  // ── Header ──
  header: { marginBottom: 28 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  logo: { width: 40, height: 40, borderRadius: 10 },
  brandName: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  title: { fontSize: 36, fontWeight: '900', color: '#ffffff', lineHeight: 44, letterSpacing: -0.5, marginBottom: 8 },
  titleAccent: { color: '#3b82f6' },
  dot: { color: '#22c55e', fontSize: 36, fontWeight: '900' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.35)' },

  // ── Toggle ──
  toggleRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: '#3b82f6', elevation: 4, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  toggleBtnActiveGreen: { backgroundColor: '#22c55e', elevation: 4, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  toggleText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.35)' },
  toggleTextActive: { color: '#fff' },

  // ── Form ──
  formContainer: { width: '100%' },
  inputContainer: { marginBottom: 18 },
  label: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)', marginBottom: 7, letterSpacing: 0.8, textTransform: 'uppercase' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 13, borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)', paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#ffffff',
  },
  passRow: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  mobileRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countryCode: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 13, borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)', paddingHorizontal: 12, paddingVertical: 14,
  },
  countryCodeText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  mobileInput: { flex: 1 },
  infoNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 10, padding: 10, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  infoNoteText: { flex: 1, fontSize: 12, color: '#93c5fd', fontWeight: '600' },
  button: {
    backgroundColor: '#3b82f6', paddingVertical: 15, borderRadius: 13,
    alignItems: 'center', elevation: 6, marginTop: 4,
    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12,
  },
  buttonGreen: { backgroundColor: '#22c55e', shadowColor: '#22c55e' },
  buttonDisabled: { backgroundColor: 'rgba(255,255,255,0.08)', elevation: 0, shadowOpacity: 0 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: 'bold', letterSpacing: 0.3 },
  switchLink: { marginTop: 18, alignItems: 'center', paddingBottom: 20 },
  switchText: { fontSize: 14, color: 'rgba(255,255,255,0.3)' },
  switchTextBold: { color: '#60a5fa', fontWeight: '700' },
});
