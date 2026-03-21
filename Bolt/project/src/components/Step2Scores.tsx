import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import API from '../utils/api';
import { TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import { SubjectScores, Statistics } from '../types';

interface Step2ScoresProps {
  scores: SubjectScores;
  setScores: (scores: SubjectScores) => void;
  onNext: () => void;
  onBack: () => void;
}

const subjectMapping: { [key: string]: keyof SubjectScores } = {
  'Python-1': 'python_1',
  'SQL': 'sql',
  'Calculus-1': 'calculus_1',
  'Python-2': 'python_2',
  'Hackathon-1': 'hackathon_1',
  'Calculus-2': 'calculus_2',
  'SM-1': 'sm_1',
  'Linear Algebra': 'linear_algebra',
  'Discrete Mathematics': 'discrete_mathematics',
  'Hackathon-2': 'hackathon_2',
  'DSA': 'dsa',
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const cardItem = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 300 } }
} as const;

export default function Step2Scores({ scores, setScores, onNext, onBack }: Step2ScoresProps) {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await API.get('/api/statistics');
        setStatistics(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatistics();
  }, []);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const subjects = [
    'Python-1', 'SQL', 'Calculus-1', 'Python-2', 'Hackathon-1',
    'Calculus-2', 'SM-1', 'Linear Algebra', 'Discrete Mathematics',
    'Hackathon-2', 'DSA'
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-gray-800 rounded-3xl shadow-2xl p-10 border border-gray-700">
        <h2 className="text-4xl font-bold text-white mb-3">Academic Performance</h2>
        <p className="text-gray-400 mb-10 text-lg">Input your percentile scores for each subject below (0 - 100).</p>

        <form onSubmit={handleSubmit}>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {subjects.map((subject) => {
              const key = subjectMapping[subject];
              const stat = statistics?.[subject];
              const currentScore = scores[key] || 0;
              const classAvg = stat?.mean || 0;
              const difference = currentScore - classAvg;

              return (
                <motion.div
                  key={subject}
                  variants={cardItem}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-gray-900 rounded-2xl border border-gray-700 p-5 shadow-lg transition-all duration-200 hover:shadow-xl hover:border-purple-500/30"
                >
                  <label className="block text-lg font-bold text-white mb-4">{subject}</label>

                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    value={scores[key] || ''}
                    onChange={(e) => setScores({ ...scores, [key]: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:shadow-lg focus:scale-[1.01] transition-all duration-200"
                    placeholder="0 - 100"
                  />

                  {!loading && stat && currentScore > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 space-y-3 text-sm">
                      <div className="flex justify-between items-center bg-gray-800 p-2 rounded-lg">
                        <span className="text-gray-400">Class Avg</span>
                        <span className="text-white font-mono">{classAvg.toFixed(1)}%</span>
                      </div>

                      <div className="flex justify-between items-center bg-gray-800 p-2 rounded-lg">
                        <span className="text-gray-400">Difference</span>
                        <span className={`font-mono font-bold flex items-center gap-1 ${difference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {difference >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {Math.abs(difference).toFixed(1)}%
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-gray-800 p-2 rounded-lg">
                        <span className="text-gray-400">Status</span>
                        {currentScore >= classAvg ? (
                          <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md text-xs font-bold">Above Avg</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-xs font-bold">Below Avg</span>
                        )}
                      </div>

                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          <div className="mt-12 flex justify-between items-center bg-gray-900 border border-gray-700 p-4 rounded-2xl">
            <motion.button
              type="button"
              onClick={onBack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all shadow flex items-center gap-2"
            >
              <ArrowLeft size={18} /> Back
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all"
            >
              Discover Percentile →
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}