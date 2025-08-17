import { Metadata } from 'next';
import React from 'react';

import SubmissionForm from './SubmissionForm';

export const metadata: Metadata = {
  title: 'Submit Your Code | Developer Portal',
  description: 'Submit your code for review directly through our developer portal.',
};

export default function SubmitCodePage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            Submit Your Code
          </h1>
          <p className="mt-3 text-xl text-gray-300">
            Upload your code file and provide your email to submit your work for review.
          </p>
        </div>
        
        <div className="bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6">
          <SubmissionForm />
        </div>
      </div>
    </div>
  );
} 