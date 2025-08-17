'use client';

import Link from 'next/link';
import { useRouter , useSearchParams } from 'next/navigation';
import React, { useState, Suspense } from 'react';

// Loading fallback component
function SuccessLoading() {
  return <div className="flex items-center justify-center min-h-screen">
    <div className="animate-pulse text-xl">Loading submission results...</div>
  </div>;
}

function SubmissionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const score = searchParams.get('score') || '0';
  
  const [hasWatchedVideo, setHasWatchedVideo] = useState(false);
  const [hasReadContract, setHasReadContract] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAgreement = async () => {
    if (!hasWatchedVideo || !hasReadContract) {
      setError('Please watch the video and read the contract before proceeding.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/developer/agreement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          agreed_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record agreement');
      }

      // Redirect to the task pool page
      router.push('/developer/tasks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsSubmitting(false);
    }
  };

  const handleVideoEnd = () => {
    setHasWatchedVideo(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="rounded-full bg-green-900/30 p-3 mx-auto w-16 h-16 flex items-center justify-center">
            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="mt-4 text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Congratulations!
          </h1>
          
          <p className="mt-3 text-lg text-gray-300">
            Your code submission has been approved with a score of {score}/100. You're now ready to join our developer team!
          </p>
        </div>

        {/* Video Section */}
        <div className="bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-white">Welcome Video</h2>
            <p className="mt-1 text-sm text-gray-400">Please watch this video to learn about our development process.</p>
          </div>
          <div className="border-t border-gray-700 p-4">
            <div className="aspect-w-16 aspect-h-9">
              <video 
                className="w-full h-auto" 
                controls 
                onEnded={handleVideoEnd}
                poster="/video-placeholder.jpg"
              >
                <source src="/welcome-video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="mt-2 flex items-center">
              <input 
                type="checkbox" 
                id="video-watched" 
                checked={hasWatchedVideo} 
                onChange={() => setHasWatchedVideo(!hasWatchedVideo)} 
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded bg-gray-700"
              />
              <label htmlFor="video-watched" className="ml-2 block text-sm text-gray-200">
                I have watched the entire video
              </label>
            </div>
          </div>
        </div>

        {/* Contract Section */}
        <div className="bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-white">Developer Agreement</h2>
            <p className="mt-1 text-sm text-gray-400">Please read and agree to our developer terms.</p>
          </div>
          <div className="border-t border-gray-700 p-4">
            <div className="h-64 overflow-y-auto p-4 bg-gray-700 text-sm text-gray-200 border border-gray-600 rounded">
              <h3 className="font-bold mb-2">Developer Agreement</h3>
              <p className="mb-2">This Developer Agreement ("Agreement") is entered into between you ("Developer") and our company.</p>
              
              <h4 className="font-semibold mt-4 mb-1">1. Services</h4>
              <p className="mb-2">Developer agrees to provide software development services as assigned through the Developer Portal.</p>
              
              <h4 className="font-semibold mt-4 mb-1">2. Compensation</h4>
              <p className="mb-2">Developer will be compensated based on the task tier:</p>
              <ul className="list-disc pl-5 mb-2">
                <li>Tier 1: $100 per task</li>
                <li>Tier 2: $250 per task</li>
                <li>Tier 3: $500 per task</li>
              </ul>
              <p className="mb-2">New developers will initially have access to Tier 1 tasks only. Access to higher tiers will be granted based on performance.</p>
              
              <h4 className="font-semibold mt-4 mb-1">3. Intellectual Property</h4>
              <p className="mb-2">All work produced by Developer under this Agreement shall be considered work made for hire and shall be owned exclusively by the company.</p>
              
              <h4 className="font-semibold mt-4 mb-1">4. Confidentiality</h4>
              <p className="mb-2">Developer agrees to maintain the confidentiality of all proprietary information shared during the course of this engagement.</p>
              
              <h4 className="font-semibold mt-4 mb-1">5. Term and Termination</h4>
              <p className="mb-2">This Agreement shall remain in effect until terminated by either party with written notice.</p>
              
              <h4 className="font-semibold mt-4 mb-1">6. Independent Contractor</h4>
              <p className="mb-2">Developer is an independent contractor and not an employee of the company.</p>
              
              <h4 className="font-semibold mt-4 mb-1">7. Governing Law</h4>
              <p className="mb-2">This Agreement shall be governed by the laws of the applicable jurisdiction.</p>
              
              <p className="mt-4">By clicking "I Agree" below, you acknowledge that you have read, understood, and agree to be bound by the terms of this Agreement.</p>
            </div>
            <div className="mt-2 flex items-center">
              <input 
                type="checkbox" 
                id="contract-read" 
                checked={hasReadContract} 
                onChange={() => setHasReadContract(!hasReadContract)} 
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded bg-gray-700"
              />
              <label htmlFor="contract-read" className="ml-2 block text-sm text-gray-200">
                I have read and agree to the terms of the Developer Agreement
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleAgreement}
            disabled={isSubmitting || !hasWatchedVideo || !hasReadContract}
            className={`px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              (isSubmitting || !hasWatchedVideo || !hasReadContract) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Processing...' : 'I Agree & Continue to Tasks'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubmissionSuccessPage() {
  return (
    <Suspense fallback={<SuccessLoading />}>
      <SubmissionSuccessContent />
    </Suspense>
  );
} 