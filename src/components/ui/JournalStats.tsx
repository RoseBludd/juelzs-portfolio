'use client';

import { JournalStats as JournalStatsType } from '@/services/journal.service';

interface JournalStatsProps {
  stats: JournalStatsType;
}

const categoryColors = {
  architecture: 'bg-blue-900/30 text-blue-300 border-blue-700',
  decision: 'bg-purple-900/30 text-purple-300 border-purple-700',
  reflection: 'bg-green-900/30 text-green-300 border-green-700',
  planning: 'bg-yellow-900/30 text-yellow-300 border-yellow-700',
  'problem-solving': 'bg-red-900/30 text-red-300 border-red-700',
  milestone: 'bg-indigo-900/30 text-indigo-300 border-indigo-700',
  learning: 'bg-orange-900/30 text-orange-300 border-orange-700'
};

const categoryIcons = {
  architecture: '🏗️',
  decision: '🤔',
  reflection: '💭',
  planning: '📅',
  'problem-solving': '🔧',
  milestone: '🎯',
  learning: '📚'
};

export default function JournalStats({ stats }: JournalStatsProps) {
  const aiImplementationRate = stats.aiSuggestionsGenerated > 0 
    ? Math.round((stats.aiSuggestionsImplemented / stats.aiSuggestionsGenerated) * 100)
    : 0;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-white mb-6">📊 Journal Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Entries */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Entries</p>
              <p className="text-2xl font-bold text-white">{stats.totalEntries}</p>
            </div>
            <div className="text-2xl">📝</div>
          </div>
        </div>

        {/* AI Suggestions Generated */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">AI Suggestions</p>
              <p className="text-2xl font-bold text-blue-400">{stats.aiSuggestionsGenerated}</p>
            </div>
            <div className="text-2xl">🤖</div>
          </div>
        </div>

        {/* AI Implementation Rate */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Implementation Rate</p>
              <p className="text-2xl font-bold text-green-400">{aiImplementationRate}%</p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
          <div className="mt-2 bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${aiImplementationRate}%` }}
            />
          </div>
        </div>

        {/* Top Tags Count */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Unique Tags</p>
              <p className="text-2xl font-bold text-purple-400">{stats.topTags.length}</p>
            </div>
            <div className="text-2xl">🏷️</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entries by Category */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
          <h3 className="text-sm font-medium text-gray-300 mb-4">📈 Entries by Category</h3>
          <div className="space-y-3">
            {Object.entries(stats.entriesByCategory).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{categoryIcons[category as keyof typeof categoryIcons] || '📄'}</span>
                  <span className="text-sm text-gray-300 capitalize">
                    {category.replace('-', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{count}</span>
                  <div className="w-16 bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        categoryColors[category as keyof typeof categoryColors]?.includes('blue') ? 'bg-blue-500' :
                        categoryColors[category as keyof typeof categoryColors]?.includes('purple') ? 'bg-purple-500' :
                        categoryColors[category as keyof typeof categoryColors]?.includes('green') ? 'bg-green-500' :
                        categoryColors[category as keyof typeof categoryColors]?.includes('yellow') ? 'bg-yellow-500' :
                        categoryColors[category as keyof typeof categoryColors]?.includes('red') ? 'bg-red-500' :
                        categoryColors[category as keyof typeof categoryColors]?.includes('orange') ? 'bg-orange-500' :
                        'bg-indigo-500'
                      }`}
                      style={{ 
                        width: `${Math.max(10, (count / Math.max(...Object.values(stats.entriesByCategory))) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Tags */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
          <h3 className="text-sm font-medium text-gray-300 mb-4">🏷️ Most Used Tags</h3>
          <div className="space-y-2">
            {stats.topTags.slice(0, 8).map((tag, index) => (
              <div key={tag.name} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">#{tag.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{tag.count}</span>
                  <div className="w-12 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.max(15, (tag.count / Math.max(...stats.topTags.map(t => t.count))) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Entries Preview */}
      {stats.recentEntries.length > 0 && (
        <div className="mt-6 bg-gray-900/50 rounded-lg p-4 border border-gray-600">
          <h3 className="text-sm font-medium text-gray-300 mb-4">🕒 Recent Activity</h3>
          <div className="space-y-2">
            {stats.recentEntries.slice(0, 3).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {categoryIcons[entry.category as keyof typeof categoryIcons] || '📄'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white truncate max-w-xs">
                      {entry.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(entry.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${categoryColors[entry.category]}`}>
                  {entry.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
