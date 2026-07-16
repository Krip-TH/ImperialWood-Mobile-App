import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type CategoryCardProps = {
  name: string;
  onPress: () => void;
};

const categoryIcons: Record<string, ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  'Solid Wood Doors': 'door',
  'Modern Doors': 'door-sliding',
  'Classic Doors': 'door-closed',
  'Glass Panel Doors': 'door-sliding',
  'Entrance Doors': 'home-import-outline',
  'Interior Doors': 'home-floor-1',
  'Door Frames': 'border-style',
  Accessories: 'hammer-screwdriver',
};

export default function CategoryCard({ name, onPress }: CategoryCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.categoryCard,
        pressed && styles.categoryCardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.iconShell}>
        <MaterialCommunityIcons
          name={categoryIcons[name] ?? 'door-closed'}
          size={25}
          color="#3B2416"
        />
      </View>
      <Text style={styles.categoryText}>{name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  categoryCard: {
    width: '48%',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D6C3',
    padding: 16,
    minHeight: 118,
    justifyContent: 'space-between',
    shadowColor: '#3B2416',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  categoryCardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  iconShell: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F2E6D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  categoryText: {
    color: '#3B2416',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
});
