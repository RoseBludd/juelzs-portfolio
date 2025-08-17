'use client';

import { IconArrowRight, IconCheck, IconLoader2, IconAlertCircle } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect, Suspense } from 'react';

// Loading fallback component
function InterviewPrepLoading() {
  return <div className="flex items-center justify-center min-h-screen">
    <div className="animate-pulse text-xl">Loading interview preparation...</div>
  </div>;
}

function InterviewPrepContent() {
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoError, setVideoError] = useState(false);
  const [contractError, setContractError] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [contractUrl, setContractUrl] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [useSynthesiaEmbed, setUseSynthesiaEmbed] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  useEffect(() => {
    // Use direct URLs from environment variables instead of fetching from API
    const fetchVideoAndContract = async () => {
      try {
        // For Synthesia video embed
        if (process.env.SYNTHESIA_VIDEO_EMBED_CODE) {
          console.log('Using Synthesia embed code from env');
          setUseSynthesiaEmbed(true);
        } else {
          // For video URL, try to use the direct S3 URL or signed URL from env vars
          if (process.env.S3_VIDEO_SIGNED_URL) {
            setVideoUrl(process.env.S3_VIDEO_SIGNED_URL);
            console.log('Using signed video URL from env:', process.env.S3_VIDEO_SIGNED_URL);
          } else if (process.env.S3_VIDEO_URL) {
            setVideoUrl(process.env.S3_VIDEO_URL);
            console.log('Using direct video URL from env:', process.env.S3_VIDEO_URL);
          } else {
            // Fallback to API
            console.log('No video URL in env, fetching from API...');
            const videoRes = await fetch('/api/interview-video');
            const videoData = await videoRes.json();
            if (videoData.url) {
              console.log('Video URL from API:', videoData.url);
              setVideoUrl(videoData.url);
            } else {
              throw new Error('No video URL returned from API');
            }
          }
        }

        // For contract, try API
        console.log('Fetching contract from API...');
        const contractRes = await fetch('/api/contract-pdf');
        const contractData = await contractRes.json();
        if (contractData.url) {
          console.log('Contract URL from API:', contractData.url);
          setContractUrl(contractData.url);
        } else {
          throw new Error('No contract URL returned from API');
        }
      } catch (error: any) {
        console.error('Error fetching resources:', error);
        if (error.message && error.message.includes('video')) {
          setVideoError(true);
        }
        if (error.message && error.message.includes('contract')) {
          setContractError(true);
        }
      }
    };

    fetchVideoAndContract();
  }, []);

  // Check email separately
  useEffect(() => {
    if (!email) {
      setError('Email is required. Please start the application process from the beginning.');
    } else {
      setError('');
    }
  }, [email]);

  const handleAgree = async () => {
    try {
      console.log('Starting agreement process...');
      setIsLoading(true);
      setError('');

      if (!email) {
        console.error('No email found in URL');
        setError('Email is required. Please start from the beginning of the application process.');
        setIsLoading(false);
        return;
      }

      console.log('Updating developer stage...');
      const response = await fetch('/api/developer/update-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, stage: 'contract_signed' }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Stage update failed:', data);
        throw new Error(data.message || 'Failed to update stage');
      }

      console.log('Stage updated successfully, attempting sign in...');
      const decodedEmail = decodeURIComponent(email);
      console.log('Signing in with decoded email:', decodedEmail);
      
      const signInResponse = await fetch('/api/auth/custom-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: decodedEmail,
          password: 'dev123', // Using the default password
        }),
      });

      const signInResult = await signInResponse.json();
      console.log('Sign in result:', signInResult);

      if (!signInResult.success) {
        console.error('Sign in failed:', signInResult.error);
        throw new Error(signInResult.error || 'Sign in failed');
      }

      setHasAgreed(true);
      setShowSuccess(true);
      
      // Add a small delay to show the success message before redirecting
      setTimeout(() => {
        console.log('Sign in successful, redirecting...');
        window.location.href = '/developer/trial-tasks';
      }, 1500);
    } catch (error: any) {
      console.error('Agreement process failed:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-white">Interview Preparation</h1>
      
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8 border border-gray-700">
        <h2 className="text-2xl font-semibold mb-4 text-white">Interview Overview Video</h2>
        <p className="text-gray-300 mb-6">
          Please watch this video carefully as it covers important information about your upcoming interview,
          including the format, types of questions you'll be asked, and tips for success.
        </p>
        
        {/* Video container with 16:9 aspect ratio */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          {videoError ? (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
              <p className="text-red-400">Error loading video. Please try refreshing the page.</p>
            </div>
          ) : useSynthesiaEmbed ? (
            <div 
              className="absolute top-0 left-0 w-full h-full rounded-lg overflow-hidden"
              dangerouslySetInnerHTML={{ __html: process.env.SYNTHESIA_VIDEO_EMBED_CODE || '' }}
            />
          ) : !videoUrl && process.env.S3_VIDEO_URL ? (
            // Direct iframe embed using the S3_VIDEO_URL from environment
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src={process.env.S3_VIDEO_URL}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : !videoUrl ? (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
              <IconLoader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <video
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              controls
              preload="metadata"
              onError={() => setVideoError(true)}
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-semibold mb-4 text-white">Contract Information</h2>
        <p className="mb-6">Please review the contract carefully. You must agree to the terms before proceeding.</p>
        
        {contractError ? (
          <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg mb-6">
            <p className="text-red-400 flex items-center">
              <IconAlertCircle className="w-5 h-5 mr-2" />
              Error loading contract. Please try refreshing the page.
            </p>
          </div>
        ) : !contractUrl ? (
          <div className="p-4 bg-gray-800 rounded-lg mb-6 flex justify-center">
            <IconLoader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : contractUrl.startsWith('/') ? (
          // Local file from public directory
          <div className="h-[500px] bg-gray-800 rounded-lg mb-6 overflow-hidden">
            <iframe 
              src={contractUrl} 
              className="w-full h-full" 
              title="Developer Contract"
            ></iframe>
          </div>
        ) : (
          // S3 URL
          <div className="h-[500px] bg-gray-800 rounded-lg mb-6 overflow-hidden">
            <object 
              data={contractUrl} 
              type="application/pdf" 
              className="w-full h-full"
            >
              <p className="p-4 text-red-400">
                Unable to display PDF. <a href={contractUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Click here</a> to download the contract.
              </p>
            </object>
          </div>
        )}
        
        <div className="space-y-6">
          {error && (
            <div className="flex items-center text-red-400 mb-4">
              <IconAlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}
          
          {showSuccess && (
            <div className="flex items-center bg-green-900 text-green-100 p-4 rounded-md mb-4">
              <IconCheck className="h-5 w-5 mr-2" />
              <div>
                <p className="font-semibold">Contract Accepted Successfully!</p>
                <p className="text-sm mt-1">You're being automatically signed in and will be redirected to your trial tasks.</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleAgree}
              disabled={isLoading || hasAgreed}
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : hasAgreed ? (
                <>
                  <IconCheck className="mr-2 h-5 w-5" />
                  Contract Accepted
                </>
              ) : (
                <>
                  I Agree to the Terms
                  <IconArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>

            <a
              href={contractUrl}
              download="RM_Developers_Contract.pdf"
              className="inline-flex items-center px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download Contract
              <IconArrowRight className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InterviewPrepPage() {
  return (
    <Suspense fallback={<InterviewPrepLoading />}>
      <InterviewPrepContent />
    </Suspense>
  );
}