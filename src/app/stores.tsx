import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ImageSourcePropType,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomNavigation from '@/components/BottomNavigation';
import Header from '@/components/Header';
import { useAppContext } from '@/context/AppContext';
import { getStores, StoreRecord } from '@/services/storeService';

type Store = StoreRecord;

const LEGACY_STORAGE_KEY = 'imperialwood_stores';
const STORAGE_KEYS: Record<string, string> = {
  phuket: 'imperialwood_store_phuket',
  melbourne: 'imperialwood_store_melbourne',
  'new-york': 'imperialwood_store_newyork',
};
const MAX_STORE_JSON_BYTES = 1_500_000;

const storeImageMap: Record<string, ImageSourcePropType> = {
  'assets/stores/phuket-1.jpg': require('../../assets/stores/phuket-1.jpg'),
  'assets/stores/phuket-2.jpg': require('../../assets/stores/phuket-2.jpg'),
  'assets/stores/phuket-3.jpg': require('../../assets/stores/phuket-3.jpg'),
  'assets/stores/melbourne-1.jpg': require('../../assets/stores/melbourne-1.jpg'),
  'assets/stores/melbourne-2.jpg': require('../../assets/stores/melbourne-2.jpg'),
  'assets/stores/melbourne-3.jpg': require('../../assets/stores/melbourne-3.jpg'),
  'assets/stores/new-york-1.jpg': require('../../assets/stores/new-york-1.jpg'),
  'assets/stores/new-york-2.jpg': require('../../assets/stores/new-york-2.jpg'),
  'assets/stores/new-york-3.jpg': require('../../assets/stores/new-york-3.jpg'),
};

const phuketDefaultImages: ImageSourcePropType[] = [
  storeImageMap['assets/stores/phuket-1.jpg'],
  storeImageMap['assets/stores/phuket-2.jpg'],
  storeImageMap['assets/stores/phuket-3.jpg'],
];

const melbourneDefaultImages: ImageSourcePropType[] = [
  storeImageMap['assets/stores/melbourne-1.jpg'],
  storeImageMap['assets/stores/melbourne-2.jpg'],
  storeImageMap['assets/stores/melbourne-3.jpg'],
];

const newYorkDefaultImages: ImageSourcePropType[] = [
  storeImageMap['assets/stores/new-york-1.jpg'],
  storeImageMap['assets/stores/new-york-2.jpg'],
  storeImageMap['assets/stores/new-york-3.jpg'],
];

const defaultImages: Record<string, ImageSourcePropType[]> = {
  phuket: phuketDefaultImages,
  melbourne: melbourneDefaultImages,
  'new-york': newYorkDefaultImages,
};
const fallbackStoreImages = [
  phuketDefaultImages,
  melbourneDefaultImages,
  newYorkDefaultImages,
];

const initialStores: Store[] = [
  {
    id: 'phuket', city: 'Phuket', country: 'Thailand', employees: '18', items: '245',
    orders: '14', refunds: '2', mostSoldProduct: 'Imperial Classic Oak Door',
    popularCategory: 'Entrance Doors', satisfaction: '96%',
    businessDays: 'Monday - Saturday', openingTime: '09:00', closingTime: '18:00',
    closedDay: 'Sunday', timezone: 'GMT+7',
    images: [],
  },
  {
    id: 'melbourne', city: 'Melbourne', country: 'Australia', employees: '22', items: '318',
    orders: '19', refunds: '1', mostSoldProduct: 'Modern Walnut Entrance Door',
    popularCategory: 'Modern Doors', satisfaction: '94%',
    businessDays: 'Monday - Friday', openingTime: '09:00', closingTime: '17:30',
    closedDay: 'Saturday and Sunday', timezone: 'GMT+10',
    images: [],
  },
  {
    id: 'new-york', city: 'New York City', country: 'USA', employees: '27', items: '402',
    orders: '25', refunds: '3', mostSoldProduct: 'Premium Teak Glass Panel Door',
    popularCategory: 'Glass Panel Doors', satisfaction: '92%',
    businessDays: 'Monday - Saturday', openingTime: '10:00', closingTime: '19:00',
    closedDay: 'Sunday', timezone: 'GMT-4',
    images: [],
  },
];

const editableFields: { key: Exclude<keyof Store, 'id' | 'images'>; label: string; keyboard?: 'numeric' }[] = [
  { key: 'city', label: 'City' }, { key: 'country', label: 'Country' },
  { key: 'employees', label: 'Employees', keyboard: 'numeric' },
  { key: 'items', label: 'Total items', keyboard: 'numeric' },
  { key: 'orders', label: 'Orders', keyboard: 'numeric' },
  { key: 'refunds', label: 'Refunds', keyboard: 'numeric' },
  { key: 'mostSoldProduct', label: 'Most sold product' },
  { key: 'popularCategory', label: 'Most popular category' },
  { key: 'satisfaction', label: 'Customer satisfaction' },
  { key: 'businessDays', label: 'Business days' },
  { key: 'openingTime', label: 'Opening time' },
  { key: 'closingTime', label: 'Closing time' },
  { key: 'closedDay', label: 'Closed day' },
  { key: 'timezone', label: 'Local timezone' },
];

export default function StoresScreen() {
  const { role } = useAppContext();
  const { width } = useWindowDimensions();
  const [stores, setStores] = useState(initialStores);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Store | null>(null);
  const [statusClock, setStatusClock] = useState(() => new Date());

  useEffect(() => {
    let active = true;
    const loadStores = async () => {
      try {
        const remoteStores = await getStores();
        if (active && remoteStores.length > 0) {
          setStores(remoteStores);
          setIsLoading(false);
          return;
        }
        throw new Error('The API returned no stores.');
      } catch (apiError) {
        console.warn('Using locally saved store data:', apiError);
      }

      try {
        const savedStores = await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));
        if (__DEV__) console.log('Loaded stores from storage', savedStores);
        if (active) {
          const savedByKey = new Map(savedStores);
          setStores(initialStores.map((defaultStore) => {
            const saved = savedByKey.get(STORAGE_KEYS[defaultStore.id]);
            if (!saved) return defaultStore;
            const parsed = JSON.parse(saved) as Store;
            return {
              ...defaultStore,
              ...parsed,
              id: defaultStore.id,
              images: Array.isArray(parsed.images)
                ? parsed.images.filter((image): image is string => typeof image === 'string').slice(0, 3)
                : [],
            };
          }));
        }
        await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch (error) {
        console.error('Unable to load stores from storage', error);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadStores();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setStatusClock(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  if (!role) return <Redirect href="/" />;

  const cardWidth = width >= 900 ? '31%' : '100%';

  const commitStore = (updatedStore: Store) => {
    const previousStore = stores.find((store) => store.id === updatedStore.id);
    setStores((current) => current.map((store) => store.id === updatedStore.id ? updatedStore : store));
    void persistStore(updatedStore).then((saved) => {
      if (!saved && previousStore) {
        setStores((current) => current.map((store) => store.id === previousStore.id ? previousStore : store));
      }
    });
  };

  const pickPhotos = async (storeId: string) => {
    const store = stores.find((item) => item.id === storeId);
    const remaining = 3 - (store?.images.length ?? 0);
    if (remaining === 0) {
      Alert.alert('Photo limit reached', 'Remove a photo before selecting another.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: remaining,
      quality: 1,
    });
    if (!result.canceled) {
      try {
        const selected = await Promise.all(result.assets.slice(0, remaining).map(async (asset) => {
          const compressedUri = await compressPhoto(asset);
          return persistCompressedPhoto(compressedUri, storeId);
        }));
        if (store) commitStore({ ...store, images: [...store.images, ...selected].slice(0, 3) });
      } catch (error) {
        console.error('Unable to process selected image', error);
        Alert.alert('Image is too large. Please choose a smaller image.');
      }
    }
  };

  const startEditing = (store: Store) => { setEditingId(store.id); setDraft({ ...store }); };
  const saveStore = () => {
    if (!draft) return;
    commitStore(draft);
    setEditingId(null);
    setDraft(null);
  };

  const removeStorePhoto = async (store: Store, photoIndex: number) => {
    const photoUri = store.images[photoIndex];
    if (photoUri) await deleteManagedPhoto(photoUri);
    commitStore({ ...store, images: store.images.filter((_, index) => index !== photoIndex) });
  };

  const resetStorePhotos = async (store: Store) => {
    await Promise.all(store.images.map(deleteManagedPhoto));
    commitStore({ ...store, images: [] });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F1E8" />
      <Header title="Stores" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.pageHeading, width < 600 && styles.pageHeadingMobile]}>
          <View style={styles.pageHeadingCopy}>
            <Text style={styles.eyebrow}>GLOBAL SHOWROOMS</Text>
            <Text style={styles.pageTitle}>ImperialWood Stores</Text>
            <Text style={styles.pageSubtitle}>Three destinations for timeless wooden craftsmanship.</Text>
          </View>
          <View style={styles.storeCount}><Text style={styles.storeCountNumber}>3</Text><Text style={styles.storeCountLabel}>STORES</Text></View>
        </View>

        <View style={styles.grid}>
          {!isLoading && stores.map((store, storeIndex) => {
            const isEditing = role === 'admin' && editingId === store.id && draft;
            const isOpen = isStoreOpen(store, statusClock);
            const databasePhotos = store.images.map(resolveStoreImage);
            const storePhotos = databasePhotos.length > 0
              ? databasePhotos
              : (defaultImages[store.id] ?? fallbackStoreImages[storeIndex % fallbackStoreImages.length]);
            return (
              <View key={store.id} style={[styles.card, { width: cardWidth }]}>
                <View style={styles.photoRow}>
                  {[0, 1, 2].map((index) => {
                    const photo = storePhotos[index];
                    return (
                      <View key={`${store.id}-photo-${index}`} style={styles.photoSlot}>
                        {photo ? <Image source={photo} style={styles.photo} resizeMode="cover" /> : (
                          <View style={styles.placeholder}><Ionicons name="image-outline" size={25} color="#B99A70" /><Text style={styles.placeholderText}>PHOTO</Text></View>
                        )}
                      </View>
                    );
                  })}
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.titleRow}>
                    <View style={styles.locationIcon}><Ionicons name="location" size={19} color="#C89B3C" /></View>
                    <View style={styles.locationCopy}><Text style={styles.city}>{isEditing ? draft.city : store.city}</Text><Text style={styles.country}>{isEditing ? draft.country : store.country}</Text></View>
                    <View style={[styles.statusBadge, !isOpen && styles.statusBadgeClosed]}><View style={[styles.statusDot, !isOpen && styles.statusDotClosed]} /><Text style={[styles.statusText, !isOpen && styles.statusTextClosed]}>{isOpen ? 'Open' : 'Closed'}</Text></View>
                  </View>

                  {isEditing ? (
                    <View style={styles.form}>
                      {editableFields.map((field) => (
                        <View key={field.key} style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>{field.label}</Text>
                          <TextInput value={draft[field.key]} keyboardType={field.keyboard} onChangeText={(value) => setDraft({ ...draft, [field.key]: value })} style={styles.input} />
                        </View>
                      ))}
                    </View>
                  ) : (
                    <>
                      <View style={styles.hoursSection}>
                        <View style={styles.hoursHeading}>
                          <Ionicons name="time-outline" size={17} color="#B07C2E" />
                          <Text style={styles.hoursTitle}>Business Hours</Text>
                        </View>
                        <View style={styles.hoursCards}>
                          <View style={[styles.hoursCard, styles.hoursCardWide]}>
                            <Ionicons name="calendar-outline" size={17} color="#B07C2E" />
                            <View style={styles.hoursCopy}>
                              <Text style={styles.hoursLabel}>BUSINESS DAYS</Text>
                              <Text style={styles.hoursValue}>{store.businessDays}</Text>
                              <Text style={styles.hoursTime}>{store.openingTime} - {store.closingTime}</Text>
                            </View>
                          </View>
                          <View style={styles.hoursCard}>
                            <Ionicons name="calendar-clear-outline" size={17} color="#B07C2E" />
                            <View style={styles.hoursCopy}>
                              <Text style={styles.hoursLabel}>CLOSED</Text>
                              <Text style={styles.hoursValue}>{store.closedDay}</Text>
                            </View>
                          </View>
                          <View style={styles.hoursCard}>
                            <Ionicons name="globe-outline" size={17} color="#B07C2E" />
                            <View style={styles.hoursCopy}>
                              <Text style={styles.hoursLabel}>TIMEZONE</Text>
                              <Text style={styles.hoursValue}>{store.timezone}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                      <View style={styles.metrics}>
                        {[
                          ['people-outline', store.employees, 'Employees'], ['cube-outline', store.items, 'Total items'],
                          ['receipt-outline', store.orders, 'Orders'], ['return-down-back-outline', store.refunds, 'Refunds'],
                        ].map(([icon, value, label]) => (
                          <View key={label} style={styles.metric}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={17} color="#9B6B32" /><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>
                        ))}
                      </View>
                      <View style={styles.detailList}>
                        <Detail icon="ribbon-outline" label="Most sold product" value={store.mostSoldProduct} />
                        <Detail icon="grid-outline" label="Most popular category" value={store.popularCategory} />
                        <Detail icon="happy-outline" label="Customer satisfaction" value={store.satisfaction} accent />
                      </View>
                    </>
                  )}

                  {role === 'admin' && (
                    <>
                      {store.images.length > 0 && (
                        <View style={styles.previewSection}>
                          <Text style={styles.previewTitle}>Local photo previews</Text>
                          <Text style={styles.previewHelper}>Uploaded photos are local previews until backend storage is connected.</Text>
                          <View style={styles.previewRow}>
                            {store.images.map((photoUri, index) => (
                              <View key={photoUri} style={styles.previewSlot}>
                                <Image source={resolveStoreImage(photoUri)} style={styles.photo} resizeMode="cover" />
                                <TouchableOpacity accessibilityLabel="Remove preview photo" style={styles.removeButton} onPress={() => void removeStorePhoto(store, index)}>
                                  <Ionicons name="close" size={12} color="#FFFFFF" />
                                  <Text style={styles.removeButtonText}>Remove Photo</Text>
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                      <View style={styles.actions}>
                      {isEditing ? (
                        <><TouchableOpacity style={styles.primaryButton} onPress={saveStore}><Ionicons name="checkmark" size={18} color="#FFFFFF" /><Text style={styles.primaryButtonText}>Save Changes</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => { setEditingId(null); setDraft(null); }}><Text style={styles.secondaryButtonText}>Cancel</Text></TouchableOpacity></>
                      ) : (
                        <><TouchableOpacity style={styles.primaryButton} onPress={() => startEditing(store)}><Ionicons name="create-outline" size={18} color="#FFFFFF" /><Text style={styles.primaryButtonText}>Edit Store</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => pickPhotos(store.id)}><Ionicons name="cloud-upload-outline" size={18} color="#6B4423" /><Text style={styles.secondaryButtonText}>Upload Store Photos</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => void resetStorePhotos(store)}><Ionicons name="refresh-outline" size={18} color="#6B4423" /><Text style={styles.secondaryButtonText}>Reset Store Photos</Text></TouchableOpacity></>
                      )}
                      </View>
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
}

async function compressPhoto(asset: ImagePicker.ImagePickerAsset): Promise<string> {
  const scale = Math.min(1, 700 / asset.width, 500 / asset.height);
  const width = Math.max(1, Math.round(asset.width * scale));
  const height = Math.max(1, Math.round(asset.height * scale));
  const context = ImageManipulator.ImageManipulator.manipulate(asset.uri);
  context.resize({ width, height });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    compress: 0.55,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: Platform.OS === 'web',
  });
  if (Platform.OS === 'web') {
    if (!result.base64) throw new Error('Compressed image did not include base64 data');
    return `data:image/jpeg;base64,${result.base64}`;
  }
  return result.uri;
}

function resolveStoreImage(photoUrl: string): ImageSourcePropType {
  return storeImageMap[photoUrl] ?? { uri: photoUrl };
}

let lastPhotoTimestamp = 0;

function nextPhotoTimestamp(): number {
  lastPhotoTimestamp = Math.max(Date.now(), lastPhotoTimestamp + 1);
  return lastPhotoTimestamp;
}

async function persistCompressedPhoto(uri: string, storeId: string): Promise<string> {
  if (Platform.OS === 'web') return uri;
  const storesDirectory = new Directory(Paths.document, 'stores');
  storesDirectory.create({ idempotent: true, intermediates: true });
  const sourceFile = new File(uri);
  const destinationFile = new File(
    storesDirectory,
    `${storeId}_${nextPhotoTimestamp()}.jpg`
  );
  await sourceFile.copy(destinationFile);
  return destinationFile.uri;
}

async function deleteManagedPhoto(uri: string): Promise<void> {
  if (Platform.OS === 'web' || !uri.startsWith('file:')) return;
  try {
    const storesDirectory = new Directory(Paths.document, 'stores');
    if (!uri.startsWith(storesDirectory.uri)) return;
    const photoFile = new File(uri);
    if (photoFile.exists) photoFile.delete();
  } catch (error) {
    console.warn('Unable to delete store photo file', error);
  }
}

const timeZoneAliases: Record<string, string> = {
  'GMT+7': 'Asia/Bangkok',
  'GMT+10': 'Australia/Melbourne',
  'GMT-4': 'America/New_York',
};

function isStoreOpen(store: Store, now: Date): boolean {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZoneAliases[store.timezone] ?? store.timezone,
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(now);
    const weekday = parts.find((part) => part.type === 'weekday')?.value;
    const hour = Number(parts.find((part) => part.type === 'hour')?.value);
    const minute = Number(parts.find((part) => part.type === 'minute')?.value);
    if (!weekday || Number.isNaN(hour) || Number.isNaN(minute)) return false;
    if (store.closedDay.toLowerCase().includes(weekday.toLowerCase())) return false;

    const currentMinutes = hour * 60 + minute;
    const openingMinutes = parseTime(store.openingTime);
    const closingMinutes = parseTime(store.closingTime);
    if (openingMinutes === null || closingMinutes === null) return false;
    return currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
  } catch (error) {
    console.error('Unable to calculate store status', error);
    return false;
  }
}

function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

async function persistStore(store: Store): Promise<boolean> {
  const storageKey = STORAGE_KEYS[store.id];
  if (!storageKey) return false;
  const serialized = JSON.stringify(store);
  const size = typeof TextEncoder === 'undefined'
    ? serialized.length * 2
    : new TextEncoder().encode(serialized).byteLength;
  if (size > MAX_STORE_JSON_BYTES) {
    Alert.alert('Image is too large. Please choose a smaller image.');
    return false;
  }
  try {
    await AsyncStorage.setItem(storageKey, serialized);
    return true;
  } catch (error) {
    console.error('Unable to save store', error);
    const errorName = error instanceof Error ? error.name : '';
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorName === 'QuotaExceededError' || errorMessage.includes('quota')) {
      Alert.alert('Storage is full. Remove some store photos or upload smaller images.');
    } else {
      Alert.alert('Save failed', 'The store changes could not be saved on this device.');
    }
    return false;
  }
}

function Detail({ icon, label, value, accent = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; accent?: boolean }) {
  return <View style={styles.detail}><View style={styles.detailIcon}><Ionicons name={icon} size={16} color="#9B6B32" /></View><View style={styles.detailCopy}><Text style={styles.detailLabel}>{label}</Text><Text style={[styles.detailValue, accent && styles.goldText]}>{value}</Text></View></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F1E8' },
  scrollView: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 150, maxWidth: 1480, width: '100%', alignSelf: 'center' },
  pageHeading: { width: '100%', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, gap: 16 },
  pageHeadingMobile: { flexDirection: 'column', alignItems: 'stretch' },
  pageHeadingCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: '#B07C2E', fontSize: 11, fontWeight: '900', letterSpacing: 2.2, marginBottom: 5 },
  pageTitle: { color: '#3B2416', fontSize: 28, lineHeight: 34, fontWeight: '900' },
  pageSubtitle: { color: '#80634A', fontSize: 14, lineHeight: 20, marginTop: 5 },
  storeCount: { backgroundColor: '#3B2416', borderRadius: 18, paddingVertical: 9, paddingHorizontal: 16, alignItems: 'center' },
  storeCountNumber: { color: '#D8AC52', fontSize: 20, fontWeight: '900' }, storeCountLabel: { color: '#F7F1E8', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  grid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 18, alignItems: 'flex-start' },
  card: { maxWidth: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#E5D6C3', shadowColor: '#3B2416', shadowOffset: { width: 0, height: 9 }, shadowOpacity: 0.09, shadowRadius: 18, elevation: 4 },
  photoRow: { flexDirection: 'row', height: 145, gap: 3, backgroundColor: '#EADBC7' },
  photoSlot: { flex: 1, flexBasis: 0, position: 'relative', backgroundColor: '#EEE2D2' }, photo: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5 }, placeholderText: { color: '#A68862', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  removeButton: { position: 'absolute', right: 4, top: 5, minHeight: 25, borderRadius: 13, paddingHorizontal: 6, backgroundColor: 'rgba(76,42,25,0.92)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, borderWidth: 1, borderColor: '#D8AC52' },
  removeButtonText: { color: '#FFFFFF', fontSize: 7, fontWeight: '900' },
  cardBody: { padding: 18 }, titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  locationIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F7F0E5', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  locationCopy: { flex: 1 }, city: { color: '#3B2416', fontSize: 20, fontWeight: '900' }, country: { color: '#8B6B50', fontSize: 12, fontWeight: '700', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EDF6EC', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6 },
  statusBadgeClosed: { backgroundColor: '#FBE9E7' },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4C8B4B' },
  statusDotClosed: { backgroundColor: '#B84A3F' },
  statusText: { color: '#39703A', fontSize: 11, fontWeight: '900' },
  statusTextClosed: { color: '#9F392F' },
  hoursSection: { marginBottom: 16 },
  hoursHeading: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  hoursTitle: { color: '#3B2416', fontSize: 13, fontWeight: '900' },
  hoursCards: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hoursCard: { width: '48.5%', minHeight: 64, borderRadius: 14, backgroundColor: '#F8F1E7', borderWidth: 1, borderColor: '#E9D8BE', padding: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  hoursCardWide: { width: '100%' },
  hoursCopy: { flex: 1 },
  hoursLabel: { color: '#9A8068', fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  hoursValue: { color: '#3B2416', fontSize: 12, lineHeight: 16, fontWeight: '800', marginTop: 2 },
  hoursTime: { color: '#9B6B32', fontSize: 13, lineHeight: 17, fontWeight: '900', marginTop: 2 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  metric: { width: '48.5%', minHeight: 78, borderRadius: 15, backgroundColor: '#FAF6F0', borderWidth: 1, borderColor: '#EEE1D1', padding: 11 }, metricValue: { color: '#3B2416', fontSize: 18, fontWeight: '900', marginTop: 4 }, metricLabel: { color: '#8B6B50', fontSize: 10, fontWeight: '700', marginTop: 1 },
  detailList: { borderTopWidth: 1, borderTopColor: '#EEE2D4', paddingTop: 5 }, detail: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F2E9DE' }, detailIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: '#F7F0E5', alignItems: 'center', justifyContent: 'center', marginRight: 10 }, detailCopy: { flex: 1 }, detailLabel: { color: '#9A8068', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 }, detailValue: { color: '#4A3020', fontSize: 13, lineHeight: 18, fontWeight: '800', marginTop: 2 }, goldText: { color: '#A57221', fontSize: 17 },
  previewSection: { marginTop: 17, gap: 7 },
  previewTitle: { color: '#3B2416', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  previewHelper: { color: '#80634A', fontSize: 11, lineHeight: 16 },
  previewRow: { flexDirection: 'row', height: 100, gap: 3, backgroundColor: '#EADBC7', borderRadius: 12, overflow: 'hidden' },
  previewSlot: { flex: 1, flexBasis: 0, position: 'relative', backgroundColor: '#EEE2D2' },
  actions: { marginTop: 17, gap: 9 }, primaryButton: { minHeight: 46, borderRadius: 14, backgroundColor: '#3B2416', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  secondaryButton: { minHeight: 45, borderRadius: 14, backgroundColor: '#F7F0E5', borderWidth: 1, borderColor: '#D8B875', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, secondaryButtonText: { color: '#6B4423', fontSize: 12, fontWeight: '900' },
  form: { gap: 10 }, inputGroup: { gap: 4 }, inputLabel: { color: '#80634A', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }, input: { minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: '#DDC7A8', backgroundColor: '#FCF9F5', color: '#3B2416', paddingHorizontal: 12, fontSize: 13, fontWeight: '700' },
});
