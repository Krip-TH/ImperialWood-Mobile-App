import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Product, useAppContext } from '@/context/AppContext';
import ProductImage from './ProductImage';

type Props = { product: Product; variant: 'featured' | 'grid'; width?: number };

export default function HomeProductCard({ product, variant, width }: Props) {
  const router = useRouter();
  const { addToCart, favoriteIds, toggleFavorite } = useAppContext();
  const favorite = favoriteIds.includes(product.id);
  const openDetail = () => router.push({ pathname: '/product-detail', params: { id: product.id } });
  const soldOut = product.status === 'Out of Stock';

  return (
    <View style={[styles.card, variant === 'featured' ? styles.featured : styles.grid, width ? { width } : null]}>
      <TouchableOpacity activeOpacity={0.88} onPress={openDetail}>
        <ProductImage product={product} style={[styles.image, variant === 'featured' && styles.featuredImage]} resizeMode="cover" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.favorite} onPress={() => toggleFavorite(product.id)}>
        <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={18} color={favorite ? '#C89B3C' : '#3B2416'} />
      </TouchableOpacity>
      <View style={styles.info}>
        <Text numberOfLines={2} style={styles.name}>{product.name}</Text>
        <Text numberOfLines={1} style={styles.meta}>{variant === 'featured' ? product.material : product.category}</Text>
        <View style={styles.priceRow}>
          <Text numberOfLines={1} style={styles.price}>{product.price}</Text>
          {variant === 'featured' ? (
            <TouchableOpacity style={styles.arrow} onPress={openDetail}><Ionicons name="arrow-forward" size={16} color="#FFFFFF" /></TouchableOpacity>
          ) : null}
        </View>
        <View style={[styles.status, product.status === 'Low Stock' && styles.low, soldOut && styles.out]}>
          <Text style={styles.statusText}>{product.status}</Text>
        </View>
        {variant === 'grid' ? (
          <View style={styles.actions}>
            <TouchableOpacity disabled={soldOut} style={[styles.cart, soldOut && styles.disabled]} onPress={() => addToCart(product)}>
              <Ionicons name="cart-outline" size={15} color="#FFFFFF" /><Text style={styles.cartText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.detail} onPress={openDetail}><Text style={styles.detailText}>View</Text></TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 21, borderWidth: 1, borderColor: '#E5D6C3', overflow: 'hidden', position: 'relative', shadowColor: '#3B2416', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 2 },
  featured: { width: 220, marginRight: 12 },
  grid: { minWidth: 0 },
  image: { width: '100%', height: 142, backgroundColor: '#EFE4D6' },
  featuredImage: { height: 180 },
  favorite: { position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.93)', alignItems: 'center', justifyContent: 'center' },
  info: { padding: 12 },
  name: { minHeight: 37, color: '#3B2416', fontSize: 14, lineHeight: 18, fontWeight: '900' },
  meta: { color: '#8A7765', fontSize: 11, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 9 },
  price: { flexShrink: 1, color: '#6B4423', fontSize: 13, fontWeight: '900' },
  arrow: { width: 31, height: 31, borderRadius: 12, backgroundColor: '#3B2416', alignItems: 'center', justifyContent: 'center' },
  status: { alignSelf: 'flex-start', marginTop: 8, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#E5F2E8' },
  low: { backgroundColor: '#FFF0CC' },
  out: { backgroundColor: '#F3DEDA' },
  statusText: { color: '#3B2416', fontSize: 9, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 6, marginTop: 10 },
  cart: { flex: 1.2, minHeight: 35, borderRadius: 12, flexDirection: 'row', gap: 4, backgroundColor: '#3B2416', alignItems: 'center', justifyContent: 'center' },
  cartText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  detail: { flex: 1, minHeight: 35, borderRadius: 12, borderWidth: 1, borderColor: '#E5D6C3', alignItems: 'center', justifyContent: 'center' },
  detailText: { color: '#6B4423', fontSize: 11, fontWeight: '900' },
  disabled: { opacity: 0.42 },
});
