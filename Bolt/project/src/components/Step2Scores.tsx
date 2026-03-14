import { useEffect, useState } from 'react';
import { SubjectScores, Statistics } from '../types';
import axios from 'axios';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Step2ScoresProps {
  scores: SubjectScores;
  setScores: (scores: SubjectScores) => void;
  onNext: () => void;
  onBack: () => void;
}

const subjectMapping: { [key: string]: keyof SubjectScores } = {
  'Calculus-1': 'calculus_1',
  'Calculus-2': 'calculus_2',
  'Python-1': 'python_1',
  'Python-2': 'python_2',
  'SM-1': 'sm_1',
};

export default function Step2Scores({ scores, setScores, onNext, onBack }: Step2ScoresProps) {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/statistics');
        setStatistics(response.data);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const getDifficulty = (std: number) => {
    if (std > 15) return { level: 'Hard', color: 'text-red-400' };
    if (std > 10) return { level: 'Medium', color: 'text-yellow-400' };
    return { level: 'Easy', color: 'text-green-400' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const subjects = ['Calculus-1', 'Calculus-2', 'Python-1', 'Python-2', 'SM-1'];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
        <h2 className="text-3xl font-bold text-white mb-2">Enter Subject Percentiles</h2>
        <p className="text-gray-400 mb-8">Input your percentile scores for each subject (0-100)</p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subjects.map((subject) => {
              const key = subjectMapping[subject];
              const stat = statistics?.[subject];
              const currentScore = scores[key] || 0;
              const classAvg = stat?.mean || 0;
              const difference = currentScore - classAvg;
              const difficulty = stat ? getDifficulty(stat.std) : null;

              return (
                <div key={subject} className="bg-gray-750 p-6 rounded-xl border border-gray-600">
                  <label className="block text-lg font-semibold text-white mb-3">
                    {subject}
                  </label>

                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    value={scores[key] || ''}
                    onChange={(e) => setScores({ ...scores, [key]: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
                    placeholder="Enter percentile"
                  />

                  {!loading && stat && currentScore > 0 && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Class Average:</span>
                        <span className="text-white font-semibold">{classAvg.toFixed(2)}%</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Difference:</span>
                        <span className={`font-semibold flex items-center gap-1 ${difference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {difference >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          {Math.abs(difference).toFixed(2)}%
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Status:</span>
                        {currentScore >= classAvg ? (
                          <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-semibold">
                            Above Average
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-900/30 text-red-400 rounded-full text-xs font-semibold">
                            Below Average
                          </span>
                        )}
                      </div>

                      {difficulty && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Difficulty:</span>
                          <span className={`font-semibold ${difficulty.color}`}>
                            {difficulty.level}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={onBack}
              className="px-8 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all duration-200"
            >
              ← Back
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Predict Percentile →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
