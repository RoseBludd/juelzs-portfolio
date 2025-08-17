/**
 * Types for assessment data
 */

export interface GradeSubScore {
  score: number;
  feedback: string;
}

export interface GradeCriteria {
  score: number;
  feedback: string;
  details?: string[];
}

export interface Assessment {
  id: string;
  name: string;
  email: string;
  role: string;
  timeSpent: string;
  criteria: {
    [key: string]: GradeCriteria;
  };
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  result: {
    status: "Passed" | "Failed";
    score: number;
  };
  imagePath: string;
} 