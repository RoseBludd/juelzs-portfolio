'use client';

import { useState } from 'react';
import { LeadershipVideo } from '@/services/portfolio.service';
import { OverallLeadershipAnalysis } from '@/services/overall-leadership-analysis.service';
import LeadershipClient from './LeadershipClient';
import OverallLeadershipAnalysisComponent from './OverallLeadershipAnalysis';

interface LeadershipPageClientProps {
  videos: LeadershipVideo[];
  overallAnalysis: OverallLeadershipAnalysis | null;
}

export default function LeadershipPageClient({ videos, overallAnalysis }: LeadershipPageClientProps) {
  // Default to overall analysis view
  const [showOverallAnalysis, setShowOverallAnalysis] = useState(true);

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-32 h-32 mx-auto mb-8 rounded-full overflow-hidden border-4 border-yellow-400 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-1">
            <div className="w-full h-full rounded-full overflow-hidden">
              <img 
                src="/profile-logo.png" 
                alt="Juelzs Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
            Leadership in <span className="text-blue-400">Action</span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Watch how I coach teams, review architecture, and guide technical decisions in real-time. 
            These recordings showcase my approach to building both systems and the people who build them.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-800 rounded-lg p-1 border border-gray-600">
            <button
              onClick={() => setShowOverallAnalysis(true)}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                showOverallAnalysis
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              📊 Leadership Analysis
            </button>
            <button
              onClick={() => setShowOverallAnalysis(false)}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                !showOverallAnalysis
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              🎥 Individual Sessions
            </button>
          </div>
        </div>

        {/* Content based on toggle */}
        {showOverallAnalysis ? (
          // Overall Leadership Analysis View
          <div>
            {overallAnalysis ? (
              <OverallLeadershipAnalysisComponent analysis={overallAnalysis} />
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔄</div>
                <h3 className="text-xl font-medium text-white mb-2">
                  Analysis in Progress
                </h3>
                <p className="text-gray-400">
                  Overall leadership analysis is being generated from showcased sessions. Please check back soon.
                </p>
              </div>
            )}
          </div>
        ) : (
          // Individual Videos View (Original)
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  All Videos
                </button>
                <button className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 transition-colors">
                  Architecture Reviews
                </button>
                <button className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 transition-colors">
                  Leadership Moments
                </button>
                <button className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 transition-colors">
                  Mentoring Sessions
                </button>
                <button className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg font-medium hover:bg-gray-600 transition-colors">
                  Technical Discussions
                </button>
              </div>
            </div>
            
            <LeadershipClient videos={videos} showHeader={false} />
          </div>
        )}
      </div>
    </div>
  );
} 