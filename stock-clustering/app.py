import math
import os
from pathlib import Path

import pandas as pd
import requests
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler


ENV_PATH = Path(__file__).with_name(".env")
load_dotenv(dotenv_path=ENV_PATH, override=True)

app = Flask(__name__)
CORS(app)

PRODUCT_API_URL = os.getenv("PRODUCT_API_URL", "").strip()
if not PRODUCT_API_URL:
    raise RuntimeError(
        "PRODUCT_API_URL must be set in stock-clustering/.env."
    )

PRODUCT_API_TIMEOUT_SECONDS = float(
    os.getenv("PRODUCT_API_TIMEOUT_SECONDS", "10")
)
CLUSTER_LABELS = ("Low Stock", "Medium Stock", "High Stock")

print(f"ImperialWood Product API URL: {PRODUCT_API_URL}", flush=True)


def error_response(message, status_code):
    return jsonify({"success": False, "error": message}), status_code


def json_number(value):
    numeric_value = float(value)
    return int(numeric_value) if numeric_value.is_integer() else numeric_value


@app.get("/api/stock-clusters")
def get_stock_clusters():
    try:
        response = requests.get(
            PRODUCT_API_URL,
            timeout=PRODUCT_API_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except requests.Timeout:
        return error_response("The Product API request timed out.", 504)
    except requests.RequestException as error:
        status = error.response.status_code if error.response is not None else None
        detail = f" (HTTP {status})" if status else ""
        return error_response(f"The Product API is unavailable{detail}.", 502)

    try:
        payload = response.json()
    except requests.exceptions.JSONDecodeError:
        return error_response("The Product API returned invalid JSON.", 502)

    products = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(products, list):
        return error_response(
            "The Product API response does not contain a product data array.",
            502,
        )

    df = pd.DataFrame(products)
    if "total_stock" not in df.columns:
        return error_response(
            "The Product API data is missing the total_stock field.",
            422,
        )

    original_product_count = len(df)
    df["total_stock"] = pd.to_numeric(df["total_stock"], errors="coerce")
    valid_stock = df["total_stock"].map(
        lambda value: pd.notna(value) and math.isfinite(float(value))
    )
    df = df.loc[valid_stock].copy()
    invalid_product_count = original_product_count - len(df)

    if len(df) < 3:
        return error_response(
            "At least 3 products with valid total_stock values are required for k=3.",
            422,
        )

    if df["total_stock"].nunique() < 3:
        return error_response(
            "At least 3 distinct total_stock values are required to form 3 clusters.",
            422,
        )

    features = df[["total_stock"]]
    scaled = StandardScaler().fit_transform(features)

    kmeans = KMeans(
        n_clusters=3,
        random_state=42,
        n_init=10,
    )

    df["cluster"] = kmeans.fit_predict(scaled)

    cluster_means = (
        df.groupby("cluster")["total_stock"].mean().sort_values()
    )
    label_by_cluster = {
        int(cluster_id): label
        for cluster_id, label in zip(cluster_means.index, CLUSTER_LABELS)
    }
    df["cluster_label"] = df["cluster"].map(label_by_cluster)

    data = []
    for _, row in df.iterrows():
        data.append(
            {
                "product_id": row.get("product_id"),
                "product_name": row.get("product_name", "Unnamed product"),
                "total_stock": json_number(row["total_stock"]),
                "cluster": int(row["cluster"]),
                "cluster_label": row["cluster_label"],
            }
        )

    label_order = {label: index for index, label in enumerate(CLUSTER_LABELS)}
    data.sort(
        key=lambda product: (
            label_order[product["cluster_label"]],
            product["total_stock"],
            str(product["product_name"]),
        )
    )

    summary = {}
    for label in CLUSTER_LABELS:
        cluster_id = next(
            cluster
            for cluster, cluster_label in label_by_cluster.items()
            if cluster_label == label
        )
        cluster_rows = df[df["cluster"] == cluster_id]
        summary[label] = {
            "product_count": int(len(cluster_rows)),
            "average_stock": round(
                float(cluster_rows["total_stock"].mean()),
                2,
            ),
        }

    return jsonify(
        {
            "success": True,
            "k": 3,
            "feature": "total_stock",
            "data": data,
            "summary": summary,
            "invalid_product_count": invalid_product_count,
        }
    )


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5001"))
    app.run(host="0.0.0.0", port=port)
