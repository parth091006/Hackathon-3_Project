export interface StudentProfile {
  full_name: string;
  branch: string;
}

export interface SubjectScores {
  python_1: number;
  sql: number;
  calculus_1: number;
  python_2: number;
  hackathon_1: number;
  calculus_2: number;
  sm_1: number;
  linear_algebra: number;
  discrete_mathematics: number;
  hackathon_2: number;
  dsa: number;
}

export interface Statistics {
  [key: string]: {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
  };
}

export interface PredictionResult {
  predicted_percentile: number;
  grade: string;
  confidence: number;
  percentile_range: string;
  profile: StudentProfile;
  scores: SubjectScores;
}
