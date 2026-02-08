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

# Load SQL database
script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(script_dir, "..", "Database", "grades.db")
db_path = os.path.normpath(db_path)

print("Using database at:", db_path)

conn = sqlite3.connect(db_path)
df = pd.read_sql_query("SELECT * FROM student_grades", conn)
conn.close()

print("\nDataset shape:", df.shape)
print("Target distribution:\n", df.iloc[:, -1].value_counts())


# Drop roll number if present
if "Roll No." in df.columns:
    df = df.drop(columns=["Roll No."])

# Features & target
X = df.iloc[:, :-1]
y = df.iloc[:, -1]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y
)

# Models
models = {
    "Logistic Regression": LogisticRegression(max_iter=1000, class_weight="balanced"),
    "Decision Tree": DecisionTreeClassifier(class_weight="balanced"),
    "Random Forest": RandomForestClassifier(class_weight="balanced")
}


print("\nMODEL EVALUATION\n")

best_model = None
best_accuracy = 0
results = []

# Training loop
for name, model in models.items():

    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)

    print(f"\n{name}")
    print("Accuracy:", accuracy)
    print(classification_report(y_test, predictions))

    # Confusion matrix visualization
    ConfusionMatrixDisplay.from_predictions(y_test, predictions)
    plt.title(f"{name} Confusion Matrix")
    plt.show()

    # Feature importance (Random Forest only)
    if name == "Random Forest":
        importance = model.feature_importances_

        plt.figure(figsize=(8,5))
        plt.bar(X.columns, importance)
        plt.title("Feature Importance")
        plt.xticks(rotation=45)
        plt.show()

    # Store results
    results.append([name, accuracy])

    # Track best model
    if accuracy > best_accuracy:
        best_accuracy = accuracy
        best_model = model

# Model comparison table
results_df = pd.DataFrame(results, columns=["Model", "Accuracy"])

print("\nModel Comparison:")
print(results_df)

# Save best model
model_path = os.path.join(script_dir, "best_model.pkl")
joblib.dump(best_model, model_path)

print("\nBest model saved at:", model_path)