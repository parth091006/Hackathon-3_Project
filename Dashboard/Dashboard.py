import streamlit as st
import pandas as pd
import sqlite3
import joblib
import os
from io import BytesIO
from datetime import datetime

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors as rl_colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER

# Plotly for interactive charts
import plotly.graph_objects as go
import plotly.express as px
import plotly.io as pio

# PAGE CONFIGURATION

st.set_page_config(
    page_title="Student Grade Prediction Dashboard",
    # page_icon="🎓",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# CUSTOM CSS STYLING

st.markdown("""
<style>
    /* Main header styling */
    .main-header {
        text-align: center;
        padding: 2rem 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 15px;
        margin-bottom: 2rem;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    }
    
    .main-header h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
    }
    
    .main-header p {
        font-size: 1.1rem;
        opacity: 0.95;
        margin-top: 0;
    }
    
    /* Phase section headers */
    .phase-header {
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        padding: 15px 25px;
        border-radius: 10px;
        color: white;
        font-size: 1.3rem;
        font-weight: 600;
        margin: 2rem 0 1rem 0;
    }
    
    /* Input containers */
    .input-container {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 12px;
        border: 1px solid #e0e0e0;
        margin: 1rem 0;
    }
    
    /* Result cards */
    .result-card {
        padding: 2rem;
        border-radius: 15px;
        text-align: center;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        margin: 1.5rem 0;
    }
    
    /* Grade display */
    .grade-display {
        font-size: 5rem;
        font-weight: 800;
        margin: 1rem 0;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    /* Status badges */
    .status-badge {
        display: inline-block;
        padding: 5px 15px;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 600;
        margin: 0 5px;
    }
    
    .badge-above {
        background: #d4edda;
        color: #155724;
    }
    
    .badge-below {
        background: #f8d7da;
        color: #721c24;
    }
    
    .badge-easy {
        background: #d1ecf1;
        color: #0c5460;
    }
    
    .badge-medium {
        background: #fff3cd;
        color: #856404;
    }
    
    .badge-hard {
        background: #f8d7da;
        color: #721c24;
    }
    
    /* Metric styling */
    div[data-testid="stMetric"] {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 10px;
        border: 1px solid #e0e0e0;
    }
    
    /* Button styling */
    .stButton > button {
        width: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 0.75rem 2rem;
        font-size: 1.1rem;
        font-weight: 600;
        border-radius: 10px;
        transition: all 0.3s ease;
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
    }
    
    /* Info boxes */
    .info-box {
        background: #e7f3ff;
        border-left: 4px solid #2196F3;
        padding: 1rem;
        border-radius: 5px;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

# PATH CONFIGURATION

script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)

db_path = os.path.join(project_dir, "Database", "grades.db")
model_path = os.path.join(project_dir, "Training", "best_model.pkl")

# HELPER FUNCTIONS

def calculate_grade(marks):
    """Calculate letter grade from numeric marks"""
    try:
        marks = float(marks)
    except:
        return "F"
    
    if marks >= 91:
        return "A+"
    elif marks >= 81:
        return "A"
    elif marks >= 71:
        return "B+"
    elif marks >= 61:
        return "B"
    elif marks >= 51:
        return "C"
    elif marks >= 36:
        return "D"
    else:
        return "F"

def get_grade_range(grade):
    """Get marks range for a given grade"""
    grade_ranges = {
        "A+": "91-100",
        "A": "81-90",
        "B+": "71-80",
        "B": "61-70",
        "C": "51-60",
        "D": "36-50",
        "F": "0-35"
    }
    return grade_ranges.get(grade, "N/A")

def get_grade_color(grade):
    """Get color code for each grade"""
    grade_colors = {
        'A+': '#00C853', 'A': '#2E7D32',
        'B+': '#0277BD', 'B': '#01579B',
        'C': '#F57C00', 'D': '#E65100',
        'F': '#C62828'
    }
    return grade_colors.get(grade, '#757575')

def get_difficulty_badge(std):
    """Get difficulty indicator based on standard deviation"""
    if std > 15:
        return "🔴 Hard", "badge-hard"
    elif std > 10:
        return "🟡 Medium", "badge-medium"
    else:
        return "🟢 Easy", "badge-easy"

# DATABASE FUNCTIONS

@st.cache_data
def load_all_students_data(db_path):
    """Load entire student dataset from database for analysis"""
    if not os.path.exists(db_path):
        st.error(f"❌ Database not found: {db_path}")
        st.info("Please run load_to_sql.py first to create the database.")
        return None
    
    try:
        conn = sqlite3.connect(db_path)
        df = pd.read_sql_query("SELECT * FROM student_grades", conn)
        conn.close()
        return df
    except Exception as e:
        st.error(f"❌ Database error: {e}")
        return None

def calculate_class_stats(df):
    """Calculate mean, median, std for each subject"""
    subjects = ["Calculus-1", "Calculus-2", "Python-1", "Python-2", "SM-1"]
    stats = {}
    
    for subject in subjects:
        if subject in df.columns:
            stats[subject] = {
                'mean': df[subject].mean(),
                'median': df[subject].median(),
                'std': df[subject].std(),
                'min': df[subject].min(),
                'max': df[subject].max()
            }
    
    return stats

def get_student_by_roll(df, roll_number):
    """Fetch single student data by roll number"""
    if df is None:
        return None
    
    result = df[df['Roll No.'] == roll_number]
    if not result.empty:
        return result.iloc[0]
    return None

# MODEL FUNCTIONS

@st.cache_resource
def load_model():
    """Load trained model with caching"""
    if not os.path.exists(model_path):
        st.error("❌ Model file not found. Please train the model first.")
        st.info(f"Expected path: {model_path}")
        return None
    
    try:
        model = joblib.load(model_path)
        return model
    except Exception as e:
        st.error(f"❌ Model loading error: {e}")
        return None

# PDF GENERATION

def generate_report_card_pdf(student_info, subject_marks, predicted_grade, confidence, class_stats):
    """Generate professional PDF report card with class comparison"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=rl_colors.HexColor('#2C3E50'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=rl_colors.HexColor('#34495E'),
        spaceAfter=12,
        spaceBefore=12,
        fontName='Helvetica-Bold',
        backColor=rl_colors.HexColor('#ECF0F1')
    )
    
    # Title
    elements.append(Paragraph("<b>STUDENT REPORT CARD</b>", title_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Student Information
    elements.append(Paragraph("Student Information", heading_style))
    elements.append(Spacer(1, 0.1*inch))
    
    info_data = [
        ["Name:", student_info.get("Name", "-")],
        ["Roll Number:", student_info.get("Roll_Number", "-")],
        ["Branch:", student_info.get("Branch", "-")],
        ["Year:", student_info.get("Year", "-")],
        ["Report Date:", datetime.now().strftime("%B %d, %Y")]
    ]
    
    info_table = Table(info_data, colWidths=[2*inch, 4*inch])
    info_table.setStyle(TableStyle([
        ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 11),
        ('FONT', (1, 0), (1, -1), 'Helvetica', 11),
        ('TEXTCOLOR', (0, 0), (-1, -1), rl_colors.HexColor('#2C3E50')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Subject Performance Table
    elements.append(Paragraph("Subject Performance", heading_style))
    elements.append(Spacer(1, 0.1*inch))
    
    subject_order = ["Calculus-1", "Calculus-2", "Python-1", "Python-2", "SM-1"]
    subject_data = [["Subject Name", "Marks", "Grade"]]
    
    for subject in subject_order:
        if subject in subject_marks:
            marks = subject_marks[subject]
            grade = calculate_grade(marks)
            subject_data.append([subject, str(marks), grade])
    
    subject_table = Table(subject_data, colWidths=[2.5*inch, 1.5*inch, 1.5*inch])
    subject_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), rl_colors.HexColor('#3498DB')),
        ('TEXTCOLOR', (0, 0), (-1, 0), rl_colors.whitesmoke),
        ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 12),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 1, rl_colors.HexColor('#BDC3C7')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(subject_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Class Comparison Analysis
    if class_stats:
        elements.append(Paragraph("Class Comparison Analysis", heading_style))
        elements.append(Spacer(1, 0.1*inch))
        
        comparison_data = [["Subject", "Your Marks", "Class Avg", "Difference", "Status"]]
        
        for subject in subject_order:
            if subject in subject_marks and subject in class_stats:
                marks = subject_marks[subject]
                class_avg = class_stats[subject]['mean']
                difference = marks - class_avg
                status = "Above" if difference >= 0 else "Below"
                
                comparison_data.append([
                    subject,
                    str(marks),
                    f"{class_avg:.1f}",
                    f"{difference:+.1f}",
                    status
                ])
        
        comparison_table = Table(comparison_data, colWidths=[1.5*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1*inch])
        comparison_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), rl_colors.HexColor('#3498DB')),
            ('TEXTCOLOR', (0, 0), (-1, 0), rl_colors.whitesmoke),
            ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, rl_colors.HexColor('#BDC3C7')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(comparison_table)
        elements.append(Spacer(1, 0.3*inch))
    
    # Prediction Result
    elements.append(Paragraph("Prediction Result", heading_style))
    elements.append(Spacer(1, 0.1*inch))
    
    prediction_data = [
        ["Predicted SM-2 Grade:", f"<b>{predicted_grade}</b>"],
        ["Grade Range:", get_grade_range(predicted_grade)],
        ["Confidence Score:", f"{confidence:.1f}%"]
    ]
    
    prediction_table = Table(prediction_data, colWidths=[2.5*inch, 3.5*inch])
    prediction_table.setStyle(TableStyle([
        ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 11),
        ('FONT', (1, 0), (1, -1), 'Helvetica', 11),
        ('BACKGROUND', (1, 0), (1, 0), rl_colors.HexColor('#D5F4E6')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(prediction_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Performance Analysis
    elements.append(Paragraph("Performance Analysis", heading_style))
    elements.append(Spacer(1, 0.1*inch))
    
    marks_list = [subject_marks[s] for s in subject_order if s in subject_marks]
    avg_score = sum(marks_list) / len(marks_list) if marks_list else 0
    
    strong_subjects = [s for s in subject_order if s in subject_marks and subject_marks[s] >= 70]
    weak_subjects = [s for s in subject_order if s in subject_marks and subject_marks[s] < 60]
    
    analysis_data = [
        ["Strong Subjects (≥70):", ", ".join(strong_subjects) if strong_subjects else "None"],
        ["Weak Subjects (<60):", ", ".join(weak_subjects) if weak_subjects else "None"],
        ["Average Score:", f"{avg_score:.2f}"]
    ]
    
    analysis_table = Table(analysis_data, colWidths=[2.5*inch, 3.5*inch])
    analysis_table.setStyle(TableStyle([
        ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(analysis_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Performance Evaluation
    elements.append(Paragraph("Performance Evaluation", heading_style))
    elements.append(Spacer(1, 0.1*inch))
    
    if avg_score >= 85:
        perf_level = "Excellent"
    elif avg_score >= 70:
        perf_level = "Good"
    elif avg_score >= 55:
        perf_level = "Average"
    else:
        perf_level = "Poor"
    
    if avg_score >= 70:
        risk_level = "Low Risk"
    elif avg_score >= 55:
        risk_level = "Medium Risk"
    else:
        risk_level = "High Risk"
    
    evaluation_data = [
        ["Performance Level:", perf_level],
        ["Risk Level:", risk_level]
    ]
    
    evaluation_table = Table(evaluation_data, colWidths=[2.5*inch, 3.5*inch])
    evaluation_table.setStyle(TableStyle([
        ('FONT', (0, 0), (-1, -1), 'Helvetica-Bold', 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(evaluation_table)
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

# MAIN APPLICATION

def main():
    # Header
    st.markdown("""
    <div class="main-header">
        <h1>🎓 Student Grade Prediction Dashboard</h1>
        <p>Predict your expected SM-2 marks based on your previous subject performance</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Initialize session state
    if 'student_info' not in st.session_state:
        st.session_state['student_info'] = {
            'Name': '',
            'Roll_Number': '',
            'Branch': '',
            'Year': ''
        }
    
    if 'subject_marks' not in st.session_state:
        st.session_state['subject_marks'] = {
            'Calculus-1': 0,
            'Calculus-2': 0,
            'Python-1': 0,
            'Python-2': 0,
            'SM-1': 0
        }
    
    if 'prediction_result' not in st.session_state:
        st.session_state['prediction_result'] = None
    
    if 'all_students_data' not in st.session_state:
        st.session_state['all_students_data'] = load_all_students_data(db_path)
    
    if 'class_statistics' not in st.session_state and st.session_state['all_students_data'] is not None:
        st.session_state['class_statistics'] = calculate_class_stats(st.session_state['all_students_data'])
    
    # Load model
    model = load_model()
    if model is None:
        st.stop()
    
    # PHASE 1: STUDENT PROFILE
    
    st.markdown('<div class="phase-header">Section-1: Student Profile</div>', unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        Name = st.text_input("Full Name", value=st.session_state['student_info']['Name'], key='input_name')
        Roll_Number = st.text_input("Roll Number", value=st.session_state['student_info']['Roll_Number'], key='input_roll')
    
    with col2:
        Branch = st.text_input("Branch", value=st.session_state['student_info']['Branch'], key='input_branch')
        Year = st.text_input("Year of Study", value=st.session_state['student_info']['Year'], key='input_year')
    
    # Update session state
    st.session_state['student_info'].update({
        'Name': Name,
        'Roll_Number': Roll_Number,
        'Branch': Branch,
        'Year': Year
    })
    
    # Auto-fill button
    if st.button("🔍 Load My Data from Database", use_container_width=True):
        if not Roll_Number:
            st.warning("⚠️ Please enter your Roll Number first")
        else:
            with st.spinner("Searching database..."):
                student_data = get_student_by_roll(st.session_state['all_students_data'], Roll_Number)
                
                if student_data is not None:
                    # Auto-fill marks
                    subjects = ["Calculus-1", "Calculus-2", "Python-1", "Python-2", "SM-1"]
                    for subject in subjects:
                        if subject in student_data:
                            st.session_state['subject_marks'][subject] = float(student_data[subject])
                    
                    st.success(f"✅ Data loaded successfully for Roll No. {Roll_Number}!")
                    st.info("📊 Subject marks have been auto-filled below")
                    st.rerun()
                else:
                    st.error(f"❌ No data found for Roll No. {Roll_Number}")
                    st.info("💡 You can still enter your marks manually")
    
    # PHASE 2: MARKS ENTRY
        
    st.markdown('<div class="phase-header">Section-2: Subject Marks Entry</div>', unsafe_allow_html=True)
    
    subjects = ["Calculus-1", "Calculus-2", "Python-1", "Python-2", "SM-1"]
    class_stats = st.session_state.get('class_statistics', {})
    
    # Create two columns for subject inputs
    col1, col2 = st.columns(2)
    
    for i, subject in enumerate(subjects):
        with col1 if i % 2 == 0 else col2:
            # Subject input with class comparison
            marks = st.number_input(
                subject,
                min_value=0.0,
                max_value=100.0,
                value=float(st.session_state['subject_marks'][subject]),
                step=1.0,
                key=f"marks_{subject}"
            )
            st.session_state['subject_marks'][subject] = marks
            
            # Show class statistics if available
            if subject in class_stats:
                class_avg = class_stats[subject]['mean']
                class_std = class_stats[subject]['std']
                difference = marks - class_avg
                
                # Comparison badge
                if difference >= 0:
                    badge_html = f'<span class="status-badge badge-above">+{difference:.1f} above average</span>'
                else:
                    badge_html = f'<span class="status-badge badge-below">{difference:.1f} below average</span>'
                
                # Difficulty badge
                difficulty_text, difficulty_class = get_difficulty_badge(class_std)
                difficulty_html = f'<span class="status-badge {difficulty_class}">{difficulty_text}</span>'
                
                # Display info
                st.markdown(f"""
                <div style='margin-top: -10px; margin-bottom: 15px; font-size: 0.9rem;'>
                    Class Average: <strong>{class_avg:.1f}</strong> {badge_html} {difficulty_html}
                </div>
                """, unsafe_allow_html=True)
    
        # PREDICTION BUTTON
        
    st.markdown("<br>", unsafe_allow_html=True)
    
    if st.button("🎯 Predict My Grade", use_container_width=True, type="primary"):
        if not Roll_Number:
            st.error("❌ Please enter your Roll Number in Phase 1 before predicting")
        else:
            with st.spinner("🔮 Analyzing your performance and predicting grade..."):
                try:
                    # Prepare data for prediction
                    pred_df = pd.DataFrame([st.session_state['subject_marks']])
                    
                    # Align with model features
                    if hasattr(model, 'feature_names_in_'):
                        pred_df = pred_df.reindex(columns=model.feature_names_in_, fill_value=0)
                    
                    # Make prediction
                    prediction = model.predict(pred_df)[0]
                    
                    # Get confidence
                    confidence = 0.0
                    probabilities = None
                    
                    if hasattr(model, 'predict_proba'):
                        try:
                            proba = model.predict_proba(pred_df)[0]
                            confidence = float(max(proba) * 100.0)
                            probabilities = {
                                str(label): float(prob * 100.0)
                                for label, prob in zip(model.classes_, proba)
                            }
                        except:
                            pass
                    
                    # Store result
                    st.session_state['prediction_result'] = {
                        'predicted_grade': str(prediction),
                        'confidence': confidence,
                        'probabilities': probabilities,
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    st.success("✅ Prediction complete!")
                    st.rerun()
                    
                except Exception as e:
                    st.error(f"❌ Prediction failed: {e}")
                    st.info("💡 Please check your inputs and try again")
    
        # PHASE 3: PREDICTION RESULTS
        
    if st.session_state.get('prediction_result'):
        st.markdown('<div class="phase-header">Section-3: Prediction Results</div>', unsafe_allow_html=True)
        
        result = st.session_state['prediction_result']
        predicted_grade = result['predicted_grade']
        confidence = result.get('confidence', 0.0)
        grade_color = get_grade_color(predicted_grade)
        
        # Large grade display
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            st.markdown(f"""
            <div style='text-align: center; padding: 50px 40px;
                        background: linear-gradient(135deg, {grade_color}20 0%, {grade_color}10 100%);
                        border-radius: 20px; border: 4px solid {grade_color};
                        margin: 20px 0;'>
                <div class='grade-display' style='color: {grade_color};'>{predicted_grade}</div>
                <p style='font-size: 26px; color: #666; margin: 10px 0;'>
                    {get_grade_range(predicted_grade)} marks
                </p>
                <p style='font-size: 20px; color: #999;'>
                    Confidence: <strong>{confidence:.1f}%</strong>
                </p>
            </div>
            """, unsafe_allow_html=True)
        
        st.markdown("<br>", unsafe_allow_html=True)
        
        # Performance Comparison Chart
        if class_stats:
            st.markdown("### 📈 Performance Comparison")
            
            # Calculate averages
            student_avg = sum(st.session_state['subject_marks'].values()) / len(st.session_state['subject_marks'])
            class_avg_overall = sum([class_stats[s]['mean'] for s in st.session_state['subject_marks'].keys()]) / len(st.session_state['subject_marks'])
            
            # Create bar chart
            fig = go.Figure()
            
            fig.add_trace(go.Bar(
                x=['Your Average', 'Class Average'],
                y=[student_avg, class_avg_overall],
                marker_color=['#667eea', '#764ba2'],
                text=[f'{student_avg:.1f}', f'{class_avg_overall:.1f}'],
                textposition='auto',
                textfont=dict(size=16, color='white', family='Arial Black')
            ))
            
            fig.update_layout(
                title={
                    'text': 'Your Performance vs Class Average',
                    'x': 0.5,
                    'xanchor': 'center'
                },
                yaxis_title='Average Marks',
                height=350,
                showlegend=False,
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
            )
            
            st.plotly_chart(fig, use_container_width=True)
        
        # Subject-wise Analysis Table
        st.markdown("### 📋 Subject-wise Performance Analysis")
        
        comparison_data = []
        for subject, marks in st.session_state['subject_marks'].items():
            if subject in class_stats:
                class_avg = class_stats[subject]['mean']
                difference = marks - class_avg
                status = "✅ Above Average" if difference >= 0 else "⚠️ Below Average"
                
                comparison_data.append({
                    'Subject': subject,
                    'Your Marks': f"{marks:.0f}",
                    'Class Average': f'{class_avg:.1f}',
                    'Difference': f'{difference:+.1f}',
                    'Status': status,
                    'Grade': calculate_grade(marks)
                })
        
        comparison_df = pd.DataFrame(comparison_data)
        st.dataframe(
            comparison_df,
            use_container_width=True,
            hide_index=True,
            column_config={
                "Subject": st.column_config.TextColumn("Subject", width="medium"),
                "Your Marks": st.column_config.TextColumn("Your Marks", width="small"),
                "Class Average": st.column_config.TextColumn("Class Avg", width="small"),
                "Difference": st.column_config.TextColumn("Difference", width="small"),
                "Status": st.column_config.TextColumn("Status", width="medium"),
                "Grade": st.column_config.TextColumn("Grade", width="small"),
            }
        )
        
        # Performance Insights
        marks_list = list(st.session_state['subject_marks'].values())
        avg_score = sum(marks_list) / len(marks_list)
        strong_subjects = [s for s, m in st.session_state['subject_marks'].items() if m >= 70]
        weak_subjects = [s for s, m in st.session_state['subject_marks'].items() if m < 60]
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Average Score", f"{avg_score:.1f}")
        
        with col2:
            st.metric("Strong Subjects", len(strong_subjects))
        
        with col3:
            st.metric("Weak Subjects", len(weak_subjects))
        
        # Recommendations
        if weak_subjects:
            st.markdown('<div class="info-box">', unsafe_allow_html=True)
            st.markdown(f"**💡 Recommendation:** Focus on improving: {', '.join(weak_subjects)}")
            st.markdown('</div>', unsafe_allow_html=True)
    
       # PHASE 4: DOWNLOAD REPORT
       
    st.markdown('<div class="phase-header">Section-4: Report Card</div>', unsafe_allow_html=True)
    
    if st.button("📄 Download Report Card", use_container_width=True):
        pred_result = st.session_state.get('prediction_result')
        
        if pred_result is None:
            st.error("❌ Please run a prediction first in Phase 3")
        else:
            with st.spinner("📄 Generating PDF report..."):
                try:
                    pdf_bytes = generate_report_card_pdf(
                        student_info=st.session_state['student_info'],
                        subject_marks=st.session_state['subject_marks'],
                        predicted_grade=pred_result['predicted_grade'],
                        confidence=pred_result.get('confidence', 0.0),
                        class_stats=st.session_state.get('class_statistics')
                    )
                    
                    file_name = f"student_report_{st.session_state['student_info']['Roll_Number'] or 'unknown'}_{datetime.now().strftime('%Y%m%d')}.pdf"
                    
                    st.download_button(
                        label="📥 Download PDF Report",
                        data=pdf_bytes,
                        file_name=file_name,
                        mime='application/pdf',
                        use_container_width=True
                    )
                    
                    st.success("✅ Report generated successfully!")
                    
                except Exception as e:
                    st.error(f"❌ Failed to generate PDF: {e}")
                    st.info("💡 Please try again")
    
    # Footer
    st.markdown("<br><br>", unsafe_allow_html=True)
    st.divider()
    st.caption("🎓 Student Grade Prediction Dashboard | Built with Streamlit")


if __name__ == '__main__':
    main()