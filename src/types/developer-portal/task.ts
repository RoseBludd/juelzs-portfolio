export type TaskStatus = "available" | "assigned" | "in_progress" | "completed" | "blocked";
export type TaskComplexity = "low" | "medium" | "high";
export type TaskCategory =
  | "NEW_FEATURE"
  | "BUG_FIX"
  | "INTEGRATION"
  | "AUTOMATION"
  | "OPTIMIZATION"
  | "ENHANCEMENT"
  | "LOCALIZATION"
  | "DOCUMENTATION";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: Date;
}

export interface AssignedDeveloper {
  id: string;
  name: string;
  email: string;
  position?: string;
  avatar_url?: string;
}

export interface TaskUpdate {
  id: string;
  type: 'legacy' | 'module';
  description: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  department: string;
  department_display_name?: string;
  compensation: number;
  priority: TaskPriority;
  estimated_time: number;
  requirements?: string[];
  acceptance_criteria?: string[];
  notes?: TaskNote[];
  status: TaskStatus;
  complexity: TaskComplexity;
  category: TaskCategory;
  createdAt?: string;
  updatedAt?: string;
  start_date: string;
  due_date: string;
  attachments?: TaskAttachment[];
  loom_video_url?: string | null;
  transcript?: string | null;
  environment_variables?: Record<string, string>;
  metadata?: {
    github?: {
      branch: string;
      pr_number: number;
      pr_url: string;
    }
  };
  assignedDeveloper?: AssignedDeveloper;
  lastUpdate?: TaskUpdate;
  assignmentDate?: string;
}
