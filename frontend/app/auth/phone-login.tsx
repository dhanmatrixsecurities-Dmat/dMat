import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, SafeAreaView, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '@/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export default function PhoneLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Name setup modal
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  const handleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      const uid = result.user.uid;

      // Check if name is already set in Firestore
      const userDoc = await getDoc(doc(db, 'users', uid));
      const userData = userDoc.data();

      if (!userData?.name || userData.name.trim() === '') {
        // First time login — ask for name
        setCurrentUserId(uid);
        setShowNameModal(true);
        setLoading(false);
      } else {
        // Name exists — go straight in
        router.replace('/(tabs)/active-trades');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Login failed');
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) {
      Alert.alert('Please enter your name');
      return;
    }
    try {
      setSavingName(true);
      await updateDoc(doc(db, 'users', currentUserId), {
        name: nameInput.trim(),
      });
      setShowNameModal(false);
      router.replace('/(tabs)/active-trades');
    } catch (error: any) {
      Alert.alert('Error', 'Could not save name. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <Ionicons name="phone-portrait" size={80} color={Colors.primary} />
            <Text style={styles.title}>DhanMatrix</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading || !email || !password}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={Colors.secondary} />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── One-time Name Setup Modal ── */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>

            {/* Avatar preview */}
            <View style={styles.avatarPreview}>
              <Text style={styles.avatarPreviewText}>
                {nameInput.trim().length > 0
                  ? nameInput.trim().split(' ').length >= 2
                    ? (nameInput.trim().split(' ')[0][0] + nameInput.trim().split(' ')[1][0]).toUpperCase()
                    : nameInput.trim().substring(0, 2).toUpperCase()
                  : 'DM'}
              </Text>
            </View>

            <Text style={styles.modalTitle}>Welcome to DhanMatrix! 👋</Text>
            <Text style={styles.modalSub}>
              Please enter your name to set up your profile.{'\n'}This is a one-time step.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.textSecondary}
              value={nameInput}
              onChangeText={setNameInput}
              autoCapitalize="words"
              autoFocus
            />

            <TouchableOpacity
              style={[styles.modalBtn, (!nameInput.trim() || savingName) && styles.buttonDisabled]}
              onPress={handleSaveName}
              disabled={!nameInput.trim() || savingName}
              activeOpacity={0.85}
            >
              {savingName ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalBtnText}>Save & Continue →</Text>
              )}
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 48 },
  title: { fontSize: 32, fontWeight: 'bold', color: Colors.primary, marginTop: 16 },
  subtitle: { fontSize: 16, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' },
  formContainer: { width: '100%' },
  inputContainer: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  input: {
    backgroundColor: Colors.cardBackground, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 16,
    fontSize: 18, color: Colors.text,
  },
  button: {
    backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', elevation: 4,
  },
  buttonDisabled: { backgroundColor: Colors.border, elevation: 0 },
  buttonText: { color: Colors.secondary, fontSize: 18, fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', alignItems: 'center' },
  avatarPreview: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  avatarPreviewText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e3a5f', marginBottom: 8, textAlign: 'center' },
  modalSub: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalInput: {
    width: '100%', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    color: '#1e3a5f', backgroundColor: '#f8fafc', marginBottom: 16,
  },
  modalBtn: {
    width: '100%', backgroundColor: Colors.primary,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
