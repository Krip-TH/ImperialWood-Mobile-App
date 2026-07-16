import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  active: boolean;
  onPress: () => void;
};

export default function CategoryIcon({ label, icon, active, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.item} activeOpacity={0.82} onPress={onPress}>
      <View style={[styles.circle, active && styles.circleActive]}>
        <Ionicons name={icon} size={23} color={active ? '#FFFFFF' : '#6B4423'} />
      </View>
      <Text numberOfLines={1} style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: { width: 78, alignItems: 'center' },
  circle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D6C3',
  },
  circleActive: { backgroundColor: '#3B2416', borderColor: '#C89B3C', borderWidth: 2 },
  label: { marginTop: 7, color: '#8A7765', fontSize: 11, fontWeight: '700' },
  labelActive: { color: '#3B2416', fontWeight: '900' },
});
