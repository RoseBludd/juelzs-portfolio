'use client';

import { useEffect, useState } from 'react';

interface Submission {
  id: string;
  taskId: string;
  taskTitle: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  githubUrl: string;
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        // Simulate API call
        const response = await fetch('/api/developer/submissions');
        const data = await response.json();
        setSubmissions(data.submissions || []);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Your Submissions</h1>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">No Submissions Yet</h1>
          <p className="text-gray-400">You haven't submitted any tasks yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Your Submissions</h1>
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div key={submission.id} className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{submission.taskTitle}</h2>
                  <p className="text-sm text-gray-400">
                    Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm ${
                  submission.status === 'approved' ? 'bg-green-600' :
                  submission.status === 'rejected' ? 'bg-red-600' :
                  'bg-yellow-600'
                }`}>
                  {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                </div>
              </div>
              <div className="mb-4">
                <a 
                  href={submission.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 text-sm"
                >
                  View Code on GitHub →
                </a>
              </div>
              {submission.feedback && (
                <div className="mt-4 p-4 bg-gray-700 rounded-md">
                  <h3 className="text-sm font-semibold mb-2">Feedback</h3>
                  <p className="text-sm text-gray-300">{submission.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 