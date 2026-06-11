import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://your-vercel-app.vercel.app';
const HDR = '#0B1A2E';

interface StockRow { id: number; name: string; qty: string; }

export default function PortfolioEntryScreen() {
  const router = useRouter();
  const theme  = useTheme();
  const [rows, setRows] = useState<StockRow[]>([
    { id: 1, name: '', qty: '' },
    { id: 2, name: '', qty: '' },
  ]);
  const [loading, setLoading] = useState(false);
  let nextId = useRef(3);

  const addRow = () => {
    setRows(prev => [...prev, { id: nextId.current++, name: '', qty: '' }]);
  };

  const removeRow = (id: number) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: number, field: 'name' | 'qty', value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const validRows = rows.filter(r => r.name.trim() && r.qty.trim());

  const handleAnalyze = async () => {
    if (validRows.length === 0) {
      Alert.alert('Add stocks', 'Please enter at least one stock name and quantity.');
      return;
    }
    setLoading(true);
    try {
      const payload = validRows.map(r => ({ name: r.name.trim(), qty: r.qty.trim() }));
      const res  = await fetch(`${BACKEND_URL}/api/kooky-portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings: payload }),
      });
      const data = await res.json();
      // Navigate to Kooky screen passing the analysis data
      router.push({ pathname: '/(tabs)/kooky', params: { portfolioAnalysis: JSON.stringify(data) } });
    } catch {
      Alert.alert('Error', 'Could not connect to Kooky. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: HDR }} edges={['top']}>
      <StatusBar style="light" backgroundColor={HDR} translucent={false} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#4A9EFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Portfolio analysis</Text>
          <Text style={s.headerSub}>Enter your holdings below</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Hint */}
          <View style={[s.hintCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <Ionicons name="information-circle-outline" size={16} color="#2979FF" />
            <Text style={[s.hintText, { color: '#4A9EFF' }]}>
              Enter stock name and quantity or value. Kooky AI will analyse your portfolio using institutional standards.
            </Text>
          </View>

          {/* Column headers */}
          <View style={s.colHeaders}>
            <Text style={[s.colHead, { color: theme.textSecondary, flex: 1 }]}>Stock name</Text>
            <Text style={[s.colHead, { color: theme.textSecondary, width: 110 }]}>Qty / ₹ value</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Rows */}
          {rows.map((row, i) => (
            <View key={row.id} style={s.row}>
              <TextInput
                style={[s.input, { flex: 1, backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.text }]}
                placeholder="e.g. Reliance"
                placeholderTextColor={theme.textSecondary}
                value={row.name}
                onChangeText={v => updateRow(row.id, 'name', v)}
                autoCapitalize="words"
              />
              <TextInput
                style={[s.input, { width: 110, backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.text }]}
                placeholder="₹ or qty"
                placeholderTextColor={theme.textSecondary}
                value={row.qty}
                onChangeText={v => updateRow(row.id, 'qty', v)}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity onPress={() => removeRow(row.id)} style={[s.delBtn, { backgroundColor: '#1A0A0A', borderColor: '#3A1A1A' }]}>
                <Ionicons name="close" size={14} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add row */}
          <TouchableOpacity onPress={addRow} style={[s.addBtn, { backgroundColor: theme.cardBackground, borderColor: '#1A3A6A' }]}>
            <Ionicons name="add-circle-outline" size={18} color="#2979FF" />
            <Text style={s.addBtnText}>Add another stock</Text>
          </TouchableOpacity>

          {/* Summary bar */}
          <View style={[s.summaryBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View>
              <Text style={[s.sumLabel, { color: theme.textSecondary }]}>Holdings entered</Text>
              <Text style={[s.sumVal, { color: theme.text }]}>{validRows.length} stock{validRows.length !== 1 ? 's' : ''} ready</Text>
            </View>
            <View style={[s.sumBadge, { backgroundColor: validRows.length > 0 ? '#0A2A0A' : theme.cardBackground, borderColor: validRows.length > 0 ? '#1A4A1A' : theme.border }]}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: validRows.length > 0 ? '#22C55E' : theme.textSecondary }}>
                {validRows.length > 0 ? 'Ready' : 'Add stocks'}
              </Text>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[s.askBtn, (loading || validRows.length === 0) && s.askBtnDisabled]}
            onPress={handleAnalyze}
            disabled={loading || validRows.length === 0}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="hardware-chip-outline" size={18} color="#fff" />
                <Text style={s.askBtnText}>Ask Kooky AI</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[s.disc, { color: theme.textSecondary }]}>
            For education & research only. Not investment advice.{'\n'}
            Consult a SEBI-registered advisor before any financial decision.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#1A2E4A' },
  backBtn:     { width: 34, height: 34, borderRadius: 9, backgroundColor: '#111E33', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 11, color: '#4A6A8A', marginTop: 1 },
  body:        { padding: 16, paddingBottom: 32 },
  hintCard:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, borderWidth: 1, padding: 11, marginBottom: 16 },
  hintText:    { flex: 1, fontSize: 12, lineHeight: 18 },
  colHeaders:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, paddingHorizontal: 2 },
  colHead:     { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  row:         { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  input:       { height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 14 },
  delBtn:      { width: 36, height: 36, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 11, borderWidth: 1, borderStyle: 'dashed', padding: 11, marginBottom: 14 },
  addBtnText:  { fontSize: 13, fontWeight: '700', color: '#2979FF' },
  summaryBar:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 11, borderWidth: 1, padding: 12, marginBottom: 14 },
  sumLabel:    { fontSize: 11, marginBottom: 2 },
  sumVal:      { fontSize: 14, fontWeight: '700' },
  sumBadge:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  askBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2979FF', borderRadius: 13, paddingVertical: 15, marginBottom: 14, shadowColor: '#2979FF', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  askBtnDisabled:{ backgroundColor: '#1A2E4A', shadowOpacity: 0, elevation: 0 },
  askBtnText:  { fontSize: 15, fontWeight: '800', color: '#fff' },
  disc:        { fontSize: 10, textAlign: 'center', lineHeight: 16 },
});
