"use client";

import { IconLoader2, IconUpload } from "@tabler/icons-react";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';





import { Task } from "@/types/task";

interface TaskAssignment {
  id: string;
  task_id: string;
  status: string;
  start_date: string;
  due_date: string;
  submission_url?: string;
}

interface UserSession {
  user: any;
}

export default function TrialTaskPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [assignment, setAssignment] = useState<TaskAssignment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  
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
    if (!session) {
      return;
    }

    const fetchTaskAndAssignment = async () => {
      try {
        setLoading(true);

        // Fetch task details
        const taskResponse = await fetch(`/api/tasks/trial/${params.id}`);
        if (!taskResponse.ok) throw new Error("Failed to fetch task");
        const taskData = await taskResponse.json();
        setTask(taskData);

        // Fetch assignment details
        const assignmentResponse = await fetch(
          `/api/tasks/trial/assignment/${params.id}`
        );
        if (!assignmentResponse.ok) throw new Error("Failed to fetch assignment");
        const assignmentData = await assignmentResponse.json();
        setAssignment(assignmentData);
      } catch (err) {
        setError("Error loading task. Please try again.");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskAndAssignment();
  }, [session, router, params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/tasks/trial/${params.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          githubUrl,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit task");

      // Redirect to submission confirmation page
      router.push("/developer/trial-tasks/submitted");
    } catch (err) {
      console.error("Error submitting task:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <IconLoader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-gray-400">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/50 text-red-200 p-4 rounded-lg border border-red-500/50">
            {error || "Task not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">{task.title}</h1>
          <p className="text-gray-400">
            {task.department.replace("_", " ").toUpperCase()} Department
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
              <h2 className="text-xl font-semibold text-white mb-4">
                Task Description
              </h2>
              <p className="text-gray-300">{task.description}</p>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
              <h2 className="text-xl font-semibold text-white mb-4">
                Requirements
              </h2>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                {task.requirements?.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
              <h2 className="text-xl font-semibold text-white mb-4">
                Acceptance Criteria
              </h2>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                {task.acceptance_criteria?.map((criteria, index) => (
                  <li key={index}>{criteria}</li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
              <h2 className="text-xl font-semibold text-white mb-4">
                Submit Your Work
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="githubUrl"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    GitHub Repository URL
                  </label>
                  <input
                    type="url"
                    id="githubUrl"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repo"
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !githubUrl.trim()}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <IconLoader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <IconUpload className="w-5 h-5 mr-2" />
                      Submit Task
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
              <h2 className="text-xl font-semibold text-white mb-4">
                Task Details
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Compensation</p>
                  <p className="text-lg font-medium text-white">
                    ${task.compensation}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Time Limit</p>
                  <p className="text-lg font-medium text-white">3 days</p>
                </div>
                {assignment && (
                  <>
                    <div>
                      <p className="text-sm text-gray-400">Start Date</p>
                      <p className="text-lg font-medium text-white">
                        {new Date(assignment.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Due Date</p>
                      <p className="text-lg font-medium text-white">
                        {new Date(assignment.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
              <h2 className="text-xl font-semibold text-white mb-4">
                Need Help?
              </h2>
              <p className="text-gray-300 mb-4">
                If you have any questions or need clarification, feel free to reach
                out to our support team.
              </p>
              <a
                href="mailto:support@restoremastersllc.com"
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                support@restoremastersllc.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 