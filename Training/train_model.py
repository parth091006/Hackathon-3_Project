import joblib
import sqlite3
import pandas as pd
import os
import numpy as np
from sklearn.model_selection import train_test_split

# Feature Scaling & Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# Regression Models
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor

# Regression Metrics
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

# DATABASE CONNECTION
if not os.path.exists(db_path):
    raise FileNotFoundError(
        f"\nDatabase not found at: {db_path}\n"
        f"Please run load_to_sql.py first to create the database."
    )

try:
    conn = sqlite3.connect(db_path)
    df = pd.read_sql_query("SELECT * FROM student_grades", conn)
    conn.close()
    print(f"✓ Database connected successfully")
except Exception as e:
    raise ConnectionError(f"Database connection failed: {e}")

print(f"✓ Dataset loaded - Shape: {df.shape}")

# DATA PREPROCESSING
expected_columns = [
    "Calculus-1",
    "Calculus-2",
    "Python-1",
    "Python-2",
    "SM-1",
    "SM-2",
]

# Drop roll number if present
if "Roll No." in df.columns:
    df = df.drop(columns=["Roll No."])
    print("✓ Removed 'Roll No.' column")

# Convert columns to numeric
for col in df.columns:
    df[col] = pd.to_numeric(df[col], errors='coerce')

# Validate schema
if set(expected_columns) != set(df.columns):
    raise ValueError(
        f"\n❌ Dataset column mismatch!\n"
        f"Expected: {expected_columns}\n"
        f"Found: {df.columns.tolist()}"
    )

# Reorder columns to match expected schema
df = df[expected_columns]

print("\n" + "=" * 60)
print("TARGET DISTRIBUTION (SM-2)")
print("=" * 60)
print(df["SM-2"].describe())
print("\nValue counts:")
print(df["SM-2"].value_counts().sort_index())

# FEATURES & TARGET
target_column = "SM-2"

X = df.drop(columns=[target_column])
y = df[target_column]   # Predict percentile directly

print(f"\n✓ Features: {list(X.columns)}")
print(f"✓ Target: {target_column} percentile")
print(f"✓ Training samples: {len(X)}")

# TRAIN-TEST SPLIT
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
print("✓ Train-test split completed")
print(f"  Train size: {len(X_train)}, Test size: {len(X_test)}")

# MODEL DEFINITIONS
models = {

    "Linear Regression": Pipeline([
        ("scaler", StandardScaler()),
        ("model", LinearRegression())
    ]),

    "Decision Tree": DecisionTreeRegressor(
        random_state=42
    ),

    "Random Forest": RandomForestRegressor(
        random_state=42,
        n_estimators=200
    )
}

# MODEL TRAINING & EVALUATION

best_model = None
best_model_name = ""
best_r2 = -999

results = []

for name, model in models.items():

    print(f"\n--- {name} ---")

    # Train model
    model.fit(X_train, y_train)

    # Predict
    predictions = model.predict(X_test)

    # Regression metrics
    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    r2 = r2_score(y_test, predictions)

    print(f"MAE : {mae:.2f}")
    print(f"RMSE: {rmse:.2f}")
    print(f"R²  : {r2:.4f}")

    # Store results
    results.append({
        "Model": name,
        "MAE": mae,
        "RMSE": rmse,
        "R2": r2
    })

    # Track best model
    if r2 > best_r2:
        best_r2 = r2
        best_model = model
        best_model_name = name

# RESULTS SUMMARY
results_df = pd.DataFrame(results)

print("\nMODEL COMPARISON")
print(results_df.to_string(index=False))

print(f"\nBest Model: {best_model_name}")
print(f"Best R² Score: {best_r2:.4f}")

# SAVE BEST MODEL
print("\n" + "=" * 60)
print("SAVING MODEL")
print("=" * 60)

model_path = os.path.join(script_dir, "best_model.pkl")

try:
    joblib.dump(best_model, model_path)
    print(f"✓ Model saved successfully: {model_path}")
    
    # Verify model was saved
    if os.path.exists(model_path):
        file_size = os.path.getsize(model_path) / 1024  # KB
        print(f"✓ Model file size: {file_size:.2f} KB")
    else:
        raise FileNotFoundError("Model file not created!")
        
except Exception as e:
    raise IOError(f"Failed to save model: {e}")

# FINAL SUMMARY
print("\n" + "=" * 60)
print("TRAINING COMPLETE")
print("=" * 60)
print(f"Model Type: {best_model_name}")
print(f"Best R² Score: {best_r2:.4f}")
print(f"Feature Schema: {list(X.columns)}")
print(f"Model Path: {model_path}")
print("=" * 60)