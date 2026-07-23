import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
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
import { useAppContext } from '@/context/AppContext';
import {
  createCustomerId,
  CustomerAccount,
  loadCustomerAccounts,
  saveCustomerAccounts,
} from '@/lib/customerAccounts';
import { showAlert } from '@/lib/showAlert';

type FormState = {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const initialForm: FormState = {
  fullName: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

function getValidationError(form: FormState): string | null {
  const values = Object.values(form);
  if (values.some((value) => !value.trim())) return 'All fields are required.';
  if (form.fullName.trim().length < 2) return 'Full Name must contain at least 2 characters.';
  if (form.username.trim().length < 4) return 'Username must contain at least 4 characters.';
  if (/\s/.test(form.username)) return 'Username must not contain spaces.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return 'Please enter a valid email address.';
  }
  if (form.phone.replace(/\D/g, '').length < 9) {
    return 'Phone Number must contain at least 9 digits.';
  }
  if (form.password.length < 6) return 'Password must contain at least 6 characters.';
  if (form.confirmPassword !== form.password) return 'Confirm Password must match Password.';
  return null;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { role } = useAppContext();
  const [form, setForm] = useState<FormState>(initialForm);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (role) return <Redirect href="/" />;

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const createAccount = async () => {
    if (isSubmitting) return;

    const validationError = getValidationError(form);
    if (validationError) {
      showAlert('Check your details', validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const accounts = await loadCustomerAccounts();
      const normalizedUsername = form.username.trim();
      const usernameExists = accounts.some(
        (account) => account.username.toLowerCase() === normalizedUsername.toLowerCase()
      );

      if (usernameExists) {
        showAlert('Username unavailable', 'This username is already registered.');
        return;
      }

      const account: CustomerAccount = {
        id: createCustomerId(accounts),
        fullName: form.fullName.trim(),
        username: normalizedUsername,
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        createdAt: new Date().toISOString(),
      };

      await saveCustomerAccounts([...accounts, account]);
      showAlert('Success', 'Account created successfully');

      try {
        router.replace({ pathname: '/login', params: { username: account.username } });
      } catch (error) {
        console.error('Failed to return to login after registration:', error);
        showAlert(
          'Navigation error',
          'Your account was created, but the Login page could not be opened.'
        );
      }
    } catch (error) {
      console.error('Failed to create customer account:', error);
      showAlert('Registration unavailable', 'Your account could not be saved. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const returnToLogin = () => {
    try {
      router.replace('/login');
    } catch (error) {
      console.error('Failed to return to login:', error);
      showAlert('Navigation error', 'The Login page could not be opened.');
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
            <View style={styles.logoWrap}>
              <BrandLogo compact />
            </View>
            <Text style={styles.heading}>Create Customer Account</Text>
            <Text style={styles.subtitle}>
              Join ImperialWood and explore premium wooden doors.
            </Text>

            <View style={styles.card}>
              <FormInput
                label="Full Name"
                value={form.fullName}
                placeholder="Enter your full name"
                autoCapitalize="words"
                textContentType="name"
                onChangeText={(value) => updateField('fullName', value)}
              />
              <FormInput
                label="Username"
                value={form.username}
                placeholder="Choose a username"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                onChangeText={(value) => updateField('username', value)}
              />
              <FormInput
                label="Email"
                value={form.email}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                onChangeText={(value) => updateField('email', value)}
              />
              <FormInput
                label="Phone Number"
                value={form.phone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                onChangeText={(value) => updateField('phone', value)}
              />

              <PasswordInput
                label="Password"
                value={form.password}
                visible={passwordVisible}
                onChangeText={(value) => updateField('password', value)}
                onToggle={() => setPasswordVisible((visible) => !visible)}
              />
              <PasswordInput
                label="Confirm Password"
                value={form.confirmPassword}
                visible={confirmPasswordVisible}
                onChangeText={(value) => updateField('confirmPassword', value)}
                onToggle={() => setConfirmPasswordVisible((visible) => !visible)}
                onSubmit={() => void createAccount()}
              />

              <TouchableOpacity
                style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
                activeOpacity={0.9}
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() => void createAccount()}
              >
                <Text style={styles.primaryButtonText}>
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>

              <View style={styles.loginRow}>
                <Text style={styles.accountPrompt}>Already have an account?</Text>
                <TouchableOpacity
                  accessibilityRole="link"
                  accessibilityLabel="Return to Login"
                  onPress={returnToLogin}
                >
                  <Text style={styles.linkText}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FormInputProps = React.ComponentProps<typeof TextInput> & { label: string };

function FormInput({ label, style: _style, ...props }: FormInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor="#8B8B7A"
        returnKeyType="next"
      />
    </View>
  );
}

function PasswordInput({
  label,
  value,
  visible,
  onChangeText,
  onToggle,
  onSubmit,
}: {
  label: string;
  value: string;
  visible: boolean;
  onChangeText: (value: string) => void;
  onToggle: () => void;
  onSubmit?: () => void;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.passwordWrap}>
        <TextInput
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={label === 'Password' ? 'Create a password' : 'Re-enter your password'}
          placeholderTextColor="#8B8B7A"
          secureTextEntry={!visible}
          textContentType={label === 'Password' ? 'newPassword' : 'password'}
          returnKeyType={onSubmit ? 'done' : 'next'}
          onSubmitEditing={onSubmit}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          accessibilityRole="button"
          accessibilityLabel={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          onPress={onToggle}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={21}
            color="#6B4423"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F1E8' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingVertical: 16 },
  logoWrap: {
    alignSelf: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5D6C3',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 20,
  },
  heading: { color: '#3B2416', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  subtitle: {
    color: '#6B4423',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7B56D',
    padding: 20,
    shadowColor: '#3B2416',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
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
  primaryButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: '#3B2416',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.65 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  loginRow: { alignItems: 'center', marginTop: 18, gap: 5 },
  accountPrompt: { color: '#6B5A4A', fontSize: 13 },
  linkText: { color: '#A97517', fontSize: 14, fontWeight: '900', padding: 4 },
});
