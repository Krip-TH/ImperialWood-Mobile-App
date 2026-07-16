import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useAppContext } from '@/context/AppContext';

export default function CartButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { cartItemCount } = useAppContext();
  return (
    <TouchableOpacity
      accessibilityLabel={`Cart with ${cartItemCount} items`}
      style={[styles.button, compact && styles.compact]}
      onPress={() => router.push('/cart' as Href)}
    >
      <Ionicons name="cart-outline" size={compact ? 20 : 22} color="#3B2416" />
      {cartItemCount > 0 ? <Text style={styles.badge}>{cartItemCount > 99 ? '99+' : cartItemCount}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5D6C3', alignItems: 'center', justifyContent: 'center' },
  compact: { width: 38, height: 38, borderRadius: 14 },
  badge: { position: 'absolute', top: -5, right: -5, minWidth: 19, height: 19, borderRadius: 10, paddingHorizontal: 4, textAlign: 'center', lineHeight: 19, overflow: 'hidden', color: '#FFFFFF', backgroundColor: '#C89B3C', fontSize: 10, fontWeight: '900' },
});
