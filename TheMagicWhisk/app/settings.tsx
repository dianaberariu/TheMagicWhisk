import React, { useEffect, useState } from 'react';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../AuthContext';
import { supabase } from '../supabase';

const COLORS = {
  background: '#F3F8F4',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#DCE9E2',
  accent: '#65B891',
  accentSoft: '#E4F4EC',
  accentDark: '#4F9B78',
};

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'idle' | 'success' | 'error'>('idle' as 'idle');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const fullName = user?.user_metadata?.full_name;
    setFirstName(typeof fullName === 'string' ? fullName : '');
  }, [user?.id, user?.user_metadata?.full_name]);

  const handleSave = async () => {
    const trimmedFirstName = firstName.trim();

    if (!trimmedFirstName) {
      setMessage('Please enter your first name before saving.');
      setMessageType('error');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: trimmedFirstName },
      });

      if (error) {
        setMessage(error.message);
        setMessageType('error');
        return;
      }

      setMessage('Your profile has been updated successfully.');
      setMessageType('success');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save your changes.');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const email = user?.email ?? 'No email available';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.backgroundGlowTop} />
          <View style={styles.backgroundGlowBottom} />

          <View style={styles.contentInset}>
            <View style={styles.topRow}>
              <Pressable
                onPress={() => router.replace('/(tabs)')}
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              >
                <Ionicons name="chevron-back" size={18} color={COLORS.text} />
                <Text style={styles.backButtonText}>Back</Text>
              </Pressable>
            </View>

            <View style={styles.heroCard}>
              <View style={styles.iconShell}>
                <Ionicons name="person-circle-outline" size={34} color={COLORS.accentDark} />
              </View>
              <Text style={styles.title}>Profile &amp; Settings</Text>
              <Text style={styles.subtitle}>
                A calm, elegant place to refine your account details and keep your culinary identity polished.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Account</Text>

              <View style={styles.emailBlock}>
                <Text style={styles.fieldLabel}>Current Email</Text>
                <View style={styles.emailPill}>
                  <Ionicons name="mail-outline" size={16} color={COLORS.accentDark} />
                  <Text style={styles.emailText} numberOfLines={1}>
                    {email}
                  </Text>
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Edit First Name</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter your first name"
                  placeholderTextColor="#98A6A0"
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="givenName"
                  autoComplete="name"
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  style={[styles.input, focused && styles.inputFocused]}
                />
              </View>

              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && styles.pressed,
                  saving && styles.saveButtonDisabled,
                ]}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </Pressable>

              {/* Change Password (secondary action) */}
              <Pressable
                onPress={() => console.log('Change Password tapped')}
                style={({ pressed }) => [
                  styles.changePasswordButton,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.changePasswordContent}>
                  <FontAwesome name="lock" size={14} color={'#374151'} />
                  <Text style={styles.changePasswordText}>Change Password</Text>
                </View>
              </Pressable>

              {/* Log Out (secondary outline action) */}
              <Pressable
                onPress={async () => {
                  try {
                    const { error } = await (signOut?.() as Promise<any>);
                    if (error) {
                      console.error('Failed to sign out', error);
                    } else {
                      router.replace('/login');
                    }
                  } catch (err) {
                    console.error('Sign out error', err);
                  }
                }}
                style={({ pressed }) => [
                  styles.logoutOutlineButton,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.logoutOutlineContent}>
                  <Ionicons name="log-out-outline" size={16} color={COLORS.accentDark} />
                  <Text style={styles.logoutOutlineText}>Log Out</Text>
                </View>
              </Pressable>

              {message ? (
                <View
                  style={[
                    styles.messageBox,
                    messageType === 'error' ? styles.messageError : styles.messageSuccess,
                  ]}
                >
                  <Ionicons
                    name={messageType === 'error' ? 'warning-outline' : 'checkmark-circle-outline'}
                    size={16}
                    color={messageType === 'error' ? '#B45309' : COLORS.accentDark}
                  />
                  <Text
                    style={[
                      styles.messageText,
                      messageType === 'error' ? styles.messageTextError : styles.messageTextSuccess,
                    ]}
                  >
                    {message}
                  </Text>
                </View>
              ) : null}

              {/* Subtle Delete Link */}
              <Pressable onPress={() => console.log('Delete Account tapped')} style={styles.deleteLink}>
                <View style={styles.deleteLinkContent}>
                  <FontAwesome name="trash" size={14} color={'#D98C8C'} />
                  <Text style={styles.deleteLinkText}>Delete Account</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 40,
    minHeight: '100%',
  },
  contentInset: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -70,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(101, 184, 145, 0.14)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: 60,
    left: -110,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(101, 184, 145, 0.08)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  
  heroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: '#E1ECE5',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 4,
    alignItems: 'center',
    marginBottom: 16,
  },
  iconShell: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: '#D5EBDD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
    textAlign: 'center',
    maxWidth: 320,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  emailBlock: {
    marginBottom: 18,
  },
  fieldBlock: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F6FBF8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE9E2',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emailText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FBFDFC',
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.text,
  },
  inputFocused: {
    borderColor: COLORS.accent,
    backgroundColor: '#FFFFFF',
    shadowColor: COLORS.accent,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  saveButton: {
    height: 52,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: COLORS.accentDark,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.82,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  messageBox: {
    marginTop: 14,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  messageSuccess: {
    backgroundColor: '#F3FBF7',
    borderColor: '#D4EBDD',
  },
  messageError: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  messageText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  messageTextSuccess: {
    color: '#356C54',
  },
  messageTextError: {
    color: '#9A3412',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  changePasswordButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  changePasswordContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changePasswordText: {
    color: '#374151',
    fontWeight: '700',
    marginLeft: 6,
  },
  logoutOutlineButton: {
    marginTop: 10,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accentDark,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  logoutOutlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutOutlineText: {
    color: COLORS.accentDark,
    fontWeight: '700',
    marginLeft: 6,
  },
  deleteLink: {
    marginTop: 14,
    alignSelf: 'center',
    paddingVertical: 6,
  },
  deleteLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteLinkText: {
    color: '#D98C8C',
    fontWeight: '700',
    marginLeft: 6,
    fontSize: 13,
  },
});