import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type DashboardCardProps = {
  label: string;
  value?: string;
  onPress?: () => void;
  icon?: ComponentProps<typeof Ionicons>['name'];
};

export default function DashboardCard({ label, value, onPress, icon }: DashboardCardProps) {
  const content = (
    <>
      <View style={styles.cardTop}>
        <View style={styles.iconShell}>
          <Ionicons name={icon ?? 'cube-outline'} size={20} color="#3B2416" />
        </View>
        {value ? <Text style={styles.summaryValue}>{value}</Text> : null}
      </View>
      <Text style={value ? styles.summaryLabel : styles.controlText}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.86} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    minHeight: 112,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5D6C3',
    shadowColor: '#3B2416',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconShell: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F2E6D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    color: '#3B2416',
    fontSize: 30,
    fontWeight: '900',
  },
  summaryLabel: {
    color: '#6B4423',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  controlText: {
    color: '#3B2416',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
  },
});
