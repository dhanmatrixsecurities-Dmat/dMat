import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export default function Profile() {
  const { user, userData, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth/disclaimer');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return Colors.success;
      case 'FREE':
        return Colors.warning;
      case 'BLOCKED':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'checkmark-circle';
      case 'FREE':
        return 'star';
      case 'BLOCKED':
        return 'lock-closed';
      default:
        return 'help-circle';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={60} color={Colors.secondary} />
          </View>
          <Text style={styles.phoneNumber}>{user?.phoneNumber || 'Not Available'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(userData?.status || 'FREE') }]}>
            <Ionicons name={getStatusIcon(userData?.status || 'FREE')} size={16} color={Colors.secondary} />
            <Text style={styles.statusText}>{userData?.status || 'FREE'} MEMBER</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Status</Text>
          
          {userData?.status === 'FREE' && (
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color={Colors.warning} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Free Membership</Text>
                <Text style={styles.infoText}>
                  You can view closed trades. Upgrade to ACTIVE to access live trades and notifications.
                </Text>
              </View>
            </View>
          )}

          {userData?.status === 'ACTIVE' && (
            <View style={[styles.infoCard, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Active Membership</Text>
                <Text style={styles.infoText}>
                  You have full access to live trades and real-time notifications.
                </Text>
              </View>
            </View>
          )}

          {userData?.status === 'BLOCKED' && (
            <View style={[styles.infoCard, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="lock-closed" size={24} color={Colors.error} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Account Blocked</Text>
                <Text style={styles.infoText}>
                  Your account has been blocked. Please contact support for assistance.
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons 
                name="checkmark-done" 
                size={20} 
                color={Colors.success} 
              />
              <Text style={styles.featureText}>Closed Trades History</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons 
                name="pulse" 
                size={20} 
                color={userData?.status === 'ACTIVE' ? Colors.success : Colors.textSecondary} 
              />
              <Text style={[styles.featureText, userData?.status !== 'ACTIVE' && styles.disabledText]}>
                Live Active Trades
              </Text>
              {userData?.status !== 'ACTIVE' && (
                <Text style={styles.premiumLabel}>PREMIUM</Text>
              )}
            </View>
            <View style={styles.featureItem}>
              <Ionicons 
                name="notifications" 
                size={20} 
                color={userData?.status === 'ACTIVE' ? Colors.success : Colors.textSecondary} 
              />
              <Text style={[styles.featureText, userData?.status !== 'ACTIVE' && styles.disabledText]}>
                Push Notifications
              </Text>
              {userData?.status !== 'ACTIVE' && (
                <Text style={styles.premiumLabel}>PREMIUM</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color={Colors.primary} />
            <Text style={styles.menuText}>Help & FAQ</Text>
            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="mail-outline" size={24} color={Colors.primary} />
            <Text style={styles.menuText}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color={Colors.primary} />
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={24} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>DhanMatrix v1.0</Text>
          <Text style={styles.footerSubtext}>Made for educational purposes only</Text>
        </View>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  phoneNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.secondary,
    marginLeft: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  featuresList: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  disabledText: {
    color: Colors.textSecondary,
  },
  premiumLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.warning,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
    marginTop: 16,
  },
  signOutText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.error,
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footerSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
