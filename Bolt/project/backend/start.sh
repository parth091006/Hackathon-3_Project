#!/bin/bash

echo "Starting Student Grade Prediction Backend Server..."
echo "Server will run on http://localhost:8000"
echo ""
echo "Make sure you have:"
echo "1. Installed dependencies: pip install -r requirements.txt"
echo "2. Model file at: ../Training/best_model.pkl"
echo "3. Database file at: ../Database/grades.db"
echo ""

python server.py
