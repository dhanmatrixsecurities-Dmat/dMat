import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export default function Disclaimer() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

  const handleContinue = () => {
    if (accepted) {
      router.push('/auth/phone-login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="warning" size={80} color={Colors.warning} />
        </View>

        <Text style={styles.title}>Important Disclaimer</Text>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            This app is for <Text style={styles.bold}>educational purposes only</Text> and does not provide investment advice.
          </Text>

          <Text style={styles.disclaimerText}>
            {`\n`}• The information provided is for general informational purposes only.
          </Text>

          <Text style={styles.disclaimerText}>
            {`\n`}• Stock trading involves substantial risk of loss and is not suitable for everyone.
          </Text>

          <Text style={styles.disclaimerText}>
            {`\n`}• Past performance is not indicative of future results.
          </Text>

          <Text style={styles.disclaimerText}>
            {`\n`}• You should consult a licensed financial advisor before making any investment decisions.
          </Text>

          <Text style={styles.disclaimerText}>
            {`\n`}• We are not responsible for any financial losses incurred based on information provided in this app.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAccepted(!accepted)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && (
              <Ionicons name="checkmark" size={20} color={Colors.secondary} />
            )}
          </View>
          <Text style={styles.checkboxText}>
            I have read and understand the disclaimer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueButton, !accepted && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!accepted}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  disclaimerBox: {
    backgroundColor: Colors.cardBackground,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disclaimerText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkboxText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  continueButton: {
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
  continueButtonDisabled: {
    backgroundColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: Colors.secondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});