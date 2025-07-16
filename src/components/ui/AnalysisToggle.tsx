'use client';

import { useState } from 'react';
import { LeadershipAnalysis } from '@/services/meeting-analysis.service';

interface AnalysisToggleProps {
  analysis: LeadershipAnalysis;
}

export default function AnalysisToggle({ analysis }: AnalysisToggleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 8) return 'bg-green-500/20';
    if (score >= 6) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  return (
    <div className="mb-4">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getScoreBackground(analysis.overallRating)}`}>
            <span className={`text-sm font-bold ${getScoreColor(analysis.overallRating)}`}>
              {analysis.overallRating}
            </span>
          </div>
          <div className="text-left">
            <h4 className="text-sm font-medium text-white">AI Leadership Analysis</h4>
            <p className="text-xs text-gray-400">Overall Rating: {analysis.overallRating}/10</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
          {/* Summary */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-white mb-2">Executive Summary</h5>
            <p className="text-xs text-gray-300 leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <h6 className="text-xs font-medium text-gray-400 mb-2">Communication</h6>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Clarity</span>
                  <span className={getScoreColor(analysis.communicationStyle.clarity)}>
                    {analysis.communicationStyle.clarity}/10
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Engagement</span>
                  <span className={getScoreColor(analysis.communicationStyle.engagement)}>
                    {analysis.communicationStyle.engagement}/10
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h6 className="text-xs font-medium text-gray-400 mb-2">Leadership</h6>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Technical Guidance</span>
                  <span className={getScoreColor(analysis.leadershipQualities.technicalGuidance)}>
                    {analysis.leadershipQualities.technicalGuidance}/10
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Problem Solving</span>
                  <span className={getScoreColor(analysis.leadershipQualities.problemSolving)}>
                    {analysis.leadershipQualities.problemSolving}/10
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Strengths */}
          <div className="mb-4">
            <h6 className="text-xs font-medium text-green-400 mb-2">Top Strengths</h6>
            <ul className="space-y-1">
              {analysis.strengths.slice(0, 2).map((strength, index) => (
                <li key={index} className="text-xs text-gray-300 flex items-start gap-1">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Insights */}
          {analysis.keyInsights.length > 0 && (
            <div>
              <h6 className="text-xs font-medium text-blue-400 mb-2">Key Insights</h6>
              <ul className="space-y-1">
                {analysis.keyInsights.slice(0, 2).map((insight, index) => (
                  <li key={index} className="text-xs text-gray-300 flex items-start gap-1">
                    <span className="text-blue-400 mt-0.5">💡</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 