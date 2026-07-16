import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onOpenFilters: () => void;
  onClear: () => void;
};

export default function SearchBar({ value, onChangeText, onOpenFilters, onClear }: Props) {
  return (
    <View style={styles.shell}>
      <Ionicons name="search-outline" size={21} color="#8A7765" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search doors, materials, styles..."
        placeholderTextColor="#8A7765"
        style={styles.input}
        returnKeyType="search"
      />
      {value ? (
        <TouchableOpacity accessibilityLabel="Clear search" onPress={onClear} style={styles.smallButton}>
          <Ionicons name="close-circle" size={20} color="#8A7765" />
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity accessibilityLabel="Open filters" onPress={onOpenFilters} style={styles.filterButton}>
        <Ionicons name="options-outline" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D6C3',
    shadowColor: '#3B2416',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  input: { flex: 1, minWidth: 0, paddingHorizontal: 11, color: '#3B2416', fontSize: 14 },
  smallButton: { padding: 6 },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B2416',
  },
});
