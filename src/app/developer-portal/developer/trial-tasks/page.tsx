"use client";

import { IconLoader2 } from "@tabler/icons-react";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';





import { Task } from "@/types/task";

interface UserSession {
  user: any;
}

export default function TrialTasksPage() {
  console.log('TrialTasksPage: Component mounting');
  
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [developerStatus, setDeveloperStatus] = useState<{
    progression_stage: string;
    contract_signed: boolean;
  } | null>(null);
  
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setSession({ user: userData });
        } else {
          router.push('/auth/signin');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        router.push('/auth/signin');
      } finally {
        setLoading(false);
      }
    }
    
    checkSession();
  }, []);

  useEffect(() => {
    console.log('TrialTasksPage: useEffect triggered');
    const fetchData = async () => {
      try {
        console.log('TrialTasksPage: Starting data fetch');
        setLoading(true);
        setError(null);

        // Fetch developer status
        console.log('TrialTasksPage: Fetching developer status');
        const statusResponse = await fetch("/api/developer/status", {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        console.log('TrialTasksPage: Developer status response:', statusResponse.status);
        if (!statusResponse.ok) {
          throw new Error("Failed to fetch developer status");
        }
        
        const statusData = await statusResponse.json();
        console.log('TrialTasksPage: Developer status data:', statusData);
        setDeveloperStatus(statusData);

        // Fetch trial tasks
        console.log('TrialTasksPage: Fetching trial tasks');
        const tasksResponse = await fetch("/api/tasks/trial", {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        console.log('TrialTasksPage: Trial tasks response:', tasksResponse.status);
        if (!tasksResponse.ok) {
          throw new Error("Failed to fetch tasks");
        }
        
        const tasksData = await tasksResponse.json();
        console.log('TrialTasksPage: Trial tasks data:', tasksData);
        setTasks(tasksData);
      } catch (err) {
        console.error("TrialTasksPage: Error during data fetch:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
        console.log('TrialTasksPage: Data fetch complete');
      }
    };

    fetchData();
  }, []);

  const handleStartTask = async (task: Task) => {
    try {
      console.log('TrialTasksPage: Starting task:', task.id);
      const response = await fetch("/api/tasks/trial/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: task.id,
        }),
      });

      console.log('TrialTasksPage: Task assignment response:', response.status);
      if (!response.ok) throw new Error("Failed to start task");

      console.log('TrialTasksPage: Redirecting to task page');
      router.push(`/developer/trial-tasks/${task.id}`);
    } catch (err) {
      console.error("TrialTasksPage: Error starting task:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <IconLoader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-gray-400">Loading trial tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/50 text-red-200 p-4 rounded-lg border border-red-500/50">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Trial Tasks</h1>
          <p className="text-gray-400">
            Complete one of these trial tasks to demonstrate your skills. Each task
            has a compensation of $100 and should be completed within 3 days.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50"
            >
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {task.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  {task.department.replace("_", " ").toUpperCase()} Department
                </p>
              </div>

              <div className="mb-6">
                <p className="text-gray-300">{task.description}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">
                    Requirements
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {task.requirements?.map((req, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-700/30 rounded-full text-xs text-gray-300"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">
                    Acceptance Criteria
                  </h4>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {task.acceptance_criteria?.map((criteria, index) => (
                      <li key={index}>{criteria}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Compensation:</span>
                    <span className="text-white ml-2">${task.compensation}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Time Limit:</span>
                    <span className="text-white ml-2">3 days</span>
                  </div>
                </div>

                <button
                  onClick={() => handleStartTask(task)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  Start Task
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 