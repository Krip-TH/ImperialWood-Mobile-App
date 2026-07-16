import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomNavigation from '@/components/BottomNavigation';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { Product, useAppContext } from '@/context/AppContext';
import { fallbackProducts, parseProducts, PRODUCTS_URL } from '@/data/products';

export default function ProductsScreen() {
  const { favoriteIds, role, toggleFavorite } = useAppContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        const response = await fetch(PRODUCTS_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Product request failed with status ${response.status}.`);
        }

        const data: unknown = await response.json();
        setProducts(parseProducts(data));
      } catch (requestError) {
        if (requestError instanceof Error && requestError.name === 'AbortError') {
          return;
        }

        setError('Unable to load the online catalog. Showing locally saved products.');
        setProducts(fallbackProducts);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();
    return () => controller.abort();
  }, []);

  if (!role) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F1E8" />
      <Header title="Products" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Products</Text>
        {isLoading ? (
          <View style={styles.messageCard}>
            <ActivityIndicator color="#3B2416" />
            <Text style={styles.messageText}>Loading wooden doors...</Text>
          </View>
        ) : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {!isLoading && products.length === 0 ? (
          <Text style={styles.emptyText}>No wooden doors available.</Text>
        ) : (
          products.map((product) => (
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
  messageCard: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5D6C3',
    padding: 16,
  },
  messageText: {
    color: '#3B2416',
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: '#8A4B22',
    backgroundColor: '#FFF4E8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5C4A6',
    padding: 12,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '700',
  },
});
