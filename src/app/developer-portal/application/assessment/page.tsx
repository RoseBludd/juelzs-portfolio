'use client';

import { 
  IconCode, 
  IconServer, 
  IconPlugConnected, 
  IconCloud, 
  IconStack,
  IconArrowRight
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, Suspense } from 'react';

// Loading fallback component
function AssessmentLoading() {
  return <div className="flex items-center justify-center min-h-screen">
    <div className="animate-pulse text-xl">Loading assessment...</div>
  </div>;
}

function AssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check if we already have a role from the application form
  useEffect(() => {
    // Check URL parameters first
    const roleFromUrl = searchParams.get('role');
    const emailFromUrl = searchParams.get('email');
    
    // If role is in URL, redirect to role-specific page
    if (roleFromUrl) {
      const redirectUrl = `/application/assessment/${roleFromUrl}${emailFromUrl ? `?email=${emailFromUrl}` : ''}`;
      router.push(redirectUrl);
      return;
    }
    
    // Check localStorage for previously selected position
    const storedPosition = localStorage.getItem('selectedPosition');
    if (storedPosition) {
      const emailFromStorage = localStorage.getItem('userEmail');
      const redirectUrl = `/application/assessment/${storedPosition}${emailFromStorage ? `?email=${emailFromStorage}` : ''}`;
      router.push(redirectUrl);
      return;
    }
    
    setLoading(false);
  }, [router, searchParams]);
  
  const roles = [
    {
      id: 'frontend_specialist',
      title: 'Frontend Specialist',
      icon: <IconCode size={24} />,
      description: 'Build responsive, accessible, and performant user interfaces using React and Next.js.',
    },
    {
      id: 'backend_specialist',
      title: 'Backend Specialist',
      icon: <IconServer size={24} />,
      description: 'Develop robust and scalable backend services using Node.js, Express, and Prisma.',
    },
    {
      id: 'integration_specialist',
      title: 'Integration Specialist',
      icon: <IconPlugConnected size={24} />,
      description: 'Connect different systems and services to create seamless workflows.',
    },
    {
      id: 'devops_engineer',
      title: 'DevOps Engineer',
      icon: <IconCloud size={24} />,
      description: 'Build and maintain infrastructure, CI/CD pipelines, and deployment processes.',
    },
    {
      id: 'fullstack_developer',
      title: 'Fullstack Developer',
      icon: <IconStack size={24} />,
      description: 'Work across the entire stack to deliver complete features and functionality.',
    }
  ];

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    // Store selected role in localStorage
    localStorage.setItem('selectedPosition', roleId);
  };

  const handleContinue = () => {
    if (selectedRole) {
      const email = localStorage.getItem('userEmail');
      const redirectUrl = `/application/assessment/${selectedRole}${email ? `?email=${email}` : ''}`;
      router.push(redirectUrl);
    }
  };

  // Show loading state while checking for existing role
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            Technical Assessment
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-300 sm:mt-4">
            Select your role to begin the technical assessment process.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Assessment Process</h2>
            <ol className="space-y-4 text-gray-300">
              <li className="flex">
                <span className="flex-shrink-0 bg-indigo-900/50 rounded-full h-8 w-8 flex items-center justify-center mr-3 text-indigo-400 font-medium">1</span>
                <div>
                  <h3 className="font-medium text-white">Select Your Role</h3>
                  <p className="mt-1">Choose the role that best matches your skills and interests.</p>
                </div>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 bg-indigo-900/50 rounded-full h-8 w-8 flex items-center justify-center mr-3 text-indigo-400 font-medium">2</span>
                <div>
                  <h3 className="font-medium text-white">Review Instructions</h3>
                  <p className="mt-1">Read the role-specific instructions and requirements carefully.</p>
                </div>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 bg-indigo-900/50 rounded-full h-8 w-8 flex items-center justify-center mr-3 text-indigo-400 font-medium">3</span>
                <div>
                  <h3 className="font-medium text-white">Complete the Assessment</h3>
                  <p className="mt-1">Write code that meets the requirements for your selected role.</p>
                </div>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 bg-indigo-900/50 rounded-full h-8 w-8 flex items-center justify-center mr-3 text-indigo-400 font-medium">4</span>
                <div>
                  <h3 className="font-medium text-white">Submit Your Code</h3>
                  <p className="mt-1">Submit your code directly through our platform for evaluation.</p>
                </div>
              </li>
              <li className="flex">
                <span className="flex-shrink-0 bg-indigo-900/50 rounded-full h-8 w-8 flex items-center justify-center mr-3 text-indigo-400 font-medium">5</span>
                <div>
                  <h3 className="font-medium text-white">Receive Feedback</h3>
                  <p className="mt-1">Get automated feedback and, if successful, proceed to the onboarding process.</p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Select Your Role</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <div 
                key={role.id}
                className={`bg-gray-800 rounded-lg p-5 border cursor-pointer transition-all duration-300 ${
                  selectedRole === role.id 
                    ? 'border-indigo-500 ring-2 ring-indigo-500/50' 
                    : 'border-gray-700 hover:border-gray-500'
                }`}
                onClick={() => handleRoleSelect(role.id)}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-900/50 rounded-md p-3">
                    {role.icon}
                  </div>
                  <h3 className="ml-4 text-lg font-medium text-white">{role.title}</h3>
                </div>
                <p className="mt-4 text-gray-300">
                  {role.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center ${
              !selectedRole ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Continue to Assessment
            <IconArrowRight size={18} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={<AssessmentLoading />}>
      <AssessmentContent />
    </Suspense>
  );
} 