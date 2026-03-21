import os
import json
from typing import Dict, List

import joblib
import numpy as np
import pandas as pd
import sqlite3
from sklearn.model_selection import train_test_split

from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import (
    RandomForestRegressor,
    GradientBoostingRegressor,
    ExtraTreesRegressor
)
from sklearn.svm import SVR
from sklearn.neighbors import KNeighborsRegressor

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# PATH SETUP
script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.normpath(
    os.path.join(script_dir, "..", "Database", "grades.db")
)

print("=" * 60)
print("STUDENT GRADE PREDICTION - MODEL TRAINING")
print("=" * 60)
print(f"\nUsing database at: {db_path}")

# DATABASE CONNECTION - Load training data
if not os.path.exists(db_path):
    raise FileNotFoundError(
        f"\nDatabase not found at: {db_path}\n"
        f"Please run load_to_sql.py first to create the database."
    )

try:
    conn = sqlite3.connect(db_path)
    df = pd.read_sql_query("SELECT * FROM student_grades", conn)
    conn.close()
    print("Database connected successfully")
except Exception as e:
    raise ConnectionError(f"Database connection failed: {e}")

print(f"Dataset loaded - Shape: {df.shape}")

# DATA PREPROCESSING - Define required and feature columns
required_columns = [
    "Python-1", "SQL", "Calculus-1", "Python-2", "Hackathon-1",
    "Calculus-2", "SM-1", "Linear Algebra", "Discrete Mathematics",
    "Hackathon-2", "DSA", "SM-2"
]

feature_columns = [
    "Python-1",
    "SQL",
    "Calculus-1",
    "Python-2",
    "Hackathon-1",
    "Calculus-2",
    "SM-1",
    "Linear Algebra",
    "Discrete Mathematics",
    "Hackathon-2",
    "DSA",
]

# Convert only numeric columns to numeric
numeric_columns = required_columns
for col in numeric_columns:
    if col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')

# Validate that all required columns exist in dataset
missing_columns = [col for col in required_columns if col not in df.columns]
if missing_columns:
    raise ValueError(
        f"\nRequired columns missing from dataset!\n"
        f"Missing: {missing_columns}\n"
        f"Available columns: {df.columns.tolist()}"
    )

print(f"All required columns found: {required_columns}")
print(f"Dataset contains additional columns: {[col for col in df.columns if col not in required_columns]}")

# Select only the columns needed for model training
df_ml = df[required_columns].copy()

print("\n" + "=" * 60)
print("TARGET DISTRIBUTION (SM-2)")
print("=" * 60)
print(df_ml["SM-2"].describe())
print("\nValue counts:")
print(df_ml["SM-2"].value_counts().sort_index())

# FEATURES & TARGET SETUP
# Use SM-2 as target variable (percentile to predict)
target_column = "SM-2"

# Use only the feature columns for training, exclude SM-2 (target)
X = df_ml[feature_columns]
y = df_ml[target_column]   # Predict percentile directly

print(f"\nFeatures: {list(X.columns)}")
print(f"Target: {target_column} percentile")
print(f"Training samples: {len(X)}")

# TRAIN-TEST SPLIT - Create training and testing datasets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print("Train-test split completed")
print(f"Train size: {len(X_train)}, Test size: {len(X_test)}")

# MODEL DEFINITIONS - Configure ML models for comparison
models = {

    "Linear Regression": Pipeline([
        ("scaler", StandardScaler()),
        ("model", LinearRegression())
    ]),



    "SVR": Pipeline([
        ("scaler", StandardScaler()),
        ("model", SVR(kernel='rbf', C=100, gamma=0.1, epsilon=0.1))
    ]),

    "KNN Regressor": Pipeline([
        ("scaler", StandardScaler()),
        ("model", KNeighborsRegressor(n_neighbors=5))
    ]),

    "Decision Tree": DecisionTreeRegressor(
        random_state=42,
        max_depth=10,
        min_samples_leaf=5,
        min_samples_split=10
    ),

    "Random Forest": RandomForestRegressor(
        random_state=42,
        n_estimators=200,
        max_depth=15,
        min_samples_leaf=3
    ),

    "Gradient Boosting": GradientBoostingRegressor(
        random_state=42,
        n_estimators=200,
        learning_rate=0.1,
        max_depth=5
    ),

    "Extra Trees": ExtraTreesRegressor(
        random_state=42,
        n_estimators=200,
        max_depth=15,
        min_samples_leaf=3
    ),
}

# MODEL TRAINING & EVALUATION
best_model = None
best_model_name = ""
best_r2 = -999
best_rmse = 999

results = []

for name, model in models.items():
    print(f"\n--- {name} ---")

    # Train model on training data
    model.fit(X_train, y_train)

    # Make predictions on test data
    predictions = model.predict(X_test)

    # Calculate regression metrics for model evaluation
    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    r2 = r2_score(y_test, predictions)

    print(f"MAE : {mae:.2f}")
    print(f"RMSE: {rmse:.2f}")
    print(f"R²  : {r2:.4f}")

    # Store results for comparison
    results.append({
        "Model": name,
        "MAE": mae,
        "RMSE": rmse,
        "R2": r2
    })

    # Track best model based on lowest RMSE
    if best_model is None or rmse < best_rmse:
        best_rmse = rmse
        best_model = model
        best_model_name = name

# RESULTS SUMMARY - Display model comparison
results_df = pd.DataFrame(results)

print("\nMODEL COMPARISON")
print(results_df.to_string(index=False))

print(f"\nBest Model: {best_model_name}")
print(f"Best RMSE: {best_rmse:.4f}")

# SAVE BEST MODEL - Persist model for API deployment
print("\n" + "=" * 60)
print("SAVING MODEL")
print("=" * 60)

model_path = os.path.join(script_dir, "best_model.pkl")

try:
    # Save the best performing model 
    joblib.dump(best_model, model_path)
    print(f"Model saved successfully: {model_path}")
    
    # Verify model was saved correctly
    if os.path.exists(model_path):
        file_size = os.path.getsize(model_path) / 1024
        print(f"Model file size: {file_size:.2f} KB")
    else:
        raise FileNotFoundError("Model file not created!")

    metrics_path = os.path.join(script_dir, "model_metrics.json")
    metrics_data = {
        "best_model_name": best_model_name,
        "best_r2": round(best_r2, 4),
        "best_rmse": round(
            float(results_df[
                results_df['Model'] == best_model_name
            ]['RMSE'].values[0]), 4
        ),
        "best_mae": round(
            float(results_df[
                results_df['Model'] == best_model_name
            ]['MAE'].values[0]), 4
        ),
        "all_results": [
            {
                "Model": r["Model"],
                "MAE": round(float(r["MAE"]), 4),
                "RMSE": round(float(r["RMSE"]), 4),
                "R2": round(float(r["R2"]), 4)
            }
            for r in results_df.to_dict(orient='records')
        ]
    }
    with open(metrics_path, 'w') as f:
        json.dump(metrics_data, f, indent=2)
    print(f"Metrics saved to: {metrics_path}")
        
except Exception as e:
    raise IOError(f"Failed to save model: {e}")

# FINAL SUMMARY - Display training completion information
print("\n" + "=" * 60)
print("TRAINING COMPLETE")
print("=" * 60)
print(f"Model Type: {best_model_name}")
print(f"Best RMSE: {best_rmse:.4f}")
print(f"Feature Schema: {list(X.columns)}")
print(f"Model Path: {model_path}")
print("=" * 60)