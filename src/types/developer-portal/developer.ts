// Prisma types removed - using singleton pattern

export interface TaskAssignment {
  id: string;
  title: string;
  description: string;
  status: "assigned" | "in_progress" | "completed" | "blocked";
  start_date: string;
  due_date: string;
  completed_at?: string;
}

export interface Developer {
  id: string;
  email: string;
  paypal_email?: string;
  name: string;
  profile_picture_url?: string;
  role: developer_role;
  status?: developer_status;
  phone?: string;
  github_url?: string;
  portfolio_url?: string;
  resume_url?: string;
  years_experience?: number;
  skills?: string[];
  preferred_technologies?: string[];
  hourly_rate?: number;
  availability_hours?: number;
  timezone?: string;
  english_proficiency?: string;
  education?: string;

  // Stats
  completed_tasks?: number;
  active_tasks?: number;
  average_score?: number;
  total_earned?: number;
  skill_level?: string;

  // Relations
  task_assignments?: TaskAssignment[];
}
