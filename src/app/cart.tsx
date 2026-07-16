import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomNavigation from '@/components/BottomNavigation';
import Header from '@/components/Header';
import { useAppContext } from '@/context/AppContext';

export default function CartScreen() {
  const router = useRouter();
  const { cartItems, cartSubtotal, decreaseCartItem, increaseCartItem, removeFromCart, role } = useAppContext();
  if (!role) return <Redirect href="/" />;
  if (role === 'admin') return <Redirect href="/" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F1E8" />
      <Header title="Cart" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headingRow}><View><Text style={styles.title}>Your Cart</Text><Text style={styles.subtitle}>{cartItems.length} {cartItems.length === 1 ? 'door' : 'doors'} selected</Text></View><Ionicons name="bag-handle-outline" size={27} color="#C89B3C" /></View>
        {cartItems.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Ionicons name="cart-outline" size={36} color="#6B4423" /></View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>Discover a handcrafted door for your space.</Text>
            <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/')}><Text style={styles.shopText}>Explore Doors</Text></TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.list}>
              {cartItems.map(({ product, quantity }) => (
                <View key={product.id} style={styles.item}>
                  <TouchableOpacity onPress={() => router.push({ pathname: '/product-detail', params: { id: product.id } })}>
                    <Image source={product.image_url ? { uri: product.image_url } : product.image} style={styles.image} resizeMode="cover" />
                  </TouchableOpacity>
                  <View style={styles.itemInfo}>
                    <Text numberOfLines={2} style={styles.itemName}>{product.name}</Text>
                    <Text style={styles.itemMeta}>{product.material} · {product.finish}</Text>
                    <Text style={styles.price}>{product.price}</Text>
                    <View style={styles.itemBottom}>
                      <View style={styles.quantity}>
                        <TouchableOpacity style={styles.quantityButton} onPress={() => decreaseCartItem(product.id)}><Ionicons name="remove" size={16} color="#3B2416" /></TouchableOpacity>
                        <Text style={styles.quantityText}>{quantity}</Text>
                        <TouchableOpacity style={styles.quantityButton} onPress={() => increaseCartItem(product.id)}><Ionicons name="add" size={16} color="#3B2416" /></TouchableOpacity>
                      </View>
                      <TouchableOpacity style={styles.remove} onPress={() => removeFromCart(product.id)}><Ionicons name="trash-outline" size={17} color="#9A5B3B" /></TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.summary}>
              <View><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryNote}>Taxes and delivery are not included.</Text></View>
              <Text style={styles.subtotal}>THB {cartSubtotal.toLocaleString()}</Text>
            </View>
            <Text style={styles.noCheckout}>This cart is for product planning only. No payment or checkout is required.</Text>
          </>
        )}
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F1E8' },
  container: { width: '100%', maxWidth: 880, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 118 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title: { color: '#3B2416', fontSize: 26, fontWeight: '900' },
  subtitle: { color: '#8A7765', fontSize: 12, marginTop: 3 },
  list: { gap: 12 },
  item: { flexDirection: 'row', padding: 11, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5D6C3' },
  image: { width: 96, height: 116, borderRadius: 16, backgroundColor: '#EFE4D6' },
  itemInfo: { flex: 1, minWidth: 0, paddingLeft: 13 },
  itemName: { color: '#3B2416', fontSize: 15, lineHeight: 19, fontWeight: '900', paddingRight: 4 },
  itemMeta: { color: '#8A7765', fontSize: 10, marginTop: 4 },
  price: { color: '#6B4423', fontSize: 13, fontWeight: '900', marginTop: 7 },
  itemBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
  quantity: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 3, borderRadius: 13, backgroundColor: '#F7F1E8' },
  quantityButton: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  quantityText: { color: '#3B2416', minWidth: 14, textAlign: 'center', fontSize: 12, fontWeight: '900' },
  remove: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#FFF4E8', alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 18, padding: 19, borderRadius: 22, backgroundColor: '#3B2416' },
  summaryLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  summaryNote: { color: '#D8C7AE', fontSize: 9, marginTop: 4 },
  subtotal: { color: '#E7C677', fontSize: 18, fontWeight: '900' },
  noCheckout: { color: '#8A7765', textAlign: 'center', fontSize: 10, marginTop: 12 },
  empty: { alignItems: 'center', padding: 32, borderRadius: 26, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5D6C3' },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F2E6D6', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#3B2416', fontSize: 20, fontWeight: '900', marginTop: 18 },
  emptyText: { color: '#8A7765', fontSize: 12, marginTop: 6 },
  shopButton: { marginTop: 20, borderRadius: 15, backgroundColor: '#3B2416', paddingHorizontal: 20, paddingVertical: 12 },
  shopText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
});
