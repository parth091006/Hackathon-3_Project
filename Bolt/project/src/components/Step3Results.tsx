import Plot from 'react-plotly.js';

// Icons
import { Download, Award, TrendingUp, AlertCircle } from 'lucide-react';

// Types
import { PredictionResult, Statistics } from '../types';

// Utils
import { generatePDF } from '../utils/pdfGenerator';

interface Step3ResultsProps {
  result: PredictionResult;
  statistics: Statistics;
  onBack: () => void;
}

// Subject names and keys for data mapping
const subjectNames = ['Calculus-1', 'Calculus-2', 'Python-1', 'Python-2', 'SM-1'];
const subjectKeys: (keyof PredictionResult['scores'])[] = ['calculus_1', 'calculus_2', 'python_1', 'python_2', 'sm_1'];

export default function Step3Results({ result, statistics, onBack }: Step3ResultsProps) {
  /** Grade Color Mapping */
  const getGradeColor = (grade: string) => {
    const colors: { [key: string]: string } = {
      'A+': 'from-green-500 to-green-600',
      'A': 'from-green-600 to-green-700',
      'B+': 'from-blue-500 to-blue-600',
      'B': 'from-blue-600 to-blue-700',
      'C': 'from-orange-500 to-orange-600',
      'D': 'from-orange-600 to-orange-700',
      'F': 'from-red-500 to-red-600',
    };
    return colors[grade] || 'from-gray-500 to-gray-600';
  };

  /** Grade Classification Based on Percentile. Converts percentile scores to letter grades according to academic grading standards. */
  const getGrade = (percentile: number) => {
    if (percentile >= 91) return 'A+';
    if (percentile >= 81) return 'A';
    if (percentile >= 71) return 'B+';
    if (percentile >= 61) return 'B';
    if (percentile >= 51) return 'C';
    if (percentile >= 36) return 'D';
    return 'F';
  };

  // Performance analytics calculations
  const userScores = subjectKeys.map(key => result.scores[key]);
  const classAverages = subjectNames.map(name => statistics[name]?.mean || 0);
  const avgPercentile = userScores.reduce((a, b) => a + b, 0) / userScores.length;

  // Identify strong and weak subjects for recommendations
  const strongSubjects = subjectNames.filter((_, idx) => userScores[idx] >= 70);
  const weakSubjects = subjectNames.filter((_, idx) => userScores[idx] < 60);

  // Chart data configuration for performance visualization
  const chartData = [
    {
      x: subjectNames,
      y: userScores,
      type: 'bar',
      name: 'Your Score',
      marker: { color: '#8b5cf6' },
    },
    {
      x: subjectNames,
      y: classAverages,
      type: 'bar',
      name: 'Class Average',
      marker: { color: '#ec4899' },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Predicted Percentile</h2>
        <div className="text-8xl font-bold text-white mb-4">
          {result.predicted_percentile.toFixed(2)}%
        </div>
        <div className={`inline-block px-8 py-4 bg-gradient-to-r ${getGradeColor(result.grade)} rounded-2xl shadow-lg mb-4`}>
          <div className="text-5xl font-bold text-white">{result.grade}</div>
        </div>
        <div className="text-xl text-white/90 mb-2">
          Percentile Range: {result.percentile_range}
        </div>
        <div className="text-lg text-white/80">
          Confidence: {result.confidence}%
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Award className="text-purple-400" size={24} />
            <h3 className="text-lg font-semibold text-white">Average Percentile</h3>
          </div>
          <div className="text-4xl font-bold text-purple-400">{avgPercentile.toFixed(2)}%</div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-green-400" size={24} />
            <h3 className="text-lg font-semibold text-white">Strong Subjects</h3>
          </div>
          <div className="text-4xl font-bold text-green-400">{strongSubjects.length}</div>
          <div className="text-sm text-gray-400 mt-1">Percentile ≥ 70</div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="text-red-400" size={24} />
            <h3 className="text-lg font-semibold text-white">Weak Subjects</h3>
          </div>
          <div className="text-4xl font-bold text-red-400">{weakSubjects.length}</div>
          <div className="text-sm text-gray-400 mt-1">Percentile &lt; 60</div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-6">Performance Analytics</h3>
        <Plot
          data={chartData as any}
          layout={{
            paper_bgcolor: '#1f2937',
            plot_bgcolor: '#1f2937',
            font: { color: '#fff' },
            xaxis: { title: 'Subjects', gridcolor: '#374151' },
            yaxis: { title: 'Percentile', gridcolor: '#374151' },
            barmode: 'group',
            showlegend: true,
            legend: { x: 0, y: 1.1, orientation: 'h' },
          }}
          config={{ responsive: true }}
          className="w-full"
          style={{ width: '100%', height: '400px' }}
        />
      </div>

      <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-6">Subject Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Subject</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Percentile</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Class Average</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Difference</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Grade</th>
              </tr>
            </thead>
            <tbody>
              {subjectNames.map((subject, idx) => {
                const score = userScores[idx];
                const avg = classAverages[idx];
                const diff = score - avg;
                const grade = getGrade(score);

                return (
                  <tr key={subject} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-3 px-4 text-white font-medium">{subject}</td>
                    <td className="py-3 px-4 text-white">{score.toFixed(2)}%</td>
                    <td className="py-3 px-4 text-gray-400">{avg.toFixed(2)}%</td>
                    <td className={`py-3 px-4 font-semibold ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4">
                      {score >= avg ? (
                        <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-semibold">
                          Above Average
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-900/30 text-red-400 rounded-full text-xs font-semibold">
                          Below Average
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 bg-gradient-to-r ${getGradeColor(grade)} text-white rounded-full text-xs font-bold`}>
                        {grade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {weakSubjects.length > 0 && (
        <div className="bg-red-900/20 border border-red-700 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-red-400 mb-3">Recommendations</h3>
          <p className="text-white">
            Focus on improving: <span className="font-semibold">{weakSubjects.join(', ')}</span>
          </p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="px-8 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all duration-200"
        >
          ← Back
        </button>
        <button
          onClick={() => generatePDF(result, statistics, subjectNames, subjectKeys)}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <Download size={20} />
          Download Report Card
        </button>
      </div>
    </div>
  );
}
