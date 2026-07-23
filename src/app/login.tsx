import { Ionicons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BrandLogo from '@/components/BrandLogo';
import { useAppContext, UserRole } from '@/context/AppContext';
import { showAlert } from '@/lib/showAlert';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ username?: string }>();
  const { login, role } = useAppContext();
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof params.username === 'string') {
      setUsername(params.username);
    }
  }, [params.username]);

  if (role) return <Redirect href="/" />;

  const selectRole = (nextRole: UserRole) => {
    setSelectedRole(nextRole);
    setPassword('');
    setMessage('');
  };

  const submitLogin = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      const isValid = await login(selectedRole, username, password);
      if (!isValid) {
        const invalidMessage =
          selectedRole === 'admin'
            ? 'Invalid admin username or password'
            : 'Invalid client username or password';
        setMessage(invalidMessage);
        showAlert('Login failed', invalidMessage);
        return;
      }

      try {
        router.replace('/');
      } catch (error) {
        console.error('Failed to navigate after login:', error);
        showAlert('Navigation error', 'Login succeeded, but the Home page could not be opened.');
      }
    } catch (error) {
      console.error('Failed to log in:', error);
      showAlert(
        'Login unavailable',
        'Customer accounts could not be accessed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRegistration = () => {
    try {
      router.push('/register');
    } catch (error) {
      console.error('Failed to open customer registration:', error);
      showAlert('Navigation error', 'The registration page could not be opened.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F1E8" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.logoCard}>
              <BrandLogo />
            </View>
            <Text style={styles.heading}>Welcome to ImperialWood</Text>
            <Text style={styles.subtitle}>Premium Wooden Door Collection</Text>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Choose Login Role</Text>
              <View style={styles.roleRow}>
                {(['client', 'admin'] as UserRole[]).map((roleOption) => {
                  const isSelected = selectedRole === roleOption;

                  return (
                    <TouchableOpacity
                      key={roleOption}
                      style={[styles.roleButton, isSelected && styles.roleButtonActive]}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => selectRole(roleOption)}
                    >
                      <Text style={[styles.roleText, isSelected && styles.roleTextActive]}>
                        {roleOption === 'client' ? 'Client' : 'Admin'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  placeholderTextColor="#8B8B7A"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="username"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter password"
                    placeholderTextColor="#8B8B7A"
                    secureTextEntry={!passwordVisible}
                    textContentType="password"
                    returnKeyType="done"
                    onSubmitEditing={() => void submitLogin()}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    accessibilityRole="button"
                    accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
                    onPress={() => setPasswordVisible((visible) => !visible)}
                  >
                    <Ionicons
                      name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                      size={21}
                      color="#6B4423"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {message ? <Text style={styles.warningText}>{message}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
                activeOpacity={0.9}
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() => void submitLogin()}
              >
                <Text style={styles.primaryButtonText}>
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </Text>
              </TouchableOpacity>

              {selectedRole === 'client' ? (
                <View style={styles.registerRow}>
                  <Text style={styles.accountPrompt}>Don&apos;t have an account?</Text>
                  <TouchableOpacity
                    accessibilityRole="link"
                    accessibilityLabel="Register a customer account"
                    onPress={openRegistration}
                  >
                    <Text style={styles.linkText}>Register</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F1E8' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingVertical: 18 },
  logoCard: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 320,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D6C3',
    paddingVertical: 28,
    paddingHorizontal: 18,
    marginBottom: 22,
    shadowColor: '#3B2416',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.11,
    shadowRadius: 22,
    elevation: 6,
  },
  heading: { color: '#3B2416', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  subtitle: {
    color: '#6B4423',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 24,
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D6C3',
    padding: 20,
    shadowColor: '#3B2416',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  cardTitle: { color: '#2B2118', fontSize: 21, fontWeight: '900', marginBottom: 14 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  roleButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D6C3',
    backgroundColor: '#F7F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleButtonActive: { borderColor: '#C89B3C', backgroundColor: '#3B2416' },
  roleText: { color: '#3B2416', fontSize: 14, fontWeight: '900' },
  roleTextActive: { color: '#FFFFFF' },
  inputGroup: { marginBottom: 14 },
  inputLabel: { color: '#3B2416', fontSize: 13, fontWeight: '800', marginBottom: 7 },
  input: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D6C3',
    backgroundColor: '#F7F1E8',
    color: '#2B2118',
    paddingHorizontal: 14,
    fontSize: 15,
  },
  passwordWrap: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D6C3',
    backgroundColor: '#F7F1E8',
  },
  passwordInput: { flex: 1, minHeight: 48, color: '#2B2118', paddingLeft: 14, fontSize: 15 },
  eyeButton: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  warningText: { color: '#8A4B22', fontSize: 13, fontWeight: '800', marginBottom: 12 },
  primaryButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: '#3B2416',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  buttonDisabled: { opacity: 0.65 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  registerRow: { alignItems: 'center', marginTop: 18, gap: 5 },
  accountPrompt: { color: '#6B5A4A', fontSize: 13 },
  linkText: { color: '#A97517', fontSize: 14, fontWeight: '900', padding: 4 },
});
