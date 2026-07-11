import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomNavigation from '@/components/BottomNavigation';
import BrandLogo from '@/components/BrandLogo';
import DashboardCard from '@/components/DashboardCard';
import Header from '@/components/Header';
import { useAppContext, UserRole } from '@/context/AppContext';

export default function HomeScreen() {
  const {
    role,
    login,
    products,
    favoriteIds,
    categoryList,
    notice,
    totalStock,
    deleteProduct,
    clearFavorites,
  } = useAppContext();

  const deleteFirstProduct = () => {
    const firstProduct = products[0];

    if (firstProduct) {
      deleteProduct(firstProduct.id);
    }
  };

  if (!role) {
    return <LoginPanel onLogin={login} />;
  }

  if (role === 'client') {
    return (
      <ClientHome
        totalProducts={products.length}
        totalFavorites={favoriteIds.length}
        totalCategories={categoryList.length}
      />
    );
  }

  return (
    <AdminDashboard
      totalProducts={products.length}
      totalFavorites={favoriteIds.length}
      totalCategories={categoryList.length}
      totalStock={totalStock}
      notice={notice}
      onDeleteSampleProduct={deleteFirstProduct}
      onClearFavorites={clearFavorites}
    />
  );
}

function LoginPanel({
  onLogin,
}: {
  onLogin: (role: UserRole, username: string, password: string) => boolean;
}) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const submitLogin = () => {
    const isValid = onLogin(selectedRole, username, password);

    if (!isValid) {
      setMessage('Invalid demo account. Try client/1234 or admin/1234.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F1E8" />
      <View style={styles.loginContainer}>
        <View style={styles.loginLogoCard}>
          <BrandLogo />
        </View>
        <Text style={styles.loginLogo}>ImperialWood</Text>
        <Text style={styles.loginSubtitle}>Premium Wooden Door Collection</Text>
        <Text style={styles.loginTagline}>Luxury Solid Wood Doors</Text>

        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>Choose Login Role</Text>
          <View style={styles.roleRow}>
            {(['client', 'admin'] as UserRole[]).map((roleOption) => {
              const isSelected = selectedRole === roleOption;

              return (
                <TouchableOpacity
                  key={roleOption}
                  style={[styles.roleButton, isSelected && styles.roleButtonActive]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedRole(roleOption)}
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
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#8B8B7A"
              secureTextEntry
            />
          </View>

          {message ? <Text style={styles.warningText}>{message}</Text> : null}

          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={submitLogin}>
            <Text style={styles.primaryButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ClientHome({
  totalProducts,
  totalFavorites,
  totalCategories,
}: {
  totalProducts: number;
  totalFavorites: number;
  totalCategories: number;
}) {
  const router = useRouter();
  const clientCards = [
    { label: 'Browse Products', icon: 'albums-outline' as const, action: () => router.push('/products') },
    { label: 'View Categories', icon: 'grid-outline' as const, action: () => router.push('/categories') },
    { label: 'Favorite Items', icon: 'heart-outline' as const, action: () => router.push('/favorites') },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F1E8" />
      <Header title="Home" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroPanel}>
          <BrandLogo light />
          <Text style={styles.heroTitle}>ImperialWood</Text>
          <Text style={styles.heroSystemTitle}>Premium Wooden Door Management System</Text>
          <Text style={styles.heroText}>
            Manage inventory, collections, stock and customer favorites.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Client Overview</Text>
        <View style={styles.grid}>
          <DashboardCard label="Total Doors" value={String(totalProducts)} icon="albums-outline" />
          <DashboardCard label="Favorites" value={String(totalFavorites)} icon="heart-outline" />
          <DashboardCard label="Categories" value={String(totalCategories)} icon="grid-outline" />
        </View>

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Quick Actions</Text>
        <View style={styles.grid}>
          {clientCards.map((card) => (
            <DashboardCard
              key={card.label}
              label={card.label}
              icon={card.icon}
              onPress={card.action}
            />
          ))}
        </View>
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
}

function AdminDashboard({
  totalProducts,
  totalFavorites,
  totalCategories,
  totalStock,
  notice,
  onDeleteSampleProduct,
  onClearFavorites,
}: {
  totalProducts: number;
  totalFavorites: number;
  totalCategories: number;
  totalStock: number;
  notice: string;
  onDeleteSampleProduct: () => void;
  onClearFavorites: () => void;
}) {
  const router = useRouter();
  const summaryCards = [
    { label: 'Total Doors', value: String(totalProducts), icon: 'albums-outline' as const },
    { label: 'Total Stock', value: String(totalStock), icon: 'cube-outline' as const },
    { label: 'Total Categories', value: String(totalCategories), icon: 'grid-outline' as const },
    { label: 'Total Favorites', value: String(totalFavorites), icon: 'heart-outline' as const },
  ];
  const controlCards = [
    { label: 'Manage Products', icon: 'albums-outline' as const, action: () => router.push('/products') },
    { label: 'Add Product', icon: 'add-circle-outline' as const, action: () => router.push('/add') },
    { label: 'View Categories', icon: 'grid-outline' as const, action: () => router.push('/categories') },
    { label: 'Favorite Items', icon: 'heart-outline' as const, action: () => router.push('/favorites') },
    { label: 'Delete Sample Product', icon: 'trash-outline' as const, action: onDeleteSampleProduct },
    { label: 'Clear Favorites', icon: 'heart-dislike-outline' as const, action: onClearFavorites },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F1E8" />
      <Header title="Dashboard" />
      {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroPanel}>
          <BrandLogo light />
          <Text style={styles.heroTitle}>ImperialWood</Text>
          <Text style={styles.heroSystemTitle}>Premium Wooden Door Management System</Text>
          <Text style={styles.heroText}>
            Manage inventory, collections, stock and customer favorites.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.grid}>
          {summaryCards.map((card) => (
            <DashboardCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
            />
          ))}
        </View>

        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Management</Text>
        <View style={styles.grid}>
          {controlCards.map((card) => (
            <DashboardCard
              key={card.label}
              label={card.label}
              icon={card.icon}
              onPress={card.action}
            />
          ))}
        </View>
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F1E8',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loginLogoCard: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D6C3',
    paddingVertical: 28,
    paddingHorizontal: 18,
    shadowColor: '#3B2416',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.11,
    shadowRadius: 22,
    elevation: 6,
  },
  loginLogo: {
    color: '#3B2416',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  loginSubtitle: {
    color: '#6B4423',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  loginTagline: {
    color: '#3B2416',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 30,
  },
  loginCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D6C3',
    shadowColor: '#3B2416',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
    padding: 20,
  },
  loginTitle: {
    color: '#2B2118',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 14,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  roleButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D6C3',
    backgroundColor: '#F7F1E8',
    alignItems: 'center',
    paddingVertical: 12,
  },
  roleButtonActive: {
    borderColor: '#C89B3C',
    backgroundColor: '#3B2416',
  },
  roleText: {
    color: '#3B2416',
    fontSize: 14,
    fontWeight: '900',
  },
  roleTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#3B2416',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  input: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D6C3',
    backgroundColor: '#F7F1E8',
    color: '#2B2118',
    paddingHorizontal: 12,
    fontSize: 14,
  },
  warningText: {
    color: '#8A4B22',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 12,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#3B2416',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  noticeText: {
    color: '#3B2416',
    backgroundColor: '#F2E6D6',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontWeight: '800',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 112,
  },
  heroPanel: {
    backgroundColor: '#3B2416',
    borderRadius: 28,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#3B2416',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 7,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSystemTitle: {
    color: '#C89B3C',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 21,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroText: {
    color: '#F7F1E8',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#2B2118',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 12,
  },
  sectionSpacing: {
    marginTop: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
