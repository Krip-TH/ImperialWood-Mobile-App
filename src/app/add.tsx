import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomNavigation from '@/components/BottomNavigation';
import Header from '@/components/Header';
import ImagePicker from '@/components/ImagePicker';
import { getProductStatus, useAppContext } from '@/context/AppContext';

export default function AddProductScreen() {
  const router = useRouter();
  const {
    addProduct,
    addProductCategories,
    materialOptions,
    nextItemCode,
    role,
    sizeOptions,
    storeOptions,
  } = useAppContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [finish, setFinish] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [storeAvailability, setStoreAvailability] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [photoMessage, setPhotoMessage] = useState('No product photo selected');
  const [formMessage, setFormMessage] = useState('');

  const saveProduct = () => {
    const missingFields = [
      !name.trim() && 'Product Name',
      !description.trim() && 'Description',
      !selectedCategory && 'Door Category',
      !price.trim() && 'Price',
      !selectedMaterial && 'Door Material',
      !selectedSize && 'Door Size',
      !finish.trim() && 'Finish / Color',
      !stockQuantity.trim() && 'Stock Quantity',
      !storeAvailability && 'Store Availability',
    ].filter(Boolean);

    if (missingFields.length > 0) {
      setFormMessage(`Please complete: ${missingFields.join(', ')}`);
      return;
    }

    addProduct({
      id: nextItemCode,
      itemCode: nextItemCode,
      name: name.trim(),
      description: description.trim(),
      category: selectedCategory,
      price: `THB ${price.trim()}`,
      stockQuantity: stockQuantity.trim(),
      storeAvailability,
      material: selectedMaterial,
      size: selectedSize,
      finish: finish.trim(),
      image_url: selectedImageUri ?? undefined,
      status: getProductStatus(stockQuantity),
    });

    setName('');
    setDescription('');
    setSelectedCategory('');
    setSelectedMaterial('');
    setSelectedSize('');
    setFinish('');
    setPrice('');
    setStockQuantity('');
    setStoreAvailability('');
    setSelectedImageUri(null);
    setPhotoMessage('No product photo selected');
    setFormMessage('');
    router.push('/products');
  };

  if (!role) {
    return <Redirect href="/" />;
  }

  if (role !== 'admin') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F1E8" />
        {role ? <Header title="Add Door" /> : null}
        <View style={styles.deniedCard}>
          <Text style={styles.deniedText}>Access denied: Admin only.</Text>
        </View>
        <BottomNavigation />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F1E8" />
      <Header title="Add Door" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Add Door</Text>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Product Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter wooden door name"
              placeholderTextColor="#8B8B7A"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter wooden door description"
              placeholderTextColor="#8B8B7A"
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Door Category</Text>
            <View style={styles.optionGrid}>
              {addProductCategories.map((category) => {
                const isSelected = selectedCategory === category;

                return (
                  <TouchableOpacity
                    key={category}
                    style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={[styles.optionChipText, isSelected && styles.optionChipTextSelected]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Item Code</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={nextItemCode}
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Price</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="Enter price, e.g. 2990"
              placeholderTextColor="#8B8B7A"
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>Price will be shown as THB.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Stock Quantity</Text>
            <TextInput
              style={styles.input}
              value={stockQuantity}
              onChangeText={setStockQuantity}
              placeholder="Enter quantity in stock."
              placeholderTextColor="#8B8B7A"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Store Availability</Text>
            <View style={styles.optionGrid}>
              {storeOptions.map((option) => {
                const isSelected = storeAvailability === option;

                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                    activeOpacity={0.85}
                    onPress={() => setStoreAvailability(option)}
                  >
                    <Text
                      style={[styles.optionChipText, isSelected && styles.optionChipTextSelected]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Door Material</Text>
            <View style={styles.optionGrid}>
              {materialOptions.map((material) => {
                const isSelected = selectedMaterial === material;

                return (
                  <TouchableOpacity
                    key={material}
                    style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedMaterial(material)}
                  >
                    <Text
                      style={[styles.optionChipText, isSelected && styles.optionChipTextSelected]}
                    >
                      {material}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Door Size</Text>
            <View style={styles.optionGrid}>
              {sizeOptions.map((size) => {
                const isSelected = selectedSize === size;

                return (
                  <TouchableOpacity
                    key={size}
                    style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text
                      style={[styles.optionChipText, isSelected && styles.optionChipTextSelected]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Finish / Color</Text>
            <TextInput
              style={styles.input}
              value={finish}
              onChangeText={setFinish}
              placeholder="Enter finish or color"
              placeholderTextColor="#8B8B7A"
            />
          </View>

          <ImagePicker
            selectedImageUri={selectedImageUri}
            message={photoMessage}
            onSelectImage={setSelectedImageUri}
            onMessageChange={setPhotoMessage}
          />

          {formMessage ? <Text style={styles.formMessage}>{formMessage}</Text> : null}

          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9} onPress={saveProduct}>
            <Ionicons name="checkmark-circle-outline" size={19} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Save Door</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F1E8',
  },
  deniedCard: {
    margin: 20,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D6C3',
    padding: 18,
  },
  deniedText: {
    color: '#8A4B22',
    fontSize: 16,
    fontWeight: '900',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 112,
  },
  sectionTitle: {
    color: '#2B2118',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 12,
  },
  formCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D6C3',
    padding: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#3B2416',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  input: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D6C3',
    backgroundColor: '#FBFAF6',
    color: '#2B2118',
    paddingHorizontal: 12,
    fontSize: 14,
  },
  readOnlyInput: {
    backgroundColor: '#EFE9DD',
    color: '#3B2416',
    fontWeight: '800',
  },
  descriptionInput: {
    minHeight: 86,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  helperText: {
    color: '#6B6B6B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5D6C3',
    backgroundColor: '#FBFAF6',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  optionChipSelected: {
    borderColor: '#C89B3C',
    backgroundColor: '#3B2416',
  },
  optionChipText: {
    color: '#3B2416',
    fontSize: 13,
    fontWeight: '800',
  },
  optionChipTextSelected: {
    color: '#FFFFFF',
  },
  formMessage: {
    color: '#8A4B22',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginBottom: 12,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#3B2416',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
