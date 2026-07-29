import { Redirect, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomNavigation from '@/components/BottomNavigation';
import BrandLogo from '@/components/BrandLogo';
import CategoryIcon from '@/components/CategoryIcon';
import DashboardCard from '@/components/DashboardCard';
import FilterModal, { defaultFilters, HomeFilters } from '@/components/FilterModal';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import HomeProductCard from '@/components/HomeProductCard';
import SearchBar from '@/components/SearchBar';
import { useAppContext } from '@/context/AppContext';
import { getProducts } from '@/services/productService';

export default function HomeScreen() {
  const {
    role,
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
      void deleteProduct(firstProduct.id);
    }
  };

  if (!role) {
    return <Redirect href="/login" />;
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

function ClientHome({
  totalProducts: _totalProducts,
  totalFavorites: _totalFavorites,
  totalCategories: _totalCategories,
}: {
  totalProducts: number;
  totalFavorites: number;
  totalCategories: number;
}) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { products, replaceProducts } = useAppContext();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<HomeFilters>(defaultFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const categories = [
    { label: 'Entrance', category: 'Entrance Doors', icon: 'home-outline' as const },
    { label: 'Interior', category: 'Interior Doors', icon: 'square-outline' as const },
    { label: 'Classic', category: 'Classic Doors', icon: 'ribbon-outline' as const },
    { label: 'Modern', category: 'Modern Doors', icon: 'grid-outline' as const },
    { label: 'Glass Panel', category: 'Glass Panel Doors', icon: 'apps-outline' as const },
    { label: 'More', category: 'All', icon: 'ellipsis-horizontal-circle-outline' as const },
  ];

  useEffect(() => {
    let active = true;
    async function loadCatalog() {
      try {
        const result = await getProducts();
        if (!active) return;
        replaceProducts(result.products);
        setCatalogError('');
      } catch (error) {
        if (active) setCatalogError('Product data could not be loaded.');
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadCatalog();
    return () => {
      active = false;
    };
  }, [replaceProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const parseNumber = (value: string) => Number(value.replace(/[^0-9.]/g, '')) || 0;
    const result = products.filter((product) => {
      const searchable = [product.name, product.category, product.material, product.finish, product.itemCode].join(' ').toLowerCase();
      const price = parseNumber(product.price);
      const priceMatches = filters.priceRange === 'All prices'
        || (filters.priceRange === 'Under THB 20,000' && price < 20000)
        || (filters.priceRange === 'THB 20,000–25,000' && price >= 20000 && price <= 25000)
        || (filters.priceRange === 'Over THB 25,000' && price > 25000);
      const storeMatches = filters.storeAvailability === 'All'
        || (filters.storeAvailability === 'Online only' && product.storeAvailability.toLowerCase().includes('online'))
        || (filters.storeAvailability === 'In stores' && !product.storeAvailability.toLowerCase().includes('online'));
      return (!normalizedQuery || searchable.includes(normalizedQuery))
        && (filters.category === 'All' || product.category === filters.category)
        && (filters.material === 'All' || product.material === filters.material)
        && (filters.availability === 'All' || product.status === filters.availability)
        && priceMatches && storeMatches;
    });
    return [...result].sort((a, b) => {
      if (filters.sort === 'Price: Low to High') return parseNumber(a.price) - parseNumber(b.price);
      if (filters.sort === 'Price: High to Low') return parseNumber(b.price) - parseNumber(a.price);
      if (filters.sort === 'Name: A-Z') return a.name.localeCompare(b.name);
      if (filters.sort === 'Stock: High to Low') return parseNumber(b.stockQuantity) - parseNumber(a.stockQuantity);
      return 0;
    });
  }, [filters, products, query]);

  const contentWidth = Math.min(width - 40, 1180);
  const columns = width >= 1100 ? 4 : width >= 720 ? 3 : 2;
  const cardWidth = Math.max(145, (contentWidth - 12 * (columns - 1)) / columns);
  const selectCategory = (category: string, label: string) => {
    if (label === 'More') { router.push('/categories'); return; }
    router.push({ pathname: '/products', params: { category } });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F1E8" />
      <Header title="Home" />
      <ScrollView contentContainerStyle={styles.clientContainer} showsVerticalScrollIndicator={false}>
        <SearchBar value={query} onChangeText={setQuery} onClear={() => setQuery('')} onOpenFilters={() => setFilterOpen(true)} />
        {query ? <TouchableOpacity onPress={() => setQuery('')}><Text style={styles.clearSearch}>Clear Search</Text></TouchableOpacity> : null}
        <View style={styles.clientHero}><HeroBanner onPress={() => router.push('/products')} /></View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categories.map((category) => <CategoryIcon key={category.label} label={category.label} icon={category.icon} active={category.label !== 'More' && filters.category === category.category} onPress={() => selectCategory(category.category, category.label)} />)}
        </ScrollView>

        {catalogError ? <Text style={styles.catalogError}>{catalogError}</Text> : null}
        {isLoading ? <View style={styles.homeLoading}><ActivityIndicator color="#C89B3C" /><Text style={styles.loadingText}>Curating the collection...</Text></View> : null}
        {!isLoading && filteredProducts.length === 0 ? (
          <View style={styles.noResults}><Text style={styles.noResultsTitle}>No products found</Text><Text style={styles.noResultsText}>Try clearing the search or adjusting your filters.</Text></View>
        ) : null}
        {filteredProducts.length > 0 ? (
          <>
            <View style={styles.sectionHeader}><Text style={styles.clientSectionTitle}>Featured Doors</Text><TouchableOpacity onPress={() => router.push('/products')}><Text style={styles.seeAll}>See all</Text></TouchableOpacity></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
              {filteredProducts.slice(0, 6).map((product) => <HomeProductCard key={product.id} product={product} variant="featured" />)}
            </ScrollView>
            <View style={[styles.sectionHeader, styles.popularHeader]}><Text style={styles.clientSectionTitle}>Popular Doors</Text><Text style={styles.resultCount}>{filteredProducts.length} doors</Text></View>
            <View style={styles.productGrid}>{filteredProducts.map((product) => <HomeProductCard key={product.id} product={product} variant="grid" width={cardWidth} />)}</View>
          </>
        ) : null}
      </ScrollView>
      <FilterModal visible={filterOpen} value={filters} onClose={() => setFilterOpen(false)} onApply={setFilters} />
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
  clientContainer: { width: '100%', maxWidth: 1220, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 118 },
  clearSearch: { alignSelf: 'flex-end', color: '#6B4423', fontSize: 12, fontWeight: '900', marginTop: 8, marginRight: 4 },
  clientHero: { marginTop: 18 },
  categoryRow: { paddingVertical: 22, gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  clientSectionTitle: { color: '#3B2416', fontSize: 21, fontWeight: '900' },
  seeAll: { color: '#C08928', fontSize: 12, fontWeight: '900' },
  featuredRow: { paddingBottom: 8 },
  popularHeader: { marginTop: 24 },
  resultCount: { color: '#8A7765', fontSize: 11, fontWeight: '700' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catalogError: { color: '#8A4B22', backgroundColor: '#FFF4E8', borderRadius: 14, borderWidth: 1, borderColor: '#E5C4A6', padding: 11, marginBottom: 14, fontSize: 12, fontWeight: '700' },
  homeLoading: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', padding: 28 },
  loadingText: { color: '#6B4423', fontSize: 13, fontWeight: '700' },
  noResults: { alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5D6C3', borderRadius: 22, padding: 28, marginTop: 4 },
  noResultsTitle: { color: '#3B2416', fontSize: 18, fontWeight: '900' },
  noResultsText: { color: '#8A7765', fontSize: 12, marginTop: 6, textAlign: 'center' },
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
