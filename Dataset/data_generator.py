import pandas as pd
import numpy as np
import subprocess
import os
import sys
from faker import Faker
from datetime import datetime

fake = Faker()
np.random.seed(None)  # Different results each run

# ─────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(SCRIPT_DIR, "Dataset", "Student_Dataset.csv")
DB_SCRIPT    = os.path.join(SCRIPT_DIR, "Database", "load_to_sql.py")
TRAIN_SCRIPT = os.path.join(SCRIPT_DIR, "Training", "train_model.py")

NEW_ROWS = 50  # Number of new students to generate

BRANCHES = ["B.Tech CSE", "B.Tech AIML", "B.Tech AIDS"]

# ─────────────────────────────────────────
# STEP 1: Load existing dataset
# ─────────────────────────────────────────
print("=" * 60)
print("DATA GENERATOR - PIPELINE TRIGGER")
print("=" * 60)

if not os.path.exists(DATASET_PATH):
    print(f"ERROR: Dataset not found at {DATASET_PATH}")
    sys.exit(1)

df_existing = pd.read_csv(DATASET_PATH)
existing_count = len(df_existing)
print(f"Existing students: {existing_count}")

# Get last roll number to continue sequence
last_roll = df_existing["Roll No"].iloc[-1]
last_num  = int(last_roll.replace("STU", ""))

# ─────────────────────────────────────────
# STEP 2: Generate new student rows
# ─────────────────────────────────────────
print(f"Generating {NEW_ROWS} new student rows...")

# Use existing data statistics for realistic generation
feature_cols = [
    "Python-1", "SQL", "Calculus-1", "Python-2", "Hackathon-1",
    "Calculus-2", "SM-1", "Linear Algebra", "Discrete Mathematics",
    "Hackathon-2", "DSA"
]

means = df_existing[feature_cols].mean()
stds  = df_existing[feature_cols].std()

new_rows = []

for i in range(NEW_ROWS):
    row = {}

    # Base subjects
    row["Python-1"]   = np.clip(np.random.normal(means["Python-1"],   stds["Python-1"]),   0, 100)
    row["Calculus-1"] = np.clip(np.random.normal(means["Calculus-1"], stds["Calculus-1"]), 0, 100)
    row["SM-1"]       = np.clip(np.random.normal(means["SM-1"],       stds["SM-1"]),       0, 100)

    # Progressions
    row["Python-2"]   = np.clip(row["Python-1"]   + np.random.normal(5, 5),  0, 100)
    row["Calculus-2"] = np.clip(row["Calculus-1"] + np.random.normal(3, 5),  0, 100)

    # Derived subjects
    row["SQL"]         = np.clip(row["Python-1"]  + np.random.normal(0, 10), 0, 100)
    row["DSA"]         = np.clip(row["Python-1"]  + np.random.normal(2, 10), 0, 100)
    row["Hackathon-1"] = np.clip(row["Python-2"]  + np.random.normal(0, 10), 0, 100)
    row["Hackathon-2"] = np.clip(row["Python-2"]  + np.random.normal(0, 10), 0, 100)

    row["Linear Algebra"] = np.clip(
        row["SM-1"] + np.random.normal(0, 5), 0, 100
    )
    row["Discrete Mathematics"] = np.clip(
        row["SM-1"] * 0.6 + row["Calculus-1"] * 0.4 +
        np.random.normal(0, 8), 0, 100
    )

    # Target: SM-2 as weighted average of all inputs
    row["SM-2"] = np.clip(
        row["Python-1"]             * 0.10 +
        row["SQL"]                  * 0.08 +
        row["Calculus-1"]           * 0.10 +
        row["Python-2"]             * 0.10 +
        row["Hackathon-1"]          * 0.08 +
        row["Calculus-2"]           * 0.10 +
        row["SM-1"]                 * 0.12 +
        row["Linear Algebra"]       * 0.10 +
        row["Discrete Mathematics"] * 0.10 +
        row["Hackathon-2"]          * 0.07 +
        row["DSA"]                  * 0.05 +
        np.random.normal(0, 3),
        0, 100
    )

    new_roll = f"STU{(last_num + i + 1):04d}"
    row["Name"]    = fake.name()
    row["Roll No"] = new_roll
    row["Branch"]  = np.random.choice(BRANCHES)

    new_rows.append(row)

new_df = pd.DataFrame(new_rows)

# Reorder columns to match existing dataset
new_df = new_df[[
    "Name", "Roll No", "Branch",
    "Python-1", "SQL", "Calculus-1", "Python-2", "Hackathon-1",
    "Calculus-2", "SM-1", "Linear Algebra", "Discrete Mathematics",
    "Hackathon-2", "DSA", "SM-2"
]].round(2)

# ─────────────────────────────────────────
# STEP 3: Append to existing dataset
# ─────────────────────────────────────────
new_df.to_csv(DATASET_PATH, mode='a', header=False, index=False)
new_count = existing_count + NEW_ROWS
print(f"Dataset updated: {existing_count} → {new_count} students")
print(f"Saved to: {DATASET_PATH}")

# ─────────────────────────────────────────
# STEP 4: Auto-trigger load_to_sql.py
# ─────────────────────────────────────────
print("\n" + "=" * 60)
print("TRIGGERING DATABASE UPDATE")
print("=" * 60)

result = subprocess.run(
    [sys.executable, DB_SCRIPT],
    capture_output=True, text=True
)

if result.returncode == 0:
    print("Database updated successfully")
else:
    print("ERROR updating database:")
    print(result.stderr)
    sys.exit(1)

# ─────────────────────────────────────────
# STEP 5: Auto-trigger train_model.py
# ─────────────────────────────────────────
print("\n" + "=" * 60)
print("TRIGGERING MODEL RETRAINING")
print("=" * 60)

result = subprocess.run(
    [sys.executable, TRAIN_SCRIPT],
    capture_output=True, text=True
)

if result.returncode == 0:
    # Extract key metrics from output
    for line in result.stdout.split('\n'):
        if any(x in line for x in [
            'Best Model:', 'Best R²', 'Train size',
            'RMSE', 'MAE', 'R²', 'Metrics saved'
        ]):
            print(line)
else:
    print("ERROR during model retraining:")
    print(result.stderr)
    sys.exit(1)

# ─────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────
print("\n" + "=" * 60)
print("PIPELINE COMPLETE")
print("=" * 60)
print(f"Timestamp  : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"New rows   : {NEW_ROWS}")
print(f"Total rows : {new_count}")
print(f"Model      : retrained and saved")
print(f"Dashboard  : refresh browser to see updated metrics")
print("=" * 60)