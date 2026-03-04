import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '@/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

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
      await signInWithEmailAndPassword(auth, email.trim(), password);
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
    if (!validateMobile(mobile)) return Alert.alert('Error', 'Enter a valid 10-digit Indian mobile number');
    if (!regEmail.trim()) return Alert.alert('Error', 'Please enter your email');
    if (regPassword.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');
    if (regPassword !== confirmPassword) return Alert.alert('Error', 'Passwords do not match');

    try {
      setLoading(true);
      const userCred = await createUserWithEmailAndPassword(auth, regEmail.trim(), regPassword);
      const uid = userCred.user.uid;

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

      Alert.alert(
        'Registration Successful! 🎉',
        'Your account has been created. Contact admin to activate your subscription.',
        [{ text: 'OK', onPress: () => setIsRegister(false) }]
      );
      setName(''); setMobile(''); setRegEmail(''); setRegPassword(''); setConfirmPassword('');
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="phone-portrait" size={70} color={Colors.primary} />
            <Text style={styles.title}>DhanMatrix</Text>
            <Text style={styles.subtitle}>{isRegister ? 'Create your account' : 'Sign in to continue'}</Text>
          </View>

          {/* Toggle tabs */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, !isRegister && styles.toggleBtnActive]}
              onPress={() => setIsRegister(false)} activeOpacity={0.8}>
              <Text style={[styles.toggleText, !isRegister && styles.toggleTextActive]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, isRegister && styles.toggleBtnActive]}
              onPress={() => setIsRegister(true)} activeOpacity={0.8}>
              <Text style={[styles.toggleText, isRegister && styles.toggleTextActive]}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* ── LOGIN FORM ── */}
          {!isRegister && (
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={Colors.textSecondary}
                  value={email} onChangeText={setEmail}
                  keyboardType="email-address" autoCapitalize="none"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Enter your password"
                    placeholderTextColor={Colors.textSecondary}
                    value={password} onChangeText={setPassword}
                    secureTextEntry={!showPass}
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={22} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.button, (loading || !email || !password) && styles.buttonDisabled]}
                onPress={handleLogin} disabled={loading || !email || !password} activeOpacity={0.8}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
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
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={Colors.textSecondary}
                  value={name} onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.mobileRow}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.mobileInput]}
                    placeholder="9XXXXXXXXX"
                    placeholderTextColor={Colors.textSecondary}
                    value={mobile} onChangeText={setMobile}
                    keyboardType="phone-pad" maxLength={10}
                  />
                </View>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={Colors.textSecondary}
                  value={regEmail} onChangeText={setRegEmail}
                  keyboardType="email-address" autoCapitalize="none"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Min. 6 characters"
                    placeholderTextColor={Colors.textSecondary}
                    value={regPassword} onChangeText={setRegPassword}
                    secureTextEntry={!showPass}
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={22} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Re-enter password"
                    placeholderTextColor={Colors.textSecondary}
                    value={confirmPassword} onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPass}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)} style={styles.eyeBtn}>
                    <Ionicons name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'} size={22} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsRegister(false)} style={styles.switchLink}>
                <Text style={styles.switchText}>Already have an account? <Text style={styles.switchTextBold}>Login</Text></Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 50 },
  header: { alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 32, fontWeight: 'bold', color: Colors.primary, marginTop: 12 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  toggleRow: { flexDirection: 'row', backgroundColor: '#e8edf5', borderRadius: 12, padding: 4, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: Colors.primary, elevation: 2 },
  toggleText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  toggleTextActive: { color: '#fff' },
  formContainer: { width: '100%' },
  inputContainer: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 7 },
  input: {
    backgroundColor: Colors.cardBackground, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: Colors.text,
  },
  passRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { position: 'absolute', right: 14, padding: 4 },
  mobileRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countryCode: {
    backgroundColor: Colors.cardBackground, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 14,
  },
  countryCodeText: { fontSize: 15, fontWeight: '700', color: Colors.text },
  mobileInput: { flex: 1 },
  button: {
    backgroundColor: Colors.primary, paddingVertical: 15, borderRadius: 12,
    alignItems: 'center', elevation: 4, marginTop: 4,
  },
  buttonDisabled: { backgroundColor: Colors.border, elevation: 0 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  switchLink: { marginTop: 18, alignItems: 'center' },
  switchText: { fontSize: 14, color: Colors.textSecondary },
  switchTextBold: { color: Colors.primary, fontWeight: '700' },
});
