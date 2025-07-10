'use client';

import { LeadershipAnalysis } from '@/services/meeting-analysis.service';
import Card from './Card';

interface LeadershipAnalysisCardProps {
  analysis: LeadershipAnalysis;
  onReanalyze?: () => void;
}

export default function LeadershipAnalysisCard({ analysis, onReanalyze }: LeadershipAnalysisCardProps) {
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

  const ScoreBar = ({ score, label }: { score: number; label: string }) => (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className={`font-semibold ${getScoreColor(score)}`}>{score}/10</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getScoreBackground(score)}`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
    </div>
  );

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getScoreBackground(analysis.overallRating)}`}>
            <span className={`text-xl font-bold ${getScoreColor(analysis.overallRating)}`}>
              {analysis.overallRating}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Leadership Analysis</h3>
            <p className="text-gray-400">AI-Powered Performance Review</p>
          </div>
        </div>
        {onReanalyze && (
          <button 
            onClick={onReanalyze}
            className="px-3 py-2 text-sm bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            Re-analyze
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-3">Executive Summary</h4>
        <p className="text-gray-300 text-sm leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Communication Style Metrics */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-4">Communication Style</h4>
        <div className="grid grid-cols-2 gap-4">
          <ScoreBar score={analysis.communicationStyle.clarity} label="Clarity" />
          <ScoreBar score={analysis.communicationStyle.engagement} label="Engagement" />
          <ScoreBar score={analysis.communicationStyle.empathy} label="Empathy" />
          <ScoreBar score={analysis.communicationStyle.decisiveness} label="Decisiveness" />
        </div>
      </div>

      {/* Leadership Qualities */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-4">Leadership Qualities</h4>
        <div className="grid grid-cols-2 gap-4">
          <ScoreBar score={analysis.leadershipQualities.technicalGuidance} label="Technical Guidance" />
          <ScoreBar score={analysis.leadershipQualities.teamBuilding} label="Team Building" />
          <ScoreBar score={analysis.leadershipQualities.problemSolving} label="Problem Solving" />
          <ScoreBar score={analysis.leadershipQualities.visionCasting} label="Vision Casting" />
        </div>
      </div>

      {/* Strengths and Areas for Improvement */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Strengths
          </h4>
          <ul className="space-y-2">
            {analysis.strengths.map((strength, index) => (
              <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-semibold text-orange-400 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Growth Areas
          </h4>
          <ul className="space-y-2">
            {analysis.areasForImprovement.map((area, index) => (
              <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-orange-400 mt-1">•</span>
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Standout Moments */}
      {analysis.standoutMoments.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
            Standout Moments
          </h4>
          <ul className="space-y-2">
            {analysis.standoutMoments.map((moment, index) => (
              <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-purple-400 mt-1">★</span>
                <span>{moment}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Insights */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
          </svg>
          Key Insights
        </h4>
        <ul className="space-y-2">
          {analysis.keyInsights.map((insight, index) => (
            <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
              <span className="text-blue-400 mt-1">💡</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendations */}
      <div>
        <h4 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
          </svg>
          Action Items
        </h4>
        <ul className="space-y-2">
          {analysis.recommendations.map((recommendation, index) => (
            <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
              <span className="text-yellow-400 mt-1">→</span>
              <span>{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
} 