import { Redirect } from 'expo-router';
import { ScrollView, StatusBar, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomNavigation from '@/components/BottomNavigation';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { useAppContext } from '@/context/AppContext';

export default function FavoritesScreen() {
  const { favoriteProducts, favoriteIds, role, toggleFavorite } = useAppContext();

  if (!role) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F1E8" />
      <Header title="Favorites" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Favorites</Text>
        {favoriteProducts.length === 0 ? (
          <Text style={styles.emptyText}>No favorite doors yet.</Text>
        ) : (
          favoriteProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={favoriteIds.includes(product.id)}
              onToggleFavorite={() => toggleFavorite(product.id)}
            />
          ))
        )}
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
  sectionTitle: {
    color: '#2B2118',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 12,
  },
  emptyText: {
    color: '#6B6B6B',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5D6C3',
    padding: 16,
    fontSize: 14,
    fontWeight: '700',
  },
});
