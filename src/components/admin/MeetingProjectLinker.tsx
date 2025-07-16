'use client';

import { useState, useEffect, useCallback } from 'react';
import { SystemProject } from '@/services/portfolio.service';
import PortfolioService from '@/services/portfolio.service';
import ProjectLinkingService, { ProjectVideoLink } from '@/services/project-linking.service';

interface MeetingProjectLinkerProps {
  meetingId: string;
  meetingTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onLinksUpdated?: () => void;
}

const linkTypes = [
  { value: 'architecture-review', label: 'Architecture Review', icon: '🏗️' },
  { value: 'technical-discussion', label: 'Technical Discussion', icon: '🔍' },
  { value: 'mentoring-session', label: 'Mentoring Session', icon: '💡' },
  { value: 'demo', label: 'Demo/Showcase', icon: '📈' },
  { value: 'planning', label: 'Planning Session', icon: '📋' },
] as const;

export default function MeetingProjectLinker({ 
  meetingId, 
  meetingTitle, 
  isOpen, 
  onClose, 
  onLinksUpdated 
}: MeetingProjectLinkerProps) {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedLinkType, setSelectedLinkType] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [projects, setProjects] = useState<SystemProject[]>([]);
  const [existingLinks, setExistingLinks] = useState<ProjectVideoLink[]>([]);

  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      // Load real projects from PortfolioService
      const portfolioService = PortfolioService.getInstance();
      const systemProjects = await portfolioService.getSystemProjects();
      setProjects(systemProjects);

      // Load existing video links from ProjectLinkingService
      const projectLinkingService = ProjectLinkingService.getInstance();
      const allLinks: ProjectVideoLink[] = [];

      for (const project of systemProjects) {
        try {
          const projectResources = await projectLinkingService.getProjectResources(project.id);
          const videoLinks = projectResources.linkedVideos.filter(link => link.videoId === meetingId);
          allLinks.push(...videoLinks);
        } catch {
          // Project has no resources yet, that's fine
        }
      }

      setExistingLinks(allLinks);
      console.log(`📋 Loaded ${systemProjects.length} projects and ${allLinks.length} existing links for meeting ${meetingId}`);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [meetingId]);

  // Load projects and existing links when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, meetingId, loadData]);

  // Auto-detect link type based on meeting title/content
  const detectLinkType = useCallback((projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 'technical-discussion';

    const meetingLower = meetingTitle.toLowerCase();
    const projectLower = project.title.toLowerCase();

    // Architecture-related keywords
    if (meetingLower.includes('architecture') || meetingLower.includes('design') || 
        projectLower.includes('architecture') || project.category === 'architecture') {
      return 'architecture-review';
    }

    // Review-related keywords  
    if (meetingLower.includes('review') || meetingLower.includes('feedback')) {
      return 'technical-discussion';
    }

    // Planning-related keywords
    if (meetingLower.includes('planning') || meetingLower.includes('roadmap') || 
        meetingLower.includes('sprint')) {
      return 'planning';
    }

    // Mentoring-related keywords
    if (meetingLower.includes('mentoring') || meetingLower.includes('coaching') || 
        meetingLower.includes('guidance')) {
      return 'mentoring-session';
    }

    // Demo-related keywords
    if (meetingLower.includes('demo') || meetingLower.includes('showcase') || 
        meetingLower.includes('presentation')) {
      return 'demo';
    }

    // Default to technical discussion
    return 'technical-discussion';
  }, [projects, meetingTitle]);

  // Auto-set link type when project is selected
  useEffect(() => {
    if (selectedProject) {
      const autoType = detectLinkType(selectedProject);
      setSelectedLinkType(autoType);
    }
  }, [selectedProject, detectLinkType]);

  const handleLinkProject = async () => {
    if (!selectedProject || !selectedLinkType) return;

    setIsLoading(true);
    try {
      const projectLinkingService = ProjectLinkingService.getInstance();
      
      await projectLinkingService.linkVideoToProject(selectedProject, {
        projectId: selectedProject,
        videoId: meetingId,
        videoTitle: meetingTitle,
        linkType: selectedLinkType as ProjectVideoLink['linkType'],
        relevanceScore: 8, // Default relevance score
        notes: description.trim() || `Linked from admin interface - ${meetingTitle}`
      });

      console.log(`✅ Successfully linked "${meetingTitle}" to project ${selectedProject}`);
      
      await loadData(); // Refresh links
      setSelectedProject('');
      setSelectedLinkType('');
      setDescription('');
      onLinksUpdated?.();
      
    } catch (error) {
      console.error('Error linking meeting to project:', error);
      alert(`Failed to link meeting to project: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlinkProject = async (projectId: string) => {
    try {
      const projectLinkingService = ProjectLinkingService.getInstance();
      const success = await projectLinkingService.unlinkVideoFromProject(projectId, meetingId);

      if (success) {
        console.log(`✅ Successfully unlinked "${meetingTitle}" from project ${projectId}`);
        await loadData(); // Refresh links
        onLinksUpdated?.();
      } else {
        throw new Error('Link not found');
      }
    } catch (error) {
      console.error('Error unlinking meeting from project:', error);
      alert(`Failed to unlink meeting from project: ${error}`);
    }
  };

  const getProjectTitle = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.title || 'Unknown Project';
  };

  const getLinkTypeLabel = (linkType: string) => {
    const type = linkTypes.find(t => t.value === linkType);
    return type ? `${type.icon} ${type.label}` : linkType;
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter(project => 
    !existingLinks.some(link => link.projectId === project.id) &&
    (project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     project.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-medium text-white">Link Meeting to Projects</h3>
            <p className="text-sm text-gray-400 mt-1">
              {meetingTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {isLoadingData ? (
          <div className="p-6 text-center">
            <div className="animate-spin text-2xl mb-2">⏳</div>
            <p className="text-gray-400">Loading projects and links...</p>
          </div>
        ) : (
          <>
            {/* Existing Links */}
            {existingLinks.length > 0 && (
              <div className="p-6 border-b border-gray-700">
                <h4 className="text-md font-medium text-white mb-4">
                  Current Project Links ({existingLinks.length})
                </h4>
                <div className="space-y-3">
                  {existingLinks.map((link) => (
                    <div key={`${link.projectId}-${link.videoId}`} className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          {getProjectTitle(link.projectId)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {getLinkTypeLabel(link.linkType)} • Relevance: {link.relevanceScore}/10
                        </div>
                        {link.notes && (
                          <div className="text-sm text-gray-500 mt-1">{link.notes}</div>
                        )}
                      </div>
                      <button
                        onClick={() => handleUnlinkProject(link.projectId)}
                        className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Link */}
            <div className="p-6">
              <h4 className="text-md font-medium text-white mb-4">
                Add New Project Link
              </h4>

              {/* Search Projects */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Projects
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by project name or category..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Project Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Project ({filteredProjects.length} available)
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a project...</option>
                    {filteredProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title} ({project.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Link Type
                  </label>
                  <select
                    value={selectedLinkType}
                    onChange={(e) => setSelectedLinkType(e.target.value)}
                    disabled={!selectedProject}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="">Choose link type...</option>
                    {linkTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe how this meeting relates to the project..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLinkProject}
                  disabled={!selectedProject || !selectedLinkType || isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {isLoading ? '⏳ Linking...' : 'Link Project'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 