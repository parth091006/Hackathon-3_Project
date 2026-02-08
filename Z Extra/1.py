import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px

# 1. Setup Page
st.set_page_config(page_title="Hackathon Dashboard", layout="wide")
st.title("🚀 Hackathon Project: Data Insights")

# 2. Sidebar for navigation/filters
st.sidebar.header("Settings")
user_name = st.sidebar.text_input("Enter your name", "Analyst")
chart_type = st.sidebar.selectbox("Choose Chart", ("Bar", "Line", "Scatter"))

# 3. Create some dummy data (Replace this with your CSV later)
df = pd.DataFrame(
    np.random.randn(10, 2),
    columns=['Efficiency', 'Growth']
)

# 4. Display Metrics
st.write(f"### Welcome, {user_name}!")
kpi1, kpi2, kpi3 = st.columns(3)
kpi1.metric(label="Score", value="98%", delta="2%")
kpi2.metric(label="Latency", value="45ms", delta="-5ms")
kpi3.metric(label="Errors", value="0.02%", delta="-0.01%")

st.divider()

# 5. Display Charts
col_left, col_right = st.columns(2)

with col_left:
    st.subheader("Data Table")
    st.dataframe(df, use_container_width=True)

with col_right:
    st.subheader("Visual Analysis")
    if chart_type == "Bar":
        st.bar_chart(df)
    elif chart_type == "Line":
        st.line_chart(df)
    else:
        fig = px.scatter(df, x="Efficiency", y="Growth", size_max=60)
        st.plotly_chart(fig, use_container_width=True)

st.success("Dashboard successfully loaded!")