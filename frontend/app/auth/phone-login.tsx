import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export default function PhoneLogin() {
  const router = useRouter();
  const { signInWithPhone } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
  const recaptchaContainer = useRef<any>(null);

  useEffect(() => {
    // Initialize reCAPTCHA for web
    if (Platform.OS === 'web' && !recaptchaContainer.current) {
      try {
        recaptchaContainer.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA resolved');
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
          }
        });
      } catch (error) {
        console.error('reCAPTCHA initialization error:', error);
      }
    }

    return () => {
      if (recaptchaContainer.current) {
        try {
          recaptchaContainer.current.clear();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const sendVerificationCode = async () => {
    try {
      setLoading(true);
      
      // Format phone number to E.164 format
      const formattedPhone = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `+91${phoneNumber}`;

      if (Platform.OS === 'web') {
        // Web flow with reCAPTCHA
        if (!recaptchaContainer.current) {
          recaptchaContainer.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible'
          });
        }

        const confirmation = await signInWithPhoneNumber(
          auth,
          formattedPhone,
          recaptchaContainer.current
        );
        
        setConfirmationResult(confirmation);
        setVerificationId('web'); // Marker for web flow
        Alert.alert('Success', 'Verification code sent to your phone');
      } else {
        // Mobile flow - For now, show message that phone auth works on web
        Alert.alert(
          'Phone Authentication',
          'Phone authentication is best supported on web. Please use the web version or enable test mode in Firebase Console.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Phone verification error:', error);
      Alert.alert('Error', error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const confirmVerificationCode = async () => {
    try {
      setLoading(true);
      
      if (Platform.OS === 'web' && confirmationResult) {
        // Confirm the code on web
        await confirmationResult.confirm(verificationCode);
        router.replace('/(tabs)/active-trades');
      } else {
        Alert.alert('Error', 'Invalid verification flow');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      Alert.alert('Error', error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Hidden reCAPTCHA container for web */}
      {Platform.OS === 'web' && <div id="recaptcha-container"></div>}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Ionicons name="phone-portrait" size={80} color={Colors.primary} />
            <Text style={styles.title}>Stock Advisory</Text>
            <Text style={styles.subtitle}>Enter your phone number to continue</Text>
          </View>

          {!verificationId ? (
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <View style={styles.phoneInputWrapper}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter 10-digit mobile number"
                    placeholderTextColor={Colors.textSecondary}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={10}
                    autoFocus
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={sendVerificationCode}
                disabled={loading || phoneNumber.length !== 10}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.secondary} />
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>

              {Platform.OS !== 'web' && (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={20} color={Colors.primary} />
                  <Text style={styles.infoText}>
                    Phone authentication works best on web. For testing, use test numbers configured in Firebase.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.formContainer}>
              <View style={styles.successMessage}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <Text style={styles.successText}>
                  OTP sent to +91 {phoneNumber}
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Enter OTP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6-digit OTP"
                  placeholderTextColor={Colors.textSecondary}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={confirmVerificationCode}
                disabled={loading || verificationCode.length !== 6}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.secondary} />
                ) : (
                  <Text style={styles.buttonText}>Verify & Continue</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={() => {
                  setVerificationId('');
                  setVerificationCode('');
                  setConfirmationResult(null);
                }}
                disabled={loading}
              >
                <Text style={styles.resendText}>Change Phone Number</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to receive trade alerts and notifications
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  countryCode: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: Colors.secondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  successText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.success,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: Colors.primary,
    lineHeight: 18,
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});