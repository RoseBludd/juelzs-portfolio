'use client';

import { useState, useEffect } from 'react';
import GitHubService, { GitHubProject } from '@/services/github.service';
import AWSS3Service from '@/services/aws-s3.service';
import ProjectLinkingService, { ProjectPhoto } from '@/services/project-linking.service';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface PhotoWithProject extends ProjectPhoto {
  project: GitHubProject;
}

interface UploadResult {
  success: boolean;
  filename: string;
  error?: string;
}

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<PhotoWithProject[]>([]);
  const [projects, setProjects] = useState<GitHubProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'project' | 'category'>('date');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithProject | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const githubService = GitHubService.getInstance();
      const projectLinkingService = ProjectLinkingService.getInstance();

      const githubProjects = await githubService.getPortfolioProjects();
      setProjects(githubProjects);

      // Load all photos from all projects
      const allPhotos: PhotoWithProject[] = [];
      
      for (const project of githubProjects) {
        const resources = await projectLinkingService.getProjectResources(project.id);
        const projectPhotos = resources.photos.map(photo => ({
          ...photo,
          project
        }));
        allPhotos.push(...projectPhotos);
      }

      setPhotos(allPhotos);
    } catch (error) {
      console.error('Error loading photos data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePhoto = async (photo: PhotoWithProject) => {
    if (!confirm(`Are you sure you want to delete this photo from ${photo.project.title}?`)) return;

    try {
      const s3Service = AWSS3Service.getInstance();
      const projectLinkingService = ProjectLinkingService.getInstance();

      // Delete from S3
      await s3Service.deleteProjectPhoto(photo.s3Key);
      
      // Remove from project linking
      await projectLinkingService.removePhotoFromProject(photo.projectId, photo.id);

      // Refresh data
      await loadData();
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const handleUpdatePhotoMetadata = async (photo: PhotoWithProject, updates: Partial<Pick<ProjectPhoto, 'alt' | 'category' | 'order'>>) => {
    try {
      const projectLinkingService = ProjectLinkingService.getInstance();
      await projectLinkingService.updatePhotoMetadata(photo.projectId, photo.id, updates);
      
      // Refresh data
      await loadData();
    } catch (error) {
      console.error('Error updating photo metadata:', error);
    }
  };

  const handleBulkUpload = async (projectId: string, files: File[], category: ProjectPhoto['category']) => {
    const s3Service = AWSS3Service.getInstance();
    const projectLinkingService = ProjectLinkingService.getInstance();

    const results = [];
    for (const file of files) {
      try {
        const result = await s3Service.uploadProjectPhoto(projectId, file, category);
        if (result.success && result.photo) {
          await projectLinkingService.addPhotoToProject(projectId, {
            projectId: result.photo.projectId,
            filename: result.photo.filename,
            s3Key: result.photo.s3Key,
            url: result.photo.url,
            category: result.photo.category,
            order: 0,
            size: result.photo.size,
          });
          results.push({ success: true, filename: file.name });
        } else {
          results.push({ success: false, filename: file.name, error: result.error });
        }
      } catch {
        results.push({ success: false, filename: file.name, error: 'Upload failed' });
      }
    }

    await loadData();
    return results;
  };

  // Filter and sort photos
  const filteredPhotos = photos
    .filter(photo => {
      if (selectedCategory !== 'all' && photo.category !== selectedCategory) return false;
      if (selectedProject !== 'all' && photo.projectId !== selectedProject) return false;
      if (searchQuery && !photo.filename.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !photo.project.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !photo.alt?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        case 'project':
          return a.project.title.localeCompare(b.project.title);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'screenshot', label: 'Screenshots' },
    { value: 'interface', label: 'Interface' },
    { value: 'mobile', label: 'Mobile Views' },
    { value: 'diagram', label: 'Diagrams' },
    { value: 'demo', label: 'Demos' },
    { value: 'analytics', label: 'Analytics' },
  ];

  const stats = {
    total: photos.length,
    screenshots: photos.filter(p => p.category === 'screenshot').length,
    interfaces: photos.filter(p => p.category === 'interface').length,
    mobile: photos.filter(p => p.category === 'mobile').length,
    diagrams: photos.filter(p => p.category === 'diagram').length,
    demos: photos.filter(p => p.category === 'demo').length,
    analytics: photos.filter(p => p.category === 'analytics').length,
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <h3 className="text-lg font-medium text-white mb-2">Loading photo gallery...</h3>
          <p className="text-gray-300">Fetching photos from all projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Photo Gallery</h1>
            <p className="mt-2 text-gray-300">
              Manage all project photos, organize by category, and maintain your portfolio showcase.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsUploadModalOpen(true)}
          >
            📸 Bulk Upload
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
          <div className="text-sm text-gray-300">Total Photos</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.screenshots}</div>
          <div className="text-sm text-gray-300">Screenshots</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.interfaces}</div>
          <div className="text-sm text-gray-300">Interfaces</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">{stats.mobile}</div>
          <div className="text-sm text-gray-300">Mobile</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-pink-400">{stats.diagrams}</div>
          <div className="text-sm text-gray-300">Diagrams</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.demos}</div>
          <div className="text-sm text-gray-300">Demos</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">{stats.analytics}</div>
          <div className="text-sm text-gray-300">Analytics</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search photos, projects, or descriptions..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="all">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'project' | 'category')}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="date">Upload Date</option>
              <option value="project">Project Name</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Photo Grid */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Photos ({filteredPhotos.length})
        </h2>
        <div className="text-sm text-gray-400">
          Showing {filteredPhotos.length} of {photos.length} photos
        </div>
      </div>

      {filteredPhotos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredPhotos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden group">
              <div className="relative">
                <img
                  src={photo.url || '/placeholder-image.png'}
                  alt={photo.alt || photo.filename}
                  className="w-full h-48 object-cover cursor-pointer transition-transform group-hover:scale-105"
                  onClick={() => {
                    setSelectedPhoto(photo);
                    setIsDetailModalOpen(true);
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPhoto(photo);
                        setIsDetailModalOpen(true);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo);
                      }}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="text-sm font-medium text-white mb-1">{photo.project.title}</div>
                <div className="text-xs text-gray-400 mb-2">{photo.category}</div>
                <div className="text-xs text-gray-500 truncate">{photo.filename}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(photo.uploadedAt).toLocaleDateString()}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📸</div>
          <h3 className="text-lg font-medium text-white mb-2">No Photos Found</h3>
          <p className="text-gray-300 mb-6">
            {photos.length === 0 
              ? "No photos have been uploaded yet. Start building your portfolio showcase!"
              : "No photos match your current filters. Try adjusting your search criteria."
            }
          </p>
          {photos.length === 0 && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsUploadModalOpen(true)}
            >
              Upload First Photos
            </Button>
          )}
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isUploadModalOpen && (
        <BulkUploadModal
          projects={projects}
          onUpload={handleBulkUpload}
          onClose={() => setIsUploadModalOpen(false)}
        />
      )}

      {/* Photo Detail Modal */}
      {isDetailModalOpen && selectedPhoto && (
        <PhotoDetailModal
          photo={selectedPhoto}
          onUpdate={handleUpdatePhotoMetadata}
          onDelete={handleDeletePhoto}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedPhoto(null);
          }}
        />
      )}
    </div>
  );
}

// Bulk Upload Modal Component
interface BulkUploadModalProps {
  projects: GitHubProject[];
  onUpload: (projectId: string, files: File[], category: ProjectPhoto['category']) => Promise<UploadResult[]>;
  onClose: () => void;
}

function BulkUploadModal({ projects, onUpload, onClose }: BulkUploadModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [category, setCategory] = useState<ProjectPhoto['category']>('screenshot');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedProjectId || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const results = await onUpload(selectedProjectId, selectedFiles, category);
      setUploadResults(results);
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Bulk upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Bulk Photo Upload</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="">Select a project...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectPhoto['category'])}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="screenshot">Screenshots</option>
                <option value="interface">Interface</option>
                <option value="mobile">Mobile Views</option>
                <option value="diagram">Diagrams</option>
                <option value="demo">Demos</option>
                <option value="analytics">Analytics</option>
              </select>
            </div>
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
            <div className="text-4xl mb-2">📸</div>
            <div className="text-gray-300 mb-2">
              Drag & drop images or{' '}
              <label className="text-blue-400 cursor-pointer hover:text-blue-300">
                browse
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
            <div className="text-gray-400 text-sm">Support for JPG, PNG, WebP, and GIF</div>
          </div>

          {selectedFiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Selected Files ({selectedFiles.length})
              </label>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                    <div>
                      <div className="text-white text-sm">{file.name}</div>
                      <div className="text-gray-400 text-xs">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadResults.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Upload Results</label>
              {uploadResults.map((result, index) => (
                <div
                  key={index}
                  className={`text-sm p-2 rounded ${
                    result.success ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'
                  }`}
                >
                  {result.success ? '✓' : '✗'} {result.filename}
                  {result.error && <span className="ml-2 text-xs">({result.error})</span>}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1" disabled={uploading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpload}
              className="flex-1"
              disabled={!selectedProjectId || selectedFiles.length === 0 || uploading}
            >
              {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Photos`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Photo Detail Modal Component
interface PhotoDetailModalProps {
  photo: PhotoWithProject;
  onUpdate: (photo: PhotoWithProject, updates: Partial<Pick<ProjectPhoto, 'alt' | 'category' | 'order'>>) => void;
  onDelete: (photo: PhotoWithProject) => void;
  onClose: () => void;
}

function PhotoDetailModal({ photo, onUpdate, onDelete, onClose }: PhotoDetailModalProps) {
  const [alt, setAlt] = useState(photo.alt || '');
  const [category, setCategory] = useState(photo.category);
  const [order, setOrder] = useState(photo.order);

  const handleSave = () => {
    onUpdate(photo, { alt, category, order });
    onClose();
  };

  const handleDelete = () => {
    onDelete(photo);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Photo Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <img
              src={photo.url || '/placeholder-image.png'}
              alt={photo.alt || photo.filename}
              className="w-full rounded-lg"
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Project</label>
              <div className="px-3 py-2 bg-gray-700 rounded text-white">
                {photo.project.title}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Filename</label>
              <div className="px-3 py-2 bg-gray-700 rounded text-white font-mono text-sm">
                {photo.filename}
              </div>
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

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Alt Text (for accessibility)
              </label>
              <textarea
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Describe what's shown in this image..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Order
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                min="0"
              />
              <div className="text-xs text-gray-400 mt-1">
                Lower numbers appear first in galleries
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
              <div>
                <div className="font-medium">Size</div>
                <div>{(photo.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <div>
                <div className="font-medium">Uploaded</div>
                <div>{new Date(photo.uploadedAt).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} className="flex-1">
                Save Changes
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete} className="bg-red-600 border-red-600 hover:bg-red-700">
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 