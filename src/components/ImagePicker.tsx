import * as ExpoImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ImagePickerProps = {
  selectedImageUri: string | null;
  message: string;
  onSelectImage: (uri: string) => void;
  onMessageChange: (message: string) => void;
};

export default function ImagePicker({
  selectedImageUri,
  message,
  onSelectImage,
  onMessageChange,
}: ImagePickerProps) {
  const chooseProductPhoto = async () => {
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    const fileName = asset.fileName?.toLowerCase() ?? '';
    const mimeType = asset.mimeType?.toLowerCase() ?? '';
    const isAllowedImage =
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg') ||
      fileName.endsWith('.png') ||
      mimeType === 'image/jpeg' ||
      mimeType === 'image/png';

    if (!isAllowedImage && (fileName || mimeType)) {
      onMessageChange('Please choose a JPG, JPEG, or PNG image');
      return;
    }

    onSelectImage(asset.uri);
    onMessageChange('Product photo selected');
  };

  return (
    <>
      <Text style={styles.inputLabel}>Product Photo</Text>
      <TouchableOpacity style={styles.photoButton} activeOpacity={0.9} onPress={chooseProductPhoto}>
        <Ionicons name="image-outline" size={18} color="#FFFFFF" />
        <Text style={styles.photoButtonText}>Choose Product Photo</Text>
      </TouchableOpacity>
      <View style={styles.photoPreviewBox}>
        {selectedImageUri ? (
          <Image source={{ uri: selectedImageUri }} style={styles.photoPreview} />
        ) : (
          <Text style={styles.noImageText}>{message}</Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  inputLabel: {
    color: '#3B2416',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  photoButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: '#3B2416',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
    marginBottom: 12,
  },
  photoButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  photoPreviewBox: {
    minHeight: 160,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5D6C3',
    backgroundColor: '#F7F1E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  noImageText: {
    color: '#8B8B7A',
    fontSize: 14,
    fontWeight: '700',
  },
});
