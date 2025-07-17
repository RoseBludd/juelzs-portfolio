'use client';

import { useState } from 'react';
import Card from './Card';
import { useRouter } from 'next/navigation';
import type { SystemProject } from '@/services/portfolio.service';
import type { ProjectPhoto } from '@/services/project-linking.service';

interface ProjectWithPhotos extends SystemProject {
  photos: ProjectPhoto[];
  featuredImage?: ProjectPhoto;
}

interface Category {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

interface ProjectsClientProps {
  projects: ProjectWithPhotos[];
  categories: Category[];
}

export default function ProjectsClient({ projects, categories }: ProjectsClientProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [loadingProject, setLoadingProject] = useState<string | null>(null);
  const router = useRouter();

  // Handle project navigation with loading state
  const handleProjectClick = (projectId: string) => {
    setLoadingProject(projectId);
    router.push(`/projects/${projectId}`);
  };

  // Filter projects by category
  const getFilteredProjects = () => {
    if (activeCategory === 'all') return projects;
    return projects.filter(p => p.category === activeCategory);
  };

  const filteredProjects = getFilteredProjects();
  const filteredWithImages = filteredProjects.filter(p => p.featuredImage);
  const filteredWithoutImages = filteredProjects.filter(p => !p.featuredImage);

  // Get business impact based on project type and role
  const getBusinessImpact = (project: ProjectWithPhotos) => {
    const impactMap: { [key: string]: string[] } = {
      'ai-callers-app': ['Automated customer outreach', 'Reduced manual calling by 80%'],
      'voice-personas-studio': ['Enhanced voice quality control', 'Streamlined voice production workflow'],
      'roofing-business-intelligence': ['Real-time damage analysis', 'Accelerated claim processing'],
      'dev-portal': ['Centralized task management', 'Improved development workflow efficiency'],
      'default-ai': ['AI-powered automation', 'Enhanced decision-making capabilities'],
      'default-leadership': ['Team collaboration tools', 'Streamlined project management'],
      'default-architecture': ['Scalable system design', 'Future-proof infrastructure'],
      'default-systems': ['Robust system integration', 'Optimized performance metrics']
    };

    return impactMap[project.id] || 
           impactMap[`default-${project.category}`] || 
           ['Production system in active use', 'Solving real business challenges'];
  };

  return (
    <>
      {/* Loading Overlay */}
      {loadingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/95 via-purple-900/95 to-black/95 backdrop-blur-sm" />
          
          {/* Loading Content */}
          <div className="relative z-10 text-center">
            {/* Animated Spinner */}
            <div className="mb-8">
              <div className="relative w-20 h-20 mx-auto">
                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/30"></div>
                {/* Spinning Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin"></div>
                {/* Inner Glow */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-sm"></div>
                {/* Center Dot */}
                <div className="absolute inset-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 animate-pulse"></div>
              </div>
            </div>

            {/* Loading Text */}
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-white">
                Loading Project
              </h3>
              <p className="text-blue-200 text-lg">
                {projects.find(p => p.id === loadingProject)?.title}
              </p>
              <div className="flex items-center justify-center gap-2 text-gray-300">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                </div>
                <span className="ml-2 text-sm">Analyzing architecture & generating insights</span>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="mt-8 max-w-sm mx-auto">
              <div className="space-y-2">
                {[
                  'Fetching repository data',
                  'Running AI analysis',
                  'Generating insights',
                  'Preparing visualization'
                ].map((step, index) => (
                  <div key={step} className="flex items-center gap-3 text-sm text-gray-300">
                    <div className={`w-2 h-2 rounded-full transition-colors duration-1000 ${
                      index === 0 ? 'bg-blue-400 animate-pulse' : 
                      index === 1 ? 'bg-purple-400 animate-pulse [animation-delay:1s]' :
                      index === 2 ? 'bg-blue-400 animate-pulse [animation-delay:2s]' :
                      'bg-gray-600'
                    }`}></div>
                    <span className={index <= 2 ? 'text-white' : ''}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="mb-12">
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((category) => {
            const categoryCount = category.id === 'all' 
              ? projects.length 
              : projects.filter(p => p.category === category.id).length;
            
            if (category.id !== 'all' && categoryCount === 0) return null;

            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`
                  flex items-center gap-3 px-6 py-3 rounded-full text-sm font-medium transition-all duration-200
                  ${activeCategory === category.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white border border-gray-600'
                  }
                `}
              >
                <span className="text-lg">{category.icon}</span>
                <span>{category.label}</span>
                <span className={`
                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${activeCategory === category.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-600 text-gray-300'
                  }
                `}>
                  {categoryCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category Description */}
        {activeCategory !== 'all' && (
          <div className="text-center mb-8">
            <p className="text-gray-400 text-lg">
              {categories.find(c => c.id === activeCategory)?.description}
            </p>
          </div>
        )}
      </div>

      {/* Projects with Images - Dribbble Style */}
      {filteredWithImages.length > 0 && (
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Visual Portfolio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredWithImages.map((project) => (
              <div 
                key={project.id} 
                onClick={() => handleProjectClick(project.id)}
                className="cursor-pointer"
              >
                <Card className={`group overflow-hidden hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 border-gray-700/50 hover:border-blue-500/30 ${
                  loadingProject === project.id ? 'opacity-75 scale-95' : ''
                }`}>
                  {/* Featured Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={project.featuredImage?.url || '/placeholder-image.png'}
                      alt={project.featuredImage?.alt || project.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity">
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                          <span className="text-green-400 text-xs font-medium">Live Production</span>
                        </div>
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        categories.find(c => c.id === project.category)?.color || 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {categories.find(c => c.id === project.category)?.icon} {categories.find(c => c.id === project.category)?.label}
                      </span>
                    </div>

                    {/* Photo Count Badge */}
                    {project.photos.length > 1 && (
                      <div className="absolute top-4 right-4">
                        <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white rounded-full text-xs font-medium">
                          +{project.photos.length - 1} more
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Project Info */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-2 mb-4">
                      {project.description}
                    </p>

                    {/* Impact Badge */}
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
                      <p className="text-green-400 text-xs font-medium">
                        {getBusinessImpact(project)[0]}
                      </p>
                    </div>

                    {/* Tech Stack - Simplified */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.techStack.slice(0, 3).map((tech, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 bg-gray-800/50 border border-gray-700/50 text-gray-300 rounded text-xs font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.techStack.length > 3 && (
                        <span className="px-2 py-1 bg-gray-700/30 text-gray-400 rounded text-xs">
                          +{project.techStack.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Role */}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="text-blue-400">👨‍💻</span>
                      <span>{project.role.split(' & ')[0]}</span>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects without Images - Compact List Style */}
      {filteredWithoutImages.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            {filteredWithImages.length > 0 ? 'More Projects' : 'Projects'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredWithoutImages.map((project) => (
              <div 
                key={project.id} 
                onClick={() => handleProjectClick(project.id)}
                className="cursor-pointer"
              >
                <Card className={`group p-6 hover:scale-[1.02] transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 border-gray-700/50 hover:border-blue-500/30 ${
                  loadingProject === project.id ? 'opacity-75 scale-95' : ''
                }`}>
                  {/* Project Header */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-lg">
                          {categories.find(c => c.id === project.category)?.icon || '⚙️'}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 rounded-full text-xs font-medium">
                            {project.language}
                          </span>
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Production Active"></span>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors leading-tight line-clamp-1">
                      {project.title}
                    </h3>
                    
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  </div>

                  {/* Key Impact */}
                  <div className="mb-4">
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3">
                      <p className="text-green-400 text-xs font-medium">
                        {getBusinessImpact(project)[0]}
                      </p>
                    </div>
                  </div>

                  {/* Tech Stack - Compact */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {project.techStack.slice(0, 4).map((tech, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 bg-gray-800/50 border border-gray-700/50 text-gray-300 rounded text-xs"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.techStack.length > 4 && (
                        <span className="px-2 py-1 bg-gray-700/30 text-gray-400 rounded text-xs">
                          +{project.techStack.length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Role */}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="text-blue-400">👨‍💻</span>
                    <span>{project.role.split(' & ')[0]}</span>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Projects Message */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-white mb-2">No Projects Found</h3>
          <p className="text-gray-300">
            No projects found in the {categories.find(c => c.id === activeCategory)?.label} category.
          </p>
        </div>
      )}
    </>
  );
} 