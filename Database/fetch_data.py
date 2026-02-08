import sqlite3
import pandas as pd
import os

# Safe database path
script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(script_dir, "grades.db")

print("Using database:", db_path)

# Database connection
try:
    conn = sqlite3.connect(db_path)

    df = pd.read_sql_query("SELECT * FROM student_grades", conn)

    print("\n✅ Data loaded successfully!")
    print("\nDataset shape:", df.shape)
    print("\nPreview:")
    print(df.head())

except Exception as e:
    print("\nDatabase error:", e)

finally:
    if 'conn' in locals():
        conn.close()