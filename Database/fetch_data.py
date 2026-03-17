# Standard Python libraries
import os
import sys

# Third-party libraries
import pandas as pd
import sqlite3

# PATH SETUP - Configure database file path
script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(script_dir, "grades.db")

print("=" * 60)
print("STUDENT GRADE DATABASE - FETCH DATA")
print("=" * 60)
print(f"\nDatabase path: {db_path}")

# DATABASE VALIDATION - Ensure database file exists before proceeding
if not os.path.exists(db_path):
    print(f"\nERROR: Database not found at: {db_path}")
    print("\nPlease run 'load_to_sql.py' first to create the database.")
    sys.exit(1)

# DATA RETRIEVAL - Fetch and analyze student grade data
conn = None

try:
    # Connect to SQLite database
    conn = sqlite3.connect(db_path)
    print("Database connected successfully")
    
    # Fetch all student grade data
    df = pd.read_sql_query("SELECT * FROM student_grades", conn)
    
    print("Data loaded successfully!")
    print(f"\n{'='*60}")
    print("DATASET INFORMATION")
    print("=" * 60)
    print(f"Shape: {df.shape} (rows, columns)")
    print(f"Columns: {list(df.columns)}")
    
    # DATA PREVIEW - Display first 10 rows for data inspection
    print(f"\n{'='*60}")
    print("DATA PREVIEW (First 10 rows)")
    print("=" * 60)
    print(df.head(10).to_string())
    
    # STATISTICAL ANALYSIS - Generate descriptive statistics
    print(f"\n{'='*60}")
    print("STATISTICAL SUMMARY")
    print("=" * 60)
    print(df.describe().to_string())
    
    # DATA QUALITY CHECK - Analyze missing values in dataset
    missing = df.isnull().sum()
    if missing.sum() > 0:
        print(f"\n{'='*60}")
        print("MISSING VALUES DETECTED")
        print("=" * 60)
        print(missing[missing > 0])
    else:
        print("\nNo missing values detected")
    
    print("\n" + "=" * 60)
    print("DATA FETCH COMPLETE")
    print("=" * 60)

# ERROR HANDLING - Catch and handle database and general exceptions
except sqlite3.Error as e:
    print(f"\nDatabase error: {e}")
    sys.exit(1)

except Exception as e:
    print(f"\nUnexpected error: {e}")
    sys.exit(1)

# CLEANUP - Ensure database connection is properly closed
finally:
    if conn is not None:
        conn.close()