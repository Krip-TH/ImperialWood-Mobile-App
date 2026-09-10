# ImperialWood Stock Clustering

ImperialWood Stock Clustering uses K-Means to group the active products returned by the existing MySQL Product API according to their current `total_stock` values.

- Feature: `total_stock`
- Number of clusters: `k = 3`
- Groups: Low Stock, Medium Stock, and High Stock

The K-Means numeric cluster IDs are kept in the response. The readable labels are assigned after clustering by sorting each cluster's average stock, so the lowest mean becomes Low Stock and the highest mean becomes High Stock.

## Run locally

Make sure the `my-Backend-MySQL` server is running, then open a second terminal:

```powershell
cd stock-clustering
Copy-Item .env.example .env
pip install -r requirements.txt
python app.py
```

By default, the service reads products from:

```text
http://119.59.102.161:3117/api/products
```

Change `PRODUCT_API_URL` in `stock-clustering/.env` when the MySQL backend runs on another host or port. The address is never hardcoded to a production server.

Test the clustering endpoint at:

```text
http://localhost:5001/api/stock-clusters
```

For Expo running on a physical phone, set `EXPO_PUBLIC_STOCK_CLUSTERING_API_URL` in the project's root `.env` to this computer's LAN address, for example `http://192.168.1.20:5001/api/stock-clusters`. A phone cannot use the computer's `localhost` address.
