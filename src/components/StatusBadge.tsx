import { StyleSheet, Text, View } from 'react-native';

import { ProductStatus } from '@/context/AppContext';

type StatusBadgeProps = {
  status: ProductStatus;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <View style={styles.statusBadge}>
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBadge: {
    borderRadius: 999,
    backgroundColor: '#F2E6D6',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: {
    color: '#3B2416',
    fontSize: 11,
    fontWeight: '900',
  },
});
