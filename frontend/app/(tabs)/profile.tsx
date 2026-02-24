import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Linking,
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
        { text: 'Cancel', style: 'cancel' },
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

  // Generate initials from name or phone
  const getInitials = () => {
    const name = userData?.name?.trim();
    if (name && name.length > 0) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    // Fallback to last 2 digits of phone
    const phone = userData?.phone || user?.phoneNumber || '';
    return phone.length >= 2 ? phone.slice(-2) : 'DM';
  };

  // Get first name for greeting
  const getFirstName = () => {
    const name = userData?.name?.trim();
    if (name && name.length > 0) {
      return name.split(' ')[0];
    }
    return null;
  };

  // Calculate days remaining for subscription
  const getSubscriptionInfo = () => {
    if (userData?.status !== 'ACTIVE') return null;
    if (!userData?.subscriptionEndDate) return null;

    const endDate = new Date(userData.subscriptionEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const formattedDate = endDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return { daysLeft: diffDays, endDateFormatted: formattedDate };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return Colors.success;
      case 'FREE': return Colors.warning;
      case 'BLOCKED': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'checkmark-circle';
      case 'FREE': return 'star';
      case 'BLOCKED': return 'lock-closed';
      default: return 'help-circle';
    }
  };

  const subscriptionInfo = getSubscriptionInfo();
  const firstName = getFirstName();

  const handleContactSupport = () => {
    const message = encodeURIComponent('Hi, I need support for my DhanMatrix account.');
    Alert.alert(
      'Contact Support',
      'Choose a number to contact us on WhatsApp',
      [
        {
          text: '8383898886',
          onPress: () => {
            Linking.openURL(`whatsapp://send?phone=918383898886&text=${message}`).catch(() => {
              Alert.alert('WhatsApp not installed', 'Please contact us at support@dhanmatrix.com');
            });
          },
        },
        {
          text: '9258303916',
          onPress: () => {
            Linking.openURL(`whatsapp://send?phone=919258303916&text=${message}`).catch(() => {
              Alert.alert('WhatsApp not installed', 'Please contact us at support@dhanmatrix.com');
            });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    // Replace with your actual privacy policy URL
    Linking.openURL('https://dhanmatrix.com/privacy-policy');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* HEADER */}
        <View style={styles.header}>
          {/* Initials Avatar */}
          <View style={[styles.avatarContainer, { backgroundColor: getStatusColor(userData?.status || 'FREE') }]}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>

          {/* Name */}
          {firstName ? (
            <Text style={styles.userName}>
              {userData?.name || ''}
            </Text>
          ) : null}

          {/* Phone */}
          <Text style={styles.phoneNumber}>
            {userData?.phone || user?.phoneNumber || 'Not Available'}
          </Text>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(userData?.status || 'FREE') }]}>
            <Ionicons name={getStatusIcon(userData?.status || 'FREE')} size={16} color="#fff" />
            <Text style={styles.statusText}>{userData?.status || 'FREE'} MEMBER</Text>
          </View>
        </View>

        {/* SUBSCRIPTION CARD */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membership</Text>

          {userData?.status === 'FREE' && (
            <View style={[styles.infoCard, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="information-circle" size={24} color={Colors.warning} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Free Membership</Text>
                <Text style={styles.infoText}>
                  You can view closed trades only. Contact support to upgrade and access live trade recommendations.
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
                  You have full access to live trade recommendations and notifications.
                </Text>
                {subscriptionInfo && (
                  <View style={styles.subscriptionDetails}>
                    <View style={styles.subscriptionRow}>
                      <Ionicons name="calendar-outline" size={16} color={Colors.success} />
                      <Text style={styles.subscriptionText}>
                        Expires: {subscriptionInfo.endDateFormatted}
                      </Text>
                    </View>
                    <View style={styles.subscriptionRow}>
                      <Ionicons name="time-outline" size={16} color={
                        subscriptionInfo.daysLeft <= 7 ? Colors.error :
                        subscriptionInfo.daysLeft <= 15 ? Colors.warning : Colors.success
                      } />
                      <Text style={[styles.subscriptionText, {
                        color: subscriptionInfo.daysLeft <= 7 ? Colors.error :
                               subscriptionInfo.daysLeft <= 15 ? Colors.warning : Colors.success,
                        fontWeight: 'bold',
                      }]}>
                        {subscriptionInfo.daysLeft > 0
                          ? `${subscriptionInfo.daysLeft} days remaining`
                          : 'Subscription expired'}
                      </Text>
                    </View>
                  </View>
                )}
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

        {/* FEATURES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-done" size={20} color={Colors.success} />
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
            <View style={[styles.featureItem, { borderBottomWidth: 0 }]}>
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

        {/* SUPPORT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleContactSupport}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            <Text style={styles.menuText}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyPolicy}>
            <Ionicons name="shield-checkmark-outline" size={24} color={Colors.primary} />
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* SIGN OUT */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={24} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* FOOTER */}
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
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 15,
    color: Colors.textSecondary,
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
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
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
  subscriptionDetails: {
    marginTop: 10,
    gap: 6,
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subscriptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
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
