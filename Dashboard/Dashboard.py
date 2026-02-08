import streamlit as st
import sqlite3
import pandas as pd
import joblib
import os
import numpy as np
import subprocess
import matplotlib.pyplot as plt
from sklearn.metrics import ConfusionMatrixDisplay
from sklearn.model_selection import train_test_split

# PAGE SETUP
st.set_page_config(page_title="Student Term Grade Prediction Dashboard", layout="wide")
st.title("Student Term Grade Prediction Dashboard")

# PATHS
script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)

db_path = os.path.join(project_dir, "Database", "grades.db")
model_path = os.path.join(project_dir, "Training", "best_model.pkl")
train_script = os.path.join(project_dir, "Training", "train_model.py")

# SIDEBAR
st.sidebar.title("System Control")

if st.sidebar.button("Retrain Model"):
    subprocess.run(["python", train_script])
    st.sidebar.success("Model retrained!")

# LOAD DATA
conn = sqlite3.connect(db_path)
df = pd.read_sql_query("SELECT * FROM student_grades", conn)
conn.close()

if "Roll No." in df.columns:
    df = df.drop(columns=["Roll No."])

model = joblib.load(model_path)

# RAW dataset (for analytics)
X_raw = df.iloc[:, :-1]
y = df.iloc[:, -1]

# MODEL aligned dataset
if hasattr(model, "feature_names_in_"):
    X = X_raw.reindex(columns=model.feature_names_in_, fill_value=0)
else:
    X = X_raw.copy()

# ACCURACY
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

accuracy = model.score(X_test, y_test)

# TABS
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "Dataset Overview",
    "Subject Analytics",
    "ML Prediction",
    "Export",
    "Model Insights"
])

# TAB 1
with tab1:

    st.subheader("Dataset Overview")
    st.dataframe(df, use_container_width=True)

    st.subheader("Summary")
    st.dataframe(df.describe(), use_container_width=True)

# TAB 2
with tab2:

    st.subheader("Subject Performance Distribution")

    subjects = X_raw.columns
    cols = st.columns(3)

    for i, subject in enumerate(subjects):
        with cols[i % 3]:
            fig, ax = plt.subplots()
            df[subject].value_counts().sort_index().plot.bar(ax=ax)
            ax.set_title(subject)
            st.pyplot(fig)

# TAB 3
with tab3:

    st.subheader("Predict ML Grade")

    feature_names = list(model.feature_names_in_)

    # Grade mapping
    grade_dict = {
        "A+": 10,
        "A": 9,
        "B+": 8,
        "B": 7,
        "C+": 6,
        "C": 5,
        "D": 4,
        "E": 2,
        "NC": 0
    }

    st.info("Select grades — they are automatically converted to numbers.")

    inputs = {}
    cols = st.columns(2)

    for i, feature in enumerate(feature_names):
        with cols[i % 2]:

            selected_grade = st.selectbox(
                feature,
                grade_dict.keys(),
                key=feature
            )

            inputs[feature] = grade_dict[selected_grade]

    if st.button("Predict Grade"):

        pred_df = pd.DataFrame([inputs])
        pred_df = pred_df.reindex(columns=feature_names, fill_value=0)

        pred = model.predict(pred_df)[0]

        # Grade mapping
        grade_map = {
            10: "A+",
            9: "A",
            8: "B+",
            7: "B",
            6: "C+",
            5: "C",
            4: "D",
            2: "E",
            0: "NC"
        }

        # Convert model output → nearest grade
        closest_score = min(grade_map.keys(), key=lambda x: abs(x - pred))
        predicted_grade = grade_map[closest_score]

        # Show grade instead of number
        st.success(f"Predicted Grade: {predicted_grade}")


# TAB 4
with tab4:

    st.subheader("Download Dataset")

    st.download_button(
        "Download CSV",
        df.to_csv(index=False),
        file_name="student_data.csv"
    )