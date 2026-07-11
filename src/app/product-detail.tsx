import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomNavigation from '@/components/BottomNavigation';
import BrandLogo from '@/components/BrandLogo';
import FavoriteButton from '@/components/FavoriteButton';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import { useAppContext } from '@/context/AppContext';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { favoriteIds, getProductById, role, toggleFavorite } = useAppContext();
  const product = id ? getProductById(id) : undefined;

  if (!role) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F1E8" />
      <Header title="Product Detail" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {!product ? (
          <Text style={styles.emptyText}>Product not found.</Text>
        ) : (
          <>
            <View style={styles.imageCard}>
              <Image source={product.image} style={styles.detailImage} resizeMode="contain" />
            </View>
            <View style={styles.detailCard}>
              <View style={styles.detailHeaderRow}>
                <BrandLogo compact />
                <Text style={styles.detailTitle}>{product.name}</Text>
              </View>
              <Text style={styles.detailLine}>Category: {product.category}</Text>
              <Text style={styles.detailLine}>Material: {product.material}</Text>
              <Text style={styles.detailLine}>Size: {product.size}</Text>
              <Text style={styles.detailLine}>Finish: {product.finish}</Text>
              <Text style={styles.detailLine}>Price: {product.price}</Text>
              <Text style={styles.detailLine}>Item code: {product.itemCode}</Text>
              <Text style={styles.detailLine}>Stock: {product.stockQuantity}</Text>
              <Text style={styles.detailLine}>Store availability: {product.storeAvailability}</Text>
              <Text style={styles.detailDescription}>{product.description}</Text>
              <View style={styles.statusRow}>
                <Text style={styles.detailLine}>Status:</Text>
                <StatusBadge status={product.status} />
              </View>
              <View style={styles.favoriteRow}>
                <Text style={styles.favoriteLabel}>Favorite</Text>
                <FavoriteButton
                  large
                  isFavorite={favoriteIds.includes(product.id)}
                  onPress={() => toggleFavorite(product.id)}
                />
              </View>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.9}
                onPress={() => router.push('/products')}
              >
                <Text style={styles.primaryButtonText}>Back to Products</Text>
              </TouchableOpacity>
            </View>
          </>
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
  imageCard: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D6C3',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#3B2416',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  detailImage: {
    width: '100%',
    maxWidth: 420,
    height: 320,
    backgroundColor: '#F7F1E8',
    borderRadius: 18,
  },
  detailCard: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D6C3',
    padding: 14,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  detailTitle: {
    flex: 1,
    color: '#2B2118',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  detailLine: {
    color: '#3B2416',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 7,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  detailDescription: {
    color: '#6B4423',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 14,
  },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5D6C3',
    paddingTop: 12,
    marginBottom: 12,
  },
  favoriteLabel: {
    color: '#3B2416',
    fontSize: 14,
    fontWeight: '900',
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 8,
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
