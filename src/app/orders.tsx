import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomNavigation from '@/components/BottomNavigation';
import Header from '@/components/Header';
import { useAppContext } from '@/context/AppContext';
import {
  getOrders,
  type Order,
  type OrderStatus,
  updateOrderStatus,
} from '@/services/orderService';

const STATUS_LABELS: Record<OrderStatus, string> = {
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  confirmed: 'packed',
  packed: 'shipped',
  shipped: 'delivered',
};

export default function OrdersScreen() {
  const { role } = useAppContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!role) {
      setIsLoading(false);
      return;
    }
    let active = true;
    void getOrders()
      .then((data) => {
        if (active) setOrders(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof Error ? requestError.message : 'Orders could not be loaded.'
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [role]);

  const changeOrderStatus = async (
    order: Order,
    nextStatus: OrderStatus
  ) => {
    if (role !== 'admin' || updatingOrderId) return;

    setUpdatingOrderId(order.id);
    setError('');

    try {
      await updateOrderStatus(order.id, nextStatus);
      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === order.id
            ? { ...currentOrder, status: nextStatus }
            : currentOrder
        )
      );
      Alert.alert(
        'Order updated',
        `Order #${order.id} is now ${STATUS_LABELS[nextStatus]}.`
      );

      try {
        setOrders(await getOrders());
      } catch (refreshError) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : 'The updated orders could not be refreshed.'
        );
      }
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'The order status could not be updated.'
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (!role) return <Redirect href="/" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F1E8" />
      <Header title="Orders" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.state}>
            <ActivityIndicator color="#3B2416" />
            <Text style={styles.stateText}>Loading orders...</Text>
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!isLoading && !error && orders.length === 0 ? (
          <View style={styles.state}>
            <Ionicons name="receipt-outline" size={32} color="#6B4423" />
            <Text style={styles.stateText}>No orders yet.</Text>
          </View>
        ) : null}
        {orders.map((order) => (
          <View key={order.id} style={styles.order}>
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderId}>Order #{order.id}</Text>
                <Text style={styles.date}>{new Date(order.created_at).toLocaleString()}</Text>
              </View>
              <Text style={styles.status}>{STATUS_LABELS[order.status]}</Text>
            </View>
            {order.items.map((item) => (
              <Text key={`${order.id}-${item.product_id}`} style={styles.item}>
                Product {item.product_id} x {item.quantity}
              </Text>
            ))}
            <Text style={styles.total}>THB {order.total_amount.toLocaleString()}</Text>
            {role === 'admin' ? (
              <View style={styles.statusActions}>
                {NEXT_STATUS[order.status] ? (
                  <TouchableOpacity
                    style={[
                      styles.statusAction,
                      updatingOrderId !== null && styles.actionDisabled,
                    ]}
                    disabled={updatingOrderId !== null}
                    activeOpacity={0.85}
                    onPress={() =>
                      void changeOrderStatus(
                        order,
                        NEXT_STATUS[order.status] as OrderStatus
                      )
                    }
                  >
                    <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.statusActionText}>
                      {updatingOrderId === order.id
                        ? 'Updating...'
                        : `Mark as ${STATUS_LABELS[NEXT_STATUS[order.status] as OrderStatus]}`}
                    </Text>
                  </TouchableOpacity>
                ) : null}
                {order.status !== 'delivered' && order.status !== 'cancelled' ? (
                  <TouchableOpacity
                    style={[
                      styles.cancelAction,
                      updatingOrderId !== null && styles.actionDisabled,
                    ]}
                    disabled={updatingOrderId !== null}
                    activeOpacity={0.85}
                    onPress={() => void changeOrderStatus(order, 'cancelled')}
                  >
                    <Ionicons name="close-circle-outline" size={16} color="#8A4B22" />
                    <Text style={styles.cancelActionText}>
                      {updatingOrderId === order.id ? 'Updating...' : 'Cancel Order'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F1E8' },
  container: { width: '100%', maxWidth: 880, alignSelf: 'center', padding: 20, paddingBottom: 118, gap: 12 },
  state: { alignItems: 'center', gap: 10, padding: 24, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5D6C3' },
  stateText: { color: '#6B4423', fontSize: 13, fontWeight: '700' },
  error: { color: '#9A3D2E', backgroundColor: '#FFF4E8', borderRadius: 8, padding: 14, fontWeight: '700' },
  order: { padding: 16, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5D6C3' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  orderId: { color: '#3B2416', fontSize: 16, fontWeight: '900' },
  date: { color: '#8A7765', fontSize: 11, marginTop: 3 },
  status: { color: '#6B4423', backgroundColor: '#F2E6D6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, fontSize: 11, fontWeight: '900' },
  item: { color: '#6B4423', fontSize: 12, lineHeight: 19 },
  total: { color: '#3B2416', fontSize: 15, fontWeight: '900', textAlign: 'right', marginTop: 12 },
  statusActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderTopWidth: 1, borderTopColor: '#E5D6C3', paddingTop: 12, marginTop: 12 },
  statusAction: { minHeight: 38, borderRadius: 8, backgroundColor: '#3B2416', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  statusActionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  cancelAction: { minHeight: 38, borderRadius: 8, backgroundColor: '#FFF4E8', borderWidth: 1, borderColor: '#E5C4A6', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  cancelActionText: { color: '#8A4B22', fontSize: 11, fontWeight: '900' },
  actionDisabled: { opacity: 0.5 },
});
