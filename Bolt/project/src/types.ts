export interface StudentProfile {
  full_name: string;
  roll_number: string;
  branch: string;
  year: string;
}

export interface SubjectScores {
  calculus_1: number;
  calculus_2: number;
  python_1: number;
  python_2: number;
  sm_1: number;
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
