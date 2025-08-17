'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface ActiveTask {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  acceptance_criteria: string[];
  estimated_time: number;
  compensation: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: string;
}

export default function ActiveTaskPage() {
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchActiveTask = async () => {
      try {
        setLoading(true);
        // Simulate API call
        const response = await fetch('/api/developer/active-task');
        const data = await response.json();
        setActiveTask(data.task);
      } catch (error) {
        console.error('Error fetching active task:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveTask();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Current Task</h1>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeTask) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">No Active Task</h1>
          <p className="text-gray-400 mb-6">You currently don't have any active tasks.</p>
          <Link 
            href="/developer/trial-tasks"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
          >
            Browse Available Tasks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{activeTask.title}</h1>
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-300">{activeTask.description}</p>
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Requirements</h2>
            <ul className="list-disc list-inside text-gray-300">
              {activeTask.requirements.map((req: string, index: number) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Acceptance Criteria</h2>
            <ul className="list-disc list-inside text-gray-300">
              {activeTask.acceptance_criteria.map((criteria: string, index: number) => (
                <li key={index}>{criteria}</li>
              ))}
            </ul>
          </div>
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-400">
              Time Limit: {activeTask.estimated_time} days
            </div>
            <div className="text-sm text-gray-400">
              Compensation: ${activeTask.compensation}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Link
            href="/developer/submissions"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
          >
            Submit Solution
          </Link>
        </div>
      </div>
    </div>
  );
} 