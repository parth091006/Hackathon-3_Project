# Standard Python libraries
import os
import sys

# Third-party libraries
import pandas as pd
import sqlite3

# PATH SETUP - Configure file paths for CSV source and database target
script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)

csv_path = os.path.join(project_dir, "Dataset", "Student_Dataset.csv")
db_path = os.path.join(script_dir, "grades.db")

print("=" * 60)
print("STUDENT GRADE DATABASE - LOAD DATA")
print("=" * 60)
print(f"\nCSV Source: {csv_path}")
print(f"Database Target: {db_path}")

# FILE VALIDATION - Ensure CSV file exists before proceeding
if not os.path.exists(csv_path):
    print(f"\nERROR: CSV file not found at: {csv_path}")
    print("\nPlease ensure the dataset file exists in the Dataset folder.")
    sys.exit(1)

print("CSV file found")

# LOAD CSV DATA - Read and validate the dataset
conn = None

try:
    # Read CSV file into pandas DataFrame
    df = pd.read_csv(csv_path)
    print("CSV loaded successfully")
    print(f"  Shape: {df.shape}")
    
    # Validate required columns for model training
    required_columns = [
        "Name",
        "Roll No",
        "Branch",
        "Python-1",
        "SQL",
        "Calculus-1",
        "Python-2",
        "Hackathon-1",
        "Calculus-2",
        "SM-1",
        "Linear Algebra",
        "Discrete Mathematics",
        "Hackathon-2",
        "DSA",
        "SM-2"
    ]
    
    # Check for missing required columns
    missing_columns = [col for col in required_columns if col not in df.columns]
    
    if missing_columns:
        print(f"\nERROR: Missing required columns: {missing_columns}")
        print(f"Found columns: {list(df.columns)}")
        sys.exit(1)
    
    print("All required columns present")
    
    # DATA QUALITY CHECK - Analyze missing values in dataset
    missing_values = df.isnull().sum()
    if missing_values.sum() > 0:
        print(f"\nWARNING: Dataset contains missing values:")
        print(missing_values[missing_values > 0])
        print("Proceeding with data load...")
    else:
        print("No missing values detected")

    # STORE IN DATABASE - Load validated data into SQLite
    print(f"\n{'='*60}")
    print("WRITING TO DATABASE")
    print("=" * 60)
    
    # Establish database connection
    conn = sqlite3.connect(db_path)
    
    # Store data in SQL table (replace if exists)
    df.to_sql("student_grades", conn, if_exists="replace", index=False)
    
    print("Data successfully stored in SQL database!")
    
    # DATA VERIFICATION - Confirm data was stored correctly
    verification_df = pd.read_sql_query("SELECT * FROM student_grades LIMIT 10", conn)
    print(f"\nVerification - First 10 rows:")
    print(verification_df.to_string())
    
    # Get total row count for confirmation
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM student_grades")
    row_count = cursor.fetchone()[0]
    
    print(f"\n{'='*60}")
    print("DATABASE LOAD COMPLETE")
    print("=" * 60)
    print(f"Total records stored: {row_count}")
    print(f"Database location: {db_path}")
    print("=" * 60)

# ERROR HANDLING - Catch and handle specific exceptions
except pd.errors.EmptyDataError:
    print("\nERROR: CSV file is empty")
    sys.exit(1)

except pd.errors.ParserError as e:
    print(f"\nERROR: Failed to parse CSV file: {e}")
    sys.exit(1)

except sqlite3.Error as e:
    print(f"\nDATABASE ERROR: {e}")
    sys.exit(1)

except Exception as e:
    print(f"\nUNEXPECTED ERROR: {e}")
    sys.exit(1)

# CLEANUP - Ensure database connection is properly closed
finally:
    if conn is not None:
        conn.close()
        print("Database connection closed")