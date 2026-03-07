import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, SafeAreaView, Animated, Image,
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

export default function PhoneLogin() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const dotOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(dotOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

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
      router.replace('/(tabs)/active-trades');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
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
      const uid = userCred.user.uid;
      await sendEmailVerification(userCred.user);
      const cleanMobile = '+91' + mobile.replace(/\D/g, '').replace(/^(91|0)/, '');
      await setDoc(doc(db, 'users', uid), {
        name: name.trim(), mobile: cleanMobile,
        email: regEmail.trim().toLowerCase(), status: 'FREE',
        subscriptionEndDate: null, createdAt: serverTimestamp(),
      });
      await auth.signOut();
      Alert.alert('Verify Your Email 📧', `Verification link sent to ${regEmail.trim()}.`, [{
        text: 'OK', onPress: () => {
          setIsRegister(false);
          setName(''); setMobile(''); setRegEmail(''); setRegPassword(''); setConfirmPassword('');
        }
      }]);
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

  // LOGIN SCREEN
  if (!isRegister) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <View style={styles.loginLayout}>

            {/* ALL CONTENT grouped together at top */}
            <View>
              {/* Brand */}
              <View style={styles.brandRow}>
                <Image source={require('../../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
                <Text style={styles.brandName}>DhanMatrix</Text>
              </View>
              {/* Headline - "Your" white, "Trust" cyan-blue like poster */}
              <Text style={styles.h1}>Investing</Text>
              <View style={styles.h2Row}>
                <Text style={styles.h2White}>Your </Text>
                <Text style={styles.h2Cyan}>Trust</Text>
                <Animated.View style={[styles.dot, { opacity: dotOpacity }]} />
              </View>
              <Text style={styles.sub}>Smart market insights, every day.</Text>
              {/* Toggle */}
              <View style={styles.toggleRow}>
                <TouchableOpacity style={[styles.toggleBtn, styles.tBtnBlue]} activeOpacity={0.8}>
                  <Text style={styles.toggleTextOn}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toggleBtn} onPress={() => setIsRegister(true)} activeOpacity={0.8}>
                  <Text style={styles.toggleText}>Register</Text>
                </TouchableOpacity>
              </View>
              {/* Fields */}
              <View style={styles.field}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput style={styles.input} placeholder="Enter your email" placeholderTextColor="rgba(255,255,255,0.25)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passRow}>
                  <TextInput style={[styles.input, { flex: 1, paddingRight: 48 }]} placeholder="Enter your password" placeholderTextColor="rgba(255,255,255,0.25)" value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eye}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={22} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={[styles.btn, (loading || !email || !password) && styles.btnOff]} onPress={handleLogin} disabled={loading || !email || !password} activeOpacity={0.8}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In →</Text>}
              </TouchableOpacity>
            </View>

            {/* Footer pinned to bottom */}
            <TouchableOpacity onPress={() => setIsRegister(true)} style={styles.footer}>
              <Text style={styles.footerText}>New user? <Text style={styles.footerLink}>Register here</Text></Text>
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // REGISTER SCREEN
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Brand */}
          <View style={styles.brandRow}>
            <Image source={require('../../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brandName}>DhanMatrix</Text>
          </View>
          {/* Headline - no dot on register */}
          <Text style={styles.h1}>Create Your</Text>
          <Text style={[styles.h2Cyan, { lineHeight: 44, marginBottom: 10 }]}>Account</Text>
          <Text style={styles.sub}>Join DhanMatrix and stay ahead of the market.</Text>
          {/* Toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity style={styles.toggleBtn} onPress={() => setIsRegister(false)} activeOpacity={0.8}>
              <Text style={styles.toggleText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, styles.tBtnGreen]} activeOpacity={0.8}>
              <Text style={styles.toggleTextOn}>Register</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} placeholder="Enter your full name" placeholderTextColor="rgba(255,255,255,0.25)" value={name} onChangeText={setName} autoCapitalize="words" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.mobileRow}>
              <View style={styles.cc}><Text style={styles.ccText}>🇮🇳 +91</Text></View>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="9XXXXXXXXX" placeholderTextColor="rgba(255,255,255,0.25)" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" maxLength={10} />
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput style={styles.input} placeholder="Enter your email" placeholderTextColor="rgba(255,255,255,0.25)" value={regEmail} onChangeText={setRegEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passRow}>
              <TextInput style={[styles.input, { flex: 1, paddingRight: 48 }]} placeholder="Min. 6 characters" placeholderTextColor="rgba(255,255,255,0.25)" value={regPassword} onChangeText={setRegPassword} secureTextEntry={!showPass} />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eye}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={22} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passRow}>
              <TextInput style={[styles.input, { flex: 1, paddingRight: 48 }]} placeholder="Re-enter password" placeholderTextColor="rgba(255,255,255,0.25)" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPass} />
              <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)} style={styles.eye}>
                <Ionicons name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'} size={22} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={16} color="#3b82f6" />
            <Text style={styles.infoText}>A verification link will be sent to your email after registration.</Text>
          </View>
          <TouchableOpacity style={[styles.btn, styles.btnGreen, loading && styles.btnOff]} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account →</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsRegister(false)} style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? <Text style={styles.footerLink}>Sign In</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060c1a' },
  keyboardView: { flex: 1 },
  loginLayout: { flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 30, justifyContent: 'space-between' },
  scroll: { padding: 24, paddingTop: 20, paddingBottom: 30 },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  logo: { width: 38, height: 38, borderRadius: 9 },
  brandName: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },

  h1: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -0.5, lineHeight: 44 },
  h2Row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  h2White: { fontSize: 36, fontWeight: '900', color: '#ffffff', letterSpacing: -0.5, lineHeight: 44 },
  h2Cyan: { fontSize: 36, fontWeight: '900', color: '#06b6d4', letterSpacing: -0.5 },
  dot: { width: 9, height: 9, backgroundColor: '#22c55e', marginLeft: 3, marginBottom: 8 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 },

  toggleRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tBtnBlue: { backgroundColor: '#3b82f6', elevation: 4, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  tBtnGreen: { backgroundColor: '#22c55e', elevation: 4, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  toggleText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.35)' },
  toggleTextOn: { fontSize: 15, fontWeight: '600', color: '#fff' },

  field: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 13, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)', paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: '#fff' },
  passRow: { position: 'relative' },
  eye: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  mobileRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cc: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 13, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)', paddingHorizontal: 12, paddingVertical: 13 },
  ccText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  infoNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 10, padding: 10, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  infoText: { flex: 1, fontSize: 12, color: '#93c5fd', fontWeight: '600' },

  btn: { backgroundColor: '#3b82f6', paddingVertical: 15, borderRadius: 13, alignItems: 'center', elevation: 6, marginTop: 4, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12 },
  btnGreen: { backgroundColor: '#22c55e', shadowColor: '#22c55e' },
  btnOff: { backgroundColor: 'rgba(255,255,255,0.08)', elevation: 0, shadowOpacity: 0 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: 'bold', letterSpacing: 0.3 },

  footer: { alignItems: 'center', paddingTop: 8 },
  footerText: { fontSize: 14, color: 'rgba(255,255,255,0.3)' },
  footerLink: { color: '#60a5fa', fontWeight: '700' },
});
