import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomNavigation from '@/components/BottomNavigation';
import Header from '@/components/Header';
import { useAppContext } from '@/context/AppContext';
import {
  getStockClusters,
  type StockClusterLabel,
  type StockClusterResponse,
} from '@/services/clusteringService';

const CLUSTER_LABELS: StockClusterLabel[] = [
  'Low Stock',
  'Medium Stock',
  'High Stock',
];

const CLUSTER_COLORS: Record<StockClusterLabel, string> = {
  'Low Stock': '#B84A3A',
  'Medium Stock': '#B07A16',
  'High Stock': '#3D7A4D',
};

export default function ReportsScreen() {
  const { products, role, totalStock } = useAppContext();
  const [clusterReport, setClusterReport] =
    useState<StockClusterResponse | null>(null);
  const [isLoadingClusters, setIsLoadingClusters] = useState(false);
  const [clusterError, setClusterError] = useState('');

  const loadStockClusters = useCallback(async () => {
    setIsLoadingClusters(true);
    setClusterError('');

    try {
      setClusterReport(await getStockClusters());
    } catch (error) {
      setClusterReport(null);
      setClusterError(
        error instanceof Error
          ? error.message
          : 'Stock clustering is currently unavailable.'
      );
    } finally {
      setIsLoadingClusters(false);
    }
  }, []);

  useEffect(() => {
    if (role) {
      void loadStockClusters();
    }
  }, [loadStockClusters, role]);

  if (!role) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F1E8" />
      <Header title="Reports" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.iconShell}>
            <Ionicons name="bar-chart-outline" size={28} color="#3B2416" />
          </View>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.text}>Total doors: {products.length}</Text>
          <Text style={styles.text}>Total stock: {totalStock}</Text>
        </View>

        <View style={styles.clusterCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconShell}>
              <Ionicons name="analytics-outline" size={24} color="#3B2416" />
            </View>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Stock Clustering</Text>
              <Text style={styles.sectionSubtitle}>
                K-Means · k = 3 · Feature: total_stock
              </Text>
            </View>
          </View>

          {isLoadingClusters ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color="#3B2416" />
              <Text style={styles.stateText}>Calculating stock clusters...</Text>
            </View>
          ) : clusterError ? (
            <View style={styles.stateCard}>
              <Ionicons name="cloud-offline-outline" size={28} color="#8A7765" />
              <Text style={styles.errorTitle}>Clustering service unavailable</Text>
              <Text style={styles.stateText}>{clusterError}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.82}
                onPress={() => void loadStockClusters()}
                style={styles.retryButton}
              >
                <Ionicons name="refresh" size={16} color="#FFFFFF" />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : !clusterReport || clusterReport.data.length === 0 ? (
            <View style={styles.stateCard}>
              <Ionicons name="file-tray-outline" size={28} color="#8A7765" />
              <Text style={styles.stateText}>No stock clustering data is available.</Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryGrid}>
                {CLUSTER_LABELS.map((label) => {
                  const summary = clusterReport.summary[label];
                  return (
                    <View key={label} style={styles.summaryItem}>
                      <View
                        style={[
                          styles.summaryDot,
                          { backgroundColor: CLUSTER_COLORS[label] },
                        ]}
                      />
                      <Text style={styles.summaryLabel}>{label}</Text>
                      <Text style={styles.summaryCount}>
                        {summary.product_count} products
                      </Text>
                      <Text style={styles.summaryAverage}>
                        Avg. stock {summary.average_stock}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {CLUSTER_LABELS.map((label) => {
                const clusterProducts = clusterReport.data.filter(
                  (product) => product.cluster_label === label
                );

                return (
                  <View key={label} style={styles.clusterGroup}>
                    <View style={styles.groupHeader}>
                      <View
                        style={[
                          styles.groupAccent,
                          { backgroundColor: CLUSTER_COLORS[label] },
                        ]}
                      />
                      <Text style={styles.groupTitle}>{label}</Text>
                    </View>

                    {clusterProducts.map((product) => (
                      <View
                        key={`${product.product_id}-${product.cluster}`}
                        style={styles.productRow}
                      >
                        <View style={styles.productDetails}>
                          <Text style={styles.productName}>
                            {product.product_name}
                          </Text>
                          <Text style={styles.productMeta}>
                            Stock: {product.total_stock} · Cluster: {product.cluster}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.clusterBadge,
                            { borderColor: CLUSTER_COLORS[label] },
                          ]}
                        >
                          <Text
                            style={[
                              styles.clusterBadgeText,
                              { color: CLUSTER_COLORS[label] },
                            ]}
                          >
                            {label}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })}
            </>
          )}
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
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 112,
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D6C3',
    padding: 18,
    shadowColor: '#3B2416',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  clusterCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5D6C3',
    padding: 18,
    marginTop: 16,
    shadowColor: '#3B2416',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  iconShell: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#F2E6D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    color: '#3B2416',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  text: {
    color: '#6B4423',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionIconShell: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F2E6D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionHeading: {
    flex: 1,
  },
  sectionTitle: {
    color: '#3B2416',
    fontSize: 19,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: '#8A7765',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  stateCard: {
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#FBF8F3',
    borderWidth: 1,
    borderColor: '#EADFCC',
    padding: 22,
    gap: 8,
  },
  stateText: {
    color: '#8A7765',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorTitle: {
    color: '#3B2416',
    fontSize: 15,
    fontWeight: '900',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 14,
    backgroundColor: '#3B2416',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryItem: {
    flexGrow: 1,
    flexBasis: 140,
    borderRadius: 17,
    backgroundColor: '#FBF8F3',
    borderWidth: 1,
    borderColor: '#EADFCC',
    padding: 13,
  },
  summaryDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#3B2416',
    fontSize: 14,
    fontWeight: '900',
  },
  summaryCount: {
    color: '#6B4423',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 5,
  },
  summaryAverage: {
    color: '#8A7765',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  clusterGroup: {
    marginTop: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  groupTitle: {
    color: '#3B2416',
    fontSize: 15,
    fontWeight: '900',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EFE5D8',
    paddingVertical: 12,
    gap: 10,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    color: '#3B2416',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
  productMeta: {
    color: '#8A7765',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  clusterBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  clusterBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
});
