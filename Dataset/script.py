import pandas as pd
import numpy as np
from faker import Faker
import random

fake = Faker()
np.random.seed(42)

target_rows = 1000
synthetic_data = []

for _ in range(target_rows):
    row = {}

    # All subjects completely independent
    row["Python-1"]             = np.clip(np.random.normal(50, 25), 0, 100)
    row["SQL"]                  = np.clip(np.random.normal(50, 25), 0, 100)
    row["Calculus-1"]           = np.clip(np.random.normal(50, 25), 0, 100)
    row["Python-2"]             = np.clip(np.random.normal(50, 25), 0, 100)
    row["Hackathon-1"]          = np.clip(np.random.normal(50, 25), 0, 100)
    row["Calculus-2"]           = np.clip(np.random.normal(50, 25), 0, 100)
    row["SM-1"]                 = np.clip(np.random.normal(50, 25), 0, 100)
    row["Linear Algebra"]       = np.clip(np.random.normal(50, 25), 0, 100)
    row["Discrete Mathematics"] = np.clip(np.random.normal(50, 25), 0, 100)
    row["Hackathon-2"]          = np.clip(np.random.normal(50, 25), 0, 100)
    row["DSA"]                  = np.clip(np.random.normal(50, 25), 0, 100)
    row["SM-2"]                 = np.clip(np.random.normal(50, 25), 0, 100)

    synthetic_data.append(row)

synthetic_df = pd.DataFrame(synthetic_data)

branches = ["B.Tech CSE", "B.Tech AIML", "B.Tech AIDS"]

synthetic_df.insert(0, "Name",    [fake.name() for _ in range(len(synthetic_df))])
synthetic_df.insert(1, "Roll No", [f"STU{i:04d}" for i in range(1, len(synthetic_df) + 1)])
synthetic_df.insert(2, "Branch",  [random.choice(branches) for _ in range(len(synthetic_df))])
synthetic_df.insert(0, "Sr No.",  range(1, len(synthetic_df) + 1))

final_columns = [
    "Sr No.", "Name", "Roll No", "Branch",
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
feature_cols = [
    "Python-1", "SQL", "Calculus-1", "Python-2", "Hackathon-1",
    "Calculus-2", "SM-1", "Linear Algebra", "Discrete Mathematics",
    "Hackathon-2", "DSA"
]
print(synthetic_df[feature_cols].corrwith(synthetic_df["SM-2"]).round(3))
print("\nFirst 10 rows:")
print(synthetic_df[["Name", "SM-1", "SM-2"]].head(10).to_string())