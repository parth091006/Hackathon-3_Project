# Backend Server

## Setup

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Run the server:
```bash
python server.py
```

The server will start on http://localhost:8000

## API Endpoints

- `GET /api/statistics` - Get class statistics for all subjects
- `POST /api/predict` - Make grade predictions

## Requirements

- Python 3.8+
- FastAPI
- pandas
- scikit-learn
- Model file at: `../Training/best_model.pkl`
- Database file at: `../Database/grades.db`
