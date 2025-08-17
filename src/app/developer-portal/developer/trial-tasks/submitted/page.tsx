"use client";

import { IconCheck } from "@tabler/icons-react";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';





interface UserSession {
  user: any;
}

export default function TrialTaskSubmittedPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  
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
    
    // Additional logic if needed
  }, [session, router]);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <IconCheck className="w-8 h-8 text-green-300" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Task Submitted Successfully!
          </h1>
          <p className="text-gray-400">
            Thank you for submitting your trial task. Our team will review your
            submission and get back to you within 2-3 business days.
          </p>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-8 border border-gray-700/50">
          <h2 className="text-2xl font-semibold text-white mb-6">Next Steps</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                1. Code Review
              </h3>
              <p className="text-gray-400">
                Our development team will review your code for quality,
                functionality, and adherence to best practices.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                2. Feedback
              </h3>
              <p className="text-gray-400">
                You'll receive detailed feedback on your implementation, including
                what worked well and areas for improvement.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-2">
                3. Next Stage
              </h3>
              <p className="text-gray-400">
                If your submission meets our requirements, you'll be invited to join
                our development team and start working on real projects.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400 mb-4">
            Have questions about your submission?
          </p>
          <a
            href="mailto:support@restoremastersllc.com"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Contact our support team
          </a>
        </div>
      </div>
    </div>
  );
} 