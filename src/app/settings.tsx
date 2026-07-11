import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomNavigation from '@/components/BottomNavigation';
import Header from '@/components/Header';
import { useAppContext } from '@/context/AppContext';

export default function SettingsScreen() {
  const { role } = useAppContext();

  if (!role) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F1E8" />
      <Header title="Settings" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.iconShell}>
            <Ionicons name="settings-outline" size={28} color="#3B2416" />
          </View>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.text}>ImperialWood settings are kept simple for this assignment.</Text>
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
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 112,
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D6C3',
    padding: 18,
    shadowColor: '#3B2416',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  iconShell: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#F2E6D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    color: '#3B2416',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  text: {
    color: '#6B4423',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
});
