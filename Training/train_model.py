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

print("=" * 60)
print("STUDENT GRADE PREDICTION - MODEL TRAINING")
print("=" * 60)
print(f"\nUsing database at: {db_path}")

# DATABASE CONNECTION
if not os.path.exists(db_path):
    raise FileNotFoundError(
        f"\nDatabase not found at: {db_path}\n"
        f"Please run load_to_sql.py first to create the database."
    )

try:
    conn = sqlite3.connect(db_path)
    df = pd.read_sql_query("SELECT * FROM student_grades", conn)
    conn.close()
    print(f"✓ Database connected successfully")
except Exception as e:
    raise ConnectionError(f"Database connection failed: {e}")

print(f"✓ Dataset loaded - Shape: {df.shape}")

# DATA PREPROCESSING
expected_columns = [
    "Calculus-1",
    "Calculus-2",
    "Python-1",
    "Python-2",
    "SM-1",
    "SM-2",
]

# Drop roll number if present
if "Roll No." in df.columns:
    df = df.drop(columns=["Roll No."])
    print("✓ Removed 'Roll No.' column")

# Convert columns to numeric
for col in df.columns:
    df[col] = pd.to_numeric(df[col], errors='coerce')

# Validate schema
if set(expected_columns) != set(df.columns):
    raise ValueError(
        f"\n❌ Dataset column mismatch!\n"
        f"Expected: {expected_columns}\n"
        f"Found: {df.columns.tolist()}"
    )

# Reorder columns to match expected schema
df = df[expected_columns]

print("\n" + "=" * 60)
print("TARGET DISTRIBUTION (SM-2)")
print("=" * 60)
print(df["SM-2"].describe())
print("\nValue counts:")
print(df["SM-2"].value_counts().sort_index())

# FEATURES & TARGET
target_column = "SM-2"

X = df.drop(columns=[target_column])
y_continuous = df[target_column]

# Convert continuous scores to grade categories for classification
def score_to_grade(score):
    """Convert numeric score to grade category"""
    if score >= 90:
        return "A+"
    elif score >= 80:
        return "A"
    elif score >= 70:
        return "B+"
    elif score >= 60:
        return "B"
    elif score >= 50:
        return "C"
    elif score >= 35:
        return "D"
    else:
        return "F"

y = y_continuous.apply(score_to_grade)

print(f"\n✓ Features: {list(X.columns)}")
print(f"✓ Target: {target_column} (converted to grades)")
print(f"✓ Training samples: {len(X)}")
print(f"✓ Grade distribution:")
print(y.value_counts().sort_index())

# TRAIN-TEST SPLIT
try:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print("✓ Using stratified train-test split")
except:
    print("⚠ Stratified split failed - using normal split")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

print(f"  Train size: {len(X_train)}, Test size: {len(X_test)}")

# MODEL DEFINITIONS
models = {
    "Logistic Regression": LogisticRegression(
        max_iter=1000, class_weight="balanced", random_state=42
    ),
    "Decision Tree": DecisionTreeClassifier(
        class_weight="balanced", random_state=42
    ),
    "Random Forest": RandomForestClassifier(
        class_weight="balanced", random_state=42, n_estimators=100
    )
}

# MODEL TRAINING & EVALUATION
print("\n" + "=" * 60)
print("MODEL EVALUATION")
print("=" * 60)

best_model = None
best_model_name = ""
best_accuracy = 0
results = []

# TRAIN LOOP
for name, model in models.items():
    print(f"\n--- {name} ---")
    
    # Train model
    model.fit(X_train, y_train)
    
    # Make predictions
    predictions = model.predict(X_test)
    
    # Calculate accuracy
    accuracy = accuracy_score(y_test, predictions)
    
    print(f"Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
    print("\nClassification Report:")
    print(classification_report(y_test, predictions, zero_division=0))
    
    # Store results
    results.append({"Model": name, "Accuracy": accuracy})
    
    # Track best model
    if accuracy > best_accuracy:
        best_accuracy = accuracy
        best_model = model
        best_model_name = name

# RESULTS SUMMARY
results_df = pd.DataFrame(results)

print("\n" + "=" * 60)
print("MODEL COMPARISON SUMMARY")
print("=" * 60)
print(results_df.to_string(index=False))
print(f"\n🏆 Best Model: {best_model_name}")
print(f"🏆 Best Accuracy: {best_accuracy:.4f} ({best_accuracy*100:.2f}%)")

# CONFUSION MATRIX
print("\n" + "=" * 60)
print("GENERATING CONFUSION MATRIX")
print("=" * 60)

try:
    fig, ax = plt.subplots(figsize=(10, 8))
    
    # Get predictions for confusion matrix
    y_pred = best_model.predict(X_test)
    
    # Create confusion matrix display
    disp = ConfusionMatrixDisplay.from_predictions(
        y_test, 
        y_pred, 
        ax=ax, 
        cmap='Blues',
        colorbar=True
    )
    
    ax.set_title(f'Confusion Matrix - {best_model_name}\nAccuracy: {best_accuracy:.2%}')
    plt.tight_layout()
    
    # Save confusion matrix
    confusion_matrix_path = os.path.join(script_dir, "confusion_matrix.png")
    plt.savefig(confusion_matrix_path, dpi=150, bbox_inches='tight')
    print(f"✓ Confusion matrix saved: {confusion_matrix_path}")
    
    plt.close()
    
except Exception as e:
    print(f"⚠ Warning: Could not generate confusion matrix: {e}")

# SAVE BEST MODEL
print("\n" + "=" * 60)
print("SAVING MODEL")
print("=" * 60)

# Store feature names for later validation
best_model.feature_names_in_ = X.columns

model_path = os.path.join(script_dir, "best_model.pkl")

try:
    joblib.dump(best_model, model_path)
    print(f"✓ Model saved successfully: {model_path}")
    
    # Verify model was saved
    if os.path.exists(model_path):
        file_size = os.path.getsize(model_path) / 1024  # KB
        print(f"✓ Model file size: {file_size:.2f} KB")
    else:
        raise FileNotFoundError("Model file not created!")
        
except Exception as e:
    raise IOError(f"Failed to save model: {e}")

# FINAL SUMMARY
print("\n" + "=" * 60)
print("TRAINING COMPLETE")
print("=" * 60)
print(f"Model Type: {best_model_name}")
print(f"Model Accuracy: {best_accuracy:.2%}")
print(f"Feature Schema: {list(best_model.feature_names_in_)}")
print(f"Model Path: {model_path}")
print("=" * 60)