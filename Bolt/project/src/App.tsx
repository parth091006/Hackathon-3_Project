import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from './utils/api';

// Icons
import { Brain, CheckCircle, History } from 'lucide-react';

// Components
import Step1Profile from './components/Step1Profile';
import Step2Scores from './components/Step2Scores';
import Step3Results from './components/Step3Results';
import PredictionsHistory from './components/PredictionsHistory';

// Types
import { StudentProfile, SubjectScores, PredictionResult, Statistics } from './types';

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4
} as const;

// Skeleton Loader Component
const SkeletonLoader = () => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }}
    className="w-full max-w-6xl mx-auto space-y-6"
  >
    <div className="bg-gray-800/50 rounded-2xl h-64 animate-pulse border border-gray-700"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gray-800/50 rounded-xl h-40 animate-pulse border border-gray-700"></div>
      <div className="bg-gray-800/50 rounded-xl h-40 animate-pulse border border-gray-700"></div>
      <div className="bg-gray-800/50 rounded-xl h-40 animate-pulse border border-gray-700"></div>
    </div>
  </motion.div>
);

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_error: any) {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Component Crash:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ color: "black", padding: "20px", background: "white" }}>Error loading component</div>;
    }
    return this.props.children;
  }
}

function App() {
  console.log("App loaded");
  const [step, setStep] = useState(1);
  const [showPredictionsHistory, setShowPredictionsHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<StudentProfile>({
    full_name: '',
    branch: '',
  });

  const [scores, setScores] = useState<SubjectScores>({
    python_1: 0,
    sql: 0,
    calculus_1: 0,
    python_2: 0,
    hackathon_1: 0,
    calculus_2: 0,
    sm_1: 0,
    linear_algebra: 0,
    discrete_mathematics: 0,
    hackathon_2: 0,
    dsa: 0,
  });

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);

  const handleRegisterAndNext = async (name: string, branch: string) => {
    setLoading(true);
    setError(null);
    try {
      await API.post('/register-student', {
        full_name: name,
        branch: branch,
      });
      setProfile({
        full_name: name,
        branch: branch,
      });
      setStep(2);
    } catch (err) {
      setError('Failed to register student. Please ensure the backend is running.');
    }
    setLoading(false);
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);

    try {
      const predictionRes = await API.post("/api/predict", {
        profile: profile,
        scores: scores
      });
      const statsRes = await API.get("/api/statistics");

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
    setProfile({ full_name: '', branch: '' });
    setScores({
      python_1: 0, sql: 0, calculus_1: 0, python_2: 0, hackathon_1: 0,
      calculus_2: 0, sm_1: 0, linear_algebra: 0, discrete_mathematics: 0,
      hackathon_2: 0, dsa: 0,
    });
    setResult(null);
    setStatistics(null);
    setError(null);
  };

  const getPageKey = () => {
    if (loading) return 'loading';
    if (showPredictionsHistory) return 'history';
    return `step-${step}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-x-hidden">
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 shadow-2xl relative z-10">
        <div className="w-full max-w-[2000px] mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <motion.div 
                whileHover={{ rotate: 5, scale: 1.05 }}
                className="bg-white/20 backdrop-blur-sm p-3 rounded-xl cursor-default"
              >
                <Brain size={40} className="text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Student Percentile Prediction</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto justify-end">
              {step === 1 && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={() => setShowPredictionsHistory(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-white/20 transition-all shadow-md hover:shadow-lg text-sm"
                >
                  <History size={18} />
                  View History
                </motion.button>
              )}
              {step === 3 && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={resetDashboard}
                  className="px-6 py-2.5 bg-white text-purple-700 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-md hover:shadow-lg"
                >
                  New Prediction
                </motion.button>
              )}
            </div>
          </div>

          {!showPredictionsHistory && (
            <div className="mt-10 flex justify-center items-center gap-2 md:gap-4 overflow-x-auto pb-2">
              {[
                { num: 1, label: 'Student Profile' },
                { num: 2, label: 'Subject Scores' },
                { num: 3, label: 'Results' }
              ].map((s, index) => (
                <React.Fragment key={s.num}>
                  <div className={`flex items-center gap-2 whitespace-nowrap ${step >= s.num ? 'text-white' : 'text-purple-300'}`}>
                    <motion.div 
                      initial={false}
                      animate={{ 
                        scale: step === s.num ? 1.1 : 1,
                        backgroundColor: step > s.num ? 'rgba(255,255,255,1)' : (step === s.num ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0)')
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step > s.num ? 'text-purple-600' : 'border-2 border-current'}`}
                    >
                      {step > s.num ? <CheckCircle size={18} /> : s.num}
                    </motion.div>
                    <span className="font-semibold text-sm md:text-base hidden sm:inline-block">{s.label}</span>
                  </div>
                  {index < 2 && (
                    <div className="h-0.5 w-8 md:w-16 mx-1 md:mx-0 overflow-hidden rounded-full bg-purple-400/30">
                      <motion.div 
                        initial={{ width: '0%' }}
                        animate={{ width: step > s.num ? '100%' : '0%' }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-white"
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 py-12 relative">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-500 text-white px-6 py-4 rounded-xl mb-8 text-center font-semibold shadow-lg max-w-4xl mx-auto"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={getPageKey()}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="w-full"
          >
            {loading && <SkeletonLoader />}

            {!loading && !showPredictionsHistory && step === 1 && (
              <ErrorBoundary>
                <Step1Profile profile={profile} setProfile={setProfile} onNext={handleRegisterAndNext} />
              </ErrorBoundary>
            )}

            {!loading && !showPredictionsHistory && step === 2 && (
              <ErrorBoundary>
                <Step2Scores
                  scores={scores}
                  setScores={setScores}
                  onNext={handlePredict}
                  onBack={() => { setResult(null); setStep(1); }}
                />
              </ErrorBoundary>
            )}

            {!loading && !showPredictionsHistory && step === 3 && result && statistics && (
              <ErrorBoundary>
                <Step3Results result={result} statistics={statistics} onBack={() => setStep(2)} />
              </ErrorBoundary>
            )}

            {!loading && showPredictionsHistory && (
              <ErrorBoundary>
                <PredictionsHistory onBack={() => {
                  setShowPredictionsHistory(false);
                  setStep(1);
                }} />
              </ErrorBoundary>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;