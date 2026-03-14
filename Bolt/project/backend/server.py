from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import sqlite3
import numpy as np
from typing import Dict, List
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "..", "..", "..", "Training", "best_model.pkl")
DB_PATH = os.path.join(BASE_DIR, "..", "..", "..", "Database", "grades.db")

model = None

def load_model():
    global model
    try:
        model = joblib.load(MODEL_PATH)
        print("Model loaded successfully")
    except Exception as e:
        print(f"Error loading model: {e}")

load_model()

class StudentProfile(BaseModel):
    full_name: str
    roll_number: str
    branch: str
    year: str

class SubjectScores(BaseModel):
    calculus_1: float
    calculus_2: float
    python_1: float
    python_2: float
    sm_1: float

class PredictionRequest(BaseModel):
    profile: StudentProfile
    scores: SubjectScores

@app.get("/")
def read_root():
    return {"message": "Student Grade Prediction API"}

@app.get("/api/statistics")
def get_statistics():
    try:
        conn = sqlite3.connect(DB_PATH)
        df = pd.read_sql_query("SELECT * FROM student_grades", conn)
        conn.close()

        subjects = ['Calculus-1', 'Calculus-2', 'Python-1', 'Python-2', 'SM-1']
        stats = {}

        for subject in subjects:
            if subject in df.columns:
                stats[subject] = {
                    'mean': float(df[subject].mean()),
                    'median': float(df[subject].median()),
                    'std': float(df[subject].std()),
                    'min': float(df[subject].min()),
                    'max': float(df[subject].max())
                }

        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching statistics: {str(e)}")

@app.post("/api/predict")
def predict(request: PredictionRequest):
    try:
        if model is None:
            raise HTTPException(status_code=500, detail="Model not loaded")

        input_data = pd.DataFrame({
            'Calculus-1': [request.scores.calculus_1],
            'Calculus-2': [request.scores.calculus_2],
            'Python-1': [request.scores.python_1],
            'Python-2': [request.scores.python_2],
            'SM-1': [request.scores.sm_1]
        })

        prediction = model.predict(input_data)[0]

        prediction = max(0, min(100, prediction))

        scores = [
            request.scores.calculus_1,
            request.scores.calculus_2,
            request.scores.python_1,
            request.scores.python_2,
            request.scores.sm_1
        ]
        avg_score = sum(scores) / len(scores)
        variance = sum((x - avg_score) ** 2 for x in scores) / len(scores)
        confidence = max(50, min(95, 100 - (variance / 10)))

        def get_grade(percentile):
            if percentile >= 91:
                return 'A+'
            elif percentile >= 81:
                return 'A'
            elif percentile >= 71:
                return 'B+'
            elif percentile >= 61:
                return 'B'
            elif percentile >= 51:
                return 'C'
            elif percentile >= 36:
                return 'D'
            else:
                return 'F'

        grade = get_grade(prediction)

        lower = max(0, prediction - 5)
        upper = min(100, prediction + 5)

        return {
            'predicted_percentile': round(prediction, 2),
            'grade': grade,
            'confidence': round(confidence, 2),
            'percentile_range': f'{round(lower)}-{round(upper)}',
            'profile': request.profile.dict(),
            'scores': request.scores.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

@app.get("/health")
def health():
    return {"status": "API running"}

