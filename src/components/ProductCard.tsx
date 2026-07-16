import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Product, useAppContext } from '@/context/AppContext';
import FavoriteButton from './FavoriteButton';
import StatusBadge from './StatusBadge';

type ProductCardProps = {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onDelete?: () => void;
};

export default function ProductCard({
  product,
  isFavorite,
  onToggleFavorite,
  onDelete,
}: ProductCardProps) {
  const router = useRouter();
  const { deleteProduct, role } = useAppContext();
  const isAdmin = role === 'admin';
  const openDetail = () => {
    router.push({ pathname: '/product-detail', params: { id: product.id } });
  };

  return (
    <TouchableOpacity style={styles.productCard} activeOpacity={0.9} onPress={openDetail}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.productImage} />
      ) : (
        <Image source={product.image} style={styles.productImage} />
      )}
      <View style={styles.favoriteWrap}>
        <FavoriteButton isFavorite={isFavorite} onPress={onToggleFavorite} />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productDetail}>Stock: {product.stockQuantity}</Text>
        <Text style={styles.productDetail}>Category: {product.category}</Text>
        <Text style={styles.productDetail}>Location: {product.storeAvailability}</Text>
        <View style={styles.productFooter}>
          <StatusBadge status={product.status} />
          <Text style={styles.price}>{product.price}</Text>
          <TouchableOpacity style={styles.arrowButton} activeOpacity={0.8} onPress={openDetail}>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {isAdmin ? (
          <TouchableOpacity
            style={styles.deleteButton}
            activeOpacity={0.8}
            onPress={onDelete ?? (() => deleteProduct(product.id))}
          >
            <Ionicons name="trash-outline" size={15} color="#8A4B22" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D6C3',
    padding: 12,
    marginBottom: 12,
    position: 'relative',
    shadowColor: '#3B2416',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  productImage: {
    width: 92,
    height: 112,
    borderRadius: 18,
    resizeMode: 'contain',
    marginRight: 14,
    backgroundColor: '#F7F1E8',
  },
  favoriteWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
  productInfo: {
    flex: 1,
    paddingRight: 28,
  },
  productName: {
    color: '#2B2118',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 5,
  },
  productDetail: {
    color: '#6B4423',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 8,
    gap: 8,
  },
  price: {
    color: '#3B2416',
    fontSize: 14,
    fontWeight: '900',
  },
  arrowButton: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: '#3B2416',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  deleteButton: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#F7F1E8',
    borderWidth: 1,
    borderColor: '#E5D6C3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteButtonText: {
    color: '#8A4B22',
    fontSize: 12,
    fontWeight: '900',
  },
});
