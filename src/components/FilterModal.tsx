import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { ProductStatus } from '@/context/AppContext';

export type SortOption = 'Default' | 'Price: Low to High' | 'Price: High to Low' | 'Name: A-Z' | 'Stock: High to Low';
export type PriceRange = 'All prices' | 'Under THB 20,000' | 'THB 20,000–25,000' | 'Over THB 25,000';
export type HomeFilters = {
  category: string;
  material: string;
  priceRange: PriceRange;
  availability: ProductStatus | 'All';
  storeAvailability: 'All' | 'In stores' | 'Online only';
  sort: SortOption;
};

export const defaultFilters: HomeFilters = {
  category: 'All', material: 'All', priceRange: 'All prices', availability: 'All', storeAvailability: 'All', sort: 'Default',
};

type Props = { visible: boolean; value: HomeFilters; onClose: () => void; onApply: (filters: HomeFilters) => void };

const categories = ['All', 'Entrance Doors', 'Interior Doors', 'Classic Doors', 'Modern Doors', 'Glass Panel Doors'];
const materials = ['All', 'Teak', 'Oak', 'Walnut', 'Ash', 'Mahogany', 'Engineered Wood'];
const prices: PriceRange[] = ['All prices', 'Under THB 20,000', 'THB 20,000–25,000', 'Over THB 25,000'];
const availability: HomeFilters['availability'][] = ['All', 'Available', 'Low Stock', 'Out of Stock'];
const stores: HomeFilters['storeAvailability'][] = ['All', 'In stores', 'Online only'];
const sorts: SortOption[] = ['Default', 'Price: Low to High', 'Price: High to Low', 'Name: A-Z', 'Stock: High to Low'];

export default function FilterModal({ visible, value, onClose, onApply }: Props) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { if (visible) setDraft(value); }, [value, visible]);

  const choice = <K extends keyof HomeFilters>(key: K, options: HomeFilters[K][]) => (
    <View style={styles.choices}>
      {options.map((option) => {
        const active = draft[key] === option;
        return (
          <TouchableOpacity key={String(option)} style={[styles.chip, active && styles.chipActive]} onPress={() => setDraft((current) => ({ ...current, [key]: option }))}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{String(option)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.panel}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View><Text style={styles.title}>Filter Doors</Text><Text style={styles.subtitle}>Refine your collection</Text></View>
            <TouchableOpacity style={styles.close} onPress={onClose}><Ionicons name="close" size={20} color="#3B2416" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Category</Text>{choice('category', categories)}
            <Text style={styles.label}>Material</Text>{choice('material', materials)}
            <Text style={styles.label}>Price range</Text>{choice('priceRange', prices)}
            <Text style={styles.label}>Availability</Text>{choice('availability', availability)}
            <Text style={styles.label}>Store availability</Text>{choice('storeAvailability', stores)}
            <Text style={styles.label}>Sort by</Text>{choice('sort', sorts)}
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.reset} onPress={() => setDraft(defaultFilters)}><Text style={styles.resetText}>Reset Filters</Text></TouchableOpacity>
            <TouchableOpacity style={styles.apply} onPress={() => { onApply(draft); onClose(); }}><Text style={styles.applyText}>Apply Filters</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(43, 25, 14, 0.48)' },
  panel: { maxHeight: '90%', width: '100%', maxWidth: 720, alignSelf: 'center', backgroundColor: '#F7F1E8', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 10 },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#D2C0AA', alignSelf: 'center', marginBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  title: { color: '#3B2416', fontSize: 23, fontWeight: '900' },
  subtitle: { color: '#8A7765', fontSize: 12, marginTop: 2 },
  close: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingBottom: 12 },
  label: { color: '#3B2416', fontSize: 13, fontWeight: '900', marginTop: 14, marginBottom: 9 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 20, borderWidth: 1, borderColor: '#E5D6C3', backgroundColor: '#FFFFFF', paddingHorizontal: 13, paddingVertical: 9 },
  chipActive: { backgroundColor: '#3B2416', borderColor: '#C89B3C' },
  chipText: { color: '#6B4423', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#FFFFFF' },
  actions: { flexDirection: 'row', gap: 10, padding: 20, borderTopWidth: 1, borderTopColor: '#E5D6C3', backgroundColor: '#FFFFFF' },
  reset: { flex: 1, minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: '#E5D6C3', alignItems: 'center', justifyContent: 'center' },
  resetText: { color: '#3B2416', fontSize: 13, fontWeight: '900' },
  apply: { flex: 1.35, minHeight: 48, borderRadius: 16, backgroundColor: '#3B2416', alignItems: 'center', justifyContent: 'center' },
  applyText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
});
