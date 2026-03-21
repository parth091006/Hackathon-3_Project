// PDF Libraries
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types
import { PredictionResult, Statistics } from '../types';

export const generatePDF = (
  result: PredictionResult,
  statistics: Statistics,
  subjectNames: string[],
  subjectKeys: (keyof PredictionResult['scores'])[]
) => {
  // Initialize PDF document
  const doc = new jsPDF();
  const getGrade = (percentile: number) => {
    if (percentile >= 91) return 'A+';
    if (percentile >= 81) return 'A';
    if (percentile >= 71) return 'B+';
    if (percentile >= 61) return 'B';
    if (percentile >= 51) return 'C';
    if (percentile >= 36) return 'D';
    return 'F';
  };

  // PDF Header Section with gradient background
  doc.setFillColor(139, 92, 246);
  doc.rect(0, 0, 210, 40, 'F');

  // Title and subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Percentile Prediction', 105, 15, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('AI Powered Academic Performance Report', 105, 25, { align: 'center' });

  // Student Information Section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Information', 14, 50);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${result.profile.full_name}`, 14, 60);
  doc.text(`Branch: ${result.profile.branch}`, 14, 68);

  // Subject Performance Table
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Subject Performance', 14, 100);

  // Prepare performance data for table
  const performanceData = subjectNames.map((subject, idx) => {
    const key = subjectKeys[idx];
    const score = result.scores[key];
    const grade = getGrade(score);
    return [subject, `${score.toFixed(2)}%`, grade];
  });

  // Generate performance table
  autoTable(doc, {
    startY: 105,
    head: [['Subject', 'Percentile', 'Grade']],
    body: performanceData,
    theme: 'grid',
    headStyles: { fillColor: [139, 92, 246] },
  });

  const lastY = (doc as any).lastAutoTable.finalY + 10;

  // Class Comparison Table
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Class Comparison', 14, lastY);

  // Prepare comparison data with class averages
  const comparisonData = subjectNames.map((subject, idx) => {
    const key = subjectKeys[idx];
    const score = result.scores[key];
    const avg = statistics[subject]?.mean || 0;
    const diff = score - avg;
    const status = score >= avg ? 'Above Average' : 'Below Average';
    return [
      subject,
      `${score.toFixed(2)}%`,
      `${avg.toFixed(2)}%`,
      `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}%`,
      status,
    ];
  });

  // Generate comparison table
  autoTable(doc, {
    startY: lastY + 5,
    head: [['Subject', 'Your Score', 'Class Avg', 'Difference', 'Status']],
    body: comparisonData,
    theme: 'grid',
    headStyles: { fillColor: [139, 92, 246] },
  });

  const lastY2 = (doc as any).lastAutoTable.finalY + 10;

  // Prediction Summary Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Prediction Summary', 14, lastY2);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Predicted Percentile: ${result.predicted_percentile.toFixed(2)}%`, 14, lastY2 + 10);
  doc.text(`Predicted Grade: ${result.grade}`, 14, lastY2 + 20);
  doc.text(`Confidence Score: ${result.confidence.toFixed(2)}%`, 14, lastY2 + 30);
  doc.text(`Percentile Range: ${result.percentile_range}`, 14, lastY2 + 40);

  // Performance analytics calculations
  const userScores = subjectKeys.map(key => result.scores[key]);
  const avgPercentile = userScores.reduce((a, b) => a + b, 0) / userScores.length;
  const strongSubjects = subjectNames.filter((_, idx) => userScores[idx] >= 70);
  const weakSubjects = subjectNames.filter((_, idx) => userScores[idx] < 60);

  // Performance analytics — flows inline after Prediction Summary (no page break)
  const perfStartY = lastY2 + 60;

  // Overall Performance Section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Performance', 14, perfStartY);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Average Percentile: ${avgPercentile.toFixed(2)}%`, 14, perfStartY + 10);
  doc.text(`Strong Subjects (above 70%): ${strongSubjects.length}`, 14, perfStartY + 20);
  if (strongSubjects.length > 0) {
    doc.text(`  - ${strongSubjects.join(', ')}`, 14, perfStartY + 28);
  }

  doc.text(`Weak Subjects (below 60%): ${weakSubjects.length}`, 14, perfStartY + 38);
  if (weakSubjects.length > 0) {
    doc.text(`  - ${weakSubjects.join(', ')}`, 14, perfStartY + 46);
  }

  // Performance Evaluation Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Evaluation', 14, perfStartY + 65);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  let evaluation = '';
  if (avgPercentile >= 85) {
    evaluation = 'Excellent - Outstanding academic performance';
  } else if (avgPercentile >= 70) {
    evaluation = 'Good - Strong academic performance';
  } else if (avgPercentile >= 55) {
    evaluation = 'Average - Satisfactory performance with room for improvement';
  } else {
    evaluation = 'Poor - Significant improvement needed';
  }
  doc.text(evaluation, 14, perfStartY + 75);

  // Risk Assessment Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Risk Assessment', 14, perfStartY + 95);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  let riskLevel = '';
  if (avgPercentile >= 70) {
    riskLevel = 'Low Risk - Student is performing well';
  } else if (avgPercentile >= 55) {
    riskLevel = 'Medium Risk - Student needs moderate support';
  } else {
    riskLevel = 'High Risk - Student requires immediate attention and support';
  }
  doc.text(riskLevel, 14, perfStartY + 105);

  // Recommendations Section (only if weak subjects exist)
  if (weakSubjects.length > 0) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommendations', 14, perfStartY + 125);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Focus on improving the following subjects:', 14, perfStartY + 135);
    weakSubjects.forEach((subject, idx) => {
      doc.text(`${idx + 1}. ${subject}`, 20, perfStartY + 145 + (idx * 8));
    });
  }

  // PDF Footer with generation info
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Generated by Student Percentile Prediction System', 105, 285, { align: 'center' });
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 290, { align: 'center' });

  // Save PDF with student name in filename
  doc.save(`${result.profile.full_name.replace(/\s+/g, '_')}_Report_Card.pdf`);
};