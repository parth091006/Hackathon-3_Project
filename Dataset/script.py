import pandas as pd
import numpy as np

# Load original dataset
df = pd.read_csv("Dataset/Hackathon_3_percentile.csv")

# Remove Roll No for generation
scores = df.drop(columns=["Roll No."])

target_rows = 500

synthetic_rows = []

while len(scores) + len(synthetic_rows) < target_rows:

    # randomly pick a real row
    sample = scores.sample(1).copy()

    # add small noise to each subject score
    for col in sample.columns:
        noise = np.random.normal(0, 3)   # small variation
        sample[col] = np.clip(sample[col] + noise, 0, 100)

    synthetic_rows.append(sample)

# Combine original + synthetic
synthetic_df = pd.concat([scores] + synthetic_rows, ignore_index=True)

# Create new Roll Numbers
synthetic_df.insert(0, "Roll No.", ["SYN" + str(i).zfill(4) for i in range(len(synthetic_df))])

# Save dataset
synthetic_df.to_csv("expanded_student_dataset.csv", index=False)

print("Final dataset shape:", synthetic_df.shape)