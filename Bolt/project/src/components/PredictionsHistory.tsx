import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import API from '../utils/api';
import {
  ArrowLeft,
  Star, BarChart3, Users, Brain, Database, Search, Code, Server, HardDrive, Beaker, Cpu
} from 'lucide-react';

type TabId = 'models' | 'dataset' | 'techstack';

interface DashboardData {
  dataset: {
    total_students: number;
    features: number;
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
}

interface ModelMetrics {
  name: string;
  accuracy: number;
  rmse: number;
  is_best: boolean;
  reason?: string;
  r2_raw?: number;
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
} as const;

const modelContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const modelRow = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 200 } }
} as const;

export default function PredictionsHistory({ onBack }: PredictionsHistoryProps) {
  console.log("Component loaded");
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('models');
  const [searchTerm, setSearchTerm] = useState('');
  const [datasetData, setDatasetData] = useState<any[]>([]);

  const sortedModels = [...(dashboardData?.models || [])].sort((a, b) => b.accuracy - a.accuracy);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setDashboardLoading(true);
      const response = await API.get('/dashboard-data');
      setDashboardData(response.data);

      // Set dataset data from backend response
      if (response.data?.dataset_rows) {
        setDatasetData(response.data.dataset_rows);
      } else {
        setDatasetData([]);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setDashboardData(null);
    } finally {
      setDashboardLoading(false);
    }
  };

  if (dashboardLoading) {
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

  if (!dashboardData) {
    return (
      <div className="w-full px-6 lg:px-12 xl:px-20">
        <div className="w-full max-w-[2000px] mx-auto bg-gray-800 rounded-3xl shadow-2xl p-12 lg:p-16 border border-gray-700">
          <div className="text-center py-20">
            <div className="text-red-400 text-xl font-bold mb-4">Unable to load dashboard data</div>
            <div className="text-gray-400 mb-6">Please check if the backend server is running on localhost:8000</div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchDashboardData}
              className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors"
            >
              Retry
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-20 transition-all duration-300">
      <div className="w-full max-w-[2000px] mx-auto bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-6 sm:p-10 lg:p-14 shadow-2xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-2"></h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-gray-700/80 text-white font-bold rounded-2xl hover:bg-gray-600 transition-colors shadow-lg shadow-black/20"
          >
            <ArrowLeft size={18} /> Back to Main Page
          </motion.button>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="flex overflow-x-auto gap-3 mb-10 border-b border-gray-700/50 pb-4 no-scrollbar">
          {[
            { id: 'models' as TabId, label: 'Models Used', icon: Brain },
            { id: 'dataset' as TabId, label: 'Dataset', icon: Database },
            { id: 'techstack' as TabId, label: 'Tech Stack', icon: Code }
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

        {/* Tab Content Rendering - CORRECTED STRUCTURE */}
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">

            {/* ════════════════════════════════════════════════════════════
                TAB: MODELS
            ════════════════════════════════════════════════════════════ */}
            {activeTab === 'models' && (
              <motion.div key="models" variants={tabContent} initial="initial" animate="animate" exit="exit" className="space-y-8">

                {/* Hero — Best Model */}
                {dashboardData?.models.find(m => m.is_best) && (
                  <motion.div
                    {...cardHover}
                    className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-10 shadow-xl shadow-green-900/20 relative overflow-hidden"
                  >
                    <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-md text-white text-xs font-black tracking-wider uppercase px-4 py-2 rounded-full flex items-center gap-2 border border-white/20">
                      <Star size={12} className="text-white" fill="currentColor" />
                      Best Model
                    </div>
                    <div className="flex items-center gap-6 mb-8">
                      <div className="bg-white/20 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                        <Brain size={40} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
                          {dashboardData.models.find(m => m.is_best)?.name || 'Best Model'}
                        </h3>
                        {dashboardData.models.find(m => m.is_best)?.reason && (
                          <p className="text-green-100 text-sm mt-2 font-medium">
                            {dashboardData.models.find(m => m.is_best)?.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-black/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                        <div className="text-green-100 text-sm mb-2 font-bold uppercase tracking-widest">ERROR (RMSE)</div>
                        <div className="text-5xl font-black text-white tabular-nums drop-shadow-md">
                          {dashboardData.models.find(m => m.is_best)?.rmse.toFixed(2) || '0.00'}
                        </div>
                      </div>
                      <div className="bg-black/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                        <div className="text-green-100 text-sm mb-2 font-bold uppercase tracking-widest">R² SCORE</div>
                        <div className="text-5xl font-black text-white tabular-nums drop-shadow-md min-w-[120px] inline-flex items-center justify-center">
                          {dashboardData.models.find(m => m.is_best)?.accuracy.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Model Performance Roster */}
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
                              <span className="text-green-400 text-xs font-black uppercase tracking-wider">Best Model</span>
                            </div>
                          )}
                        </div>
                        {/* Bar */}
                        <div className="flex-1 relative">
                          <div className="w-full bg-gray-800 rounded-full h-10 border border-gray-700/50 shadow-inner overflow-hidden relative">
                            <div
                              className={`h-full rounded-r-full shadow-lg ${model.is_best ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                                }`}
                              style={{ width: `${Math.max(8, 100 - Math.abs(model.accuracy))}%`, transition: 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                            >
                            </div>
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white text-sm font-black tabular-nums drop-shadow-md inline-flex items-center justify-center min-w-[72px] px-3 whitespace-nowrap shrink-0">
                              R² <CountUp end={model.accuracy} duration={1.5} decimals={2} delay={0.1 + index * 0.1} />
                            </span>
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

                {/* Four Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <motion.div {...cardHover} className="bg-gray-900 rounded-2xl border border-gray-700 p-6 shadow-lg">
                    <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Total Students</div>
                    <div className="text-4xl font-black text-white tabular-nums">
                      <CountUp end={dashboardData?.dataset?.total_students || datasetData.length} separator="," duration={1.5} delay={0.1} />
                    </div>
                  </motion.div>
                  <motion.div {...cardHover} className="bg-gray-900 rounded-2xl border border-gray-700 p-6 shadow-lg">
                    <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Total Subjects</div>
                    <div className="text-4xl font-black text-white tabular-nums">
                      <CountUp end={dashboardData?.dataset?.features || 11} duration={1.5} delay={0.2} />
                    </div>
                  </motion.div>
                  <motion.div {...cardHover} className="bg-gray-900 rounded-2xl border border-gray-700 p-6 shadow-lg">
                    <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Train/Test Split</div>
                    <div className="text-2xl font-black text-purple-400">
                      {dashboardData?.training?.train_test_split || '80:20'}
                    </div>
                  </motion.div>
                  <motion.div {...cardHover} className="bg-gray-900 rounded-2xl border border-gray-700 p-6 shadow-lg">
                    <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Target Variable</div>
                    <div className="text-2xl font-black text-purple-400">SM-2</div>
                  </motion.div>
                </div>

                {/* Input Features Card */}
                <motion.div {...cardHover} className="bg-gray-900 rounded-2xl border border-gray-700 p-8 shadow-lg">
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                    <Users size={24} className="text-purple-400" /> Input Features
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {['Python-1', 'SQL', 'Calculus-1', 'Python-2', 'Hackathon-1', 'Calculus-2', 'SM-1', 'Linear Algebra', 'Discrete Mathematics', 'Hackathon-2', 'DSA'].map((subject) => (
                      <span key={subject} className="px-4 py-2 bg-purple-600/20 text-purple-300 font-bold rounded-lg border border-purple-500/30">
                        {subject}
                      </span>
                    ))}
                  </div>
                </motion.div>

                {/* Dataset Table */}
                <motion.div {...cardHover} className="bg-gray-900 rounded-2xl border border-gray-700 p-8 shadow-lg">
                  <h3 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
                    <Database size={28} className="text-blue-400" /> Student Dataset
                  </h3>

                  {/* Search Bar */}
                  <div className="mb-6 relative">
                    <Search size={22} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by student name or roll number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-base md:text-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  {/* Scrollable Table */}
                  <div className="overflow-hidden rounded-xl border border-gray-700">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full text-sm md:text-base">
                        <thead className="bg-gray-800 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 text-left text-gray-400 font-bold uppercase tracking-wider text-sm md:text-base">Sr No</th>
                            <th className="px-4 py-3 text-left text-gray-400 font-bold uppercase tracking-wider text-sm md:text-base">Name</th>
                            <th className="px-4 py-3 text-left text-gray-400 font-bold uppercase tracking-wider text-sm md:text-base">Roll No</th>
                            <th className="px-4 py-3 text-left text-gray-400 font-bold uppercase tracking-wider text-sm md:text-base">Branch</th>
                            <th className="px-4 py-3 text-left text-gray-400 font-bold uppercase tracking-wider text-sm md:text-base">Python-1</th>
                            <th className="px-4 py-3 text-left text-gray-400 font-bold uppercase tracking-wider text-sm md:text-base">SQL</th>
                            <th className="px-4 py-3 text-left text-gray-400 font-bold uppercase tracking-wider text-sm md:text-base">Calculus-1</th>
                            <th className="px-4 py-3 text-left text-gray-400 font-bold uppercase tracking-wider text-sm md:text-base">Python-2</th>
                            <th className="px-4 py-3 text-left text-gray-400 font-bold uppercase tracking-wider text-sm md:text-base">Hackathon-1</th>
                            <th className="px-4 py-3 text-left text-gray-400 font-bold uppercase tracking-wider text-sm md:text-base">Calculus-2</th>
                            <th className="px-4 py-3 text-left text-gray-400 font-bold uppercase tracking-wider text-sm md:text-base">SM-1</th>
                            <th className="px-4 py-3 text-left text-gray-400 font-bold uppercase tracking-wider text-sm md:text-base">Linear Algebra</th>
                            <th className="px-4 py-3 text-left text-gray-400 font-bold uppercase tracking-wider text-sm md:text-base">Discrete Mathematics</th>
                            <th className="px-4 py-3 text-left text-gray-400 font-bold uppercase tracking-wider text-sm md:text-base">Hackathon-2</th>
                            <th className="px-4 py-3 text-left text-gray-400 font-bold uppercase tracking-wider text-sm md:text-base">DSA</th>
                            <th className="px-4 py-3 text-left text-gray-400 font-bold uppercase tracking-wider text-sm md:text-base">SM-2</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {datasetData.length === 0 ? (
                            <tr><td colSpan={16} className="py-12 text-center text-gray-500 font-bold">Loading dataset...</td></tr>
                          ) : (
                            datasetData
                              .filter((student: any) =>
                                (student.Name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (student['Roll No'] || '').toLowerCase().includes(searchTerm.toLowerCase())
                              )
                              .map((student: any, index: number) => (
                                <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                                  <td className="px-4 py-3 text-gray-300 font-mono text-sm md:text-base">{index + 1}</td>
                                  <td className="px-4 py-3 text-white font-semibold text-sm md:text-base">{student.Name || 'N/A'}</td>
                                  <td className="px-4 py-3 text-gray-300 font-mono font-medium text-sm md:text-base">{student['Roll No'] || 'N/A'}</td>
                                  <td className="px-4 py-3 text-gray-300 text-sm md:text-base">{student.Branch || 'N/A'}</td>
                                  <td className="px-4 py-3 text-gray-300 font-mono text-sm md:text-base">{student['Python-1'] || 0}</td>
                                  <td className="px-4 py-3 text-gray-300 font-mono text-sm md:text-base">{student['SQL'] || 0}</td>
                                  <td className="px-4 py-3 text-gray-300 font-mono text-sm md:text-base">{student['Calculus-1'] || 0}</td>
                                  <td className="px-4 py-3 text-gray-300 font-mono text-sm md:text-base">{student['Python-2'] || 0}</td>
                                  <td className="px-4 py-3 text-gray-300 font-mono text-sm md:text-base">{student['Hackathon-1'] || 0}</td>
                                  <td className="px-4 py-3 text-gray-300 font-mono text-sm md:text-base">{student['Calculus-2'] || 0}</td>
                                  <td className="px-4 py-3 text-gray-300 font-mono text-sm md:text-base">{student['SM-1'] || 0}</td>
                                  <td className="px-4 py-3 text-gray-300 font-mono text-sm md:text-base">{student['Linear Algebra'] || 0}</td>
                                  <td className="px-4 py-3 text-gray-300 font-mono text-sm md:text-base">{student['Discrete Mathematics'] || 0}</td>
                                  <td className="px-4 py-3 text-gray-300 font-mono text-sm md:text-base">{student['Hackathon-2'] || 0}</td>
                                  <td className="px-4 py-3 text-gray-300 font-mono text-sm md:text-base">{student['DSA'] || 0}</td>
                                  <td className="px-4 py-3 text-gray-300 font-mono font-semibold text-sm md:text-base">{student['SM-2'] || 0}</td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>

              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════
                TAB: TECH STACK
            ════════════════════════════════════════════════════════════ */}
            {activeTab === 'techstack' && (
              <motion.div key="techstack" variants={tabContent} initial="initial" animate="animate" exit="exit" className="space-y-6">

                {/* Category 1: Programming Languages */}
                <motion.div {...cardHover} className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-xl">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 border-b border-gray-700">
                    <h3 className="text-3xl font-black text-white flex items-center gap-3">
                      <Code size={24} /> Programming Languages
                    </h3>
                  </div>
                  <div className="p-8 space-y-4">
                    {[
                      { name: 'Python', desc: 'Core language for ML, data processing, and backend API', color: 'blue' },
                      { name: 'TypeScript', desc: 'Type-safe frontend development with React', color: 'blue' },
                      { name: 'SQL', desc: 'Database queries and data management', color: 'orange' }
                    ].map((tech, index) => (
                      <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-800 last:border-0">
                        <div className={`text-${tech.color}-400 font-black text-lg md:text-xl min-w-[120px]`}>{tech.name}</div>
                        <div className="text-gray-400 text-base md:text-lg flex-1">{tech.desc}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Category 2: Frontend Framework */}
                <motion.div {...cardHover} className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-xl">
                  <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-8 py-4 border-b border-gray-700">
                    <h3 className="text-3xl font-black text-white flex items-center gap-3">
                      <Server size={24} /> Frontend Framework & Libraries
                    </h3>
                  </div>
                  <div className="p-8 space-y-4">
                    {[
                      { name: 'React', desc: 'Component-based UI library for building interfaces', color: 'cyan' },
                      { name: 'Framer Motion', desc: 'Animation library for smooth transitions and gestures', color: 'purple' },
                      { name: 'Lucide React', desc: 'Icon library for consistent UI icons', color: 'green' },
                      { name: 'React Plotly.js', desc: 'Data visualization and charting library', color: 'orange' },
                      { name: 'React CountUp', desc: 'Animated number counting component', color: 'pink' }
                    ].map((tech, index) => (
                      <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-800 last:border-0">
                        <div className={`text-${tech.color}-400 font-black text-lg md:text-xl min-w-[120px]`}>{tech.name}</div>
                        <div className="text-gray-400 text-base md:text-lg flex-1">{tech.desc}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Category 3: Backend & API */}
                <motion.div {...cardHover} className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-xl">
                  <div className="bg-gradient-to-r from-green-600 to-teal-600 px-8 py-4 border-b border-gray-700">
                    <h3 className="text-3xl font-black text-white flex items-center gap-3">
                      <HardDrive size={24} /> Backend & API
                    </h3>
                  </div>
                  <div className="p-8 space-y-4">
                    {[
                      { name: 'FastAPI', desc: 'Modern Python web framework for building APIs', color: 'green' },
                      { name: 'Pandas', desc: 'Data manipulation and analysis library', color: 'purple' },
                      { name: 'Scikit-learn', desc: 'Machine learning library for model training', color: 'orange' },
                      { name: 'NumPy', desc: 'Numerical computing and array operations', color: 'blue' },
                      { name: 'SQLite', desc: 'Student data storage and querying', color: 'blue' },
                      { name: 'CSV Files', desc: 'Dataset storage (Student_Dataset.csv)', color: 'green' }
                    ].map((tech, index) => (
                      <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-800 last:border-0">
                        <div className={`text-${tech.color}-400 font-black text-lg md:text-xl min-w-[120px]`}>{tech.name}</div>
                        <div className="text-gray-400 text-base md:text-lg flex-1">{tech.desc}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Category 4: ML Models and Algorithms */}
                <motion.div {...cardHover} className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-xl">
                  <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-8 py-4 border-b border-gray-700">
                    <h3 className="text-3xl font-black text-white flex items-center gap-3">
                      <Beaker size={24} /> ML Models and Algorithms
                    </h3>
                  </div>
                  <div className="p-8 space-y-4">
                    <div className="mb-6">
                      <h4 className="text-xl font-bold text-white mb-3">Models Used</h4>
                      {dashboardData?.models?.length > 0 ? (
                        dashboardData.models.map((model, index) => (
                          <div key={index} className="flex items-start gap-4 pb-3 border-b border-gray-800 last:border-0">
                            <div className={`text-${model.is_best ? 'yellow' : 'green'}-400 font-black text-lg md:text-xl min-w-[200px] flex items-center gap-2`}>
                              {model.name}
                              {model.is_best && <Star size={14} className="text-yellow-400" fill="currentColor" />}
                            </div>
                            <div className="text-gray-400 text-base md:text-lg flex-1">
                              {model.is_best ? 'Best model' : 'Compared model'} - R²: {model.accuracy.toFixed(2)}, RMSE: {model.rmse.toFixed(2)}
                            </div>
                          </div>
                        ))
                      ) : (
                        [
                          { name: 'Linear Regression', desc: 'Best model', color: 'gold', highlight: true },
                          { name: 'Random Forest', desc: 'Compared model', color: 'green' },
                          { name: 'Decision Tree', desc: 'Compared model', color: 'blue' },
                          { name: 'Gradient Boosting', desc: 'Compared model', color: 'purple' },
                          { name: 'KNN (K-Nearest Neighbors)', desc: 'Compared model', color: 'orange' }
                        ].map((tech, index) => (
                          <div key={index} className="flex items-start gap-4 pb-3 border-b border-gray-800 last:border-0">
                            <div className={`text-${tech.color}-400 font-black text-lg md:text-xl min-w-[200px] flex items-center gap-2`}>
                              {tech.name}
                              {tech.highlight && <Star size={14} className="text-yellow-400" fill="currentColor" />}
                            </div>
                            <div className="text-gray-400 text-base md:text-lg flex-1">{tech.desc}</div>
                          </div>
                        ))
                      )}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-3">Evaluation Metrics</h4>
                      {[
                        { name: 'R² Score', desc: 'Model accuracy measure', color: 'cyan' },
                        { name: 'RMSE', desc: 'Root Mean Squared Error', color: 'red' },
                        { name: 'MAE', desc: 'Mean Absolute Error', color: 'orange' }
                      ].map((tech, index) => (
                        <div key={index} className="flex items-start gap-4 pb-3 border-b border-gray-800 last:border-0">
                          <div className={`text-${tech.color}-400 font-black text-lg md:text-xl min-w-[200px]`}>{tech.name}</div>
                          <div className="text-gray-400 text-base md:text-lg flex-1">{tech.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Category 5: Deployment and Integration */}
                <motion.div {...cardHover} className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-xl">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 border-b border-gray-700">
                    <h3 className="text-3xl font-black text-white flex items-center gap-3">
                      <Cpu size={24} /> Deployment and Integration
                    </h3>
                  </div>
                  <div className="p-8 space-y-4">
                    {[
                      { name: 'Local Server', desc: 'FastAPI running on localhost:8000', color: 'green' },
                      { name: 'REST API', desc: 'Frontend and backend communication via HTTP endpoints', color: 'blue' },
                      { name: 'React Frontend', desc: 'Running on localhost:5173 via Vite dev server', color: 'cyan' }
                    ].map((tech, index) => (
                      <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-800 last:border-0">
                        <div className={`text-${tech.color}-400 font-black text-lg md:text-xl min-w-[120px]`}>{tech.name}</div>
                        <div className="text-gray-400 text-base md:text-lg flex-1">{tech.desc}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}