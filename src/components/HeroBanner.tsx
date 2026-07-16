import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HeroBanner({ onPress }: { onPress: () => void }) {
  return (
    <ImageBackground
      source={require('../../assets/products/modern-walnut-entrance-door.jpg')}
      resizeMode="cover"
      imageStyle={styles.image}
      style={styles.banner}
    >
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>THE SIGNATURE COLLECTION</Text>
        <Text style={styles.title}>Timeless Doors for Exceptional Spaces</Text>
        <Text style={styles.subtitle}>Explore handcrafted wooden doors designed for elegant homes.</Text>
        <TouchableOpacity style={styles.button} activeOpacity={0.86} onPress={onPress}>
          <Text style={styles.buttonText}>Shop Collection</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  banner: { minHeight: 238, borderRadius: 28, overflow: 'hidden', justifyContent: 'center' },
  image: { borderRadius: 28 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(40, 22, 12, 0.62)' },
  content: { width: '75%', maxWidth: 520, padding: 24 },
  eyebrow: { color: '#E7C677', fontSize: 10, letterSpacing: 1.5, fontWeight: '900' },
  title: { color: '#FFFFFF', fontSize: 27, lineHeight: 33, fontWeight: '900', marginTop: 9 },
  subtitle: { color: '#F7F1E8', fontSize: 13, lineHeight: 19, marginTop: 8 },
  button: { alignSelf: 'flex-start', marginTop: 17, borderRadius: 14, backgroundColor: '#C89B3C', paddingHorizontal: 18, paddingVertical: 11 },
  buttonText: { color: '#3B2416', fontSize: 12, fontWeight: '900' },
});
