import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

type FeedbackType = 'complaint' | 'suggestion';

interface Props {
  visible: boolean;
  onClose: () => void;
  userName: string;
  userMobile: string;
  userEmail: string;
}

export default function FeedbackModal({ visible, onClose, userName, userMobile, userEmail }: Props) {
  const [type, setType] = useState<FeedbackType>('complaint');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleClose = () => {
    setMessage('');
    setType('complaint');
    setSubmitted(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Empty message', 'Please write your complaint or suggestion before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        type,
        message: message.trim(),
        userName: userName || 'Unknown',
        userMobile: userMobile || '',
        userEmail: userEmail || '',
        createdAt: serverTimestamp(),
        status: 'unread',
      });
      setSubmitted(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {!submitted ? (
            <>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>
                    {type === 'complaint' ? 'Raise a Complaint' : 'Give a Suggestion'}
                  </Text>
                  <Text style={styles.subtitle}>We'll review and revert soon</Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Type toggle pills */}
              <View style={styles.pillRow}>
                <TouchableOpacity
                  style={[styles.pill, type === 'complaint' && styles.pillComplaintActive]}
                  onPress={() => setType('complaint')}
                >
                  <Ionicons
                    name="alert-circle"
                    size={14}
                    color={type === 'complaint' ? '#C62828' : Colors.textSecondary}
                  />
                  <Text style={[styles.pillText, type === 'complaint' && styles.pillComplaintText]}>
                    Complaint
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pill, type === 'suggestion' && styles.pillSuggestActive]}
                  onPress={() => setType('suggestion')}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={type === 'suggestion' ? '#2E7D32' : Colors.textSecondary}
                  />
                  <Text style={[styles.pillText, type === 'suggestion' && styles.pillSuggestText]}>
                    Suggestion
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Text input */}
              <TextInput
                style={styles.input}
                placeholder={
                  type === 'complaint'
                    ? 'Describe the issue you faced...'
                    : 'Share your idea or suggestion...'
                }
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={4}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
              />

              {/* Auto-filled user info */}
              <View style={styles.userInfoBox}>
                <Text style={styles.userInfoLabel}>Submitting as:</Text>
                <Text style={styles.userInfoValue}>
                  {userName}  ·  {userMobile}  ·  {userEmail}
                </Text>
              </View>

              {/* Submit button */}
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitText}>Submit</Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            /* Success state */
            <View style={styles.successContainer}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={32} color={Colors.success} />
              </View>
              <Text style={styles.successTitle}>Thank You!</Text>
              <Text style={styles.successMessage}>
                Your {type} has been received.{'\n'}Our team will review it and revert to you soon.
              </Text>
              <TouchableOpacity style={styles.submitBtn} onPress={handleClose} activeOpacity={0.85}>
                <Text style={styles.submitText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pillComplaintActive: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF9A9A',
  },
  pillComplaintText: {
    color: '#C62828',
  },
  pillSuggestActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  pillSuggestText: {
    color: '#2E7D32',
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    height: 100,
    marginTop: 12,
    backgroundColor: Colors.background,
  },
  userInfoBox: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  userInfoLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  userInfoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 3,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
});
