import sqlite3
import pandas as pd
import os
import sys

# PATH SETUP
script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(script_dir, "grades.db")

print("=" * 60)
print("STUDENT GRADE DATABASE - FETCH DATA")
print("=" * 60)
print(f"\nDatabase path: {db_path}")

# DATABASE VALIDATION
if not os.path.exists(db_path):
    print(f"\n❌ ERROR: Database not found at: {db_path}")
    print("\nPlease run 'load_to_sql.py' first to create the database.")
    sys.exit(1)

# DATA RETRIEVAL
conn = None

try:
    # Connect to database
    conn = sqlite3.connect(db_path)
    print("✓ Database connection successful")
    
    # Fetch data
    df = pd.read_sql_query("SELECT * FROM student_grades", conn)
    
    print(f"✓ Data loaded successfully!")
    print(f"\n{'='*60}")
    print("DATASET INFORMATION")
    print("=" * 60)
    print(f"Shape: {df.shape} (rows, columns)")
    print(f"Columns: {list(df.columns)}")
    
    print(f"\n{'='*60}")
    print("DATA PREVIEW (First 10 rows)")
    print("=" * 60)
    print(df.head(10).to_string())
    
    print(f"\n{'='*60}")
    print("STATISTICAL SUMMARY")
    print("=" * 60)
    print(df.describe().to_string())
    
    # Check for missing values
    missing = df.isnull().sum()
    if missing.sum() > 0:
        print(f"\n{'='*60}")
        print("MISSING VALUES DETECTED")
        print("=" * 60)
        print(missing[missing > 0])
    else:
        print("\n✓ No missing values detected")
    
    print("\n" + "=" * 60)
    print("DATA FETCH COMPLETE")
    print("=" * 60)

except sqlite3.Error as e:
    print(f"\n❌ Database error: {e}")
    sys.exit(1)

except Exception as e:
    print(f"\n❌ Unexpected error: {e}")
    sys.exit(1)

finally:
    if conn is not None:
        conn.close()