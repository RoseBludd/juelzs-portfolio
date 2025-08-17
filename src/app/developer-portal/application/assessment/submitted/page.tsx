'use client';

import { 
  IconCircleCheck, 
  IconArrowRight, 
  IconX, 
  IconGitPullRequest, 
  IconCheck, 
  IconHourglass, 
  IconExternalLink,
  IconMail,
  IconUser,
  IconBrandGithub
} from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';

// Loading fallback component
function SubmittedLoading() {
  return (
    <main className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-6">
            <div className="relative w-[300px] h-[60px] flex items-center justify-center">
              <div className="relative w-full h-full">
                <Image
                  src="/rm-logo-no-outline.png"
                  alt="RestoreMasters Logo"
                  fill
                  priority
                  style={{ objectFit: "contain" }}
                />
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="w-full max-w-lg">
          <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 p-8">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mb-6"></div>
              <div className="text-xl text-white">Loading submission data...</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

type AssessmentSubmission = {
  id: string;
  email: string;
  role: string;
  score: number | null;
  passed: boolean | null;
  feedback: string;
  githubPrLink: string | null;
  submittedAt: string;
}

function SubmittedContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const score = searchParams.get('score') ? parseInt(searchParams.get('score')!) : null;
  const passed = searchParams.get('passed') === 'true';
  const feedback = searchParams.get('feedback') || '';
  const status = searchParams.get('status') || '';
  const submissionId = searchParams.get('submissionId') || '';
  
  const [decodedFeedback, setDecodedFeedback] = useState('');
  const [loadingState, setLoadingState] = useState<'evaluating' | 'loading' | 'complete' | 'received' | 'error'>('loading');
  const [submission, setSubmission] = useState<AssessmentSubmission | null>(null);
  const [error, setError] = useState('');
  
  const fetchSubmissionData = async () => {
    if ((status === 'received' && (submissionId || email))) {
      setLoadingState('loading');
      try {
        console.log('Fetching submission data with:', { 
          submissionId, 
          email, 
          url: `/api/application/get-submission?${
            submissionId ? `submissionId=${submissionId}` : `email=${encodeURIComponent(email)}`
          }` 
        });
        
        const response = await fetch(`/api/application/get-submission?${
          submissionId ? `submissionId=${submissionId}` : `email=${encodeURIComponent(email)}`
        }`);
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch submission data (Status ${response.status})`);
        }
        
        const data = await response.json();
        console.log('Submission data received:', data);
        
        if (!data.submission) {
          console.error('No submission data in response:', data);
          throw new Error('No submission data received');
        }
        
        setSubmission(data.submission);
        setLoadingState('received');
        
        // Store email in localStorage
        if (data.submission?.email) {
          localStorage.setItem('userEmail', data.submission.email);
        }
      } catch (err) {
        console.error('Error fetching submission:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch submission data');
        setLoadingState('error');
      }
    } else if (status === 'received') {
      console.log('Status is received but no submissionId or email provided');
      setLoadingState('received');
    } else if (email) {
      console.log('Storing email in localStorage:', email);
      localStorage.setItem('userEmail', email);
    }
  };
  
  useEffect(() => {
    // Always log the current state for debugging
    console.log('Current state:', { status, submissionId, email });
    
    // Handle GitHub PR submission (status = received)
    if (status === 'received') {
      fetchSubmissionData();
      return;
    }
    
    // If we have a score, it means evaluation is complete
    if (score !== null) {
      try {
        const decoded = decodeURIComponent(feedback);
        setDecodedFeedback(decoded);
        setLoadingState('complete');
      } catch (error) {
        console.error('Error decoding feedback:', error);
        setDecodedFeedback(feedback);
      }
    }
  }, [email, feedback, score, status, submissionId]);

  // Loading state
  if (loadingState === 'loading') {
    return <SubmittedLoading />;
  }

  // Error state
  if (loadingState === 'error') {
    return (
      <main className="min-h-screen bg-gray-900">
        <nav className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center py-6">
              <div className="relative w-[300px] h-[60px] flex items-center justify-center">
                <div className="relative w-full h-full">
                  <Image
                    src="/rm-logo-no-outline.png"
                    alt="RestoreMasters Logo"
                    fill
                    priority
                    style={{ objectFit: "contain" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </nav>
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className="w-full max-w-lg">
            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-900/30 mb-4">
                  <IconX size={32} className="text-red-500" />
                </div>
                <h2 className="text-xl text-white font-medium mb-3">Error Loading Submission</h2>
                <p className="text-base text-red-300 mb-6">
                  {error || 'An error occurred while loading your submission data.'}
                </p>
                <div className="mt-4">
                  <Link 
                    href="/application/assessment"
                    className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Return to Assessment Selection
                  </Link>
                </div>
                <p className="text-sm text-gray-400 mt-6">
                  For assistance, contact <a href="mailto:dev@restoremastersllc.com" className="text-indigo-400 hover:text-indigo-300">dev@restoremastersllc.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // PR submission received view
  if (loadingState === 'received') {
    const submissionDate = submission?.submittedAt 
      ? new Date(submission.submittedAt).toLocaleString() 
      : 'Recently';
    
    const roleName = submission?.role 
      ? submission.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      : '';
      
    return (
      <main className="min-h-screen bg-gray-900">
        <nav className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center py-6">
              <div className="relative w-[300px] h-[60px] flex items-center justify-center">
                <div className="relative w-full h-full">
                  <Image
                    src="/rm-logo-no-outline.png"
                    alt="RestoreMasters Logo"
                    fill
                    priority
                    style={{ objectFit: "contain" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </nav>
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className="w-full max-w-6xl">
            {/* Header with icon */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-indigo-900/30 mb-4">
                <IconGitPullRequest size={40} className="text-indigo-500" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                GitHub PR Submission Received
              </h1>
              <p className="text-gray-300 text-base">
                Thank you for submitting your pull request. We've received your submission and will review it shortly.
              </p>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left side: Submission Details */}
              <div className="md:col-span-5">
                {!submission ? (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 h-full">
                    <h3 className="text-base font-medium text-red-300">Missing Data</h3>
                    <p className="text-red-200 text-sm mt-2">We couldn't retrieve your submission details.</p>
                    <div className="mt-3 text-sm font-mono bg-gray-900 p-3 rounded overflow-auto text-gray-300 text-opacity-70">
                      <div>Email: {email || 'Not provided'}</div>
                      <div>ID: {submissionId || 'Not provided'}</div>
                    </div>
                    <div className="mt-4 flex justify-center">
                      <button 
                        onClick={fetchSubmissionData} 
                        className="px-4 py-2 text-sm bg-red-700 hover:bg-red-600 text-white rounded focus:outline-none"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 h-full">
                    <div className="p-6">
                      <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <IconUser size={20} className="text-indigo-400 mr-2" />
                        Submission Details
                      </h2>
                      <div className="space-y-4">
                        <div className="flex items-center bg-gray-900/50 rounded p-3">
                          <div className="flex-shrink-0 w-24 text-sm text-gray-400">Email:</div>
                          <div className="ml-2 text-base text-white">{submission.email}</div>
                        </div>
                        
                        <div className="flex items-center bg-gray-900/50 rounded p-3">
                          <div className="flex-shrink-0 w-24 text-sm text-gray-400">Role:</div>
                          <div className="ml-2 text-base text-white">{roleName}</div>
                        </div>
                        
                        <div className="flex items-center bg-gray-900/50 rounded p-3">
                          <div className="flex-shrink-0 w-24 text-sm text-gray-400">Submitted:</div>
                          <div className="ml-2 text-base text-white">{submissionDate}</div>
                        </div>
                        
                        <div className="flex flex-col bg-gray-900/50 rounded p-3">
                          <div className="flex-shrink-0 text-sm text-gray-400 mb-2">GitHub PR:</div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-white truncate max-w-[260px]">
                              {submission.githubPrLink}
                            </div>
                            <a 
                              href={submission.githubPrLink || '#'} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-2 inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300"
                            >
                              <IconExternalLink size={16} className="mr-1" />
                              Open
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Middle: Next Steps */}
              <div className="md:col-span-4">
                <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 h-full">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <IconHourglass size={20} className="text-indigo-400 mr-2" />
                      What Happens Next
                    </h2>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <span className="flex-shrink-0 rounded-full bg-indigo-900/40 p-1.5 mr-3 mt-0.5">
                          <IconCheck size={16} className="text-indigo-400" />
                        </span>
                        <span className="text-gray-300 text-base">Your PR has been recorded in our system</span>
                      </li>
                      <li className="flex items-start">
                        <span className="flex-shrink-0 rounded-full bg-indigo-900/40 p-1.5 mr-3 mt-0.5">
                          <IconHourglass size={16} className="text-indigo-400" />
                        </span>
                        <span className="text-gray-300 text-base">Our team will review your code (1-3 business days)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="flex-shrink-0 rounded-full bg-indigo-900/40 p-1.5 mr-3 mt-0.5">
                          <IconMail size={16} className="text-indigo-400" />
                        </span>
                        <span className="text-gray-300 text-base">
                          You'll receive an email at <strong className="text-white text-opacity-90">{submission?.email || email || 'your email'}</strong>
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="flex-shrink-0 rounded-full bg-indigo-900/40 p-1.5 mr-3 mt-0.5">
                          <IconArrowRight size={16} className="text-indigo-400" />
                        </span>
                        <span className="text-gray-300 text-base">The email will include next steps</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right side: Evaluation Criteria */}
              <div className="md:col-span-3">
                <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 h-full">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <IconCheck size={20} className="text-indigo-400 mr-2" />
                      Evaluation Criteria
                    </h2>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <div className="flex-shrink-0 text-indigo-500 mr-2 text-base">•</div>
                        <div className="text-sm text-gray-300">
                          <strong>Functionality</strong> (40%): Does it work as expected?
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 text-indigo-500 mr-2 text-base">•</div>
                        <div className="text-sm text-gray-300">
                          <strong>Code Quality</strong> (30%): Well-structured code?
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 text-indigo-500 mr-2 text-base">•</div>
                        <div className="text-sm text-gray-300">
                          <strong>Technical Decisions</strong> (30%): Good architecture?
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mt-8 text-center">
              <p className="text-base text-gray-400 mb-5">
                For any inquiries regarding your submission, please contact <a href="mailto:dev@restoremastersllc.com" className="text-indigo-400 hover:text-indigo-300">dev@restoremastersllc.com</a>
              </p>
            </div>

            {/* Bottom button */}
            <div className="mt-5 text-center">
              <Link 
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Return to Homepage
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (loadingState === 'evaluating') {
    return (
      <main className="min-h-screen bg-gray-900">
        <nav className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center py-6">
              <div className="relative w-[300px] h-[60px] flex items-center justify-center">
                <div className="relative w-full h-full">
                  <Image
                    src="/rm-logo-no-outline.png"
                    alt="RestoreMasters Logo"
                    fill
                    priority
                    style={{ objectFit: "contain" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </nav>
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className="w-full max-w-lg">
            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto mb-6"></div>
                <h2 className="text-xl text-white font-medium mb-3">Evaluating Your Assessment</h2>
                <p className="text-base text-gray-400 mb-6">Please wait while our system analyzes your code...</p>
                <div className="space-y-3 text-left">
                  <div className="flex items-center text-sm text-gray-400">
                    <div className="w-5 h-5 mr-3 rounded-full bg-gray-700 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                    </div>
                    Analyzing code structure and patterns
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <div className="w-5 h-5 mr-3 rounded-full bg-gray-700 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                    </div>
                    Evaluating best practices and implementation
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <div className="w-5 h-5 mr-3 rounded-full bg-gray-700 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                    </div>
                    Generating detailed feedback
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-6">
                  For assistance, contact <a href="mailto:dev@restoremastersllc.com" className="text-indigo-400 hover:text-indigo-300">dev@restoremastersllc.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-6">
            <div className="relative w-[300px] h-[60px] flex items-center justify-center">
              <div className="relative w-full h-full">
                <Image
                  src="/rm-logo-no-outline.png"
                  alt="RestoreMasters Logo"
                  fill
                  priority
                  style={{ objectFit: "contain" }}
                />
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="w-full max-w-6xl">
          {/* Header with icon */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center h-20 w-20 rounded-full ${passed ? 'bg-green-900/30' : 'bg-red-900/30'} mb-4`}>
              {passed ? (
                <IconCircleCheck size={40} className="text-green-500" />
              ) : (
                <IconX size={40} className="text-red-500" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Assessment Evaluation Results
            </h1>
            <p className="text-gray-300 text-base">
              Thank you for completing the technical assessment.
            </p>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left side: Evaluation results */}
            <div className="md:col-span-6">
              <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 h-full">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <IconCheck size={20} className="text-indigo-400 mr-2" />
                    Your Results
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-900/50 rounded p-3">
                      <span className="text-base text-gray-400">Score:</span>
                      <span className={`text-lg font-bold ${score && score >= 80 ? 'text-green-400' : 'text-red-400'}`}>
                        {score}/100
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-900/50 rounded p-3">
                      <span className="text-base text-gray-400">Status:</span>
                      <span className={`text-base font-medium ${passed ? 'text-green-400' : 'text-red-400'}`}>
                        {passed ? 'Passed' : 'Not Passed'}
                      </span>
                    </div>
                    {decodedFeedback && (
                      <div className="bg-gray-900/50 rounded p-3">
                        <h3 className="text-sm text-gray-400 mb-2">Feedback:</h3>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">{decodedFeedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Next steps */}
            <div className="md:col-span-6">
              <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 h-full">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <IconArrowRight size={20} className="text-indigo-400 mr-2" />
                    What Happens Next
                  </h2>
                  {passed ? (
                    <div>
                      <p className="text-base text-gray-300 mb-6">
                        Congratulations! You've passed the assessment. You can now proceed to the interview preparation stage.
                      </p>
                      <div className="flex justify-center">
                        <Link 
                          href={`/application/interview-prep?email=${encodeURIComponent(email)}`}
                          className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Proceed to Interview Prep
                          <IconArrowRight size={18} className="ml-2" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-base text-gray-300 mb-6">
                        Unfortunately, your submission did not meet the passing criteria. We encourage you to review the feedback, make improvements, and try again.
                      </p>
                      <div className="flex justify-center">
                        <Link 
                          href="/application/assessment"
                          className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Return to Assessments
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section: Evaluation Criteria */}
          <div className="mt-6">
            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <IconCheck size={20} className="text-indigo-400 mr-2" />
                  Assessment Evaluation Criteria
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-900/50 rounded p-3">
                    <div className="text-base text-white font-medium mb-1">Functionality (40%)</div>
                    <p className="text-sm text-gray-300">Does the code work as expected and meet all requirements?</p>
                  </div>
                  <div className="bg-gray-900/50 rounded p-3">
                    <div className="text-base text-white font-medium mb-1">Code Quality (30%)</div>
                    <p className="text-sm text-gray-300">Is the code well-structured, maintainable, and following best practices?</p>
                  </div>
                  <div className="bg-gray-900/50 rounded p-3">
                    <div className="text-base text-white font-medium mb-1">Technical Decisions (30%)</div>
                    <p className="text-sm text-gray-300">Are the architecture choices and problem-solving approaches appropriate?</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-8 text-center">
            <p className="text-base text-gray-400">
              For any inquiries regarding your assessment results, please contact <a href="mailto:dev@restoremastersllc.com" className="text-indigo-400 hover:text-indigo-300">dev@restoremastersllc.com</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AssessmentSubmittedPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <SubmittedContent />
    </Suspense>
  );
} 