import { Ionicons } from '@expo/vector-icons';
import { type Href, usePathname, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppContext } from '@/context/AppContext';

type NavHref = '/' | '/favorites' | '/cart' | '/add' | '/products' | '/categories' | '/stores';
type NavItem = {
  label: string;
  href: NavHref;
  icon: ComponentProps<typeof Ionicons>['name'];
  activeIcon?: ComponentProps<typeof Ionicons>['name'];
};

const adminNavItems: NavItem[] = [
  { label: 'Home', href: '/', icon: 'home-outline' },
  { label: 'Favorites', href: '/favorites', icon: 'heart-outline' },
  { label: 'Add', href: '/add', icon: 'add-circle-outline' },
  { label: 'Products', href: '/products', icon: 'albums-outline' },
  { label: 'Categories', href: '/categories', icon: 'grid-outline' },
  { label: 'Stores', href: '/stores', icon: 'business-outline' },
];

const clientNavItems: NavItem[] = [
  { label: 'Home', href: '/', icon: 'home-outline', activeIcon: 'home' },
  { label: 'Favorites', href: '/favorites', icon: 'heart-outline', activeIcon: 'heart' },
  { label: 'Cart', href: '/cart', icon: 'cart-outline', activeIcon: 'cart' },
  { label: 'Categories', href: '/categories', icon: 'grid-outline', activeIcon: 'grid' },
  { label: 'Stores', href: '/stores', icon: 'storefront-outline', activeIcon: 'storefront' },
];

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { cartItemCount, role } = useAppContext();

  if (!role) {
    return null;
  }

  const navItems = role === 'client' ? clientNavItems : adminNavItems;
  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

        return (
          <TouchableOpacity
            key={item.href}
            style={[styles.bottomNavItem, isActive && styles.bottomNavItemActive]}
            activeOpacity={0.82}
            onPress={() => router.push(item.href as Href)}
          >
            <View>
              <Ionicons name={isActive ? (item.activeIcon ?? item.icon) : item.icon} size={21} color={isActive ? '#3B2416' : '#8C7A68'} />
              {item.href === '/cart' && cartItemCount > 0 ? <Text style={styles.cartBadge}>{cartItemCount > 99 ? '99+' : cartItemCount}</Text> : null}
            </View>
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
  cartBadge: { position: 'absolute', top: -8, right: -12, minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 3, lineHeight: 17, textAlign: 'center', overflow: 'hidden', backgroundColor: '#C89B3C', color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
});
