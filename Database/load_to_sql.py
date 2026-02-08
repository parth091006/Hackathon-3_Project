import pandas as pd
import sqlite3
import os

# Safe path resolution
script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)

csv_path = os.path.join(project_dir, "Dataset", "Hackathon-3 values.csv")
db_path = os.path.join(script_dir, "grades.db")

print("Loading CSV from:", csv_path)
print("Writing database to:", db_path)

# Load + store data
try:
    df = pd.read_csv(csv_path)

    conn = sqlite3.connect(db_path)

    df.to_sql("student_grades", conn, if_exists="replace", index=False)

    print("\nData successfully stored in SQL database!")
    print("Dataset shape:", df.shape)

except Exception as e:
    print("\nError:", e)

finally:
    if 'conn' in locals():
        conn.close()
