'use client';

import { 
  IconChevronLeft, 
  IconCode, 
  IconServer, 
  IconPlugConnected, 
  IconCloud, 
  IconStack,
  IconBrandGithub,
  IconExternalLink,
  IconGitPullRequest,
  IconAlertCircle,
  IconClock,
  IconCopy,
  IconCheck
} from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';

// Define the role data structure for assessments
interface RoleAssessment {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

// Define the roles assessment data
const rolesAssessmentData: Record<string, RoleAssessment> = {
  frontend_specialist: {
    id: 'frontend_specialist',
    title: 'Frontend Specialist Assessment',
    icon: <IconCode size={24} />,
    description: 'This assessment evaluates your ability to build responsive, accessible, and performant user interfaces using React and Next.js.',
  },
  backend_specialist: {
    id: 'backend_specialist',
    title: 'Backend Specialist Assessment',
    icon: <IconServer size={24} />,
    description: 'This assessment evaluates your ability to develop robust and scalable backend services using Node.js, Express, and database technologies.',
  },
  integration_specialist: {
    id: 'integration_specialist',
    title: 'Integration Specialist Assessment',
    icon: <IconPlugConnected size={24} />,
    description: 'This assessment evaluates your ability to connect different systems and services to create seamless workflows.',
  },
  devops_engineer: {
    id: 'devops_engineer',
    title: 'DevOps Engineer Assessment',
    icon: <IconCloud size={24} />,
    description: 'This assessment evaluates your ability to build and maintain infrastructure, CI/CD pipelines, and deployment processes.',
  },
  fullstack_developer: {
    id: 'fullstack_developer',
    title: 'Fullstack Developer Assessment',
    icon: <IconStack size={24} />,
    description: 'This assessment evaluates your ability to work across the entire stack to deliver complete features and functionality.',
  }
};

export default function RoleAssessmentPage({ params }: { params: { roleId: string } }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [githubPrLink, setGithubPrLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const searchParams = useSearchParams();
  
  const roleId = params.roleId;
  const roleData = rolesAssessmentData[roleId];

  // Pre-fill email from URL or localStorage when component mounts
  useEffect(() => {
    const emailFromUrl = searchParams.get('email');
    const emailFromStorage = localStorage.getItem('userEmail');
    
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    } else if (emailFromStorage) {
      setEmail(emailFromStorage);
    }
  }, [searchParams]);

  // Function to copy current URL to clipboard
  const copyUrlToClipboard = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      });
    }
  };

  if (!roleData) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
              Role Not Found
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-300 sm:mt-4">
              The specified role does not exist. Please select a valid role from the assessment page.
            </p>
            <div className="mt-8">
              <Link 
                href="/application/assessment"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <IconChevronLeft size={16} className="mr-2" />
                Back to Assessment Selection
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !githubPrLink) {
      setError('Please provide your email and GitHub pull request link');
      return;
    }

    // Validate GitHub PR URL format
    const prLinkPattern = /^https:\/\/github\.com\/[\w-]+\/[\w-]+\/pull\/\d+$/;
    if (!prLinkPattern.test(githubPrLink)) {
      setError('Please provide a valid GitHub pull request URL (https://github.com/username/repo/pull/123)');
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/application/submit-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          role: roleId,
          pullRequestUrl: githubPrLink
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to submit assessment');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit assessment');
      }
      
      // Include the email and submissionId (if available) in the redirect URL
      const redirectUrl = `/application/assessment/submitted?status=received&email=${encodeURIComponent(email)}${data.submissionId ? `&submissionId=${data.submissionId}` : ''}`;
      router.push(redirectUrl);
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link 
              href="/application/assessment"
              className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300"
            >
              <IconChevronLeft size={16} className="mr-1" />
              Back to Assessment Selection
            </Link>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 mb-8">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-900/50 rounded-md p-3">
                  {roleData.icon}
                </div>
                <h1 className="ml-4 text-2xl font-bold text-white">{roleData.title}</h1>
              </div>
              <p className="mt-4 text-gray-300">
                {roleData.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 mb-8">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Assessment Instructions</h2>
                  <div className="space-y-6">
                    <div className="bg-indigo-900/30 border-l-4 border-indigo-500 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <IconAlertCircle className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-indigo-300">
                            Please complete your assessment by following the instructions on GitHub. After submitting your pull request, return here to submit the PR link.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-900/30 border-l-4 border-yellow-500 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-300 font-medium mb-1">
                            Bookmark This Page
                          </p>
                          <p className="text-sm text-yellow-300">
                            We recommend bookmarking this page or saving its URL so you can easily return to submit your PR link after completing the assessment. Your email will be saved automatically.
                          </p>
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={copyUrlToClipboard}
                              className="inline-flex items-center px-3 py-1.5 border border-yellow-600 text-xs font-medium rounded-md text-yellow-300 bg-yellow-900/40 hover:bg-yellow-900/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 focus:ring-offset-gray-900"
                            >
                              {copied ? (
                                <>
                                  <IconCheck className="w-4 h-4 mr-1" />
                                  URL Copied!
                                </>
                              ) : (
                                <>
                                  <IconCopy className="w-4 h-4 mr-1" />
                                  Copy Page URL
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-white mb-3">Assessment Steps</h3>
                      <ol className="space-y-4 list-decimal pl-5">
                        <li className="text-gray-300">
                          <span className="font-medium">Fork the repository</span>: 
                          <a 
                            href="https://github.com/RoseBludd/technical-assessment" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 inline-flex items-center text-indigo-400 hover:text-indigo-300"
                          >
                            Visit GitHub Repository
                            <IconExternalLink size={16} className="ml-1" />
                          </a>
                        </li>
                        <li className="text-gray-300">
                          <span className="font-medium">Create a branch</span>: Follow the naming convention <code className="text-indigo-300 bg-gray-700 px-1 py-0.5 rounded">assessment/[role]/[your-name]</code>
                        </li>
                        <li className="text-gray-300">
                          <span className="font-medium">Complete the assessment tasks</span>: Read the role-specific README.md in your role's directory
                        </li>
                        <li className="text-gray-300">
                          <span className="font-medium">Test your solution</span>: Make sure all tests pass before submitting
                        </li>
                        <li className="text-gray-300">
                          <span className="font-medium">Create a pull request</span>: Submit your solution as a PR to the original repository
                        </li>
                        <li className="text-gray-300">
                          <span className="font-medium">Submit the PR link below</span>: Return to this page and submit the GitHub PR link
                        </li>
                        <li className="text-gray-300">
                          <span className="font-medium">Bookmark this page now</span>: Save this URL to easily return after you've completed your assessment
                        </li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-white mb-3">Important Notes</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start text-gray-300">
                          <span className="flex-shrink-0 text-indigo-500 mr-2">•</span>
                          <span>Read the instructions in the repository <strong>carefully</strong> before beginning</span>
                        </li>
                        <li className="flex items-start text-gray-300">
                          <span className="flex-shrink-0 text-indigo-500 mr-2">•</span>
                          <span>Time recommendation is 2-4 hours, but there's no strict time limit</span>
                        </li>
                        <li className="flex items-start text-gray-300">
                          <span className="flex-shrink-0 text-indigo-500 mr-2">•</span>
                          <span>If you have questions, use the Issues tab in the GitHub repository</span>
                        </li>
                        <li className="flex items-start text-gray-300">
                          <span className="flex-shrink-0 text-indigo-500 mr-2">•</span>
                          <span>Ensure your code follows best practices and is well-documented</span>
                        </li>
                        <li className="flex items-start text-gray-300">
                          <span className="flex-shrink-0 text-indigo-500 mr-2">•</span>
                          <span>The assessment will be evaluated on functionality, code quality, and technical decisions</span>
                        </li>
                        <li className="flex items-start text-gray-300">
                          <span className="flex-shrink-0 text-indigo-500 mr-2">•</span>
                          <span>You'll need to return to this exact page to submit your PR link, so bookmark it before leaving</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex justify-center py-4">
                      <a 
                        href="https://github.com/RoseBludd/technical-assessment" 
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900"
                      >
                        <IconBrandGithub className="mr-2 h-5 w-5" />
                        Go to GitHub Repository
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 mb-8 sticky top-8">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Submit Your Assessment</h2>
                  <p className="text-gray-300 mb-6">
                    After completing your assessment and creating a pull request on GitHub, submit the PR link below:
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="bg-red-900/30 border-l-4 border-red-500 p-4">
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
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                        Email Address
                      </label>
                      <div className="mt-1">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="appearance-none block w-full px-3 py-2 border border-gray-600 bg-gray-700 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="githubPrLink" className="block text-sm font-medium text-gray-200">
                        GitHub Pull Request URL
                      </label>
                      <div className="mt-1">
                        <input
                          id="githubPrLink"
                          name="githubPrLink"
                          type="url"
                          required
                          value={githubPrLink}
                          onChange={(e) => setGithubPrLink(e.target.value)}
                          className="appearance-none block w-full px-3 py-2 border border-gray-600 bg-gray-700 rounded-md shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="https://github.com/RoseBludd/technical-assessment/pull/123"
                        />
                        <p className="mt-2 text-sm text-gray-400">
                          Example: https://github.com/RoseBludd/technical-assessment/pull/123
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className={`px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center ${
                          submitting ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <IconGitPullRequest className="mr-2 h-5 w-5" />
                            Submit PR Link
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 