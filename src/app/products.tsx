import { Ionicons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { Product, useAppContext } from '@/context/AppContext';
import { getProducts } from '@/services/productService';

const productCategories = [
  'All',
  'Solid Wood Doors',
  'Modern Doors',
  'Classic Doors',
  'Glass Panel Doors',
  'Entrance Doors',
  'Interior Doors',
  'Door Frames',
  'Accessories',
] as const;

export default function ProductsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string | string[] }>();
  const { deleteProduct, favoriteIds, replaceProducts, role, toggleFavorite } = useAppContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);
  const requestedCategory = Array.isArray(params.category) ? params.category[0] : params.category;
  const selectedCategory = requestedCategory?.trim() || 'All';

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const result = await getProducts();
        if (!active) return;
        setProducts(result.products);
        replaceProducts(result.products);
        setShowOfflineWarning(false);
      } catch (requestError) {
        if (active) setShowOfflineWarning(true);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadProducts();
    return () => {
      active = false;
    };
  }, [replaceProducts]);

  const visibleProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const categoryMatches = selectedCategory === 'All' || product.category === selectedCategory;
      const searchableText = [
        product.name,
        product.category,
        product.material,
        product.finish,
        product.itemCode,
      ].join(' ').toLowerCase();
      return categoryMatches && (!normalizedSearch || searchableText.includes(normalizedSearch));
    });
  }, [products, searchQuery, selectedCategory]);

  function selectCategory(category: (typeof productCategories)[number]) {
    if (category === 'All') {
      router.setParams({ category: undefined });
    } else {
      router.setParams({ category });
    }
  }

  async function handleDeleteProduct(productId: string) {
    try {
      await deleteProduct(productId);
      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== productId)
      );
    } catch (error) {
      setShowOfflineWarning(true);
      console.error('Unable to delete product:', error);
    }
  }

  if (!role) return <Redirect href="/" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F1E8" />
      <Header title="Products" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{selectedCategory === 'All' ? 'All Products' : selectedCategory}</Text>
        {selectedCategory !== 'All' ? <Text style={styles.subtitle}>Products in this category</Text> : null}

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#8A7765" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products..."
            placeholderTextColor="#8A7765"
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity accessibilityLabel="Clear search" onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#8A7765" />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {productCategories.map((category) => {
            const active = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                style={[styles.filterChip, active && styles.filterChipActive]}
                activeOpacity={0.82}
                onPress={() => selectCategory(category)}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{category}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.messageCard}>
            <ActivityIndicator color="#3B2416" />
            <Text style={styles.messageText}>Loading wooden doors...</Text>
          </View>
        ) : null}
        {showOfflineWarning ? <Text style={styles.errorText}>Showing offline product data.</Text> : null}
        {!isLoading && visibleProducts.length === 0 ? (
          <Text style={styles.emptyText}>No products found in this category.</Text>
        ) : (
          visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={favoriteIds.includes(product.id)}
              onToggleFavorite={() => toggleFavorite(product.id)}
              onDelete={() => handleDeleteProduct(product.id)}
            />
          ))
        )}
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F1E8' },
  container: { width: '100%', maxWidth: 880, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 112 },
  sectionTitle: { color: '#2B2118', fontSize: 24, fontWeight: '900' },
  subtitle: { color: '#8A7765', fontSize: 13, marginTop: 4 },
  searchBar: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, paddingHorizontal: 16, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5D6C3' },
  searchInput: { flex: 1, minWidth: 0, color: '#3B2416', fontSize: 14 },
  filterRow: { gap: 8, paddingVertical: 16 },
  filterChip: { borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5D6C3', paddingHorizontal: 14, paddingVertical: 9 },
  filterChipActive: { backgroundColor: '#3B2416', borderColor: '#C89B3C' },
  filterChipText: { color: '#6B4423', fontSize: 12, fontWeight: '800' },
  filterChipTextActive: { color: '#FFFFFF' },
  emptyText: { color: '#6B4423', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E5D6C3', padding: 24, fontSize: 14, fontWeight: '800' },
  messageCard: { minHeight: 88, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E5D6C3', padding: 16 },
  messageText: { color: '#3B2416', fontSize: 14, fontWeight: '700' },
  errorText: { color: '#8A4B22', backgroundColor: '#FFF4E8', borderRadius: 14, borderWidth: 1, borderColor: '#E5C4A6', padding: 11, marginBottom: 12, fontSize: 12, fontWeight: '700' },
});
