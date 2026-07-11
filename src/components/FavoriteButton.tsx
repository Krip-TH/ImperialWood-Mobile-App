import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity } from 'react-native';

type FavoriteButtonProps = {
  isFavorite: boolean;
  onPress: () => void;
  large?: boolean;
};

export default function FavoriteButton({ isFavorite, onPress, large }: FavoriteButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.heartButton,
        large && styles.heartButtonLarge,
        isFavorite && styles.heartButtonActive,
      ]}
      activeOpacity={0.82}
      onPress={onPress}
    >
      <Ionicons
        name={isFavorite ? 'heart' : 'heart-outline'}
        size={large ? 23 : 20}
        color={isFavorite ? '#FFFFFF' : '#6B4423'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  heartButton: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5D6C3',
  },
  heartButtonLarge: {
    width: 46,
    height: 46,
    borderRadius: 16,
  },
  heartButtonActive: {
    backgroundColor: '#C89B3C',
    borderColor: '#C89B3C',
  },
});
