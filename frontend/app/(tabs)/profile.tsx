import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, SafeAreaView, Linking, RefreshControl, Animated, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import FeedbackModal from '../FeedbackModal';

export default function Profile() {
  const { user, userData, signOut, refreshUserData } = useAuth();
  const router  = useRouter();
  const theme   = useTheme();

  const [refreshing,       setRefreshing]       = useState(false);
  const [feedbackVisible,  setFeedbackVisible]  = useState(false);
  const [feedbackType,     setFeedbackType]     = useState<'complaint' | 'suggestion'>('complaint');

  const scaleAnim   = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim,  { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUserData();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => { await signOut(); router.replace('/auth/disclaimer'); },
      },
    ], { cancelable: true });
  };

  const getInitials = () => {
    const name = userData?.name?.trim();
    if (name && name.length > 0) {
      const parts = name.split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    const mobile = userData?.mobile || '';
    return mobile.length >= 2 ? mobile.slice(-2) : 'DM';
  };

  const getSubscriptionInfo = () => {
    if (userData?.status !== 'ACTIVE') return null;
    if (!userData?.subscriptionEndDate) return null;
    const endDate = new Date(userData.subscriptionEndDate);
    const today   = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    const diffDays      = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const formattedDate = endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return { daysLeft: diffDays, endDateFormatted: formattedDate };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':  return theme.success;
      case 'FREE':    return theme.warning;
      case 'BLOCKED': return theme.error;
      default:        return theme.textSecondary;
    }
  };

  const getStatusIcon = (status: string): any => {
    switch (status) {
      case 'ACTIVE':  return 'checkmark-circle';
      case 'FREE':    return 'star';
      case 'BLOCKED': return 'lock-closed';
      default:        return 'help-circle';
    }
  };

  const handleContactSupport = () => {
    const message = encodeURIComponent('Hi, I need support for my DhanMatrix account.');
    Alert.alert('Contact Support', 'Choose a number to contact us on WhatsApp', [
      { text: '8383898886', onPress: () => Linking.openURL(`whatsapp://send?phone=918383898886&text=${message}`).catch(() => Alert.alert('WhatsApp not installed')) },
      { text: '9258303916', onPress: () => Linking.openURL(`whatsapp://send?phone=919258303916&text=${message}`).catch(() => Alert.alert('WhatsApp not installed')) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const mobileDisplay      = userData?.mobile || user?.phoneNumber || '';
  const emailDisplay       = userData?.email  || user?.email       || '';
  const subscriptionInfo   = getSubscriptionInfo();

  // Dynamic colors based on theme
  const bg        = theme.background;
  const card      = theme.cardBackground;
  const txt       = theme.text;
  const txtSec    = theme.textSecondary;
  const brd       = theme.border;
  const divider   = theme.divider;
  const primary   = theme.primary;

  // Semantic card bg in dark mode
  const warnBg    = theme.isDark ? 'rgba(245,158,11,0.15)'  : '#FFF3E0';
  const successBg = theme.isDark ? 'rgba(34,168,90,0.15)'   : '#E8F5E9';
  const errorBg   = theme.isDark ? 'rgba(224,48,48,0.15)'   : '#FFEBEE';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primary]} tintColor={primary} />}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
            <View style={[styles.avatarContainer, { backgroundColor: getStatusColor(userData?.status || 'FREE') }]}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
          </Animated.View>

          {userData?.name ? <Text style={[styles.userName, { color: txt }]}>{userData.name}</Text> : null}

          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={14} color={txtSec} />
            <Text style={[styles.contactText, { color: txtSec }]}>{mobileDisplay || 'Mobile not available'}</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={14} color={txtSec} />
            <Text style={[styles.contactText, { color: txtSec }]}>{emailDisplay || 'Email not available'}</Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(userData?.status || 'FREE') }]}>
            <Ionicons name={getStatusIcon(userData?.status || 'FREE')} size={16} color="#fff" />
            <Text style={styles.statusText}>{userData?.status || 'FREE'} MEMBER</Text>
          </View>
        </View>

        {/* MEMBERSHIP */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: txt }]}>Membership</Text>
          {userData?.status === 'FREE' && (
            <View style={[styles.infoCard, { backgroundColor: warnBg }]}>
              <Ionicons name="information-circle" size={24} color={theme.warning} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: txt }]}>Free Membership</Text>
                <Text style={[styles.infoText, { color: txtSec }]}>You can view closed trades only. Contact support to upgrade and access live trade recommendations.</Text>
              </View>
            </View>
          )}
          {userData?.status === 'ACTIVE' && (
            <View style={[styles.infoCard, { backgroundColor: successBg }]}>
              <Ionicons name="checkmark-circle" size={24} color={theme.success} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: txt }]}>Active Membership</Text>
                <Text style={[styles.infoText, { color: txtSec }]}>You have full access to live trade recommendations and notifications.</Text>
                {subscriptionInfo && (
                  <View style={styles.subscriptionDetails}>
                    <View style={styles.subscriptionRow}>
                      <Ionicons name="calendar-outline" size={16} color={theme.success} />
                      <Text style={[styles.subscriptionText, { color: txtSec }]}>Expires: {subscriptionInfo.endDateFormatted}</Text>
                    </View>
                    <View style={styles.subscriptionRow}>
                      <Ionicons name="time-outline" size={16} color={subscriptionInfo.daysLeft <= 7 ? theme.error : subscriptionInfo.daysLeft <= 15 ? theme.warning : theme.success} />
                      <Text style={[styles.subscriptionText, { color: subscriptionInfo.daysLeft <= 7 ? theme.error : subscriptionInfo.daysLeft <= 15 ? theme.warning : theme.success, fontWeight: 'bold' }]}>
                        {subscriptionInfo.daysLeft > 0 ? `${subscriptionInfo.daysLeft} days remaining` : 'Subscription expired'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
          {userData?.status === 'BLOCKED' && (
            <View style={[styles.infoCard, { backgroundColor: errorBg }]}>
              <Ionicons name="lock-closed" size={24} color={theme.error} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: txt }]}>Account Blocked</Text>
                <Text style={[styles.infoText, { color: txtSec }]}>Your account has been blocked. Please contact support for assistance.</Text>
              </View>
            </View>
          )}
        </View>

        {/* FEATURES */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: txt }]}>Features</Text>
          <View style={[styles.featuresList, { backgroundColor: card, borderColor: brd }]}>
            <View style={[styles.featureItem, { borderBottomColor: divider }]}>
              <Ionicons name="checkmark-done" size={20} color={theme.success} />
              <Text style={[styles.featureText, { color: txt }]}>Closed Trades History</Text>
            </View>
            <View style={[styles.featureItem, { borderBottomColor: divider }]}>
              <Ionicons name="pulse" size={20} color={userData?.status === 'ACTIVE' ? theme.success : txtSec} />
              <Text style={[styles.featureText, { color: userData?.status !== 'ACTIVE' ? txtSec : txt }]}>Live Active Trades</Text>
              {userData?.status !== 'ACTIVE' && <Text style={styles.premiumLabel}>PREMIUM</Text>}
            </View>
            <View style={[styles.featureItem, { borderBottomWidth: 0 }]}>
              <Ionicons name="notifications" size={20} color={userData?.status === 'ACTIVE' ? theme.success : txtSec} />
              <Text style={[styles.featureText, { color: userData?.status !== 'ACTIVE' ? txtSec : txt }]}>Push Notifications</Text>
              {userData?.status !== 'ACTIVE' && <Text style={styles.premiumLabel}>PREMIUM</Text>}
            </View>
          </View>
        </View>

        {/* PREFERENCES — Dark Mode Toggle */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: txt }]}>Preferences</Text>
          <View style={[styles.menuItem, { backgroundColor: card }]}>
            <Ionicons name={theme.isDark ? 'moon' : 'moon-outline'} size={24} color={primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.menuText, { color: txt, marginLeft: 0 }]}>Dark Blue Mode</Text>
              <Text style={{ fontSize: 12, color: txtSec, marginTop: 1 }}>
                {theme.isDark ? 'Dark theme active' : 'Light theme active'}
              </Text>
            </View>
            <Switch
              value={theme.isDark}
              onValueChange={theme.toggleTheme}
              trackColor={{ false: brd, true: primary }}
              thumbColor="#fff"
              ios_backgroundColor={brd}
            />
          </View>
        </View>

        {/* FEEDBACK */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: txt }]}>Feedback</Text>
          <View style={styles.feedbackRow}>
            <TouchableOpacity
              style={[styles.feedbackCard, { backgroundColor: card, borderColor: brd }]}
              activeOpacity={0.75}
              onPress={() => { setFeedbackType('complaint'); setFeedbackVisible(true); }}
            >
              <View style={[styles.feedbackIconCircle, { backgroundColor: errorBg }]}>
                <Ionicons name="alert-circle" size={22} color={theme.error} />
              </View>
              <Text style={[styles.feedbackCardTitle, { color: txt }]}>Raise a{'\n'}Complaint</Text>
              <Text style={[styles.feedbackCardSub, { color: txtSec }]}>Report an issue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.feedbackCard, { backgroundColor: card, borderColor: brd }]}
              activeOpacity={0.75}
              onPress={() => { setFeedbackType('suggestion'); setFeedbackVisible(true); }}
            >
              <View style={[styles.feedbackIconCircle, { backgroundColor: successBg }]}>
                <Ionicons name="bulb" size={22} color={theme.accent} />
              </View>
              <Text style={[styles.feedbackCardTitle, { color: txt }]}>Give a{'\n'}Suggestion</Text>
              <Text style={[styles.feedbackCardSub, { color: txtSec }]}>Share feedback</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SUPPORT */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: txt }]}>Support</Text>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: card }]} onPress={handleContactSupport}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            <Text style={[styles.menuText, { color: txt }]}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={24} color={txtSec} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: card }]} onPress={() => Linking.openURL('https://dhanmatrix.com/privacy-policy')}>
            <Ionicons name="shield-checkmark-outline" size={24} color={primary} />
            <Text style={[styles.menuText, { color: txt }]}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={24} color={txtSec} />
          </TouchableOpacity>
        </View>

        {/* SIGN OUT */}
        <TouchableOpacity style={[styles.signOutButton, { backgroundColor: card, borderColor: theme.error }]} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={24} color={theme.error} />
          <Text style={[styles.signOutText, { color: theme.error }]}>Sign Out</Text>
        </TouchableOpacity>

        {/* FOOTER */}
        <View style={[styles.footer, { borderTopColor: brd }]}>
          <Text style={[styles.footerText,    { color: txtSec }]}>DhanMatrix v1.0</Text>
          <Text style={[styles.footerSubtext, { color: txtSec }]}>Made for educational purposes only</Text>
        </View>
      </ScrollView>

      <FeedbackModal
        visible={feedbackVisible}
        onClose={() => setFeedbackVisible(false)}
        initialType={feedbackType}
        userName={userData?.name || ''}
        userMobile={mobileDisplay}
        userEmail={emailDisplay}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1 },
  scrollContent:       { padding: 24 },
  header:              { alignItems: 'center', marginBottom: 32 },
  avatarContainer:     { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:          { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  userName:            { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  contactRow:          { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  contactText:         { fontSize: 14 },
  statusBadge:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 10 },
  statusText:          { fontSize: 13, fontWeight: 'bold', color: '#fff', marginLeft: 6 },
  section:             { marginBottom: 24 },
  sectionTitle:        { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  infoCard:            { flexDirection: 'row', padding: 16, borderRadius: 12 },
  infoContent:         { flex: 1, marginLeft: 12 },
  infoTitle:           { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  infoText:            { fontSize: 14, lineHeight: 20 },
  subscriptionDetails: { marginTop: 10, gap: 6 },
  subscriptionRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subscriptionText:    { fontSize: 14 },
  featuresList:        { borderRadius: 12, padding: 16, borderWidth: 1 },
  featureItem:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  featureText:         { flex: 1, fontSize: 16, marginLeft: 12 },
  premiumLabel:        { fontSize: 10, fontWeight: 'bold', color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  feedbackRow:         { flexDirection: 'row', gap: 12 },
  feedbackCard:        { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1 },
  feedbackIconCircle:  { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  feedbackCardTitle:   { fontSize: 13, fontWeight: 'bold', textAlign: 'center', lineHeight: 18 },
  feedbackCardSub:     { fontSize: 11, textAlign: 'center' },
  menuItem:            { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8 },
  menuText:            { flex: 1, fontSize: 16, marginLeft: 12 },
  signOutButton:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginTop: 16 },
  signOutText:         { fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  footer:              { alignItems: 'center', marginTop: 32, paddingTop: 24, borderTopWidth: 1 },
  footerText:          { fontSize: 14 },
  footerSubtext:       { fontSize: 12, marginTop: 4 },
});
