import { useState, useEffect } from 'react';
import API from '../api';
import { ArrowLeft, Calendar, User, Hash, TrendingUp, Percent, Star, BarChart3, Award, Target, Users, Brain, Lightbulb, History, ArrowUp } from 'lucide-react';

interface DashboardData {
  dataset: {
    total_students: number;
    branches: string[];
    features: number;
    target: string;
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

interface PredictionsHistoryProps {
  onBack: () => void;
}

export default function PredictionsHistory({ onBack }: PredictionsHistoryProps) {
  // Component state management
  const [predictions, setPredictions] = useState<PredictionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Get best model for highlighting
  const bestModel = dashboardData?.models.find(model => model.is_best) || dashboardData?.models[0] || null;

  useEffect(() => {
    fetchPredictions();
    fetchDashboardData();
  }, []);

  /** API Call to Fetch Dashboard Data*/
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

  /** API Call to Fetch Prediction History*/
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

  /** Date Formatting Utility. Converts timestamp strings to readable date format for display.*/
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /** Confidence Score Color Classification. Returns color classes based on confidence levels for visual indicators.*/
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-400';
    if (confidence >= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  /** Percentile Score Color Classification. Returns color classes based on percentile levels for performance indicators.*/
  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return 'text-green-400';
    if (percentile >= 75) return 'text-blue-400';
    if (percentile >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading || dashboardLoading) {
    return (
      <div className="w-full px-6 lg:px-12 xl:px-20">
        <div className="w-full max-w-[2000px] mx-auto">
          <div className="bg-gray-800 rounded-3xl shadow-2xl p-12 lg:p-16 border border-gray-700">
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-8 lg:px-12 xl:px-20">
      <div className="w-full max-w-[2000px] mx-auto">
        <div className="bg-gray-800 rounded-3xl shadow-2xl p-10 lg:p-14 border border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-3">Prediction Analytics</h2>
              <p className="text-lg text-gray-400">AI-powered student performance insights</p>
            </div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white font-semibold rounded-2xl hover:bg-gray-600 transition-all duration-200 shadow-lg"
            >
              <ArrowLeft size={20} />
              Back
            </button>
          </div>


          {/* SECTION 1: HERO CARD - BEST MODEL */}
          <div className="mb-10">
            <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm text-white text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2">
                <Award size={16} fill="white" />
                Best Model
              </div>
              <div className="flex items-center gap-6 mb-8">
                <div className="bg-white/20 backdrop-blur-sm p-5 rounded-2xl">
                  <Award size={40} className="text-white" />
                </div>
                <div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-white mb-2">{bestModel?.name || 'No Model Available'}</h3>
                  <p className="text-green-100 text-lg">Selected for final predictions</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="text-green-100 text-sm mb-3 uppercase tracking-wide">Prediction Error</div>
                  <div className="text-5xl font-bold text-white">{bestModel?.rmse?.toFixed(2) || 'N/A'}</div>
                  <div className="text-green-100 text-sm mt-2">Lower is better</div>
                </div>
                <div>
                  <div className="text-green-100 text-sm mb-3 uppercase tracking-wide">Accuracy</div>
                  <div className="text-5xl font-bold text-white">{bestModel?.accuracy?.toFixed(1) || 'N/A'}%</div>
                  <div className="text-green-100 text-sm mt-2">Model performance</div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: QUICK STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-500/20 p-3 rounded-xl">
                  <Users size={24} className="text-blue-400" />
                </div>
                <div className="text-gray-400 text-sm uppercase tracking-wide">Total Students</div>
              </div>
              <div className="text-3xl font-bold text-white">{dashboardData?.dataset.total_students?.toLocaleString() || 0}</div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-purple-500/20 p-3 rounded-xl">
                  <Brain size={24} className="text-purple-400" />
                </div>
                <div className="text-gray-400 text-sm uppercase tracking-wide">Features Used</div>
              </div>
              <div className="text-3xl font-bold text-white">{dashboardData?.dataset.features || 0}</div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-orange-500/20 p-3 rounded-xl">
                  <Target size={24} className="text-orange-400" />
                </div>
                <div className="text-gray-400 text-sm uppercase tracking-wide">Target Variable</div>
              </div>
              <div className="text-2xl font-bold text-white">{dashboardData?.dataset.target || 'N/A'}</div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-green-500/20 p-3 rounded-xl">
                  <TrendingUp size={24} className="text-green-400" />
                </div>
                <div className="text-gray-400 text-sm uppercase tracking-wide">Avg Percentile</div>
              </div>
              <div className="text-3xl font-bold text-white">
                {predictions.length > 0 ?
                  (predictions.reduce((sum, p) => sum + p.predicted_percentile, 0) / predictions.length).toFixed(1) + '%' :
                  'N/A'
                }
              </div>
            </div>
          </div>

          {/* SECTION 3: MODEL PERFORMANCE CHART */}
          <div className="mb-10">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-4">
                <BarChart3 size={32} className="text-purple-400" />
                Model Performance Comparison
              </h3>
              <div className="space-y-6">
                {dashboardData?.models.map((model, index) => (
                  <div key={index} className="flex items-center gap-6">
                    <div className="w-40">
                      <div className="text-gray-300 font-medium text-lg">{model.name.split(' ')[0]}</div>
                      {model.is_best && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star size={14} className="text-green-400" fill="currentColor" />
                          <span className="text-green-400 text-sm font-medium">Best Model</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 relative">
                      <div className="w-full bg-gray-700 rounded-full h-10">
                        <div
                          className={`h-10 rounded-full transition-all duration-700 flex items-center justify-end pr-4 shadow-lg ${model.is_best ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-purple-500 to-indigo-600'
                            }`}
                          style={{ width: `${model.accuracy}%` }}
                        >
                          <span className="text-white text-lg font-bold">{model.accuracy.toFixed(1)}%</span>
                        </div>
                      </div>
                      {model.is_best && (
                        <div className="absolute -top-2 -right-2">
                          <div className="bg-green-500 rounded-full p-1">
                            <Star size={16} className="text-white" fill="currentColor" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )) || (
                    <div className="text-center text-gray-400 py-12">
                      No model data available
                    </div>
                  )}
              </div>
              <div className="mt-8 flex justify-between text-sm text-gray-500">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* SECTION 4: FEATURE IMPORTANCE */}
          <div className="mb-10">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-4">
                <Target size={32} className="text-orange-400" />
                Feature Importance
              </h3>
              <div className="space-y-4">
                {dashboardData?.feature_importance
                  .sort((a, b) => b.importance - a.importance)
                  .map((feature: FeatureImportance, index: number) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-8 text-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-orange-500 text-white' :
                          index === 1 ? 'bg-yellow-500 text-white' :
                            index === 2 ? 'bg-amber-500 text-white' :
                              'bg-gray-600 text-gray-300'
                          }`}>
                          {index + 1}
                        </div>
                      </div>
                      <div className="w-32">
                        <div className="text-gray-300 font-medium">{feature.name}</div>
                      </div>
                      <div className="flex-1 relative">
                        <div className="w-full bg-gray-700 rounded-full h-8">
                          <div
                            className="h-8 rounded-full transition-all duration-700 bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-end pr-3 shadow-lg"
                            style={{ width: `${feature.importance}%` }}
                          >
                            <span className="text-white text-sm font-bold">{feature.importance.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-gray-400 py-12">
                      No feature importance data available
                    </div>
                  )}
              </div>
              <div className="mt-8 p-4 bg-orange-500/10 rounded-xl border border-orange-500/30">
                <div className="flex items-center gap-2 text-orange-400">
                  <ArrowUp size={16} />
                  <span className="text-sm font-medium">Higher value = more impact on prediction</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: SMART INSIGHTS */}
          <div className="mb-10">
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-4">
                <Lightbulb size={32} className="text-yellow-300" />
                Smart Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-yellow-300/20 p-2 rounded-lg">
                      <Star size={20} className="text-yellow-300" />
                    </div>
                    <span className="text-yellow-300 font-semibold">Top Influencing Factor</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-2">
                    {dashboardData?.feature_importance?.[0]?.name || 'N/A'}
                  </div>
                  <div className="text-yellow-100">
                    Impact: {dashboardData?.feature_importance?.[0]?.importance?.toFixed(1) || '0'}%
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-green-300/20 p-2 rounded-lg">
                      <TrendingUp size={20} className="text-green-300" />
                    </div>
                    <span className="text-green-300 font-semibold">Performance Pattern</span>
                  </div>
                  <div className="text-lg text-white leading-relaxed">
                    Students scoring higher in {dashboardData?.feature_importance?.[0]?.name || 'key subjects'} tend to get better percentile rankings
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6: PREDICTION HISTORY */}
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-4">
              <History size={32} className="text-indigo-400" />
              Prediction History
            </h3>
            <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700 bg-gray-800">
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-3 text-gray-300 font-semibold">
                          <User size={18} />
                          Student Name
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-3 text-gray-300 font-semibold">
                          <Hash size={18} />
                          Roll Number
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="text-gray-300 font-semibold">Branch</div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-3 text-gray-300 font-semibold">
                          <TrendingUp size={18} />
                          Predicted Percentile
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-3 text-gray-300 font-semibold">
                          <Percent size={18} />
                          Confidence
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="flex items-center gap-3 text-gray-300 font-semibold">
                          <Calendar size={18} />
                          Date / Time
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                          <div className="flex flex-col items-center gap-4">
                            <History size={48} className="text-gray-600" />
                            <span className="text-lg">No prediction results found. Start making predictions to see them here.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      predictions.map((prediction) => (
                        <tr
                          key={prediction.id}
                          className={`border-b border-gray-700 transition-all duration-200 ${prediction.predicted_percentile >= 90
                            ? 'bg-green-900/20 hover:bg-green-900/30'
                            : 'hover:bg-gray-800'
                            }`}
                        >
                          <td className="px-6 py-4 text-white font-medium">
                            {prediction.student_name}
                          </td>
                          <td className="px-6 py-4 text-gray-300">
                            {prediction.roll_number}
                          </td>
                          <td className="px-6 py-4 text-gray-300">
                            {prediction.branch}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-semibold text-lg ${getPercentileColor(prediction.predicted_percentile)}`}>
                              {prediction.predicted_percentile.toFixed(1)}%
                            </span>
                            {prediction.predicted_percentile >= 90 && (
                              <div className="inline-flex items-center gap-1 ml-2">
                                <Star size={12} className="text-green-400" fill="currentColor" />
                                <span className="text-green-400 text-xs">Top Performer</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-semibold ${getConfidenceColor(prediction.confidence)}`}>
                              {prediction.confidence.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-300">
                            {formatDate(prediction.date_time)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}