import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

type BrandLogoProps = {
  compact?: boolean;
  light?: boolean;
};

export default function BrandLogo({ compact = false, light = false }: BrandLogoProps) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={[styles.iconShell, compact && styles.iconShellCompact]}>
        <MaterialCommunityIcons
          name="door-closed"
          size={compact ? 21 : 36}
          color={light ? '#F7F1E8' : '#3B2416'}
        />
      </View>
      <View>
        <Text style={[styles.brandText, compact && styles.brandTextCompact, light && styles.lightText]}>
          ImperialWood
        </Text>
        {!compact ? (
          <Text style={[styles.brandSubtext, light && styles.lightSubtext]}>Premium Doors</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  wrapCompact: {
    gap: 8,
  },
  iconShell: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#F2E6D6',
    borderWidth: 1,
    borderColor: '#C89B3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShellCompact: {
    width: 34,
    height: 34,
    borderRadius: 11,
  },
  brandText: {
    color: '#3B2416',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
  },
  brandTextCompact: {
    fontSize: 18,
  },
  brandSubtext: {
    color: '#6B4423',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  lightText: {
    color: '#FFFFFF',
  },
  lightSubtext: {
    color: '#C89B3C',
  },
});
