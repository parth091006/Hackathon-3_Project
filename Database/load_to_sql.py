import pandas as pd
import sqlite3
import os
import sys

# PATH SETUP
script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)

csv_path = os.path.join(project_dir, "Dataset", "Student_Dataset.csv")
db_path = os.path.join(script_dir, "grades.db")

print("=" * 60)
print("STUDENT GRADE DATABASE - LOAD DATA")
print("=" * 60)
print(f"\nCSV Source: {csv_path}")
print(f"Database Target: {db_path}")

# FILE VALIDATION
if not os.path.exists(csv_path):
    print(f"\n❌ ERROR: CSV file not found at: {csv_path}")
    print("\nPlease ensure the dataset file exists in the Dataset folder.")
    sys.exit(1)

print("✓ CSV file found")

# LOAD CSV DATA
conn = None

try:
    # Read CSV file
    df = pd.read_csv(csv_path)
    print(f"✓ CSV loaded successfully")
    print(f"  Shape: {df.shape}")
    
    # Validate required columns
    required_columns = [
        "Roll No.", 
        "Calculus-1", 
        "Calculus-2", 
        "Python-1", 
        "Python-2", 
        "SM-1", 
        "SM-2"
    ]
    
    missing_columns = [col for col in required_columns if col not in df.columns]
    
    if missing_columns:
        print(f"\n❌ ERROR: Missing required columns: {missing_columns}")
        print(f"Found columns: {list(df.columns)}")
        sys.exit(1)
    
    print("✓ All required columns present")
    
    # Check for missing values
    missing_values = df.isnull().sum()
    if missing_values.sum() > 0:
        print(f"\n⚠ WARNING: Dataset contains missing values:")
        print(missing_values[missing_values > 0])
        print("Proceeding with data load...")
    else:
        print("✓ No missing values detected")

    # STORE IN DATABASE
    print(f"\n{'='*60}")
    print("WRITING TO DATABASE")
    print("=" * 60)
    
    conn = sqlite3.connect(db_path)
    
    # Store data in SQL table (replace if exists)
    df.to_sql("student_grades", conn, if_exists="replace", index=False)
    
    print("✓ Data successfully stored in SQL database!")
    
    # Verify data was stored
    verification_df = pd.read_sql_query("SELECT * FROM student_grades LIMIT 5", conn)
    print(f"\nVerification - First 5 rows:")
    print(verification_df.to_string())
    
    # Get row count
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM student_grades")
    row_count = cursor.fetchone()[0]
    
    print(f"\n{'='*60}")
    print("DATABASE LOAD COMPLETE")
    print("=" * 60)
    print(f"Total records stored: {row_count}")
    print(f"Database location: {db_path}")
    print("=" * 60)

except pd.errors.EmptyDataError:
    print("\n❌ ERROR: CSV file is empty")
    sys.exit(1)

except pd.errors.ParserError as e:
    print(f"\n❌ ERROR: Failed to parse CSV file: {e}")
    sys.exit(1)

except sqlite3.Error as e:
    print(f"\n❌ DATABASE ERROR: {e}")
    sys.exit(1)

except Exception as e:
    print(f"\n❌ UNEXPECTED ERROR: {e}")
    sys.exit(1)

finally:
    if conn is not None:
        conn.close()
        print("✓ Database connection closed")