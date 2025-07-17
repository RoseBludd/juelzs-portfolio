'use client';

import { useState, useEffect } from 'react';
import MeetingToggle from '@/components/admin/MeetingToggle';
import MeetingProjectLinker from '@/components/admin/MeetingProjectLinker';
import Button from '@/components/ui/Button';

interface MeetingGroup {
  id: string;
  title: string;
  dateRecorded: string;
  participants: string[];
  category?: string;
  isPortfolioRelevant?: boolean;
  insights?: {
    keyMoments?: Array<{
      timestamp: string;
      type: string;
      description: string;
    }>;
    duration?: string;
    description?: string;
  };
  video?: { s3Key: string };
  transcript?: { s3Key: string };
  recap?: { s3Key: string };
}

interface MeetingsResponse {
  success: boolean;
  meetings: MeetingGroup[];
  stats: {
    total: number;
    portfolioRelevant: number;
    withVideo: number;
    withTranscript: number;
    withRecap: number;
  };
}

export default function AdminMeetingsPage() {
  const [meetingGroups, setMeetingGroups] = useState<MeetingGroup[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    portfolioRelevant: 0,
    withVideo: 0,
    withTranscript: 0,
    withRecap: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingGroup | null>(null);
  const [isLinkerOpen, setIsLinkerOpen] = useState(false);
  const [refreshingVideos, setRefreshingVideos] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'relevance'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'relevant' | 'recent'>('all');
  const [refreshingOverallAnalysis, setRefreshingOverallAnalysis] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading meetings from admin API...');
      const response = await fetch('/api/admin/meetings');
      const data: MeetingsResponse = await response.json();

      if (data.success) {
        setMeetingGroups(data.meetings);
        setStats(data.stats);
        console.log(`✅ Loaded ${data.meetings.length} meetings`);
      } else {
        console.error('Failed to load meetings:', data);
      }
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshVideoAnalysis = async (meetingId: string) => {
    const meeting = meetingGroups.find(m => m.id === meetingId);
    const meetingTitle = meeting?.title || 'Unknown Meeting';
    
    setRefreshingVideos(prev => new Set(prev).add(meetingId));
    
    try {
      console.log(`🔄 Starting analysis refresh for: ${meetingTitle}`);
      
      const response = await fetch('/api/admin/meetings/refresh-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: `s3-${meetingId}` })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Video analysis refreshed for: ${meetingTitle} - New rating: ${result.analysis?.overallRating || 'N/A'}/10`);
        // Refresh the meetings list to show updated analysis
        await loadMeetings();
        
        // Show success notification to user
        alert(`✅ Analysis refreshed for "${meetingTitle}"\nNew rating: ${result.analysis?.overallRating || 'N/A'}/10`);
      } else {
        console.error('Failed to refresh video analysis:', result.error);
        alert(`❌ Failed to refresh analysis for "${meetingTitle}": ${result.error}`);
      }
    } catch (error) {
      console.error('Error refreshing video analysis:', error);
      alert(`❌ Error refreshing analysis for "${meetingTitle}": ${error}`);
    } finally {
      setRefreshingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(meetingId);
        return newSet;
      });
    }
  };

  const refreshAllAnalyses = async () => {
    try {
      const response = await fetch('/api/admin/meetings/refresh-analysis', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ All analyses refreshed successfully');
        // Reload meetings to get updated analysis data
        await loadMeetings();
      } else {
        console.error('Failed to refresh analyses:', data.error);
      }
    } catch (error) {
      console.error('Error refreshing analyses:', error);
    }
  };

  const refreshOverallAnalysis = async () => {
    try {
      setRefreshingOverallAnalysis(true);
      console.log('🔄 Refreshing overall leadership analysis...');
      
      const response = await fetch('/api/admin/leadership/refresh-overall-analysis', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Overall leadership analysis refreshed successfully');
        console.log(`📊 New overall rating: ${data.analysis.overallRating}/10`);
        console.log(`📊 Sessions analyzed: ${data.analysis.totalSessionsAnalyzed}`);
      } else {
        console.error('Failed to refresh overall analysis:', data.error);
      }
    } catch (error) {
      console.error('Error refreshing overall analysis:', error);
    } finally {
      setRefreshingOverallAnalysis(false);
    }
  };

  const handleOpenLinker = (meeting: MeetingGroup) => {
    setSelectedMeeting(meeting);
    setIsLinkerOpen(true);
  };

  const handleCloseLinker = () => {
    setSelectedMeeting(null);
    setIsLinkerOpen(false);
  };

  const handleLinksUpdated = () => {
    console.log('Links updated for meeting:', selectedMeeting?.id);
  };

  // Filter and sort meetings
  const getFilteredAndSortedMeetings = () => {
    let filtered = [...meetingGroups];

    // Apply filters
    switch (filterBy) {
      case 'relevant':
        filtered = filtered.filter(m => m.isPortfolioRelevant);
        break;
      case 'recent':
        // Show meetings from July 2025 (most recent ones)
        filtered = filtered.filter(m => {
          const date = new Date(m.dateRecorded);
          return date.getMonth() === 6 && date.getFullYear() === 2025; // July 2025
        });
        break;
      default:
        // Show all
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'relevance':
        filtered.sort((a, b) => {
          if (a.isPortfolioRelevant && !b.isPortfolioRelevant) return -1;
          if (!a.isPortfolioRelevant && b.isPortfolioRelevant) return 1;
          return new Date(b.dateRecorded).getTime() - new Date(a.dateRecorded).getTime();
        });
        break;
      default: // 'date'
        filtered.sort((a, b) => new Date(b.dateRecorded).getTime() - new Date(a.dateRecorded).getTime());
        break;
    }

    return filtered;
  };

  const filteredMeetings = getFilteredAndSortedMeetings();

  // Group meetings for better display with manual showcase priority
  const groupedMeetings = filteredMeetings.reduce((acc, meeting) => {
    let category: string;
    
    // Override category for manually showcased meetings
    if (meeting.isPortfolioRelevant && meeting.category === 'skip') {
      category = 'manual-showcase';
    } else if (meeting.isPortfolioRelevant) {
      category = meeting.category || 'uncategorized';
    } else {
      category = meeting.category || 'uncategorized';
    }
    
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(meeting);
    return acc;
  }, {} as Record<string, MeetingGroup[]>);

  const categoryLabels = {
    'manual-showcase': '🎯 Manual Showcase',
    'architecture-review': 'Architecture Reviews',
    'mentoring-session': 'Mentoring Sessions', 
    'technical-discussion': 'Technical Discussions',
    'leadership-moment': 'Leadership Moments',
    'skip': 'Skipped (Administrative)',
    'uncategorized': 'Other Meetings',
  };

  // Check if meeting is recent (July 2025)
  const isRecentMeeting = (dateRecorded: string) => {
    const date = new Date(dateRecorded);
    return date.getMonth() === 6 && date.getFullYear() === 2025; // July 2025
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <h3 className="text-lg font-medium text-white mb-2">
            Loading meetings...
          </h3>
          <p className="text-gray-300">
            Fetching meeting data from S3...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Meeting Management</h1>
            <p className="mt-2 text-gray-300">
              Select which S3 meetings to showcase in your portfolio. Recent meetings highlighted for easy selection.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={loadMeetings}
            >
              🔄 Refresh List
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={refreshAllAnalyses}
              disabled={refreshingVideos.size > 0}
            >
              🔄 Refresh All Analysis
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={refreshOverallAnalysis}
              disabled={refreshingOverallAnalysis}
            >
              {refreshingOverallAnalysis ? '⏳ Generating...' : '📊 Refresh Overall Analysis'}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg shadow p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
          <div className="text-sm text-gray-300">Total Meetings</div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.portfolioRelevant}</div>
          <div className="text-sm text-gray-300">Showcased</div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.withVideo}</div>
          <div className="text-sm text-gray-300">With Video</div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.withTranscript}</div>
          <div className="text-sm text-gray-300">With Transcript</div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-orange-400">{stats.withRecap}</div>
          <div className="text-sm text-gray-300">With Recap</div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow p-4 border border-gray-700 text-center">
          <div className="text-2xl font-bold text-cyan-400">{refreshingVideos.size}</div>
          <div className="text-sm text-gray-300">Analyzing</div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3">
                     <select 
             value={filterBy} 
             onChange={(e) => setFilterBy(e.target.value as 'all' | 'relevant' | 'recent')}
             className="px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600"
           >
            <option value="all">All Meetings ({meetingGroups.length})</option>
            <option value="relevant">Portfolio Relevant ({stats.portfolioRelevant})</option>
            <option value="recent">Recent (July 2025)</option>
          </select>
          
                     <select 
             value={sortBy} 
             onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'relevance')}
             className="px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600"
           >
            <option value="date">Sort by Date (Newest First)</option>
            <option value="title">Sort by Title</option>
            <option value="relevance">Sort by Relevance</option>
          </select>
        </div>

        <div className="text-sm text-gray-400">
          Showing {filteredMeetings.length} of {meetingGroups.length} meetings
        </div>
      </div>

      {/* Meeting Categories */}
      {Object.keys(groupedMeetings).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedMeetings)
            .sort(([a], [b]) => {
              // Show manual showcase first, then other categories
              if (a === 'manual-showcase') return -1;
              if (b === 'manual-showcase') return 1;
              if (a === 'skip') return 1; // Show skip last
              if (b === 'skip') return -1;
              return a.localeCompare(b);
            })
            .map(([category, meetings]) => (
            <div key={category} className="bg-gray-800 rounded-lg shadow border border-gray-700">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">
                  {categoryLabels[category as keyof typeof categoryLabels] || category}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} • {meetings.filter(m => m.isPortfolioRelevant).length} showcased
                </p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {meetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        isRecentMeeting(meeting.dateRecorded) 
                          ? 'border-blue-500 bg-blue-500/5' 
                          : 'border-gray-600'
                      } ${
                        meeting.isPortfolioRelevant 
                          ? 'bg-green-500/5' 
                          : 'hover:bg-gray-700/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-white">
                              {meeting.title}
                            </h3>
                            {isRecentMeeting(meeting.dateRecorded) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                🕒 Recent
                              </span>
                            )}
                            <MeetingToggle 
                              meetingId={meeting.id}
                              isRelevant={meeting.isPortfolioRelevant || false}
                              onToggleComplete={() => {
                                console.log('Meeting toggle completed, refreshing list...');
                                loadMeetings();
                              }}
                            />
                          </div>
                          
                          <div className="text-sm text-gray-400 mb-2">
                            <div className="flex flex-wrap gap-4">
                              <span>📅 {meeting.dateRecorded}</span>
                              <span>👥 {meeting.participants.join(', ')}</span>
                              {meeting.insights?.duration && (
                                <span>⏱️ {meeting.insights.duration}</span>
                              )}
                            </div>
                          </div>

                          {meeting.insights?.description && (
                            <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                              {meeting.insights.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {meeting.video && (
                              <span className="flex items-center gap-1">
                                🎥 Video Available
                              </span>
                            )}
                            {meeting.transcript && (
                              <span className="flex items-center gap-1">
                                📝 Transcript Available
                              </span>
                            )}
                            {meeting.recap && (
                              <span className="flex items-center gap-1">
                                📋 Recap Available
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {meeting.isPortfolioRelevant && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                              ✅ Showcased
                            </span>
                          )}
                          
                          <div className="flex flex-col gap-1">
                            <button 
                              onClick={() => handleOpenLinker(meeting)}
                              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              🔗 Link to Projects
                            </button>
                            
                            {meeting.transcript && (
                              <button 
                                onClick={() => refreshVideoAnalysis(meeting.id)}
                                disabled={refreshingVideos.has(meeting.id)}
                                className="text-sm text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title={`Refresh analysis for: ${meeting.title}`}
                              >
                                {refreshingVideos.has(meeting.id) ? '⏳ Analyzing...' : '🔄 Refresh Analysis'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📹</div>
          <h3 className="text-lg font-medium text-white mb-2">
            No meetings found
          </h3>
          <p className="text-gray-400">
            {meetingGroups.length > 0 
              ? 'No meetings match your current filter criteria.' 
              : 'No meeting recordings were found in your S3 bucket.'}
          </p>
        </div>
      )}

      {/* Meeting Project Linker Modal */}
      {selectedMeeting && (
        <MeetingProjectLinker
          meetingId={selectedMeeting.id}
          meetingTitle={selectedMeeting.title}
          isOpen={isLinkerOpen}
          onClose={handleCloseLinker}
          onLinksUpdated={handleLinksUpdated}
        />
      )}
    </div>
  );
}
