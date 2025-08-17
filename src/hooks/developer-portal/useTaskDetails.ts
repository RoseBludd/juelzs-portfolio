import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Developer {
  id: string;
  name: string;
  email: string;
  profile_picture_url?: string;
  role?: string;
}

interface MilestoneUpdate {
  id: string;
  update_type: string;
  content: string;
  created_at: string;
  developer_id: string;
  developer_name: string;
  developer_profile_picture_url?: string;
  status?: string;
  message?: string;
  admin_response?: string;
  admin_name?: string;
  admin_response_at?: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: string;
  completion_percentage: number;
  due_date: string;
  order_index: number;
  updates: MilestoneUpdate[];
  test_submission?: {
    created_at: string;
    passed: boolean;
    results: string;
  };
}

interface TaskDetails {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  complexity: string;
  category: string;
  department: string;
  department_display_name?: string;
  due_date: string;
  created_at: string;
  updated_at?: string;
  compensation: number;
  estimated_time?: number;
  developers: Developer[];
  milestones: Milestone[];
  requirements?: string[];
  acceptance_criteria?: string[];
  completed_requirements?: boolean[];
  completed_acceptance_criteria?: boolean[];
  environment_variables?: Record<string, string>;
  metadata?: {
    github?: {
      branch: string;
      pr_number: number;
      pr_url: string;
    }
  };
  assignment: {
    status: string;
    start_date: string;
    due_date: string;
    completed_at: string;
    notes: string;
  };
  loom_video_url?: string;
  transcript?: string;
}

export const useTaskDetails = (taskId: string) => {
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      console.log(`Fetching task details for task ID: ${taskId}`);
      const response = await fetch(`/api/tasks/details?taskId=${taskId}`);

      if (!response.ok) {
        console.error(`Error response from API: ${response.status} ${response.statusText}`);
        let errorMessage = 'Failed to fetch task details';

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          try {
            const errorText = await response.text();
            console.error('Error response text:', errorText);

            if (errorText.includes('<!DOCTYPE html>')) {
              errorMessage = 'Received HTML instead of JSON. This may indicate a server-side error or authentication issue.';
            }
          } catch (textError) {
            console.error('Error getting response text:', textError);
          }
        }

        toast.error(errorMessage);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Task details received:', data);

      setTask(data);
    } catch (error) {
      console.error('Error fetching task details:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const refetch = () => fetchTaskDetails();

  return {
    task,
    loading,
    error,
    refetch
  };
};

export type { TaskDetails, Milestone, MilestoneUpdate, Developer }; 