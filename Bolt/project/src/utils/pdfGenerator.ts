// PDF Libraries
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types
import { PredictionResult, Statistics } from '../types';

// ─── Constants ───────────────────────────────────────────────────────────────
const BRAND_PRIMARY: [number, number, number] = [109, 40, 217];   // purple-700
const BRAND_ACCENT: [number, number, number] = [219, 39, 119];    // pink-600
const BRAND_DARK: [number, number, number] = [15, 15, 30];        // near-black
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_H = 14;
const SAFE_BOTTOM = PAGE_H - FOOTER_H - 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Converts a percentile score to a letter grade. */
export const getGrade = (percentile: number): string => {
  if (percentile >= 91) return 'A+';
  if (percentile >= 81) return 'A';
  if (percentile >= 71) return 'B+';
  if (percentile >= 61) return 'B';
  if (percentile >= 51) return 'C';
  if (percentile >= 36) return 'D';
  return 'F';
};

/** Returns RGB colour tuple for a given grade. */
const gradeColor = (grade: string): [number, number, number] => {
  const map: Record<string, [number, number, number]> = {
    'A+': [16, 185, 129],   // emerald
    'A':  [34, 197, 94],    // green
    'B+': [59, 130, 246],   // blue
    'B':  [99, 102, 241],   // indigo
    'C':  [234, 179, 8],    // yellow
    'D':  [249, 115, 22],   // orange
    'F':  [239, 68, 68],    // red
  };
  return map[grade] ?? [107, 114, 128];
};

/** Light-tinted row fill (very low opacity approximation for jsPDF). */
const gradeRowFill = (grade: string): [number, number, number] => {
  const map: Record<string, [number, number, number]> = {
    'A+': [220, 252, 231],
    'A':  [220, 252, 231],
    'B+': [219, 234, 254],
    'B':  [224, 231, 255],
    'C':  [254, 249, 195],
    'D':  [255, 237, 213],
    'F':  [254, 226, 226],
  };
  return map[grade] ?? [243, 244, 246];
};

/** Draws a footer on the current page. */
const drawFooter = (doc: jsPDF, pageNum: number, totalPages: number, generatedAt: string) => {
  // Footer bar
  doc.setFillColor(245, 245, 250);
  doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, FOOTER_H, 'F');

  // Separator line
  doc.setDrawColor(...BRAND_PRIMARY);
  doc.setLineWidth(0.4);
  doc.line(0, PAGE_H - FOOTER_H, PAGE_W, PAGE_H - FOOTER_H);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 140);

  doc.text('AI Academic Intelligence — Confidential Student Report', MARGIN, PAGE_H - FOOTER_H + 5);
  doc.text(`Generated: ${generatedAt}`, PAGE_W / 2, PAGE_H - FOOTER_H + 5, { align: 'center' });
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MARGIN, PAGE_H - FOOTER_H + 5, { align: 'right' });
};

/** Checks remaining vertical space; adds a new page + footer if needed. */
const checkPageBreak = (
  doc: jsPDF,
  currentY: number,
  neededHeight: number,
  pageState: { page: number; generatedAt: string }
): number => {
  if (currentY + neededHeight > SAFE_BOTTOM) {
    // Draw footer on current page before turning
    drawFooter(doc, pageState.page, pageState.page + 1, pageState.generatedAt);
    doc.addPage();
    pageState.page += 1;
    return 20; // reset Y to top margin of new page
  }
  return currentY;
};

// ─── Section Renderers ───────────────────────────────────────────────────────

/** Full-width decorative section title with left accent bar. */
const drawSectionTitle = (doc: jsPDF, title: string, y: number): number => {
  doc.setFillColor(...BRAND_PRIMARY);
  doc.rect(MARGIN, y, 3, 7, 'F');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_DARK);
  doc.text(title, MARGIN + 6, y + 6);
  return y + 12;
};

/** Renders the branded gradient-style header (first page only). */
const drawHeader = (doc: jsPDF, generatedAt: string) => {
  // Background gradient-like split
  doc.setFillColor(...BRAND_PRIMARY);
  doc.rect(0, 0, PAGE_W, 38, 'F');
  doc.setFillColor(...BRAND_ACCENT);
  doc.rect(0, 38, PAGE_W, 6, 'F');

  // Institution / system name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('AI ACADEMIC INTELLIGENCE SYSTEM', PAGE_W / 2, 10, { align: 'center' });

  // Main title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Performance Report Card', PAGE_W / 2, 24, { align: 'center' });

  // Date tag
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(220, 200, 255);
  doc.text(`Issued: ${generatedAt}`, PAGE_W / 2, 34, { align: 'center' });
};

/** Renders the hero predicted percentile + grade badge. */
const drawHeroSection = (doc: jsPDF, percentile: number, grade: string, confidence: number, range: string): number => {
  const topY = 52;
  const boxH = 40;

  // Outer card background
  doc.setFillColor(248, 245, 255);
  doc.roundedRect(MARGIN, topY, CONTENT_W, boxH, 4, 4, 'F');
  doc.setDrawColor(...BRAND_PRIMARY);
  doc.setLineWidth(0.5);
  doc.roundedRect(MARGIN, topY, CONTENT_W, boxH, 4, 4, 'S');

  // Label
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_PRIMARY);
  doc.text('PREDICTED PERCENTILE', PAGE_W / 2, topY + 9, { align: 'center' });

  // Big percentile number
  doc.setFontSize(30);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_DARK);
  doc.text(`${percentile.toFixed(2)}%`, PAGE_W / 2 - 18, topY + 28, { align: 'center' });

  // Grade badge (coloured pill)
  const [gr, gg, gb] = gradeColor(grade);
  doc.setFillColor(gr, gg, gb);
  doc.roundedRect(PAGE_W / 2 + 10, topY + 13, 26, 18, 3, 3, 'F');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(grade, PAGE_W / 2 + 23, topY + 25, { align: 'center' });

  // Sub-info: confidence + range
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 120);
  doc.text(`Confidence: ${confidence.toFixed(1)}%   |   Range: ${range}`, PAGE_W / 2, topY + 36, { align: 'center' });

  return topY + boxH + 8;
};

/** Renders student info panel. */
const drawStudentInfo = (doc: jsPDF, result: PredictionResult, startY: number, generatedAt: string): number => {
  let y = drawSectionTitle(doc, 'Student Information', startY);

  const fields = [
    ['Full Name', result.profile.full_name],
    ['Branch / Programme', result.profile.branch],
    ['Roll Number', result.roll_number || '—'],
    ['Report Generated', generatedAt],
  ];

  const col1X = MARGIN + 6;
  const col2X = MARGIN + 60;
  const lineH = 7.5;

  doc.setFontSize(9.5);
  fields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(90, 90, 110);
    doc.text(label + ':', col1X, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND_DARK);
    doc.text(String(value), col2X, y);
    y += lineH;
  });

  return y + 6;
};

/** Renders the color-coded subject performance table. */
const drawSubjectTable = (
  doc: jsPDF,
  subjectNames: string[],
  subjectKeys: string[],
  result: PredictionResult,
  statistics: Statistics,
  startY: number
): number => {
  const body = subjectNames.map((subject, idx) => {
    const key = subjectKeys[idx] as keyof typeof result.scores;
    const score = result.scores[key];
    const avg = statistics[subject]?.mean ?? 0;
    const diff = score - avg;
    const grade = getGrade(score);
    const arrow = diff >= 0 ? '▲' : '▼';
    return {
      cells: [
        subject,
        `${score.toFixed(1)}%`,
        `${avg.toFixed(1)}%`,
        `${arrow} ${Math.abs(diff).toFixed(1)}%`,
        grade,
      ],
      grade,
    };
  });

  autoTable(doc, {
    startY,
    head: [['Subject', 'Your Score', 'Class Avg', 'Difference', 'Grade']],
    body: body.map(r => r.cells),
    theme: 'grid',
    headStyles: {
      fillColor: BRAND_PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold' },
      1: { cellWidth: 28, halign: 'center' },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 34, halign: 'center' },
      4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const rowGrade = body[data.row.index]?.grade;
        const [fr, fg, fb] = gradeRowFill(rowGrade);
        data.cell.styles.fillColor = [fr, fg, fb];

        // Colour the Grade cell text
        if (data.column.index === 4) {
          const [cr, cg, cb] = gradeColor(rowGrade);
          data.cell.styles.textColor = [cr, cg, cb];
        }
        // Colour Difference cell text
        if (data.column.index === 3) {
          const score = result.scores[subjectKeys[data.row.index] as keyof typeof result.scores];
          const avg = statistics[subjectNames[data.row.index]]?.mean ?? 0;
          data.cell.styles.textColor = score >= avg ? [22, 163, 74] : [220, 38, 38];
        }
      }
    },
    margin: { left: MARGIN, right: MARGIN },
  });

  return (doc as any).lastAutoTable.finalY + 10;
};

/** Renders performance summary + risk badge. */
const drawPerformanceSummary = (
  doc: jsPDF,
  avgPercentile: number,
  strongSubjects: string[],
  weakSubjects: string[],
  startY: number,
  pageState: { page: number; generatedAt: string }
): number => {
  let y = checkPageBreak(doc, startY, 50, pageState);
  y = drawSectionTitle(doc, 'Performance Summary', y);

  // Evaluation + Risk
  let evaluation = '';
  let risk = '';
  let evalColor: [number, number, number];
  let riskColor: [number, number, number];

  if (avgPercentile >= 85) {
    evaluation = 'Excellent — Outstanding academic performance';
    evalColor = [16, 185, 129];
  } else if (avgPercentile >= 70) {
    evaluation = 'Good — Strong academic performance';
    evalColor = [59, 130, 246];
  } else if (avgPercentile >= 55) {
    evaluation = 'Average — Satisfactory with room for improvement';
    evalColor = [234, 179, 8];
  } else {
    evaluation = 'Needs Improvement — Significant uplift required';
    evalColor = [239, 68, 68];
  }

  if (avgPercentile >= 70) {
    risk = '✓  Low Risk — Student is performing well';
    riskColor = [16, 185, 129];
  } else if (avgPercentile >= 55) {
    risk = '⚠  Medium Risk — Moderate support recommended';
    riskColor = [234, 179, 8];
  } else {
    risk = '✗  High Risk — Immediate intervention required';
    riskColor = [239, 68, 68];
  }

  const lineH = 7;
  doc.setFontSize(9.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 100);
  doc.text('Average Percentile:', MARGIN + 6, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND_DARK);
  doc.text(`${avgPercentile.toFixed(2)}%`, MARGIN + 60, y);
  y += lineH;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 100);
  doc.text('Evaluation:', MARGIN + 6, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...evalColor);
  doc.text(evaluation, MARGIN + 60, y);
  y += lineH;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 100);
  doc.text('Risk Level:', MARGIN + 6, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...riskColor);
  doc.text(risk, MARGIN + 60, y);
  y += lineH + 4;

  // Strong subjects chip list
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 100);
  doc.text(`Strong Subjects (≥70%): ${strongSubjects.length > 0 ? strongSubjects.join(', ') : 'None'}`, MARGIN + 6, y);
  y += lineH;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 100);
  doc.text(`Target Areas (<60%): ${weakSubjects.length > 0 ? weakSubjects.join(', ') : 'None — Great work!'}`, MARGIN + 6, y);
  y += lineH + 6;

  return y;
};

/** Renders actionable recommendations. */
const drawRecommendations = (
  doc: jsPDF,
  weakSubjects: string[],
  avgPercentile: number,
  startY: number,
  pageState: { page: number; generatedAt: string }
): number => {
  let y = checkPageBreak(doc, startY, 40, pageState);
  y = drawSectionTitle(doc, 'Recommendations', y);

  const tips: string[] = [];

  if (weakSubjects.length > 0) {
    tips.push(`Dedicate focused revision sessions to: ${weakSubjects.join(', ')}.`);
    tips.push('Allocate at least 20% more study time to each target subject per week.');
  }
  if (avgPercentile < 70) {
    tips.push('Seek additional support from faculty or peer tutoring programmes.');
    tips.push('Review past exam papers and attempt timed mock tests regularly.');
  }
  if (avgPercentile >= 70) {
    tips.push('Maintain consistency — revisit strong subjects to keep the edge.');
    tips.push('Consider advanced problem sets or competitive preparation for top percentile.');
  }

  doc.setFontSize(9.5);
  const lineH = 7.5;

  tips.forEach((tip, idx) => {
    y = checkPageBreak(doc, y, lineH + 2, pageState);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND_PRIMARY);
    doc.text(`${idx + 1}.`, MARGIN + 6, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND_DARK);

    // Word-wrap long tips
    const wrapped = doc.splitTextToSize(tip, CONTENT_W - 16);
    doc.text(wrapped, MARGIN + 14, y);
    y += wrapped.length * lineH;
  });

  return y + 6;
};

// ─── Main Export ─────────────────────────────────────────────────────────────

export const generatePDF = (
  result: PredictionResult,
  statistics: Statistics,
  subjectNames: string[],
  subjectKeys: (keyof PredictionResult['scores'])[]
): void => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const now = new Date();
  const generatedAt = now.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  // Shared mutable state for page tracking (passed by ref)
  const pageState = { page: 1, generatedAt };

  // ── Page 1 ────────────────────────────────────────────────────────────────
  drawHeader(doc, generatedAt);

  const userScores = subjectKeys.map(k => result.scores[k] ?? 0);
  const avgPercentile = userScores.reduce((a, b) => a + b, 0) / (userScores.length || 1);
  const strongSubjects = subjectNames.filter((_, i) => userScores[i] >= 70);
  const weakSubjects = subjectNames.filter((_, i) => userScores[i] < 60);

  // Hero section
  let curY = drawHeroSection(doc, result.predicted_percentile, result.grade, result.confidence, result.percentile_range);

  // Student info
  curY = drawStudentInfo(doc, result, curY, generatedAt);

  // Subject performance table (header is "Subject Performance")
  curY = checkPageBreak(doc, curY, 20, pageState);
  curY = drawSectionTitle(doc, 'Subject Performance — Detailed Breakdown', curY);
  curY = drawSubjectTable(doc, subjectNames, subjectKeys as string[], result, statistics, curY);

  // Performance summary
  curY = drawPerformanceSummary(doc, avgPercentile, strongSubjects, weakSubjects, curY, pageState);

  // Recommendations
  curY = drawRecommendations(doc, weakSubjects, avgPercentile, curY, pageState);

  // ── Footers on all pages ──────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, p, totalPages, generatedAt);
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const safeName = result.profile.full_name.replace(/\s+/g, '_');
  doc.save(`${safeName}_Report_Card.pdf`);
};