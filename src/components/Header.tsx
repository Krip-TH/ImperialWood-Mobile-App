import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import BrandLogo from '@/components/BrandLogo';
import CartButton from '@/components/CartButton';
import { useAppContext } from '@/context/AppContext';

type HeaderProps = {
  title: string;
};

type MenuItem = {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  action: () => void;
};

export default function Header({ title }: HeaderProps) {
  const router = useRouter();
  const { logout, role } = useAppContext();
  const { width } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);
  const modeText = role === 'admin' ? 'Admin Workspace' : 'Client Storefront';
  const commonMenuItems: MenuItem[] = [
    { label: 'Home', icon: 'home-outline', action: () => router.push('/') },
    { label: 'Products', icon: 'albums-outline', action: () => router.push('/products') },
    { label: 'Categories', icon: 'grid-outline', action: () => router.push('/categories') },
    { label: 'Stores', icon: 'storefront-outline', action: () => router.push('/stores') },
    { label: 'Favorites', icon: 'heart-outline', action: () => router.push('/favorites') },
  ];
  const adminMenuItems: MenuItem[] = [
    { label: 'Add Product', icon: 'add-circle-outline', action: () => router.push('/add') },
    { label: 'Reports', icon: 'bar-chart-outline', action: () => router.push('/reports') },
    { label: 'Settings', icon: 'settings-outline', action: () => router.push('/settings') },
  ];
  const menuItems: MenuItem[] = [
    ...commonMenuItems,
    ...(role === 'admin' ? adminMenuItems : []),
    {
      label: 'Logout',
      icon: 'log-out-outline',
      action: () => {
        logout();
        router.replace('/');
      },
    },
  ];

  const closeMenu = () => setMenuOpen(false);
  const runMenuAction = (action: () => void) => {
    action();
    closeMenu();
  };

  return (
    <View style={styles.topNav}>
      <TouchableOpacity
        style={styles.iconButton}
        activeOpacity={0.8}
        onPress={() => setMenuOpen(true)}
      >
        <Ionicons name="menu" size={24} color="#3B2416" />
      </TouchableOpacity>

      <View style={styles.titleWrap} pointerEvents="none">
        {role === 'client' && title === 'Home' ? <Text style={styles.brandTitle}>ImperialWood</Text> : <BrandLogo compact />}
        <Text style={styles.subtitle}>{role === 'client' && title === 'Home' ? 'Premium Wooden Doors' : title}</Text>
      </View>

      {role === 'client' && title === 'Home' ? (
        <View style={styles.clientActions}>
          <TouchableOpacity style={styles.clientIcon} onPress={() => undefined}><Ionicons name="notifications-outline" size={20} color="#3B2416" /></TouchableOpacity>
          <CartButton compact />
          {width >= 700 ? <TouchableOpacity style={styles.clientIcon} onPress={() => router.push('/settings')}><Ionicons name="person-outline" size={20} color="#3B2416" /></TouchableOpacity> : null}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={() => { logout(); router.replace('/'); }}
        >
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={closeMenu}>
        <View style={styles.overlayRoot}>
          <Pressable style={styles.overlayBackdrop} onPress={closeMenu} />
          <View style={styles.sideMenu}>
            <View style={styles.sideMenuHeader}>
              <View style={styles.sideMenuBrand}>
                <BrandLogo light />
                <Text style={styles.sideMenuSubtitle}>{modeText}</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} activeOpacity={0.8} onPress={closeMenu}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.menuList}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.menuItem}
                  activeOpacity={0.82}
                  onPress={() => runMenuAction(item.action)}
                >
                  <View style={styles.menuIconShell}>
                    <Ionicons name={item.icon} size={19} color="#C89B3C" />
                  </View>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#D8C7AE" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#F7F1E8',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5D6C3',
    shadowColor: '#3B2416',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  titleWrap: {
    alignItems: 'center',
    position: 'absolute',
    left: '50%',
    width: 160,
    marginLeft: -80,
  },
  brandTitle: { color: '#3B2416', fontSize: 18, fontWeight: '900', letterSpacing: 0.2 },
  subtitle: {
    color: '#6B4423',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#3B2416',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientActions: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 7 },
  clientIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5D6C3', alignItems: 'center', justifyContent: 'center' },
  overlayRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(43, 33, 24, 0.42)',
  },
  sideMenu: {
    width: 314,
    maxWidth: '86%',
    height: '100%',
    backgroundColor: '#3B2416',
    paddingTop: 48,
    paddingHorizontal: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
    zIndex: 2,
  },
  sideMenuHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  sideMenuBrand: {
    flex: 1,
    alignItems: 'flex-start',
  },
  sideMenuSubtitle: {
    color: '#D8C7AE',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuList: {
    gap: 8,
  },
  menuItem: {
    minHeight: 50,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconShell: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: 'rgba(200, 155, 60, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
