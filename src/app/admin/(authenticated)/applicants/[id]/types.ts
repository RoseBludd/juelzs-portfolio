export interface GithubSubmission {
  url?: string;
  status?: string;
  pr_number?: number;
  tasks_done?: number;
  total_tasks?: number;
  submitted_at?: string;
  last_updated?: string;
  pullRequestUrl?: string;
  assessmentId?: string;
  grade_result?: any;
  pr_link?: string;
}

export interface GradeResult {
  finalScore: number;
  overallFeedback: string;
  recommendedAction: string;
  technicalAssessment: {
    testing: AssessmentSection;
    codeQuality: AssessmentSection;
    implementation: AssessmentSection;
    problemSolving: AssessmentSection;
  };
  strengths: string[];
  improvements: string[];
}

export interface AssessmentSection {
  score: number;
  feedback: string;
}

export interface TestResults {
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  details: any[];
}

export interface ApplicantDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  submittedAt: string;
  score: number | null;
  testResults: TestResults | null;
  codeReview: any;
  timeSpent: string;
  whatsappNumber: string | null;
  applicationStatus: string;
  applicationDate: string | null;
  github_submission: GithubSubmission | null;
  meetingNotes?: string;
  interestLevel?: 'interested' | 'not_interested' | 'undecided';
  lastMeetingDate?: string;
  nextMeetingDate?: string;
  portfolioUrl?: string;
  passed?: boolean;
  feedback?: string;
}

// API response types for handling different API responses
export interface ApplicationsApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ApplicantsApiResponse {
  id: string;
  name: string;
  email: string;
  // ... other fields directly matching ApplicantDetail
  error?: string;
} 