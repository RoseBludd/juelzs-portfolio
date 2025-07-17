'use client';

import { OverallLeadershipAnalysis } from '@/services/overall-leadership-analysis.service';
import Card from './Card';

interface OverallLeadershipAnalysisProps {
  analysis: OverallLeadershipAnalysis;
}

export default function OverallLeadershipAnalysisComponent({ analysis }: OverallLeadershipAnalysisProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-green-400';
    if (score >= 7) return 'text-blue-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8.5) return 'bg-green-500/20 border-green-500/30';
    if (score >= 7) return 'bg-blue-500/20 border-blue-500/30';
    if (score >= 6) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-orange-500/20 border-orange-500/30';
  };

  return (
    <div className="space-y-8">
      {/* Executive Summary Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-8 border border-blue-500/30">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Leadership Analysis</h2>
            <p className="text-gray-300">Comprehensive evaluation based on {analysis.dataPoints.totalSessionsAnalyzed} leadership sessions</p>
          </div>
          <div className={`text-right ${getScoreBg(analysis.overallRating)} rounded-lg p-4 border`}>
            <div className="text-3xl font-bold text-white">{analysis.overallRating}</div>
            <div className="text-sm text-gray-300">Overall Rating</div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
          <p className="text-lg text-gray-100 leading-relaxed">
            {analysis.executiveSummary}
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="text-2xl font-bold text-blue-400 mb-2">
            {analysis.dataPoints.averageRating}/10
          </div>
          <div className="text-sm text-gray-400">Average Session Rating</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-2xl font-bold text-green-400 mb-2">
            {analysis.dataPoints.totalSessionsAnalyzed}
          </div>
          <div className="text-sm text-gray-400">Sessions Analyzed</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-2xl font-bold text-purple-400 mb-2">
            {analysis.dataPoints.analysisConfidence}/10
          </div>
          <div className="text-sm text-gray-400">Analysis Confidence</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-2xl font-bold text-orange-400 mb-2">
            {analysis.dataPoints.timeSpanCovered}
          </div>
          <div className="text-sm text-gray-400">Time Period</div>
        </Card>
      </div>

      {/* Leadership Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Primary Strengths */}
        <Card>
          <h3 className="text-xl font-semibold mb-6 text-white">Core Leadership Strengths</h3>
          <div className="space-y-4">
            {analysis.leadershipProfile.primaryStrengths.map((strength, index) => (
              <div key={index} className="flex items-start">
                <span className="text-green-400 mr-3 mt-1">✓</span>
                <span className="text-gray-300">{strength}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Leadership Style */}
        <Card>
          <h3 className="text-xl font-semibold mb-6 text-white">Leadership Approach</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Leadership Style</h4>
              <p className="text-gray-400 text-sm">{analysis.leadershipProfile.leadershipStyle}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Decision Making</h4>
              <p className="text-gray-400 text-sm">{analysis.leadershipProfile.decisionMakingApproach}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Communication</h4>
              <p className="text-gray-400 text-sm">{analysis.leadershipProfile.communicationEffectiveness}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Capabilities Assessment */}
      <Card>
        <h3 className="text-xl font-semibold mb-6 text-white">Leadership Capabilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(analysis.capabilities).map(([capability, data]) => (
            <div key={capability} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-300 capitalize">
                  {capability.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <span className={`text-lg font-bold ${getScoreColor(data.score)}`}>
                  {data.score}/10
                </span>
              </div>
              <div className="space-y-2">
                {data.evidence.slice(0, 2).map((evidence, index) => (
                  <p key={index} className="text-xs text-gray-400">{evidence}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <h3 className="text-xl font-semibold mb-6 text-white">Performance Insights</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Consistent Strengths</h4>
              <ul className="space-y-1">
                {analysis.performanceInsights.consistentStrengths.map((strength, index) => (
                  <li key={index} className="text-sm text-gray-400 flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Growth Trajectory</h4>
              <ul className="space-y-1">
                {analysis.performanceInsights.growthTrajectory.map((growth, index) => (
                  <li key={index} className="text-sm text-gray-400 flex items-start">
                    <span className="text-green-400 mr-2">↗</span>
                    {growth}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-semibold mb-6 text-white">Value Proposition</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Unique Differentiators</h4>
              <ul className="space-y-1">
                {analysis.valueProposition.uniqueDifferentiators.map((diff, index) => (
                  <li key={index} className="text-sm text-gray-400 flex items-start">
                    <span className="text-purple-400 mr-2">★</span>
                    {diff}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Organizational Impact</h4>
              <ul className="space-y-1">
                {analysis.valueProposition.organizationalImpact.slice(0, 3).map((impact, index) => (
                  <li key={index} className="text-sm text-gray-400 flex items-start">
                    <span className="text-orange-400 mr-2">►</span>
                    {impact}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <h3 className="text-xl font-semibold mb-6 text-white">Executive Recommendations</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-300 mb-3">Best Fit Scenarios</h4>
            <ul className="space-y-2">
              {analysis.recommendations.bestFitScenarios.map((scenario, index) => (
                <li key={index} className="text-sm text-gray-400 flex items-start">
                  <span className="text-blue-400 mr-2">✓</span>
                  {scenario}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-300 mb-3">Expected Outcomes</h4>
            <ul className="space-y-2">
              {analysis.recommendations.expectedOutcomes.map((outcome, index) => (
                <li key={index} className="text-sm text-gray-400 flex items-start">
                  <span className="text-green-400 mr-2">→</span>
                  {outcome}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Collaboration Style</h4>
              <p className="text-sm text-gray-400">{analysis.recommendations.collaborationStyle}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Team Integration</h4>
              <p className="text-sm text-gray-400">{analysis.recommendations.teamIntegration}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Analysis Footer */}
      <div className="text-center text-sm text-gray-500">
        Analysis updated: {new Date(analysis.dataPoints.lastUpdated).toLocaleDateString()}
      </div>
    </div>
  );
} 