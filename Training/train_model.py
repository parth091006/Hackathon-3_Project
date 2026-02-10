import joblib
import sqlite3
import pandas as pd
import os
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, ConfusionMatrixDisplay

# PATH SETUP
script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.normpath(
    os.path.join(script_dir, "..", "Database", "grades.db")
)

print("Using database at:", db_path)

# LOAD DATA
conn = sqlite3.connect(db_path)
df = pd.read_sql_query("SELECT * FROM student_grades", conn)
conn.close()

print("\nDataset shape:", df.shape)

# SCHEMA
expected_columns = [
    "Calculus-1",
    "Calculus-2",
    "Python-1",
    "Python-2",
    "SM-1",
    "SM-2",
]

# Drop roll number
if "Roll No." in df.columns:
    df = df.drop(columns=["Roll No."])

# Validate schema
if set(expected_columns) != set(df.columns):
    raise ValueError(
        f"\nDataset column mismatch!\n"
        f"Expected: {expected_columns}\n"
        f"Found: {df.columns.tolist()}"
    )

df = df[expected_columns]

print("\nTarget distribution:")
print(df["SM-2"].value_counts())

# FEATURES & TARGET
target_column = "SM-2"

X = df.drop(columns=[target_column])
y = df[target_column]

print("\nTraining target:", target_column)

# TRAIN and TEST SPLIT
try:
    X_train, X_test, y_train, y_test = train_test_split( X, y, test_size=0.2, random_state=42, stratify=y)
except:
    print("\nStratified split failed — using normal split")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# MODELS
models = {
    "Logistic Regression":
        LogisticRegression(max_iter=1000, class_weight="balanced"),

    "Decision Tree":
        DecisionTreeClassifier(class_weight="balanced"),

    "Random Forest":
        RandomForestClassifier(class_weight="balanced")
}

print("\nMODEL EVALUATION\n")

best_model = None
best_accuracy = 0
results = []

# TRAIN LOOP
for name, model in models.items():

    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)

    print(f"\n{name}")
    print("Accuracy:", accuracy)
    print(classification_report(y_test, predictions))

        # Track best model
    if accuracy > best_accuracy:
        best_accuracy = accuracy
        best_model = model

# SAVE BEST MODEL
results_df = pd.DataFrame(results, columns=["Model", "Accuracy"])

print("\nModel Comparison:")
print(results_df)

# Save model
best_model.feature_names_in_ = X.columns

model_path = os.path.join(script_dir, "best_model.pkl")
joblib.dump(best_model, model_path)

print("\nBest model saved at:", model_path)
print("Feature schema:", list(best_model.feature_names_in_))