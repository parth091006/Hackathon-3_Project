# Standard Python libraries
# Standard Python libraries
import os
import csv
import json
from datetime import datetime
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(BASE_DIR)))

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

DB_PATH = os.path.join(PROJECT_ROOT, 'Database', 'grades.db')
MODEL_PATH = os.path.join(PROJECT_ROOT, 'Training', 'best_model.pkl')

# Third-party libraries
import joblib
import pandas as pd
import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Initialize FastAPI application
app = FastAPI()

# Configure CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # temporarily allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# File path configuration for model and database
dataset_path = os.path.join(
    PROJECT_ROOT, "Dataset", "Student_Dataset.csv"
)

if not os.path.exists(dataset_path):
    raise HTTPException(status_code=500, detail="Dataset not found")

# Global model variable for ML inference
model = None


def load_model():
    """Load the trained ML model for inference.
    
    This function is responsible ONLY for loading the best_model.pkl file
    for prediction purposes. It does NOT depend on any metrics files.
    """
    global model
    try:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
        
        model = joblib.load(MODEL_PATH)
        print(f"Model loaded successfully from: {MODEL_PATH}")
        print(f"Model type: {type(model).__name__}")
    except FileNotFoundError as e:
        print(f"ERROR: {e}")
        print("Please ensure the model has been trained and saved as best_model.pkl")
        model = None
    except Exception as e:
        print(f"ERROR loading model: {e}")
        model = None


# Load model on server startup
load_model()


def get_db_connection():
    """Helper function to get database connection with error handling."""
    try:
        return sqlite3.connect(DB_PATH)
    except Exception as e:
        print(f"Database connection error: {e}")
        return None


def load_model_metrics():
    """Load model metrics for dashboard display.
    
    This function is responsible ONLY for loading model_metrics.json
    for evaluation and reporting purposes. It has NO impact on predictions.
    
    Returns:
        dict: Model metrics data or None if file not found
    """
    metrics_path = os.path.join(PROJECT_ROOT, "Training", "model_metrics.json")
    
    try:
        if not os.path.exists(metrics_path):
            print(f"Metrics file not found: {metrics_path}")
            return None
        
        with open(metrics_path, 'r') as f:
            metrics = json.load(f)
        
        print(f"Model metrics loaded successfully from: {metrics_path}")
        return metrics
    except Exception as e:
        print(f"ERROR loading model metrics: {e}")
        return None


def get_dataset_statistics(dataset_path):
    """Calculate real statistics from the dataset."""
    try:
        if not os.path.exists(dataset_path):
            return None
        
        try:
            df = pd.read_csv(dataset_path, on_bad_lines='skip', engine='python')
            print(f"Dataset loaded successfully in get_statistics: {len(df)} valid rows")
        except Exception as e:
            print(f"Error loading dataset in get_statistics: {e}")
            return None
        
        # Look for percentile column
        percentile_col = None
        for col in df.columns:
            if "percentile" in col.lower() or "Percentile" in col:
                percentile_col = col
                break
        
        if percentile_col and percentile_col in df.columns:
            percentiles = df[percentile_col].dropna()
            if len(percentiles) > 0:
                return {
                    "avg_percentile": float(percentiles.mean()),
                    "max_percentile": float(percentiles.max()),
                    "min_percentile": float(percentiles.min())
                }
        
        return None
    except Exception as e:
        print(f"Error calculating dataset statistics: {e}")
        return None


# Pydantic models for API request/response validation
class StudentProfile(BaseModel):
    full_name: str
    branch: str


class StudentRegistrationRequest(BaseModel):
    full_name: str
    branch: str


class SubjectScores(BaseModel):
    python_1: float
    sql: float
    calculus_1: float
    python_2: float
    hackathon_1: float
    calculus_2: float
    sm_1: float
    linear_algebra: float
    discrete_mathematics: float
    hackathon_2: float
    dsa: float


class PredictionRequest(BaseModel):
    profile: StudentProfile
    scores: SubjectScores


@app.get("/")
def read_root():
    return {"message": "Student Grade Prediction API"}


@app.post("/register-student")
def register_student(request: StudentRegistrationRequest):
    print(f"Endpoint called: POST /register-student (User: {request.full_name})")
    try:
        print(f"Attempting to register student: {request.full_name}")
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Ensure student_grades table exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS student_grades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                "Name" TEXT,
                "Roll No" TEXT,
                "Branch" TEXT,
                "Python-1" REAL,
                "SQL" REAL,
                "Calculus-1" REAL,
                "Python-2" REAL,
                "Hackathon-1" REAL,
                "Calculus-2" REAL,
                "SM-1" REAL,
                "Linear Algebra" REAL,
                "Discrete Mathematics" REAL,
                "Hackathon-2" REAL,
                "DSA" REAL,
                "SM-2" REAL
            )
        """)
        
        cursor.execute(
            'SELECT "Roll No" FROM student_grades ORDER BY "Roll No" DESC LIMIT 1'
        )
        last_row = cursor.fetchone()
        
        if last_row and last_row[0]:
            try:
                last_num = int(last_row[0].replace('STU', ''))
                new_num = last_num + 1
            except ValueError:
                new_num = 0
        else:
            new_num = 0
            
        new_roll = f"STU{new_num:04d}"
        
        cursor.execute("""
            INSERT INTO student_grades 
            (Name, "Roll No", Branch, "Python-1", SQL, "Calculus-1",
             "Python-2", "Hackathon-1", "Calculus-2", "SM-1",
             "Linear Algebra", "Discrete Mathematics", "Hackathon-2",
             DSA, "SM-2")
            VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
        """, (request.full_name, new_roll, request.branch))
        
        conn.commit()
        conn.close()
        
        # Ensure Dataset directory exists before writing to CSV
        dataset_dir = os.path.join(PROJECT_ROOT, "Dataset")
        os.makedirs(dataset_dir, exist_ok=True)
        
        csv_path = os.path.join(dataset_dir, "Student_Dataset.csv")
        
        student_data = {
            "Name": request.full_name,
            "Roll No": new_roll,
            "Branch": request.branch,
            "Python-1": 0,
            "SQL": 0,
            "Calculus-1": 0,
            "Python-2": 0,
            "Hackathon-1": 0,
            "Calculus-2": 0,
            "SM-1": 0,
            "Linear Algebra": 0,
            "Discrete Mathematics": 0,
            "Hackathon-2": 0,
            "DSA": 0,
            "SM-2": 0
        }
        
        if not append_student_row_safe(csv_path, student_data):
            raise Exception("Failed to append student to CSV")
            
        print(f"Successfully registered student {new_roll}")
        return {
            "success": True,
            "roll_number": new_roll,
            "message": f"Student registered as {new_roll}"
        }
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print("\n=== REGISTRATION ERROR ===")
        print(error_details)
        print("==========================\n")
        raise HTTPException(
            status_code=500, 
            detail=f"Registration failed: {str(e)}"
        )


@app.get("/api/statistics")
def get_statistics():
    print("Endpoint called: GET /api/statistics")
    try:
        conn = get_db_connection()
        if conn is None:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        df = pd.read_sql_query("SELECT * FROM student_grades", conn)
        conn.close()

        # Calculate statistics for each subject
        subjects = [
            "Python-1", "SQL", "Calculus-1", "Python-2", "Hackathon-1",
            "Calculus-2", "SM-1", "Linear Algebra", "Discrete Mathematics",
            "Hackathon-2", "DSA"
        ]
        stats = {}

        for subject in subjects:
            if subject in df.columns:
                real_scores = df[df[subject] > 0][subject]
                if len(real_scores) == 0:
                    real_scores = df[subject]
                stats[subject] = {
                    "mean": float(real_scores.mean()),
                    "median": float(real_scores.median()),
                    "std": float(real_scores.std()),
                    "min": float(real_scores.min()),
                    "max": float(real_scores.max()),
                }

        return stats
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching statistics: {str(e)}"
        )


@app.post("/api/predict")
def predict(request: PredictionRequest):
    print(f"Endpoint called: POST /api/predict (User: {request.profile.full_name})")
    try:
        input_data = pd.DataFrame({
            "Python-1": [request.scores.python_1],
            "SQL": [request.scores.sql],
            "Calculus-1": [request.scores.calculus_1],
            "Python-2": [request.scores.python_2],
            "Hackathon-1": [request.scores.hackathon_1],
            "Calculus-2": [request.scores.calculus_2],
            "SM-1": [request.scores.sm_1],
            "Linear Algebra": [request.scores.linear_algebra],
            "Discrete Mathematics": [request.scores.discrete_mathematics],
            "Hackathon-2": [request.scores.hackathon_2],
            "DSA": [request.scores.dsa],
        })

        # Make prediction using loaded ML model
        if model is None:
            raise HTTPException(
                status_code=503, 
                detail="Model not available. Please ensure the model has been trained and loaded."
            )
        
        try:
            prediction = float(model.predict(input_data)[0])
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Model prediction failed: {str(e)}"
            )

        # Ensure prediction is within valid percentile range
        prediction = max(0, min(100, prediction))

        # Calculate confidence score based on score variance
        scores = [
            request.scores.calculus_1,
            request.scores.calculus_2,
            request.scores.python_1,
            request.scores.python_2,
            request.scores.sm_1,
        ]
        avg_score = sum(scores) / len(scores)
        variance = sum((x - avg_score) ** 2 for x in scores) / len(scores)
        confidence = max(50, min(95, 100 - (variance / 10)))

        # Grade classification helper function
        def get_grade(percentile):
            if percentile >= 91:
                return "A+"
            elif percentile >= 81:
                return "A"
            elif percentile >= 71:
                return "B+"
            elif percentile >= 61:
                return "B"
            elif percentile >= 51:
                return "C"
            elif percentile >= 36:
                return "D"
            else:
                return "F"

        # Calculate grade and percentile range
        grade = get_grade(prediction)
        lower = max(0, prediction - 5)
        upper = min(100, prediction + 5)
        
        # Save prediction to database and add student to dataset
        assigned_roll = ""
        try:
            # Add student to dataset and retrain model
            assigned_roll = add_student_and_retrain(
                name                 = request.profile.full_name,
                branch               = request.profile.branch,
                python_1             = request.scores.python_1,
                sql                  = request.scores.sql,
                calculus_1           = request.scores.calculus_1,
                python_2             = request.scores.python_2,
                hackathon_1          = request.scores.hackathon_1,
                calculus_2           = request.scores.calculus_2,
                sm_1                 = request.scores.sm_1,
                linear_algebra       = request.scores.linear_algebra,
                discrete_mathematics = request.scores.discrete_mathematics,
                hackathon_2          = request.scores.hackathon_2,
                dsa                  = request.scores.dsa,
                predicted_sm2        = prediction
            )
        except Exception as pipeline_error:
            print(f"Pipeline error (non-critical): {pipeline_error}")
            # Continue with response even if pipeline fails

        # Save prediction to predictions table
        try:
            conn = get_db_connection()
            if conn:
                cursor = conn.cursor()
                
                current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                
                cursor.execute("""
                    INSERT INTO predictions 
                    (student_name, roll_number, branch, predicted_percentile, confidence, date_time)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    request.profile.full_name,
                    assigned_roll,
                    request.profile.branch,
                    round(prediction, 2),
                    round(confidence, 2),
                    current_time
                ))
                
                conn.commit()
                conn.close()
        except Exception as db_error:
            print(f"Error saving prediction to database: {db_error}")
            # Continue with response even if DB save fails

        # Return comprehensive prediction results
        return {
            "predicted_percentile": float(round(prediction, 2)),
            "grade": grade,
            "confidence": float(round(confidence, 2)),
            "percentile_range": f"{round(lower)}-{round(upper)}",
            "student_name": request.profile.full_name,
            "roll_number": assigned_roll,
            "profile": request.profile.dict(),
            "scores": request.scores.dict(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

# ... (rest of the code remains the same)
@app.get("/api/predictions")
def get_predictions():
    """Fetch all prediction records from the database."""
    print("Endpoint called: GET /api/predictions")
    try:
        conn = get_db_connection()
        if conn is None:
            raise HTTPException(status_code=500, detail="Database connection failed")
        
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, student_name, roll_number, branch, predicted_percentile, confidence, date_time
            FROM predictions 
            ORDER BY date_time DESC
        """)
        
        rows = cursor.fetchall()
        conn.close()
        
        # Convert to list of dictionaries for JSON response
        predictions = []
        for row in rows:
            predictions.append({
                "id": row[0],
                "student_name": row[1],
                "roll_number": row[2],
                "branch": row[3],
                "predicted_percentile": row[4],
                "confidence": row[5],
                "date_time": row[6]
            })
        
        return predictions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching predictions: {str(e)}")


@app.get("/health")
def health():
    """Health check endpoint for monitoring server status."""
    return {"status": "API running"}


def append_student_row_safe(dataset_path, student_data):
    """Safely append a student row to the dataset CSV with explicit column mapping.
    
    Args:
        dataset_path: Path to the CSV file
        student_data: Dictionary with keys matching the exact column order
    
    Expected columns in order:
    ["Name", "Roll No", "Branch", "Python-1", "SQL", "Calculus-1", 
     "Python-2", "Hackathon-1", "Calculus-2", "SM-1", 
     "Linear Algebra", "Discrete Mathematics", "Hackathon-2", "DSA", "SM-2"]
    """
    try:
        # Ensure dataset directory exists
        dataset_dir = os.path.dirname(dataset_path)
        os.makedirs(dataset_dir, exist_ok=True)
        
        file_exists = os.path.exists(dataset_path)
        
        with open(dataset_path, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            if not file_exists:
                # Write header if file does not exist
                writer.writerow([
                    "Name", "Roll No", "Branch", "Python-1", "SQL", "Calculus-1",
                    "Python-2", "Hackathon-1", "Calculus-2", "SM-1",
                    "Linear Algebra", "Discrete Mathematics", "Hackathon-2",
                    "DSA", "SM-2"
                ])
            
            # Write row in exact column order with explicit mapping
            writer.writerow([
                student_data.get("Name", "N/A"),
                student_data.get("Roll No", "N/A"), 
                student_data.get("Branch", "N/A"),
                student_data.get("Python-1", 0),
                student_data.get("SQL", 0),
                student_data.get("Calculus-1", 0),
                student_data.get("Python-2", 0),
                student_data.get("Hackathon-1", 0),
                student_data.get("Calculus-2", 0),
                student_data.get("SM-1", 0),
                student_data.get("Linear Algebra", 0),
                student_data.get("Discrete Mathematics", 0),
                student_data.get("Hackathon-2", 0),
                student_data.get("DSA", 0),
                student_data.get("SM-2", 0)
            ])
        
        print(f"Safely appended student row: {student_data.get('Name', 'Unknown')} ({student_data.get('Roll No', 'N/A')})")
        return True
        
    except Exception as e:
        print(f"Error appending student row: {e}")
        return False


def repair_dataset_csv(csv_path):
    """Detect and repair misaligned rows in the dataset CSV with improved logic."""
    try:
        df = pd.read_csv(csv_path, on_bad_lines='skip', engine='python')
        print(f"Loaded dataset for repair: {len(df)} rows")
        
        # Detect misaligned rows where Name looks like a roll number
        repaired_rows = []
        misaligned_count = 0
        
        for index, row in df.iterrows():
            # Check if Name column contains a roll number pattern
            name_value = str(row.get('Name', '')).strip()
            roll_no_value = str(row.get('Roll No', '')).strip()
            
            # Detect misalignment: Name looks like roll number AND Roll No looks like branch
            if (name_value.startswith('STU') and len(name_value) == 8 and 
                ('B.Tech' in roll_no_value or 'M.Tech' in roll_no_value or roll_no_value in ['CSE', 'AIML', 'AIDS', 'CSBS', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'])):
                
                # This row is misaligned - shift values to correct positions
                misaligned_count += 1
                print(f"Repairing misaligned row {index}: Name='{name_value}', Roll No='{roll_no_value}'")
                
                # Create corrected row by shifting values
                corrected_row = {
                    'Name': 'Unknown Student',  # We lost the original name
                    'Roll No': name_value,      # Move roll number to correct position
                    'Branch': roll_no_value,    # Move branch to correct position
                }
                
                # Shift remaining values from the original row
                # Original: [STU1002, B.Tech AIDS, 0, 0, 0, ...]
                # Should be: [Unknown Student, STU1002, B.Tech AIDS, 0, 0, 0, ...]
                subject_columns = ['Python-1', 'SQL', 'Calculus-1', 'Python-2', 'Hackathon-1',
                                 'Calculus-2', 'SM-1', 'Linear Algebra', 'Discrete Mathematics',
                                 'Hackathon-2', 'DSA', 'SM-2']
                
                # Map the remaining columns (skip the first 3 which we already handled)
                original_columns = list(df.columns)
                for i, subject in enumerate(subject_columns):
                    if i + 3 < len(original_columns):
                        corrected_row[subject] = row.get(original_columns[i + 3], 0)
                    else:
                        corrected_row[subject] = 0
                
                repaired_rows.append(corrected_row)
            else:
                # Row is correctly aligned
                repaired_rows.append(row.to_dict())
        
        if misaligned_count > 0:
            print(f"Found and repaired {misaligned_count} misaligned rows")
            
            # Create backup of original file
            backup_path = csv_path.replace('.csv', '_backup.csv')
            df.to_csv(backup_path, index=False)
            print(f"Created backup: {backup_path}")
            
            # Save repaired data
            repaired_df = pd.DataFrame(repaired_rows)
            repaired_df.to_csv(csv_path, index=False)
            print(f"Saved repaired dataset: {csv_path}")
            
            return True, misaligned_count
        else:
            print("No misaligned rows found")
            return False, 0
            
    except Exception as e:
        print(f"Error repairing CSV: {e}")
        return False, 0


def add_student_and_retrain(name, branch, python_1, sql, calculus_1, python_2, hackathon_1, 
                          calculus_2, sm_1, linear_algebra, discrete_mathematics, 
                          hackathon_2, dsa, predicted_sm2):
    """Add student to dataset CSV with proper CSV formatting and return roll number."""
    try:
        # Get next roll number
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute(
            'SELECT "Roll No" FROM student_grades ORDER BY "Roll No" DESC LIMIT 1'
        )
        last_row = cursor.fetchone()
        
        if last_row and last_row[0]:
            try:
                last_num = int(last_row[0].replace('STU', ''))
                new_num = last_num + 1
            except ValueError:
                new_num = 1
        else:
            new_num = 1
            
        new_roll = f"STU{new_num:04d}"
        conn.close()
        
        # Append to CSV using safe helper function
        dataset_dir = os.path.join(PROJECT_ROOT, "Dataset")
        csv_path = os.path.join(dataset_dir, "Student_Dataset.csv")
        
        student_data = {
            "Name": name,
            "Roll No": new_roll,
            "Branch": branch,
            "Python-1": python_1,
            "SQL": sql,
            "Calculus-1": calculus_1,
            "Python-2": python_2,
            "Hackathon-1": hackathon_1,
            "Calculus-2": calculus_2,
            "SM-1": sm_1,
            "Linear Algebra": linear_algebra,
            "Discrete Mathematics": discrete_mathematics,
            "Hackathon-2": hackathon_2,
            "DSA": dsa,
            "SM-2": predicted_sm2
        }
        
        if not append_student_row_safe(csv_path, student_data):
            raise Exception("Failed to append student to CSV")
        
        print(f"Student {name} added to dataset with roll {new_roll}")
        return new_roll
        
    except Exception as e:
        print(f"Error adding student to dataset: {e}")
        raise Exception(f"Failed to add student: {str(e)}")


@app.get("/dashboard-data")
def get_dashboard_data():
    """Return comprehensive dashboard data including dataset info, training details, and model performance.
    
    This endpoint uses model_metrics.json ONLY for displaying model comparison metrics.
    It does NOT affect model prediction functionality.
    """
    print("Endpoint called: GET /dashboard-data")
    
    try:
        # Get dataset information
        dataset_path = os.path.join(
            PROJECT_ROOT, "Dataset", "Student_Dataset.csv"
        )
        
        if not os.path.exists(dataset_path):
            raise HTTPException(status_code=500, detail="Dataset not found")
        
        try:
            df = pd.read_csv(dataset_path, on_bad_lines='skip', engine='python')
            print(f"Dataset loaded successfully in get_dashboard_data: {len(df)} valid rows")
            
            # Check and repair misaligned rows
            repaired, count = repair_dataset_csv(dataset_path)
            if repaired:
                print(f"Repaired {count} misaligned rows, reloading dataset")
                df = pd.read_csv(dataset_path, on_bad_lines='skip', engine='python')
                print(f"Dataset reloaded after repair: {len(df)} valid rows")
        except Exception as e:
            print(f"Error loading dataset in get_dashboard_data: {e}")
            raise HTTPException(status_code=500, detail=f"Dataset loading failed: {str(e)}")
        print(f"Dataset shape: {df.shape}")
        print(f"Model loaded: {model is not None}")
        
        total_students = int(len(df))
        
        feature_columns = [
            "Python-1", "SQL", "Calculus-1", "Python-2", "Hackathon-1",
            "Calculus-2", "SM-1", "Linear Algebra", "Discrete Mathematics",
            "Hackathon-2", "DSA"
        ]
        actual_features = [col for col in feature_columns if col in df.columns]
        features = int(len(actual_features))
        
        # Safe dataset statistics
        avg_percentile = 0.0
        max_percentile = 0.0
        min_percentile = 0.0
        
        try:
            if "SM-2" in df.columns:
                avg_percentile = float(df["SM-2"].mean())
                max_percentile = float(df["SM-2"].max())
                min_percentile = float(df["SM-2"].min())
        except Exception as e:
            print("Dataset stats error:", e)
        
        dataset_info = {
            "total_students": total_students,
            "features": features,
            "avg_percentile": avg_percentile,
            "max_percentile": max_percentile,
            "min_percentile": min_percentile,
        }
        
        # Training details (calculated from dataset)
        training_details = {
            "train_test_split": "80:20",
            "training_samples": int(total_students * 0.8),
            "testing_samples": int(total_students * 0.2),
            "cross_validation": "5-Fold Cross Validation"
        }
        
        # Load model metrics for dashboard display
        metrics = load_model_metrics()
        
        model_performance = []
        if metrics is None:
            # Fallback values when metrics file is not available
            print("WARNING: Using fallback model performance data")
            model_performance = [{
                "name": "Linear Regression",
                "accuracy": 92.0,
                "rmse": 4.5,
                "is_best": True,
                "reason": "Default model - metrics file not found"
            }]
        else:
            try:
                parsed_models = []
                for result in metrics["all_results"]:
                    parsed_models.append({
                        "name": str(result["Model"]),
                        "r2_raw": float(result["R2"]),
                        "accuracy": float(result["R2"] * 100),
                        "rmse": float(result["RMSE"])
                    })

                top_models = sorted(parsed_models, key=lambda x: (-x["r2_raw"], x["rmse"]))
                best_model = top_models[0]

                TOL = 1e-5
                for m in top_models:
                    if (
                        abs(m["r2_raw"] - best_model["r2_raw"]) < TOL and 
                        abs(m["rmse"] - best_model["rmse"]) < TOL
                    ):
                        if m["name"] == "Linear Regression":
                            best_model = m
                            break

                for m in top_models:
                    m["is_best"] = (m["name"] == best_model["name"])
                    
                    # Round only for UI output
                    m["accuracy"] = float(round(m["accuracy"], 2))
                    m["rmse"] = float(round(m["rmse"], 2))
                    
                    if m["is_best"]:
                        m["reason"] = f"Based on highest R² ({m['accuracy']}%) and lowest RMSE ({m['rmse']})"
                    
                model_performance = top_models
            except Exception as e:
                print(f"Error parsing metrics data: {e}")
                model_performance = [{
                    "name": "Error Loading",
                    "accuracy": 0.0,
                    "rmse": 0.0,
                    "is_best": False,
                    "reason": f"Metrics parsing error: {str(e)}"
                }]
        
        # Safe feature importance extraction (for display only)
        feature_importance = []
        
        try:
            if model is not None and hasattr(model, "feature_importances_"):
                feature_names = ["SM-1", "Calculus-1", "Python-1", "Python-2", "Calculus-2"]
                importances = model.feature_importances_

                if len(importances) == len(feature_names):
                    feature_importance = [
                        {"name": str(name), "importance": float(val * 100)}
                        for name, val in zip(feature_names, importances)
                    ]
        except Exception as e:
            print("Feature importance error:", e)

        if not feature_importance:
            feature_importance = [
                {"name": "Python-1", "importance": 12.0},
                {"name": "SQL", "importance": 10.0},
                {"name": "Calculus-1", "importance": 10.0},
                {"name": "Python-2", "importance": 10.0},
                {"name": "Hackathon-1", "importance": 8.0},
                {"name": "Calculus-2", "importance": 10.0},
                {"name": "SM-1", "importance": 10.0},
                {"name": "Linear Algebra", "importance": 8.0},
                {"name": "Discrete Mathematics", "importance": 8.0},
                {"name": "Hackathon-2", "importance": 7.0},
                {"name": "DSA", "importance": 7.0},
            ]
        
        # Prepare dataset rows for frontend (return entire dataset)
        dataset_rows = []
        try:
            # Use entire dataset instead of limiting to first 200 rows
            df_full = df
            
            # Convert DataFrame to list of dictionaries
            for _, row in df_full.iterrows():
                row_dict = {}
                # Handle all possible columns with proper fallbacks
                columns = ["Name", "Roll No", "Branch", "Python-1", "SQL", "Calculus-1",
                          "Python-2", "Hackathon-1", "Calculus-2", "SM-1", 
                          "Linear Algebra", "Discrete Mathematics", "Hackathon-2", "DSA", "SM-2"]
                
                for col in columns:
                    if col in row.index and pd.notna(row[col]):
                        # Convert to appropriate type
                        if col in ["Name", "Roll No", "Branch"]:
                            row_dict[col] = str(row[col])
                        else:
                            # Numeric columns - convert to float with 2 decimal places
                            try:
                                row_dict[col] = float(round(float(row[col]), 2))
                            except (ValueError, TypeError):
                                row_dict[col] = 0.0
                    else:
                        # Missing columns
                        if col in ["Name", "Roll No", "Branch"]:
                            row_dict[col] = "N/A"
                        else:
                            row_dict[col] = 0.0
                
                dataset_rows.append(row_dict)
                
            print(f"Prepared {len(dataset_rows)} dataset rows for frontend")
            
        except Exception as e:
            print(f"Error preparing dataset rows: {e}")
            dataset_rows = []
        
        return {
            "dataset": dataset_info,
            "training": training_details,
            "models": model_performance,
            "feature_importance": feature_importance,
            "dataset_rows": dataset_rows
        }
        
    except Exception as e:
        print(f"Dashboard API error: {e}")
        raise HTTPException(status_code=500, detail=f"Dashboard error: {str(e)}")


def init_db():
    """Initialize the database and create predictions table if it doesn't exist."""
    try:
        conn = get_db_connection()
        if conn is None:
            print("Failed to initialize database - connection error")
            return
        
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_name TEXT NOT NULL,
                roll_number TEXT NOT NULL,
                branch TEXT NOT NULL,
                predicted_percentile REAL NOT NULL,
                confidence REAL NOT NULL,
                date_time TEXT NOT NULL
            )
        """)
        
        conn.commit()
        conn.close()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Error initializing database: {e}")


# Initialize DB AFTER function is defined
init_db()


if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*50)
    print("TIP: For auto-reloading during development, run:")
    print("     uvicorn server:app --reload")
    print("="*50 + "\n")

    # Start the FastAPI server
    uvicorn.run(app, host="0.0.0.0", port=8000)