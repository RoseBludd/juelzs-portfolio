'use client';

import { useState, useEffect } from 'react';
import Button from './Button';
import Card from './Card';
import LeadershipAnalysisCard from './LeadershipAnalysisCard';
import { LeadershipVideo } from '@/services/portfolio.service';

interface VideoTabsProps {
  video: LeadershipVideo;
}

export default function VideoTabs({ video }: VideoTabsProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'analysis'>('timeline');

  useEffect(() => {
    console.log('🎬 VideoTabs component mounted:', {
      videoTitle: video.title,
      keyMomentsCount: video.keyMoments.length,
      hasAnalysis: !!video.analysis,
      analysisRating: video.analysis?.overallRating
    });
  }, [video]);

  console.log('🎭 VideoTabs rendering with:', {
    activeTab,
    keyMoments: video.keyMoments.length,
    hasAnalysis: !!video.analysis
  });

  return (
    <Card>
      {/* Tab Navigation */}
      <div className="flex items-center border-b border-gray-700 mb-6">
        <button
          onClick={() => {
            console.log('🔄 Switching to timeline tab');
            setActiveTab('timeline');
          }}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'timeline'
              ? 'text-blue-400 border-blue-400'
              : 'text-gray-400 border-transparent hover:text-gray-300'
          }`}
        >
          <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Session Timeline
          <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
            {video.keyMoments.length}
          </span>
        </button>
        
        {video.analysis && (
          <button
            onClick={() => {
              console.log('🔄 Switching to analysis tab');
              setActiveTab('analysis');
            }}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'analysis'
                ? 'text-purple-400 border-purple-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            AI Leadership Analysis
            <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
              video.analysis.overallRating >= 8 ? 'bg-green-500/20 text-green-300' :
              video.analysis.overallRating >= 6 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
            }`}>
              {video.analysis.overallRating}/10
            </span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'timeline' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-white">Session Timeline</h2>
            <div className="space-y-4">
              {video.keyMoments.map((moment, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors duration-200 cursor-pointer group">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors duration-200">
                      <span className="text-blue-400 font-mono text-sm font-semibold">
                        {moment.timestamp}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-white">{moment.description}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        moment.type === 'architecture' ? 'bg-blue-500/20 text-blue-300' :
                        moment.type === 'leadership' ? 'bg-purple-500/20 text-purple-300' :
                        moment.type === 'mentoring' ? 'bg-green-500/20 text-green-300' :
                        'bg-orange-500/20 text-orange-300'
                      }`}>
                        {moment.type}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-sm">
                      Jump to this moment in the video to see {moment.type} principles in action.
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
              
              {video.keyMoments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No key moments identified for this session</p>
  
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && video.analysis && (
          <div>
            <LeadershipAnalysisCard analysis={video.analysis} />
          </div>
        )}
      </div>
    </Card>
  );
} 