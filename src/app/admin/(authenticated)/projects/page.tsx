'use client';

import { useState, useEffect } from 'react';
import GitHubService, { GitHubProject } from '@/services/github.service';
import AWSS3Service, { PhotoUploadResult } from '@/services/aws-s3.service';
import ProjectLinkingService, { ProjectPhoto, ProjectVideoLink, ProjectResources } from '@/services/project-linking.service';
import PortfolioService, { LeadershipVideo } from '@/services/portfolio.service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface ProjectWithResources extends GitHubProject {
  resources: ProjectResources;
  photos: ProjectPhoto[];
  linkedVideos: ProjectVideoLink[];
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithResources[]>([]);
  const [videos, setVideos] = useState<LeadershipVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectWithResources | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLinkVideoModalOpen, setIsLinkVideoModalOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ loading: boolean; message: string }>({ loading: false, message: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const githubService = GitHubService.getInstance();
      const portfolioService = PortfolioService.getInstance();
      const projectLinkingService = ProjectLinkingService.getInstance();

      const [githubProjects, portfolioVideos] = await Promise.all([
        githubService.getPortfolioProjects(),
        portfolioService.getLeadershipVideos(false), // Get videos without analysis for faster loading
      ]);

      // Load resources for each project
      const projectsWithResources = await Promise.all(
        githubProjects.map(async (project) => {
          const resources = await projectLinkingService.getProjectResources(project.id);
          return {
            ...project,
            resources,
            photos: resources.photos,
            linkedVideos: resources.linkedVideos,
          };
        })
      );

      setProjects(projectsWithResources);
      setVideos(portfolioVideos);
    } catch (error) {
      console.error('Error loading projects data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectSelect = (project: ProjectWithResources) => {
    setSelectedProject(project);
  };

  const handleOpenUploadModal = () => {
    if (!selectedProject) return;
    setIsUploadModalOpen(true);
  };

  const handleOpenLinkVideoModal = () => {
    if (!selectedProject) return;
    setIsLinkVideoModalOpen(true);
  };

  const handlePhotoUpload = async (file: File, category: ProjectPhoto['category']) => {
    if (!selectedProject) return;

    setUploadStatus({ loading: true, message: 'Uploading photo...' });

    try {
      const s3Service = AWSS3Service.getInstance();
      const projectLinkingService = ProjectLinkingService.getInstance();

      const result = await s3Service.uploadProjectPhoto(selectedProject.id, file, category);

      if (result.success && result.photo) {
        // Add photo to project linking service
        await projectLinkingService.addPhotoToProject(selectedProject.id, {
          projectId: result.photo.projectId,
          filename: result.photo.filename,
          s3Key: result.photo.s3Key,
          url: result.photo.url,
          category: result.photo.category,
          order: selectedProject.photos.length,
          size: result.photo.size,
        });

        setUploadStatus({ loading: false, message: 'Photo uploaded successfully!' });
        
        // Refresh data
        await loadData();
        
        // Close modal after a short delay
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setUploadStatus({ loading: false, message: '' });
        }, 1500);
      } else {
        setUploadStatus({ loading: false, message: result.error || 'Upload failed' });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setUploadStatus({ loading: false, message: 'Upload failed. Please try again.' });
    }
  };

  const handleVideoLink = async (videoId: string, linkType: ProjectVideoLink['linkType'], relevanceScore: number, notes?: string) => {
    if (!selectedProject) return;

    try {
      const projectLinkingService = ProjectLinkingService.getInstance();
      const video = videos.find(v => v.id === videoId);
      
      if (!video) return;

      await projectLinkingService.linkVideoToProject(selectedProject.id, {
        projectId: selectedProject.id,
        videoId,
        videoTitle: video.title,
        linkType,
        relevanceScore,
        notes,
      });

      // Refresh data
      await loadData();
      setIsLinkVideoModalOpen(false);
    } catch (error) {
      console.error('Error linking video:', error);
    }
  };

  const handleRemovePhoto = async (photoId: string) => {
    if (!selectedProject || !confirm('Are you sure you want to delete this photo?')) return;

    try {
      const projectLinkingService = ProjectLinkingService.getInstance();
      const s3Service = AWSS3Service.getInstance();
      
      const photo = selectedProject.photos.find(p => p.id === photoId);
      if (!photo) return;

      // Delete from S3
      await s3Service.deleteProjectPhoto(photo.s3Key);
      
      // Remove from project linking
      await projectLinkingService.removePhotoFromProject(selectedProject.id, photoId);

      // Refresh data
      await loadData();
    } catch (error) {
      console.error('Error removing photo:', error);
    }
  };

  const handleUnlinkVideo = async (videoId: string) => {
    if (!selectedProject || !confirm('Are you sure you want to unlink this video?')) return;

    try {
      const projectLinkingService = ProjectLinkingService.getInstance();
      await projectLinkingService.unlinkVideoFromProject(selectedProject.id, videoId);

      // Refresh data
      await loadData();
    } catch (error) {
      console.error('Error unlinking video:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <h3 className="text-lg font-medium text-white mb-2">Loading projects...</h3>
          <p className="text-gray-300">Fetching project data and resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Project Management</h1>
        <p className="mt-2 text-gray-300">
          Manage your project photos, link leadership videos, and organize project showcases.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg shadow p-4 border border-gray-700">
          <div className="text-2xl font-bold text-blue-400">{projects.length}</div>
          <div className="text-sm text-gray-300">Total Projects</div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow p-4 border border-gray-700">
          <div className="text-2xl font-bold text-green-400">
            {projects.reduce((acc, p) => acc + p.photos.length, 0)}
          </div>
          <div className="text-sm text-gray-300">Photos Uploaded</div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow p-4 border border-gray-700">
          <div className="text-2xl font-bold text-purple-400">
            {projects.reduce((acc, p) => acc + p.linkedVideos.length, 0)}
          </div>
          <div className="text-sm text-gray-300">Video Links</div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow p-4 border border-gray-700">
          <div className="text-2xl font-bold text-orange-400">
            {projects.filter(p => p.photos.length > 0 || p.linkedVideos.length > 0).length}
          </div>
          <div className="text-sm text-gray-300">Projects Enhanced</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects List */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg shadow border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Projects</h2>
              <p className="text-sm text-gray-300 mt-1">Select a project to manage</p>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedProject?.id === project.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="font-medium">{project.title}</div>
                  <div className="text-sm opacity-75 mt-1">
                    {project.photos.length} photos • {project.linkedVideos.length} videos
                  </div>
                  <div className="text-xs opacity-50 mt-1">{project.category}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="lg:col-span-2">
          {selectedProject ? (
            <div className="space-y-6">
              {/* Project Info */}
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedProject.title}</h2>
                    <p className="text-gray-300 mt-2">{selectedProject.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">
                        {selectedProject.category}
                      </span>
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm">
                        {selectedProject.language}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleOpenUploadModal}>
                      📸 Add Photos
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleOpenLinkVideoModal}>
                      🔗 Link Videos
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Photos */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Project Photos ({selectedProject.photos.length})
                </h3>
                {selectedProject.photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedProject.photos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.url || '/placeholder-image.png'}
                          alt={photo.alt || photo.filename}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                        <div className="mt-2">
                          <div className="text-sm font-medium text-white">{photo.category}</div>
                          <div className="text-xs text-gray-400">{photo.filename}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">📸</div>
                    <p>No photos uploaded yet</p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-3"
                      onClick={handleOpenUploadModal}
                    >
                      Upload First Photo
                    </Button>
                  </div>
                )}
              </Card>

              {/* Linked Videos */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Linked Videos ({selectedProject.linkedVideos.length})
                </h3>
                {selectedProject.linkedVideos.length > 0 ? (
                  <div className="space-y-3">
                    {selectedProject.linkedVideos.map((link) => (
                      <div key={link.id} className="flex items-start justify-between p-3 bg-gray-700 rounded-lg">
                        <div>
                          <div className="font-medium text-white">{link.videoTitle}</div>
                          <div className="text-sm text-gray-300 mt-1">
                            Type: {link.linkType} • Relevance: {link.relevanceScore}/10
                          </div>
                          {link.notes && (
                            <div className="text-sm text-gray-400 mt-1">{link.notes}</div>
                          )}
                        </div>
                        <button
                          onClick={() => handleUnlinkVideo(link.videoId)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                        >
                          Unlink
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">🎥</div>
                    <p>No videos linked yet</p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-3"
                      onClick={handleOpenLinkVideoModal}
                    >
                      Link First Video
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">📁</div>
              <h3 className="text-lg font-medium text-white mb-2">Select a Project</h3>
              <p className="text-gray-300">Choose a project from the list to manage its photos and videos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Photo Upload Modal */}
      {isUploadModalOpen && selectedProject && (
        <PhotoUploadModal
          project={selectedProject}
          onUpload={handlePhotoUpload}
          onClose={() => setIsUploadModalOpen(false)}
          uploadStatus={uploadStatus}
        />
      )}

      {/* Video Link Modal */}
      {isLinkVideoModalOpen && selectedProject && (
        <VideoLinkModal
          project={selectedProject}
          videos={videos}
          onLink={handleVideoLink}
          onClose={() => setIsLinkVideoModalOpen(false)}
        />
      )}
    </div>
  );
}

// Photo Upload Modal Component
interface PhotoUploadModalProps {
  project: ProjectWithResources;
  onUpload: (file: File, category: ProjectPhoto['category']) => void;
  onClose: () => void;
  uploadStatus: { loading: boolean; message: string };
}

function PhotoUploadModal({ project, onUpload, onClose, uploadStatus }: PhotoUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<ProjectPhoto['category']>('screenshot');
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile, category);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Upload Photo</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project: {project.title}
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProjectPhoto['category'])}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="screenshot">Screenshot</option>
              <option value="interface">Interface</option>
              <option value="mobile">Mobile View</option>
              <option value="diagram">Architecture Diagram</option>
              <option value="demo">Demo/Showcase</option>
              <option value="analytics">Analytics/Dashboard</option>
            </select>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver
                ? 'border-blue-400 bg-blue-400/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div>
                <div className="text-green-400 mb-2">✓</div>
                <div className="text-white font-medium">{selectedFile.name}</div>
                <div className="text-gray-400 text-sm">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-2">📸</div>
                <div className="text-gray-300 mb-2">
                  Drag & drop an image or{' '}
                  <label className="text-blue-400 cursor-pointer hover:text-blue-300">
                    browse
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="text-gray-400 text-sm">JPG, PNG, WebP, or GIF</div>
              </div>
            )}
          </div>

          {uploadStatus.message && (
            <div className={`text-sm ${uploadStatus.loading ? 'text-blue-400' : 'text-green-400'}`}>
              {uploadStatus.message}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1"
              disabled={uploadStatus.loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpload}
              className="flex-1"
              disabled={!selectedFile || uploadStatus.loading}
            >
              {uploadStatus.loading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Video Link Modal Component
interface VideoLinkModalProps {
  project: ProjectWithResources;
  videos: LeadershipVideo[];
  onLink: (videoId: string, linkType: ProjectVideoLink['linkType'], relevanceScore: number, notes?: string) => void;
  onClose: () => void;
}

function VideoLinkModal({ project, videos, onLink, onClose }: VideoLinkModalProps) {
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [linkType, setLinkType] = useState<ProjectVideoLink['linkType']>('technical-discussion');
  const [relevanceScore, setRelevanceScore] = useState<number>(7);
  const [notes, setNotes] = useState<string>('');

  // Filter out already linked videos
  const availableVideos = videos.filter(
    video => !project.linkedVideos.some(link => link.videoId === video.id)
  );

  const handleSubmit = () => {
    if (selectedVideoId) {
      onLink(selectedVideoId, linkType, relevanceScore, notes || undefined);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Link Video to Project</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project: {project.title}
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Video</label>
            <select
              value={selectedVideoId}
              onChange={(e) => setSelectedVideoId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="">Choose a video...</option>
              {availableVideos.map((video) => (
                <option key={video.id} value={video.id}>
                  {video.title} ({video.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Link Type</label>
            <select
              value={linkType}
              onChange={(e) => setLinkType(e.target.value as ProjectVideoLink['linkType'])}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="technical-discussion">Technical Discussion</option>
              <option value="architecture-review">Architecture Review</option>
              <option value="mentoring-session">Mentoring Session</option>
              <option value="demo">Demo/Showcase</option>
              <option value="planning">Planning Session</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Relevance Score: {relevanceScore}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={relevanceScore}
              onChange={(e) => setRelevanceScore(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why is this video relevant to this project?"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              className="flex-1"
              disabled={!selectedVideoId}
            >
              Link Video
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 