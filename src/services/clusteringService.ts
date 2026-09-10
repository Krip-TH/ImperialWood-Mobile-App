export type StockClusterLabel =
  | 'Low Stock'
  | 'Medium Stock'
  | 'High Stock';

export type StockClusterProduct = {
  product_id: string | number;
  product_name: string;
  total_stock: number;
  cluster: number;
  cluster_label: StockClusterLabel;
};

export type StockClusterSummary = Record<
  StockClusterLabel,
  {
    product_count: number;
    average_stock: number;
  }
>;

export type StockClusterResponse = {
  success: true;
  k: 3;
  feature: 'total_stock';
  data: StockClusterProduct[];
  summary: StockClusterSummary;
  invalid_product_count?: number;
};

const STOCK_CLUSTERING_API_URL =
  process.env.EXPO_PUBLIC_STOCK_CLUSTERING_API_URL?.trim() ||
  'http://localhost:5001/api/stock-clusters';
const REQUEST_TIMEOUT_MS = 15_000;

export async function getStockClusters(): Promise<StockClusterResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(STOCK_CLUSTERING_API_URL, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    let result: unknown;
    try {
      result = await response.json();
    } catch {
      throw new Error('The Stock Clustering service returned invalid JSON.');
    }

    if (!response.ok) {
      const message =
        typeof result === 'object' &&
        result !== null &&
        'error' in result
          ? String((result as { error?: unknown }).error)
          : `Stock clustering failed with status ${response.status}.`;
      throw new Error(message);
    }

    if (
      typeof result !== 'object' ||
      result === null ||
      !('success' in result) ||
      (result as { success?: unknown }).success !== true ||
      !('data' in result) ||
      !Array.isArray((result as { data?: unknown }).data)
    ) {
      throw new Error('The Stock Clustering service returned an invalid response.');
    }

    return result as StockClusterResponse;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The Stock Clustering service request timed out.');
    }
    if (error instanceof TypeError) {
      throw new Error('The Stock Clustering service is offline or unreachable.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
