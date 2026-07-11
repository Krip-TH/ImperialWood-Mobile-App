import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppContext } from '@/context/AppContext';

type NavHref = '/' | '/favorites' | '/add' | '/products' | '/categories' | '/stores';
type NavItem = {
  label: string;
  href: NavHref;
  icon: ComponentProps<typeof Ionicons>['name'];
};

const navItems: NavItem[] = [
  { label: 'Home', href: '/', icon: 'home-outline' },
  { label: 'Favorites', href: '/favorites', icon: 'heart-outline' },
  { label: 'Add', href: '/add', icon: 'add-circle-outline' },
  { label: 'Products', href: '/products', icon: 'albums-outline' },
  { label: 'Categories', href: '/categories', icon: 'grid-outline' },
  { label: 'Stores', href: '/stores', icon: 'business-outline' },
];

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAppContext();

  if (!role) {
    return null;
  }

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

        return (
          <TouchableOpacity
            key={item.href}
            style={[styles.bottomNavItem, isActive && styles.bottomNavItemActive]}
            activeOpacity={0.82}
            onPress={() => router.push(item.href)}
          >
            <Ionicons name={item.icon} size={21} color={isActive ? '#3B2416' : '#8C7A68'} />
            <Text style={[styles.bottomNavText, isActive && styles.bottomNavActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D6C3',
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#3B2416',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 50,
    borderRadius: 16,
    paddingHorizontal: 6,
    gap: 3,
  },
  bottomNavItemActive: {
    backgroundColor: '#F2E6D6',
  },
  bottomNavText: {
    color: '#8C7A68',
    fontSize: 10,
    fontWeight: '800',
  },
  bottomNavActive: {
    color: '#3B2416',
  },
});
