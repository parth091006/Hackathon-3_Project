# Student Grade Prediction Dashboard

A modern AI-powered dashboard for predicting student academic performance using machine learning.

## Features

- **Step-by-Step Interface**: Clean 3-step process for entering student information and getting predictions
- **Real-time Analytics**: Live comparison with class averages and difficulty assessments
- **AI Predictions**: Uses trained ML models (Linear Regression, Decision Tree, Random Forest)
- **Interactive Charts**: Plotly-powered visualizations for performance analysis
- **PDF Reports**: Comprehensive downloadable report cards
- **Dark Theme**: Professional dark UI with purple gradient accents

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- TailwindCSS for styling
- Plotly.js for charts
- jsPDF for PDF generation
- Axios for API calls

**Backend:**
- Python FastAPI
- pandas for data processing
- scikit-learn for ML model
- SQLite database

## Project Structure

```
Hackathon-3/
├── Dashboard/              (This React app)
├── Database/
│   ├── grades.db          (SQLite database)
│   ├── fetch_data.py
│   └── load_to_sql.py
├── Dataset/
└── Training/
    ├── train_model.py
    └── best_model.pkl     (Trained ML model)
```

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python server.py
```

The backend server will start on `http://localhost:8000`

**Note:** Make sure the following files exist:
- `Training/best_model.pkl` (trained model)
- `Database/grades.db` (SQLite database with `student_grades` table)

### 2. Frontend Setup

The dependencies are already installed. The frontend is ready to use.

## Running the Application

1. **Start the Backend:**
   ```bash
   cd backend
   python server.py
   ```

2. **Frontend is auto-started** (no manual action needed)

3. Open your browser and navigate to the frontend URL

## How to Use

### Step 1: Student Profile
- Enter student's full name
- Enter roll number
- Select branch (e.g., Computer Science)
- Select year of study
- Click "Next →"

### Step 2: Subject Percentiles
- Enter percentiles (0-100) for each subject:
  - Calculus-1
  - Calculus-2
  - Python-1
  - Python-2
  - SM-1

For each subject, you'll see:
- **Class Average**: Average score from the database
- **Difference**: How far above/below the class average
- **Status**: Above Average (green) or Below Average (red)
- **Difficulty**: Based on standard deviation (Easy/Medium/Hard)

Click "Predict Percentile →" to get results

### Step 3: Results & Analytics

The results page displays:

1. **Predicted Grade**: Large display of predicted percentile and letter grade
2. **Confidence Score**: Model confidence in the prediction
3. **Performance Metrics**:
   - Average Percentile
   - Strong Subjects (≥70%)
   - Weak Subjects (<60%)
4. **Interactive Chart**: Bar chart comparing your scores vs class averages
5. **Performance Table**: Detailed breakdown by subject
6. **Recommendations**: Subjects to focus on for improvement
7. **Download Report**: Generate comprehensive PDF report card

### Grade Scale

| Grade | Percentile Range |
|-------|-----------------|
| A+    | 91-100          |
| A     | 81-90           |
| B+    | 71-80           |
| B     | 61-70           |
| C     | 51-60           |
| D     | 36-50           |
| F     | 0-35            |

## PDF Report Contents

The downloadable report includes:

1. **Student Information**: Name, Roll Number, Branch, Year
2. **Subject Performance**: All subjects with percentiles and grades
3. **Class Comparison**: Your scores vs class averages
4. **Prediction Summary**: Predicted grade and confidence
5. **Performance Analysis**: Strong/weak subjects identification
6. **Performance Evaluation**: Overall performance rating
7. **Risk Assessment**: Academic risk level
8. **Recommendations**: Personalized improvement suggestions

## API Endpoints

### GET `/api/statistics`
Returns class statistics for all subjects (mean, median, std, min, max)

**Response:**
```json
{
  "Calculus-1": {
    "mean": 75.5,
    "median": 76.0,
    "std": 12.3,
    "min": 45.0,
    "max": 98.0
  },
  ...
}
```

### POST `/api/predict`
Makes grade prediction based on student profile and scores

**Request:**
```json
{
  "profile": {
    "full_name": "John Doe",
    "roll_number": "CS2024001",
    "branch": "Computer Science",
    "year": "2nd Year"
  },
  "scores": {
    "calculus_1": 85.5,
    "calculus_2": 78.0,
    "python_1": 92.0,
    "python_2": 88.5,
    "sm_1": 75.0
  }
}
```

**Response:**
```json
{
  "predicted_percentile": 82.5,
  "grade": "A",
  "confidence": 87.3,
  "percentile_range": "77-87",
  "profile": {...},
  "scores": {...}
}
```

## Troubleshooting

**Backend not connecting:**
- Ensure the backend server is running on port 8000
- Check that `Training/best_model.pkl` exists
- Verify `Database/grades.db` exists and contains `student_grades` table

**Statistics not loading:**
- Verify the database has data
- Check backend console for errors
- Ensure table name is exactly `student_grades`

**Prediction errors:**
- Ensure all percentiles are between 0-100
- Check that the model file is not corrupted
- Verify all required subject columns exist in the model

## Database Requirements

The `student_grades` table should have columns:
- Calculus-1
- Calculus-2
- Python-1
- Python-2
- SM-1

Each column should contain percentile scores (0-100).

## Features Implemented

✅ 3-step workflow (Profile → Scores → Results)
✅ Real-time class statistics and analytics
✅ Difficulty level calculation based on standard deviation
✅ Above/Below average status indicators
✅ ML model integration for predictions
✅ Interactive Plotly charts
✅ Comprehensive performance table
✅ Strong/weak subject identification
✅ Personalized recommendations
✅ PDF report generation
✅ Modern dark theme with purple gradients
✅ Responsive design
✅ Loading states and error handling

## Technologies Used

- React 18
- TypeScript
- TailwindCSS
- Plotly.js
- jsPDF
- Axios
- Lucide React (icons)
- FastAPI
- pandas
- scikit-learn
- SQLite
