import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import API from '../utils/api';
import {
  ArrowLeft, Calendar, User, TrendingUp, Percent,
  Star, BarChart3, Target, Users, Brain, Activity, Database
} from 'lucide-react';

type TabId = 'overview' | 'models' | 'dataset' | 'history';

interface DashboardData {
  dataset: {
    total_students: number;
    branches: string[];
    features: number;
    target: string;
    avg_percentile: number;
    max_percentile: number;
    min_percentile: number;
  };
  training: {
    train_test_split: string;
    training_samples: number;
    testing_samples: number;
    cross_validation: string;
  };
  models: ModelMetrics[];
  feature_importance: FeatureImportance[];
}

interface PredictionHistory {
  id: string;
  student_name: string;
  roll_number: string;
  branch: string;
  predicted_percentile: number;
  confidence: number;
  date_time: string;
}

interface ModelMetrics {
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  rmse: number;
  is_best: boolean;
}

interface FeatureImportance {
  name: string;
  importance: number;
}

interface DatasetGrowth {
  initial: number;
  current: number;
  last_updated: string;
}

interface PredictionsHistoryProps {
  onBack: () => void;
}

// Framer Motion Variants
const tabContent = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

const cardHover = {
  whileHover: { scale: 1.02, y: -2, transition: { type: "spring", stiffness: 300, damping: 20 } },
  className: "transition-all duration-200"
};

const modelContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const modelRow = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 200 } }
};

export default function PredictionsHistory({ onBack }: PredictionsHistoryProps) {
  console.log("Component loaded");
  const [predictions, setPredictions] = useState<PredictionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [datasetGrowth, setDatasetGrowth] = useState<DatasetGrowth | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const bestModel = dashboardData?.models.find(m => m.is_best) || dashboardData?.models[0] || null;
  const sortedModels = [...(dashboardData?.models || [])].sort((a, b) => b.accuracy - a.accuracy);

  useEffect(() => {
    fetchPredictions();
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (dashboardData?.dataset) {
      setDatasetGrowth({
        initial: Math.max(0, dashboardData.dataset.total_students - predictions.length),
        current: dashboardData.dataset.total_students,
        last_updated: new Date().toISOString()
      });
    }
  }, [dashboardData, predictions]);

  const fetchDashboardData = async () => {
    try {
      setDashboardLoading(true);
      const response = await API.get('/dashboard-data');
      setDashboardData(response.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setDashboardData(null);
    } finally {
      setDashboardLoading(false);
    }
  };



  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/predictions');
      setPredictions(response.data);
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return 'text-green-400';
    if (percentile >= 75) return 'text-blue-400';
    if (percentile >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading || dashboardLoading) {
    return (
      <div className="w-full px-6 lg:px-12 xl:px-20">
        <div className="w-full max-w-[2000px] mx-auto bg-gray-800 rounded-3xl shadow-2xl p-12 lg:p-16 border border-gray-700">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
          </div>
        </div>
      </div>
    );
  }

  const avgPercentileComputed = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + p.predicted_percentile, 0) / predictions.length
    : 0;

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-20 transition-all duration-300">
      <div className="w-full max-w-[2000px] mx-auto bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-6 sm:p-10 lg:p-14 shadow-2xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-2">Prediction Engine</h2>
            <p className="text-gray-400 text-lg">System analytics & historical pipeline</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-gray-700/80 text-white font-bold rounded-2xl hover:bg-gray-600 transition-colors shadow-lg shadow-black/20"
          >
            <ArrowLeft size={18} /> Exit Dashboard
          </motion.button>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="flex overflow-x-auto gap-3 mb-10 border-b border-gray-700/50 pb-4 no-scrollbar">
          {[
            { id: 'overview' as TabId, label: 'System Overview', icon: Activity },
            { id: 'models' as TabId, label: 'Model Pipeline', icon: Brain },
            { id: 'dataset' as TabId, label: 'Dataset Metrics', icon: Database },
            { id: 'history' as TabId, label: 'Prediction Log', icon: Calendar }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: isActive ? 1 : 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold transition-all shadow-sm ${isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-none shadow-purple-500/20'
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700/50'
                  }`}
              >
                <Icon size={18} />
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        {/* Tab Content Rendering */}
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">

            {/* ════════════════════════════════════════════════════════════
                TAB: OVERVIEW
            ════════════════════════════════════════════════════════════ */}
            {activeTab === 'overview' && (
              <motion.div key="overview" variants={tabContent} initial="initial" animate="animate" exit="exit" className="space-y-8">

                {/* Hero — Best Model */}
                <motion.div
                  {...cardHover}
                  className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-10 shadow-xl shadow-green-900/20 relative overflow-hidden"
                >
                  <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-md text-white text-xs font-black tracking-wider uppercase px-4 py-2 rounded-full flex items-center gap-2 border border-white/20">
                    <Star size={14} fill="currentColor" /> Active Champion
                  </div>
                  <div className="flex items-center gap-6 mb-8">
                    <div className="bg-white/20 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                      <Brain size={40} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl lg:text-4xl font-black text-white tracking-tight">{bestModel?.name || 'No Model'}</h3>
                      <p className="text-green-100 font-medium opacity-90">Currently deployed for predictions</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-black/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                      <div className="text-green-100 text-sm mb-2 font-bold uppercase tracking-widest">Error (RMSE)</div>
                      <div className="text-5xl font-black text-white tabular-nums drop-shadow-md">
                        <CountUp end={bestModel?.rmse || 0} duration={1.5} decimals={2} delay={0.1} />
                      </div>
                    </div>
                    <div className="bg-black/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                      <div className="text-green-100 text-sm mb-2 font-bold uppercase tracking-widest">Model Score (R²)</div>
                      <div className="text-5xl font-black text-white tabular-nums drop-shadow-md">
                        <CountUp end={bestModel?.accuracy || 0} duration={1.5} decimals={1} suffix="%" delay={0.2} />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Quick Stats Grid */}
                <motion.div variants={modelContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { label: 'Total Students', value: <CountUp end={dashboardData?.dataset?.total_students || 0} separator="," duration={1.5} delay={0.1} />, icon: Users, color: 'blue', valueClass: 'text-4xl' },
                    { label: 'Features Used', value: <CountUp end={dashboardData?.dataset?.features || 0} duration={1.5} delay={0.2} />, icon: Target, color: 'orange', valueClass: 'text-4xl' },
                    { label: 'Avg Percentile', value: <CountUp end={avgPercentileComputed} duration={1.5} decimals={1} suffix="%" delay={0.4} />, icon: TrendingUp, color: 'purple', valueClass: 'text-4xl text-purple-400' }
                  ].map((stat, i) => (
                    <motion.div key={i} variants={modelRow} {...cardHover} className="bg-gray-900 rounded-2xl p-6 border border-gray-700 shadow-lg flex flex-col justify-between h-40">
                      <div className="flex items-center gap-4 mb-2">
                        <div className={`bg-${stat.color}-500/20 p-3 rounded-xl`}><stat.icon size={20} className={`text-${stat.color}-400`} /></div>
                        <div className="text-gray-400 text-sm font-bold uppercase tracking-wider">{stat.label}</div>
                      </div>
                      <div className={`${stat.valueClass} font-black drop-shadow-sm`}>{stat.value}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════
                TAB: MODELS
            ════════════════════════════════════════════════════════════ */}
            {activeTab === 'models' && (
              <motion.div key="models" variants={tabContent} initial="initial" animate="animate" exit="exit">
                <motion.div {...cardHover} className="bg-gray-900 rounded-2xl border border-gray-700 p-8 shadow-lg">
                  <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                    <BarChart3 size={28} className="text-purple-400" /> Model Performance Roster
                  </h3>
                  <motion.div variants={modelContainer} initial="hidden" animate="show" className="space-y-5">
                    {sortedModels.map((model, index) => (
                      <motion.div key={index} variants={modelRow} className="flex items-center gap-6 border-b border-gray-800 pb-5 last:border-0 last:pb-0">
                        {/* Label */}
                        <div className="w-56 shrink-0">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500 font-black text-sm bg-gray-800 px-2 py-0.5 rounded-lg border border-gray-700">#{index + 1}</span>
                            <div className="text-gray-200 font-bold text-base truncate">{model.name}</div>
                          </div>
                          {model.is_best && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <Star size={12} className="text-green-400" fill="currentColor" />
                              <span className="text-green-400 text-xs font-black uppercase tracking-wider">Champion</span>
                            </div>
                          )}
                        </div>
                        {/* Bar */}
                        <div className="flex-1 relative">
                          <div className="w-full bg-gray-800 rounded-full h-10 border border-gray-700/50 shadow-inner overflow-hidden">
                            <div
                              className={`h-full rounded-r-full flex items-center justify-end pr-5 shadow-lg ${model.is_best ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                                }`}
                              style={{ width: `${Math.max(model.accuracy, 5)}%`, transition: 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                            >
                              <span className="text-white text-sm font-black tabular-nums drop-shadow-md">
                                <CountUp end={model.accuracy} duration={1.5} decimals={1} suffix="%" delay={0.1 + index * 0.1} />
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* RMSE */}
                        <div className="w-24 shrink-0 text-right bg-gray-800 px-3 py-2 rounded-xl border border-gray-700/50">
                          <span className="block text-[10px] uppercase font-black tracking-wider text-gray-500 mb-1">RMSE Error</span>
                          <div className="text-white font-mono font-bold text-sm tracking-tight">{model.rmse.toFixed(2)}</div>
                        </div>
                      </motion.div>
                    ))}
                    {sortedModels.length === 0 && <div className="text-center text-gray-500 font-bold py-12">No model data available</div>}
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════
                TAB: DATASET
            ════════════════════════════════════════════════════════════ */}
            {activeTab === 'dataset' && (
              <motion.div key="dataset" variants={tabContent} initial="initial" animate="animate" exit="exit" className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div {...cardHover} className="bg-gray-900 rounded-2xl border border-gray-700 p-8 shadow-lg">
                    <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Base Dataset Size</div>
                    <div className="text-5xl font-black text-gray-500 tabular-nums">
                      <CountUp end={datasetGrowth?.initial || 0} separator="," duration={1.5} delay={0.1} />
                    </div>
                  </motion.div>
                  <motion.div {...cardHover} className="bg-gray-900 rounded-2xl border border-purple-500/30 p-8 shadow-[0_0_30px_rgba(168,85,247,0.1)] relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 bg-purple-500/10 w-24 h-24 rounded-full blur-2xl"></div>
                    <div className="text-purple-400 text-sm font-bold uppercase tracking-wider mb-2">Current Processed Set</div>
                    <div className="text-5xl font-black text-white tabular-nums drop-shadow-md">
                      <CountUp end={datasetGrowth?.current || 0} separator="," duration={1.5} delay={0.2} />
                    </div>
                  </motion.div>
                  <motion.div {...cardHover} className="bg-gray-900 rounded-2xl border border-green-500/30 p-8 shadow-[0_0_30px_rgba(34,197,94,0.05)] text-center flex flex-col justify-center">
                    <div className="text-green-400 text-sm font-bold uppercase tracking-wider mb-2">Automated Data Growth</div>
                    <div className="text-4xl font-black text-green-400 drop-shadow-sm tabular-nums">
                      + <CountUp end={(datasetGrowth?.current || 0) - (datasetGrowth?.initial || 0)} duration={2} delay={0.4} />
                    </div>
                    <div className="text-xs font-bold text-gray-500 mt-3 uppercase tracking-wider">New predictions retained</div>
                  </motion.div>
                </div>

              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════
                TAB: HISTORY
            ════════════════════════════════════════════════════════════ */}
            {activeTab === 'history' && (
              <motion.div key="history" variants={tabContent} initial="initial" animate="animate" exit="exit" className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800/80 border-b border-gray-700">
                      <tr>
                        <th className="px-6 py-5 text-left text-gray-400 font-bold uppercase tracking-wider">Student Name</th>
                        <th className="px-6 py-5 text-left text-gray-400 font-bold uppercase tracking-wider">Target %ile</th>
                        <th className="px-6 py-5 text-left text-gray-400 font-bold uppercase tracking-wider">Engine Conf</th>
                        <th className="px-6 py-5 text-left text-gray-400 font-bold uppercase tracking-wider">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {predictions.length === 0 ? (
                        <tr><td colSpan={4} className="py-24 text-center text-gray-500 font-bold text-lg"><Calendar className="mx-auto mb-4 opacity-50" size={40} />No prediction records found</td></tr>
                      ) : (
                        predictions.map((pred, i) => (
                          <motion.tr
                            key={pred.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                            className="hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="px-6 py-5 text-white font-bold">{pred.student_name}</td>
                            <td className="px-6 py-5">
                              <span className={`font-black text-lg ${getPercentileColor(pred.predicted_percentile)}`}>
                                {pred.predicted_percentile.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-5 text-gray-300 font-mono font-bold">{pred.confidence.toFixed(1)}%</td>
                            <td className="px-6 py-5 text-gray-500 text-xs font-bold tracking-wide uppercase">{formatDate(pred.date_time)}</td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}