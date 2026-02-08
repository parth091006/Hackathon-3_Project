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

# Page setup & theme
st.set_page_config(
    page_title="ML Academic Dashboard",
    layout="wide"
)

st.title("Student Term Grade Prediction Dashboard")

# Safe paths
script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)

db_path = os.path.join(project_dir, "Database", "grades.db")
model_path = os.path.join(project_dir, "Training", "best_model.pkl")
train_script = os.path.join(project_dir, "Training", "train_model.py")

# Sidebar
st.sidebar.title("System Control")

if st.sidebar.button("Retrain Model"):
    subprocess.run(["python", train_script])
    st.sidebar.success("Model retrained!")

st.sidebar.success("Model: Random Forest")
st.sidebar.write("Pipeline Ready")

# Load data & model
conn = sqlite3.connect(db_path)
df = pd.read_sql_query("SELECT * FROM student_grades", conn)
conn.close()

if "Roll No." in df.columns:
    df = df.drop(columns=["Roll No."])

model = joblib.load(model_path)

X = df.iloc[:, :-1]
y = df.iloc[:, -1]

# Accuracy calculation
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

accuracy = model.score(X_test, y_test)

# Tabs
tab1, tab2, tab3, tab4 = st.tabs([
    "Analytics",
    "Model Insights",
    "Prediction",
    "Export"
])

# ANALYTICS TAB
with tab1:

    st.subheader("Dataset Overview")
    st.dataframe(df, use_container_width=True)

    st.subheader("Average Subject Scores")
    st.bar_chart(df.mean())

    st.metric("Model Accuracy", f"{accuracy:.2f}")

# MODEL INSIGHTS TAB
with tab2:

    st.subheader("Confusion Matrix")

    fig, ax = plt.subplots()
    ConfusionMatrixDisplay.from_estimator(
        model, X_test, y_test, ax=ax
    )
    st.pyplot(fig)

    st.subheader("Feature Importance")

    if hasattr(model, "feature_importances_"):

        importance = model.feature_importances_

        fig2, ax2 = plt.subplots()
        ax2.bar(X.columns, importance)
        plt.xticks(rotation=45)
        st.pyplot(fig2)

# PREDICTION TAB
with tab3:

    st.subheader("Student Profile Prediction")

    col1, col2 = st.columns(2)

    inputs = []

    with col1:
        for i in range(3):
            val = st.number_input(
                f"Subject {i+1}",
                0, 10, step=1
            )
            inputs.append(val)

    with col2:
        for i in range(3, 6):
            val = st.number_input(
                f"Subject {i+1}",
                0, 10, step=1
            )
            inputs.append(val)

    if st.button("Predict Grade"):

        prediction = model.predict([inputs])[0]

        st.success(f"Predicted Grade: {prediction}")

# EXPORT TAB
with tab4:

    st.subheader("Export Dataset")

    csv = df.to_csv(index=False)

    st.download_button(
        label="📥 Download Dataset CSV",
        data=csv,
        file_name="student_data.csv",
        mime="text/csv"
    )

st.caption("Hackathon ML Pipeline — SQL → Training → Dashboard → Lifecycle")