'use client';

import { useState, useEffect } from 'react';
import PortfolioService, { LeadershipVideo } from '@/services/portfolio.service';
import GitHubService, { GitHubProject } from '@/services/github.service';
import AWSS3Service from '@/services/aws-s3.service';
import ProjectLinkingService, { ProjectVideoLink } from '@/services/project-linking.service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface MeetingWithLinkInfo extends LeadershipVideo {
  projectLinks: ProjectVideoLink[];
  suggestedProjects?: GitHubProject[];
}

export default function AdminLinksPage() {
  const [meetings, setMeetings] = useState<MeetingWithLinkInfo[]>([]);
  const [projects, setProjects] = useState<GitHubProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'linked' | 'unlinked'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔄 Loading admin links page data...');
      
      const githubService = GitHubService.getInstance();
      const portfolioService = PortfolioService.getInstance();
      const projectLinkingService = ProjectLinkingService.getInstance();
      
      // Load data in parallel
      const [allMeetings, githubProjects] = await Promise.all([
        portfolioService.getLeadershipVideos(false), // No analysis for faster loading
        githubService.getPortfolioProjects(), // This gets 24+ projects like other admin pages
      ]);

      console.log(`📁 Loaded ${githubProjects.length} GitHub projects`);
      console.log(`🎥 Loaded ${allMeetings.length} total meetings`);

      // Get meeting groups to check portfolio relevance from S3
      const s3Service = AWSS3Service.getInstance();
      const meetingGroups = await s3Service.getMeetingGroups();
      
      // Filter to only show showcased meetings (portfolio relevant)
      const showcasedMeetings = allMeetings.filter((meeting: LeadershipVideo) => {
        if (meeting.source === 'manual') {
          return true; // Manual meetings are always showcased
        }
        
        // For S3 meetings, check the meeting group's portfolio relevance
        const meetingId = meeting.id.replace('s3-', ''); // Remove s3- prefix
        const meetingGroup = meetingGroups.find(group => group.id === meetingId);
        return meetingGroup?.isPortfolioRelevant || false;
      });
      
      console.log(`📋 Found ${showcasedMeetings.length} showcased meetings from ${allMeetings.length} total`);
      
      // Add link information to each meeting by checking all projects
      const meetingsWithLinks: MeetingWithLinkInfo[] = await Promise.all(
        showcasedMeetings.map(async (meeting: LeadershipVideo) => {
          // Find all projects that have this video linked
          const allLinks: ProjectVideoLink[] = [];
          
          for (const project of githubProjects) {
            try {
              const projectResources = await projectLinkingService.getProjectResources(project.id);
              const videoLinks = projectResources.linkedVideos.filter(
                (link: ProjectVideoLink) => link.videoId === meeting.id
              );
              allLinks.push(...videoLinks);
                         } catch {
               // Project has no resources yet, that's fine
             }
          }
          
          if (allLinks.length > 0) {
            console.log(`🔗 Meeting "${meeting.title}" has ${allLinks.length} project links`);
          }
          
          return {
            ...meeting,
            projectLinks: allLinks
          };
        })
      );

      console.log(`✅ Processed ${meetingsWithLinks.length} meetings with link info`);
      console.log(`📊 ${meetingsWithLinks.filter(m => m.projectLinks.length > 0).length} meetings are linked to projects`);

      setMeetings(meetingsWithLinks);
      setProjects(githubProjects);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const linkVideoToProject = async (videoId: string, projectId: string, linkType: ProjectVideoLink['linkType']) => {
    try {
      const projectLinkingService = ProjectLinkingService.getInstance();
      const meeting = meetings.find(m => m.id === videoId);
      
      if (!meeting) {
        console.error('Meeting not found:', videoId);
        return;
      }

      await projectLinkingService.linkVideoToProject(projectId, {
        projectId,
        videoId,
        videoTitle: meeting.title,
        linkType,
        relevanceScore: 8, // Default score
        notes: `Linked from admin interface - demonstrates ${linkType.replace('-', ' ')}`
      });

      console.log(`✅ Successfully linked ${meeting.title} to project ${projectId}`);
      
      // Reload data to show updated links
      await loadData();
    } catch (error) {
      console.error('Error linking video to project:', error);
    }
  };

  const filteredMeetings = meetings.filter((meeting: MeetingWithLinkInfo) => {
    switch (filter) {
      case 'linked':
        return meeting.projectLinks.length > 0;
      case 'unlinked':
        return meeting.projectLinks.length === 0;
      default:
        return true;
    }
  });

  const linkedCount = meetings.filter(m => m.projectLinks.length > 0).length;
  const unlinkedCount = meetings.filter(m => m.projectLinks.length === 0).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-lg">Loading meeting links...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Project Links</h1>
          <p className="text-gray-300">
            Link showcased meeting videos to specific projects. These videos will appear in the individual project pages.
          </p>
        </div>

        {/* Stats & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-400">{meetings.length}</div>
            <div className="text-sm text-gray-400">Total Showcased</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-400">{linkedCount}</div>
            <div className="text-sm text-gray-400">Linked to Projects</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-orange-400">{unlinkedCount}</div>
            <div className="text-sm text-gray-400">Awaiting Links</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-purple-400">{projects.length}</div>
            <div className="text-sm text-gray-400">Available Projects</div>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All ({meetings.length})
          </Button>
          <Button
            onClick={() => setFilter('linked')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'linked'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Linked ({linkedCount})
          </Button>
          <Button
            onClick={() => setFilter('unlinked')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'unlinked'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Suggestions ({unlinkedCount})
          </Button>
        </div>

        {/* Meetings List */}
        {filteredMeetings.length > 0 ? (
          <div className="space-y-6">
            {filteredMeetings.map((meeting: MeetingWithLinkInfo) => (
              <Card key={meeting.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{meeting.title}</h3>
                      <span className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-sm">
                        {meeting.type}
                      </span>
                      {meeting.projectLinks.length > 0 && (
                        <span className="px-2 py-1 bg-green-900 text-green-200 rounded text-sm">
                          {meeting.projectLinks.length} Link{meeting.projectLinks.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-gray-400 text-sm mb-3">
                      {meeting.duration} • {new Date(meeting.dateRecorded).toLocaleDateString()}
                    </div>

                    {/* Show existing links */}
                    {meeting.projectLinks.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">Connected Projects:</h4>
                        <div className="space-y-1">
                          {meeting.projectLinks.map((link: ProjectVideoLink, index: number) => {
                            const project = projects.find(p => p.id === link.projectId);
                            return (
                              <div key={`${link.projectId}-${index}`} className="flex items-center gap-2 text-sm">
                                <span className="text-blue-400">→</span>
                                <span className="text-white font-medium">
                                  {project?.title || link.projectId}
                                </span>
                                <span className="text-gray-500">({link.linkType})</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Show suggestions for unlinked meetings */}
                    {meeting.projectLinks.length === 0 && (
                      <div className="mb-4">
                        <div className="text-orange-400 text-sm mb-2">
                          💡 This showcased meeting could be linked to demonstrate technical work
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {projects.slice(0, 3).map((project: GitHubProject) => (
                            <Button
                              key={project.id}
                              onClick={() => linkVideoToProject(meeting.id, project.id, 'technical-discussion')}
                              className="px-3 py-1 bg-blue-600/50 hover:bg-blue-600 text-blue-200 rounded text-sm"
                            >
                              Link to {project.title.substring(0, 20)}...
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                      {meeting.projectLinks.length > 0 ? 'Manage Links' : 'Add Link'}
                    </Button>
                    <Button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg">
                      View Meeting
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="text-gray-400 text-lg">
              {filter === 'linked' && 'No meetings are currently linked to projects'}
              {filter === 'unlinked' && 'All showcased meetings are already linked!'}
              {filter === 'all' && 'No showcased meetings found'}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
} 