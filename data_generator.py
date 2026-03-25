import pandas as pd    
import subprocess
import os
import sys
from datetime import datetime

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(SCRIPT_DIR, "Dataset", "Student_Dataset.csv")
DB_SCRIPT    = os.path.join(SCRIPT_DIR, "Database", "load_to_sql.py")
TRAIN_SCRIPT = os.path.join(SCRIPT_DIR, "Training", "train_model.py")

def add_student_and_retrain(
    name,
    branch,
    python_1,
    sql,
    calculus_1,
    python_2,
    hackathon_1,
    calculus_2,
    sm_1,
    linear_algebra,
    discrete_mathematics,
    hackathon_2,
    dsa,
    predicted_sm2
):
    print("DATA GENERATOR - NEW STUDENT PIPELINE")
    print(f"Student  : {name}")
    print(f"Branch   : {branch}")

    # STEP 1: Load existing dataset
    if not os.path.exists(DATASET_PATH):
        print(f"ERROR: Dataset not found at {DATASET_PATH}")
        sys.exit(1)

    df_existing = pd.read_csv(DATASET_PATH)
    existing_count = len(df_existing)
    print(f"Existing students: {existing_count}")

    # STEP 2: Generate Roll No. after last Roll No. in dataset
    last_sr   = int(df_existing["Sr No."].iloc[-1])
    last_roll = df_existing["Roll No"].iloc[-1]
    last_num  = int(last_roll.replace("STU", ""))

    new_sr   = last_sr + 1
    new_roll = f"STU{(last_num + 1):04d}"

    print(f"Roll No assigned: {new_roll}")

    # STEP 3: Build the new student row
    new_row = {
        "Sr No."               : new_sr,
        "Name"                 : name,
        "Roll No"              : new_roll,
        "Branch"               : branch,
        "Python-1"             : round(float(python_1), 2),
        "SQL"                  : round(float(sql), 2),
        "Calculus-1"           : round(float(calculus_1), 2),
        "Python-2"             : round(float(python_2), 2),
        "Hackathon-1"          : round(float(hackathon_1), 2),
        "Calculus-2"           : round(float(calculus_2), 2),
        "SM-1"                 : round(float(sm_1), 2),
        "Linear Algebra"       : round(float(linear_algebra), 2),
        "Discrete Mathematics" : round(float(discrete_mathematics), 2),
        "Hackathon-2"          : round(float(hackathon_2), 2),
        "DSA"                  : round(float(dsa), 2),
        "SM-2"                 : round(float(predicted_sm2), 2),
    }

    new_df = pd.DataFrame([new_row])

    # STEP 4: Append new student to existing dataset
    new_df.to_csv(DATASET_PATH, mode='a', header=False, index=False)
    print(f"Student added: {existing_count} → {existing_count + 1} students")
    print(f"Saved to: {DATASET_PATH}")

    # STEP 5: Auto-trigger load_to_sql.py
    print("TRIGGERING DATABASE UPDATE")

    result = subprocess.run(
        [sys.executable, DB_SCRIPT],
        capture_output=True, text=True
    )

    if result.returncode == 0:
        print("Database updated successfully")
    else:
        print("ERROR updating database:")
        print(result.stderr)
        sys.exit(1)

    # STEP 6: Auto-trigger train_model.py
    print("TRIGGERING MODEL RETRAINING")

    result = subprocess.run(
        [sys.executable, TRAIN_SCRIPT],
        capture_output=True, text=True
    )

    if result.returncode == 0:
        for line in result.stdout.split('\n'):
            if any(x in line for x in [
                'Best Model:', 'Best R²', 'Train size',
                'RMSE', 'MAE', 'R²', 'Metrics saved'
            ]):
                print(line)
    else:
        print("ERROR during model retraining:")
        print(result.stderr)
        sys.exit(1)

    # SUMMARY
    print("PIPELINE COMPLETE")
    print(f"Timestamp  : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Student    : {name} ({new_roll})")
    print(f"Total rows : {existing_count + 1}")
    print(f"Model      : retrained and saved")
    print(f"Dashboard  : refresh browser to see updated metrics")

    return new_roll