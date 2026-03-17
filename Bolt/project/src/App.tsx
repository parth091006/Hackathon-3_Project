import { useState } from 'react';
import API from './api';

// Icons
import { Brain, CheckCircle, History } from 'lucide-react';

// Components
import Step1Profile from './components/Step1Profile';
import Step2Scores from './components/Step2Scores';
import Step3Results from './components/Step3Results';
import PredictionsHistory from './components/PredictionsHistory';

// Types
import { StudentProfile, SubjectScores, PredictionResult, Statistics } from './types';

function App() {
  // Application state management for multi-step workflow
  const [step, setStep] = useState(1);
  const [showPredictionsHistory, setShowPredictionsHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Student profile data - collected in Step 1
  const [profile, setProfile] = useState<StudentProfile>({
    full_name: '',
    roll_number: '',
    branch: '',
    year: '2nd Year',
  });

  // Subject scores data - collected in Step 2
  const [scores, setScores] = useState<SubjectScores>({
    calculus_1: 0,
    calculus_2: 0,
    python_1: 0,
    python_2: 0,
    sm_1: 0,
  });

  // Results data - populated after prediction API call
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);

    try {
      // API call to get student percentile prediction
      const predictionRes = await API.post("/api/predict", {
        profile: profile,
        scores: scores
      });

      // API call to get class statistics for comparison
      const statsRes = await API.get("/api/statistics");

      // Update state with results and navigate to results step
      setResult(predictionRes.data);
      setStatistics(statsRes.data);
      setStep(3);

    } catch (err) {
      console.error(err);
      setError("Backend server not reachable. Please ensure FastAPI server is running.");
    }

    setLoading(false);
  };

  const resetDashboard = () => {
    setStep(1);
    setShowPredictionsHistory(false);
    setProfile({ full_name: '', roll_number: '', branch: '', year: '2nd Year' });
    setScores({ calculus_1: 0, calculus_2: 0, python_1: 0, python_2: 0, sm_1: 0 });
    setResult(null);
    setStatistics(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 shadow-2xl">
        <div className="w-full max-w-[2000px] mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <Brain size={40} className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Student Percentile Prediction</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {step === 1 && (
                <button
                  onClick={() => setShowPredictionsHistory(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white font-medium rounded-lg hover:bg-white/30 transition-all duration-200 text-sm"
                >
                  <History size={16} />
                  View Model Predictions
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={resetDashboard}
                  className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/30 transition-all duration-200"
                >
                  New Prediction
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-center items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-white' : 'text-purple-300'}`}>
              {step > 1 ? <CheckCircle size={24} /> : <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-bold">1</div>}
              <span className="font-semibold">Student Profile</span>
            </div>
            <div className={`h-0.5 w-16 ${step >= 2 ? 'bg-white' : 'bg-purple-300'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-white' : 'text-purple-300'}`}>
              {step > 2 ? <CheckCircle size={24} /> : <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-bold">2</div>}
              <span className="font-semibold">Subject Scores</span>
            </div>
            <div className={`h-0.5 w-16 ${step >= 3 ? 'bg-white' : 'bg-purple-300'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-white' : 'text-purple-300'}`}>
              <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-bold">3</div>
              <span className="font-semibold">Results</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[2000px] mx-auto px-6 py-12 transition-all duration-500">
        {error && (
          <div className="bg-red-500 text-white px-6 py-4 rounded-lg mb-6 text-center font-semibold">
            {error}
          </div>
        )}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
          </div>
        )}

        {!loading && !showPredictionsHistory && step === 1 && (
          <Step1Profile profile={profile} setProfile={setProfile} onNext={() => setStep(2)} />
        )}

        {!loading && !showPredictionsHistory && step === 2 && (
          <Step2Scores
            scores={scores}
            setScores={setScores}
            onNext={handlePredict}
            onBack={() => {
              setResult(null);
              setStep(1);
            }}
          />
        )}

        {!loading && !showPredictionsHistory && step === 3 && result && statistics && (
          <Step3Results result={result} statistics={statistics} onBack={() => setStep(2)} />
        )}

        {!loading && showPredictionsHistory && (
          <PredictionsHistory onBack={() => setShowPredictionsHistory(false)} />
        )}
      </div>

      <footer className="bg-gray-800 border-t border-gray-700 mt-20">
        <div className="w-full max-w-[2000px] mx-auto px-6 py-6 text-center text-gray-400">
        </div>
      </footer>
    </div>
  );
}

export default App;