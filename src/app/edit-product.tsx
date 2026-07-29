import { Ionicons } from '@expo/vector-icons';
import {
  type Href,
  Redirect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { getProductStatus, type Product, useAppContext } from '@/context/AppContext';
import {
  getCategoryOptions,
  type CategoryOption,
} from '@/services/categoryService';
import {
  getProductById,
  updateProduct,
} from '@/services/productService';

const PRODUCT_STATUSES = ['active', 'inactive'] as const;

function numberValue(value: string): number {
  return Number(value.replace(/,/g, '').trim());
}

export default function EditProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const { role } = useAppContext();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [name, setName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [material, setMaterial] = useState('');
  const [size, setSize] = useState('');
  const [finish, setFinish] = useState('');
  const [locationText, setLocationText] = useState('');
  const [description, setDescription] = useState('');
  const [productStatus, setProductStatus] = useState('active');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState('');

  const badgeStatus = useMemo(
    () => getProductStatus(stockQuantity),
    [stockQuantity]
  );

  useEffect(() => {
    if (role !== 'admin') {
      setIsLoading(false);
      return;
    }

    if (!productId) {
      setFormMessage('A product ID is required.');
      setIsLoading(false);
      return;
    }

    let active = true;

    async function loadProduct() {
      try {
        const [product, categoryOptions] = await Promise.all([
          getProductById(productId as string),
          getCategoryOptions(),
        ]);

        if (!active) return;

        setCategories(categoryOptions);
        setName(product.name);
        setItemCode(product.itemCode);
        setCategoryId(product.categoryId ?? '');
        setPrice(product.price.replace(/[^0-9.]/g, ''));
        setStockQuantity(product.stockQuantity);
        setMaterial(product.material);
        setSize(product.size);
        setFinish(product.finish);
        setLocationText(product.storeAvailability);
        setDescription(product.description);
        setProductStatus(product.productStatus ?? 'active');
        setImageUrl(product.image_url ?? '');
      } catch (error) {
        if (active) {
          setFormMessage(
            error instanceof Error
              ? error.message
              : 'The product could not be loaded.'
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadProduct();

    return () => {
      active = false;
    };
  }, [productId, role]);

  async function saveProduct() {
    if (!productId || isSaving) return;

    const numericPrice = numberValue(price);
    const numericStock = numberValue(stockQuantity);
    const missingFields = [
      !name.trim() && 'Product Name',
      !itemCode.trim() && 'Item Code',
      !categoryId && 'Category',
      !material.trim() && 'Material',
      !size.trim() && 'Size',
      !finish.trim() && 'Finish',
    ].filter(Boolean);

    if (missingFields.length > 0) {
      setFormMessage(`Please complete: ${missingFields.join(', ')}`);
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setFormMessage('Price must be 0 or greater.');
      return;
    }

    if (!Number.isFinite(numericStock) || numericStock < 0) {
      setFormMessage('Stock must be 0 or greater.');
      return;
    }

    const category = categories.find(
      (option) => option.categoryId === categoryId
    );

    if (!category) {
      setFormMessage('Please select a valid category.');
      return;
    }

    const product: Product = {
      id: productId,
      name: name.trim(),
      itemCode: itemCode.trim(),
      category: category.name,
      categoryId,
      price: `THB ${numericPrice}`,
      stockQuantity: String(numericStock),
      storeAvailability: locationText.trim(),
      material: material.trim(),
      size: size.trim(),
      finish: finish.trim(),
      description: description.trim(),
      image_url: imageUrl.trim() || undefined,
      status: getProductStatus(String(numericStock)),
      productStatus,
    };

    setIsSaving(true);
    setFormMessage('');

    try {
      await updateProduct(productId, product);
      Alert.alert('Success', 'Product updated successfully.');
      router.replace({
        pathname: '/products',
        params: { refresh: Date.now().toString() },
      } as Href);
    } catch (error) {
      setFormMessage(
        error instanceof Error
          ? error.message
          : 'The product could not be updated.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (role !== 'admin') {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F1E8" />
      <Header title="Edit Door" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Edit Product</Text>

        {isLoading ? (
          <View style={styles.messageCard}>
            <ActivityIndicator color="#3B2416" />
            <Text style={styles.messageText}>Loading product...</Text>
          </View>
        ) : (
          <View style={styles.formCard}>
            <Field
              label="Product Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter wooden door name"
            />
            <Field
              label="Item Code"
              value={itemCode}
              onChangeText={setItemCode}
              placeholder="Enter item code"
            />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.optionGrid}>
                {categories.map((category) => {
                  const selected = category.categoryId === categoryId;
                  return (
                    <TouchableOpacity
                      key={category.categoryId}
                      style={[
                        styles.optionChip,
                        selected && styles.optionChipSelected,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => setCategoryId(category.categoryId)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          selected && styles.optionChipTextSelected,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Field
              label="Price"
              value={price}
              onChangeText={setPrice}
              placeholder="Enter price"
              keyboardType="decimal-pad"
            />
            <Field
              label="Stock Quantity"
              value={stockQuantity}
              onChangeText={setStockQuantity}
              placeholder="Enter quantity in stock"
              keyboardType="numeric"
            />
            <Field
              label="Material"
              value={material}
              onChangeText={setMaterial}
              placeholder="Enter material"
            />
            <Field
              label="Size"
              value={size}
              onChangeText={setSize}
              placeholder="Enter size"
            />
            <Field
              label="Finish"
              value={finish}
              onChangeText={setFinish}
              placeholder="Enter finish or color"
            />
            <Field
              label="Store Availability / Location Text"
              value={locationText}
              onChangeText={setLocationText}
              placeholder="Enter store availability"
            />
            <Field
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Enter product description"
              multiline
            />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Status</Text>
              <View style={styles.optionGrid}>
                {PRODUCT_STATUSES.map((status) => {
                  const selected = productStatus === status;
                  return (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.optionChip,
                        selected && styles.optionChipSelected,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => setProductStatus(status)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          selected && styles.optionChipTextSelected,
                        ]}
                      >
                        {status === 'active' ? 'Active' : 'Inactive'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Badge Status</Text>
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyText}>{badgeStatus}</Text>
              </View>
            </View>

            <Field
              label="Image URL or Existing Image Path"
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="assets/products/example.jpg or https://..."
              autoCapitalize="none"
            />

            {formMessage ? (
              <Text style={styles.formMessage}>{formMessage}</Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                isSaving && styles.buttonDisabled,
              ]}
              activeOpacity={0.9}
              disabled={isSaving}
              onPress={() => void saveProduct()}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={19}
                color="#FFFFFF"
              />
              <Text style={styles.primaryButtonText}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad' | 'numeric';
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

function Field({
  label,
  multiline = false,
  ...inputProps
}: FieldProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        {...inputProps}
        style={[styles.input, multiline && styles.descriptionInput]}
        placeholderTextColor="#8B8B7A"
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F1E8',
  },
  container: {
    width: '100%',
    maxWidth: 880,
    alignSelf: 'center',
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
  messageCard: {
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D6C3',
  },
  messageText: {
    color: '#3B2416',
    fontSize: 14,
    fontWeight: '700',
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
  descriptionInput: {
    minHeight: 86,
    paddingTop: 12,
    textAlignVertical: 'top',
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
  readOnlyField: {
    minHeight: 46,
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5D6C3',
    backgroundColor: '#EFE9DD',
    paddingHorizontal: 12,
  },
  readOnlyText: {
    color: '#3B2416',
    fontSize: 14,
    fontWeight: '800',
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
  buttonDisabled: {
    opacity: 0.65,
  },
});
