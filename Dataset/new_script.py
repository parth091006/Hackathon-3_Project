import pandas as pd
import numpy as np
from faker import Faker
import random

fake = Faker()

# Load original dataset
df = pd.read_csv("Dataset/Hackathon_3_percentile.csv")

scores = df.drop(columns=["Roll No."])

target_rows = 500
synthetic_rows = []

while len(scores) + len(synthetic_rows) < target_rows:
    
    sample = scores.sample(1).copy()

    for col in sample.columns:
        noise = np.random.normal(0, 3)
        sample[col] = np.clip(sample[col] + noise, 0, 100)

    synthetic_rows.append(sample)

synthetic_df = pd.concat([scores] + synthetic_rows, ignore_index=True)

# Generate Names, Roll No, Branch

branches = ["B.Tech CSE", "B.Tech AIML", "B.Tech AIDS"]

synthetic_df.insert(0, "Name", [fake.name() for _ in range(len(synthetic_df))])
synthetic_df.insert(1, "Roll No", [f"STU{i:04d}" for i in range(len(synthetic_df))])
synthetic_df.insert(2, "Branch", [random.choice(branches) for _ in range(len(synthetic_df))])

# Save dataset
synthetic_df.to_csv("Dataset/student_dataset_500.csv", index=False)

print("Dataset created successfully")
print("Total rows:", synthetic_df.shape)