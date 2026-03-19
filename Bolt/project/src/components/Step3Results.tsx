import { motion } from 'framer-motion';
import Plot from 'react-plotly.js';
import CountUp from 'react-countup';
import { Download, Award, TrendingUp, AlertCircle, Lightbulb, ArrowLeft, ChartBar } from 'lucide-react';
import { PredictionResult, Statistics } from '../types';
import { generatePDF } from '../utils/pdfGenerator';

interface Step3ResultsProps {
  result: PredictionResult;
  statistics: Statistics;
  onBack: () => void;
}

const subjectNames = ['Calculus-1', 'Calculus-2', 'Python-1', 'Python-2', 'SM-1'];
const subjectKeys: (keyof PredictionResult['scores'])[] = ['calculus_1', 'calculus_2', 'python_1', 'python_2', 'sm_1'];

// Framer motion constants
const sidebarContainer = { show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
const sidebarCard = { hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0, transition: { duration: 0.3 } } };
const tableContainer = { show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } };
const tableRow = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0, transition: { duration: 0.2 } } };
const hoverLift = { whileHover: { scale: 1.02, y: -2 }, transition: { type: "spring", stiffness: 200 } };

export default function Step3Results({ result, statistics, onBack }: Step3ResultsProps) {
  const getGradeColor = (grade: string) => {
    const cls: Record<string, string> = {
      'A+': 'from-emerald-500 to-green-600', 'A': 'from-green-500 to-green-700',
      'B+': 'from-blue-500 to-blue-600', 'B': 'from-blue-600 to-blue-700',
      'C': 'from-amber-500 to-orange-500', 'D': 'from-orange-500 to-orange-700',
      'F': 'from-red-600 to-red-800'
    };
    return cls[grade] || 'from-gray-500 to-gray-600';
  };

  const getGrade = (pct: number) => {
    if (pct >= 91) return 'A+'; if (pct >= 81) return 'A'; if (pct >= 71) return 'B+';
    if (pct >= 61) return 'B'; if (pct >= 51) return 'C'; if (pct >= 36) return 'D'; return 'F';
  };

  const userScores = subjectKeys.map(k => result.scores[k]);
  const classAverages = subjectNames.map(n => statistics[n]?.mean || 0);
  const avgPercentile = userScores.reduce((a, b) => a + b, 0) / userScores.length;
  const strongSubjects = subjectNames.filter((_, i) => userScores[i] >= 70);
  const weakSubjects = subjectNames.filter((_, i) => userScores[i] < 60);

  const chartData = [
    { x: subjectNames, y: userScores, type: 'bar' as const, name: 'Your Score', marker: { color: '#8b5cf6', borderRadius: 4 } },
    { x: subjectNames, y: classAverages, type: 'bar' as const, name: 'Class Avg', marker: { color: '#ec4899', borderRadius: 4 } }
  ];

  const cardStyle = "bg-gray-900/80 backdrop-blur-md rounded-2xl p-6 border border-gray-700/60 shadow-xl transition-all duration-200";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="bg-gradient-to-br from-purple-700/90 via-fuchsia-600/90 to-pink-600/90 backdrop-blur-xl rounded-3xl p-10 shadow-[0_0_50px_rgba(219,39,119,0.15)] border border-white/10 text-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl mix-blend-overlay"></div>
        </div>
        
        <p className="text-white/80 text-sm font-bold uppercase tracking-[0.2em] mb-3">Predicted Percentile</p>
        
        <div className="text-7xl lg:text-8xl font-black text-white mb-6 drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] tabular-nums animate-pulse tracking-tight">
          <CountUp end={result.predicted_percentile} duration={1.5} decimals={2} suffix="%" />
        </div>
        
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, type: "spring", stiffness: 200 }} className={`inline-flex items-center px-10 py-3 bg-gradient-to-r ${getGradeColor(result.grade)} rounded-full shadow-2xl mb-6 border border-white/20`}>
          <span className="text-4xl font-black text-white">{result.grade}</span>
        </motion.div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex justify-center gap-6 text-white/90 text-sm md:text-base font-medium">
          <span className="bg-black/20 px-4 py-2 rounded-lg backdrop-blur-md border border-white/10">Range: <b className="text-white ml-1">{result.percentile_range}</b></span>
          <span className="bg-black/20 px-4 py-2 rounded-lg backdrop-blur-md border border-white/10">Confidence: <b className="text-white ml-1"><CountUp end={result.confidence} duration={1.5} decimals={1} delay={0.2} suffix="%" /></b></span>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div {...hoverLift} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={cardStyle}>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3"><ChartBar className="text-purple-400"/> Subject Comparison</h3>
            <Plot data={chartData} layout={{ paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: { color: '#d1d5db' }, xaxis: { gridcolor: '#374151', tickangle: -20 }, yaxis: { gridcolor: '#374151', range: [0, 105] }, barmode: 'group', margin: { t: 10, b: 40, l: 40, r: 10 }, legend: { orientation: 'h', y: 1.15 } }} config={{ responsive: true, displayModeBar: false }} style={{ width: '100%', height: '320px' }} />
          </motion.div>

          <motion.div {...hoverLift} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`${cardStyle} overflow-hidden px-0 pb-0`}>
            <h3 className="text-xl font-bold text-white mb-4 px-6 flex items-center gap-3"><Award className="text-pink-400"/> Performance Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-gray-800/80 border-y border-gray-700">
                  <tr>{['Subject', 'Score', 'Class Avg', 'Variance', 'Status', 'Grade'].map(h => <th key={h} className="text-left py-3 px-6 text-gray-400 font-bold uppercase tracking-wider text-xs">{h}</th>)}</tr>
                </thead>
                <motion.tbody variants={tableContainer} initial="hidden" animate="show">
                  {subjectNames.map((subj, i) => {
                    const score = userScores[i]; const avg = classAverages[i]; const diff = score - avg; const grade = getGrade(score);
                    return (
                      <motion.tr key={subj} variants={tableRow} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                        <td className="py-4 px-6 font-semibold text-white">{subj}</td>
                        <td className="py-4 px-6 text-gray-200 font-mono">{score.toFixed(1)}%</td>
                        <td className="py-4 px-6 text-gray-400 font-mono">{avg.toFixed(1)}%</td>
                        <td className={`py-4 px-6 font-mono font-bold ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>{diff > 0 ? '+' : ''}{diff.toFixed(1)}%</td>
                        <td className="py-4 px-6">
                          {score >= avg ? <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-bold shadow-sm">Leading</span> : <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold shadow-sm">Lagging</span>}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 bg-gradient-to-r ${getGradeColor(grade)} text-white rounded-lg text-xs font-black shadow-md`}>{grade}</span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>
          </motion.div>
        </div>

        <motion.div variants={sidebarContainer} initial="hidden" animate="show" className="space-y-4">
          <motion.div variants={sidebarCard} className={cardStyle} {...hoverLift}>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-500/20 p-2.5 rounded-xl"><Award size={20} className="text-purple-400" /></div>
              <h3 className="text-lg font-bold text-gray-300">Mean Percentile</h3>
            </div>
            <div className="text-5xl font-black text-purple-400 drop-shadow-md tabular-nums mt-3"><CountUp end={avgPercentile} duration={1.5} decimals={1} suffix="%" delay={0.3} /></div>
          </motion.div>

          <motion.div variants={sidebarCard} className={cardStyle} {...hoverLift}>
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-500/20 p-2.5 rounded-xl"><TrendingUp size={20} className="text-green-400" /></div>
              <h3 className="text-lg font-bold text-gray-300 flex-1">Strengths</h3>
              <span className="text-3xl font-black text-green-400">{strongSubjects.length}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {strongSubjects.map(s => <span key={s} className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-bold">{s}</span>)}
              {strongSubjects.length === 0 && <span className="text-xs text-gray-500 italic">No strong subjects yet.</span>}
            </div>
          </motion.div>

          <motion.div variants={sidebarCard} className={cardStyle} {...hoverLift}>
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-500/20 p-2.5 rounded-xl"><AlertCircle size={20} className="text-red-400" /></div>
              <h3 className="text-lg font-bold text-gray-300 flex-1">Target Areas</h3>
              <span className="text-3xl font-black text-red-400">{weakSubjects.length}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {weakSubjects.map(s => <span key={s} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold">{s}</span>)}
              {weakSubjects.length === 0 && <span className="text-xs text-green-400 font-bold">All clear! Solid performance.</span>}
            </div>
          </motion.div>

          {weakSubjects.length > 0 && (
            <motion.div variants={sidebarCard} className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6" {...hoverLift}>
              <div className="flex items-center gap-2 mb-3"><Lightbulb size={20} className="text-amber-400" /><h3 className="font-bold text-amber-400">Pro Tip</h3></div>
              <p className="text-gray-300 text-sm leading-relaxed">Allocate 20% more revision time toward <b className="text-white">{weakSubjects.join(', ')}</b> to rapidly boost your overall standing.</p>
            </motion.div>
          )}

          <div className="flex-1"></div>

          <motion.div variants={sidebarContainer} className="flex flex-col gap-3 sticky bottom-4 pt-4">
            <motion.button onClick={() => generatePDF(result, statistics, subjectNames, subjectKeys)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg border border-white/10 flex justify-center items-center gap-2">
              <Download size={18} /> Download Full Report
            </motion.button>
            <motion.button onClick={onBack} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} className="w-full py-4 bg-gray-800 text-white font-bold rounded-xl border border-gray-600 hover:bg-gray-700 transition-colors flex justify-center items-center gap-2">
              <ArrowLeft size={18} /> Adjust Scores
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
