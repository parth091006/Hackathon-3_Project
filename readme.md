# Student Academic Performance Prediction System

A complete end-to-end machine learning and data engineering project that predicts student academic performance using historical subject scores.  
The system includes **synthetic dataset generation, SQL database integration, ML model training, automated retraining, FastAPI backend, and a React dashboard**.

---

## Project Overview

This project is designed to simulate a real-world academic prediction pipeline.

It allows users to:
- Register a student
- Enter academic subject scores
- Predict **SM-2 percentile**
- View prediction results with:
  - Grade
  - Confidence score
  - Percentile range
- Store prediction history
- Automatically retrain the model when new student data is added

---

## Objective

The main objective of this project is to build a **complete machine learning prediction system**, not just a standalone model.

It demonstrates:
- Data generation
- Data ingestion
- SQL-based storage
- Model comparison
- Real-time prediction
- Automated retraining
- Dashboard analytics

---

## Problem Statement

Educational institutions collect a large amount of academic data, but it is often underutilized.

This project aims to use student performance data to:
- Predict future academic outcomes
- Analyze subject-wise performance
- Provide insights through a dashboard
- Build an automated ML workflow

---

## System Architecture

```text
Synthetic Dataset Generation (script.py)
            ↓
CSV Dataset (Student_Dataset.csv)
            ↓
Load into SQL Database (load_to_sql.py)
            ↓
Fetch / Analyze Data (fetch_data.py)
            ↓
Train Multiple ML Models (train_model.py)
            ↓
Save Best Model (best_model.pkl)
            ↓
FastAPI Backend (server.py)
            ↓
React Dashboard (Frontend)
            ↓
Prediction + History + Analytics
            ↓
Auto Retraining (data_generator.py)

Hackathon-3/
│
├── Dataset/
│   ├── Student_Dataset.csv
│   ├── Hackathon_3_percentile.csv
│   └── script.py
│
├── Database/
│   ├── grades.db
│   ├── load_to_sql.py
│   └── fetch_data.py
│
├── Training/
│   ├── train_model.py
│   ├── best_model.pkl
│   ├── model_metrics.json
│   ├── model_metrics.csv
│   └── baseline_metrics.json
│
├── backend/
│   └── server.py
│
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── Step1Profile.tsx
│   │   ├── Step2Scores.tsx
│   │   ├── Step3Results.tsx
│   │   └── PredictionsHistory.tsx
│   └── main.tsx
│
├── data_generator.py
├── requirements.txt
└── README.md

### Features

Dataset Generation
Synthetic student dataset generation
1000 student records
11 subject features
Randomized branch assignment

Database Integration
CSV data stored in SQLite
Structured student records
Prediction history storage

Machine Learning
Multiple regression models trained and compared:
Linear Regression
Random Forest Regressor
KNN Regressor
Gradient Boosting Regressor
Decision Tree Regressor

Prediction System
Predicts SM-2 percentile
Returns:
Predicted percentile
Grade
Confidence score
Percentile range

Automated Pipeline
New student data is appended automatically
Database updates automatically
Model retrains automatically after new prediction

Dashboard
Model performance comparison
Dataset insights
Subject-wise statistics
Prediction history

Dataset Details
Total Students: 1000
Input Features: 11 subjects
Target Variable: SM-2
Input Features:
Python-1
SQL
Calculus-1
Python-2
Hackathon-1
Calculus-2
SM-1
Linear Algebra
Discrete Mathematics
Hackathon-2
DSA
Student Metadata:
Name
Roll No
Branch

Machine Learning Models Used

The following regression models were trained and compared:
Linear Regression
Random Forest Regressor
KNN Regressor
Gradient Boosting Regressor
Decision Tree Regressor

The best model is selected based on:

Lowest RMSE
Highest R²
Current Model Performance
Best Model:

Linear Regression

Metrics:
RMSE: 25.02
R² Score: -1.46%

Note: The current model performance is modest because the dataset is synthetically generated with weak feature-target relationships.
The primary strength of this project is the complete ML + Data Engineering pipeline, not just predictive accuracy.

Automated Retraining Workflow

Whenever a new student prediction is made:

Student data is added to dataset
SQL database is updated
Model is retrained automatically
Dashboard reflects updated metrics

This makes the project:

Dynamic
Scalable
Self-updating
Backend API Endpoints
Core Endpoints
Endpoint	Method	Description
/	GET	Check if API is running
/health	GET	Health check
/register-student	POST	Register new student
/api/statistics	GET	Subject-wise statistics
/api/predict	POST	Predict student percentile
/api/predictions	GET	Fetch prediction history
/dashboard-data	GET	Dashboard analytics

Tech Stack
Backend
Python
FastAPI
SQLite
Pandas
NumPy
Joblib
Scikit-learn
Frontend
React
TypeScript
Vite
Tailwind CSS
ML / Data
Scikit-learn
Synthetic Dataset Generation
Regression Models