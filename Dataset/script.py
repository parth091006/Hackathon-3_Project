import pandas as pd
import numpy as np
from faker import Faker
import random

fake = Faker()
np.random.seed(42)

df = pd.read_csv("Dataset/Hackathon_3_percentile.csv")
scores = df.drop(columns=["Roll No."])
means = scores.mean()
stds = scores.std()

target_rows = 1000
synthetic_data = []

for _ in range(target_rows):
    row = {}

    # Base independent subjects
    row["Python-1"]  = np.clip(np.random.normal(means["Python-1"],  stds["Python-1"]),  0, 100)
    row["Calculus-1"]= np.clip(np.random.normal(means["Calculus-1"],stds["Calculus-1"]),0, 100)
    row["SM-1"]      = np.clip(np.random.normal(means["SM-1"],      stds["SM-1"]),      0, 100)

    # Progressions from base subjects
    row["Python-2"]   = np.clip(row["Python-1"]   + np.random.normal(5, 5),  0, 100)
    row["Calculus-2"] = np.clip(row["Calculus-1"] + np.random.normal(3, 5),  0, 100)

    # New subjects derived from base (no SM-2 used here)
    row["SQL"]         = np.clip(row["Python-1"]  + np.random.normal(0, 10), 0, 100)
    row["DSA"]         = np.clip(row["Python-1"]  + np.random.normal(2, 10), 0, 100)
    row["Hackathon-1"] = np.clip(row["Python-2"]  + np.random.normal(0, 10), 0, 100)
    row["Hackathon-2"] = np.clip(row["Python-2"]  + np.random.normal(0, 10), 0, 100)

    # Linear Algebra derived from SM-1 only
    row["Linear Algebra"] = np.clip(row["SM-1"] + np.random.normal(0, 5), 0, 100)

    # Discrete Mathematics derived from SM-1 only (SM-2 not yet defined)
    row["Discrete Mathematics"] = np.clip(
        row["SM-1"] * 0.6 +
        row["Calculus-1"] * 0.4 +
        np.random.normal(0, 8),
        0, 100
    )

    # SM-2 is the TARGET — computed last as weighted average of all inputs
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

    synthetic_data.append(row)

synthetic_df = pd.DataFrame(synthetic_data)

branches = ["B.Tech CSE", "B.Tech AIML", "B.Tech AIDS"]
synthetic_df.insert(0, "Name",    [fake.name() for _ in range(len(synthetic_df))])
synthetic_df.insert(1, "Roll No", [f"STU{i:04d}" for i in range(len(synthetic_df))])
synthetic_df.insert(2, "Branch",  [random.choice(branches) for _ in range(len(synthetic_df))])

final_columns = [
    "Name", "Roll No", "Branch",
    "Python-1", "SQL", "Calculus-1",
    "Python-2", "Hackathon-1", "Calculus-2",
    "SM-1", "Linear Algebra", "Discrete Mathematics",
    "Hackathon-2", "DSA", "SM-2"
]

synthetic_df = synthetic_df[final_columns]
synthetic_df = synthetic_df.round(2)

synthetic_df.to_csv("Dataset/Student_Dataset.csv", index=False)

print("Dataset generated successfully")
print("Shape:", synthetic_df.shape)
print("Columns:", synthetic_df.columns.tolist())
print("\nCorrelation with SM-2:")
feature_cols = ["Python-1","SQL","Calculus-1","Python-2","Hackathon-1",
                "Calculus-2","SM-1","Linear Algebra","Discrete Mathematics",
                "Hackathon-2","DSA"]
print(synthetic_df[feature_cols].corrwith(synthetic_df["SM-2"]).round(3))
print("\nMax correlation:", synthetic_df[feature_cols].corrwith(synthetic_df["SM-2"]).abs().max().round(3))
print("\nFirst 3 rows:")
print(synthetic_df[["Name","SM-1","SM-2"]].head(3).to_string())