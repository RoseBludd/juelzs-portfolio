import Link from 'next/link';
import PortfolioService from '@/services/portfolio.service';

export default async function AdminDashboard() {
  // Get data but avoid heavy analysis operations
  const portfolioService = PortfolioService.getInstance();
  
  // Get basic project data (this is fast - just GitHub API call)
  const projects = await portfolioService.getSystemArchitectures();
  
  // DON'T call getLatestLeadershipVideos() - this triggers heavy video analysis
  // Use static count for videos to avoid analysis pipeline
  const videoCount = 15; // Static estimate to avoid triggering analysis
  
  // Use static estimates for S3-dependent data to avoid slow S3 calls
  const staticStats = {
    meetingRecordings: 82, // From logs - avoid S3.getMeetingGroups()
    portfolioRelevant: 35, // Estimated 40% relevance rate
    analyzedProjects: Math.floor(projects.length * 0.7), // Based on actual project count
  };

  const stats = [
    {
      title: 'Total Projects',
      value: projects.length,
      icon: '💼',
      href: '/admin/projects',
    },
    {
      title: 'Leadership Videos', 
      value: videoCount,
      icon: '🎥',
      href: '/admin/meetings',
    },
    {
      title: 'Meeting Recordings',
      value: staticStats.meetingRecordings,
      icon: '📹',
      href: '/admin/meetings',
    },
    {
      title: 'Portfolio Relevant',
      value: staticStats.portfolioRelevant,
      icon: '⭐',
      href: '/admin/meetings',
    },
    {
      title: 'Architecture Analysis',
      value: staticStats.analyzedProjects,
      icon: '🏗️',
      href: '/admin/architecture',
    },
  ];

  const quickActions = [
    {
      title: 'Manage Meetings',
      description: 'Select and showcase S3 meetings for your portfolio',
      icon: '🎥',
      href: '/admin/meetings',
      color: 'bg-blue-500',
    },
    {
      title: 'Project Management',
      description: 'Add photos and link videos to projects',
      icon: '💼',
      href: '/admin/projects', 
      color: 'bg-green-500',
    },
    {
      title: 'Photo Gallery',
      description: 'Upload and manage project photos in S3',
      icon: '📸',
      href: '/admin/photos',
      color: 'bg-purple-500',
    },
    {
      title: 'Video Links',
      description: 'Link leadership videos to specific projects',
      icon: '🔗',
      href: '/admin/links',
      color: 'bg-orange-500',
    },
    {
      title: 'Architecture Analysis',
      description: 'Manage AI-powered architecture analysis for projects',
      icon: '🏗️',
      href: '/admin/architecture',
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Portfolio Admin Dashboard
        </h1>
        <p className="mt-2 text-gray-300">
          Manage your portfolio content, meetings, and project showcases
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 hover:bg-gray-750 hover:shadow-xl transition-all"
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">{stat.icon}</div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-300">{stat.title}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 hover:bg-gray-750 hover:shadow-xl transition-all"
            >
              <div className="flex items-start">
                <div className={`${action.color} text-white p-3 rounded-lg mr-4`}>
                  <span className="text-xl">{action.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">
                    {action.title}
                  </h3>
                  <p className="text-gray-300 mt-1">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Preview */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            Recent Portfolio Activity
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center text-sm">
              <span className="mr-3">🎥</span>
              <span className="text-gray-300">
                {Math.floor(videoCount * 0.8)} videos have leadership analysis
              </span>
            </div>
            <div className="flex items-center text-sm">
              <span className="mr-3">💼</span>
              <span className="text-gray-300">
                {projects.length} projects from GitHub
              </span>
            </div>
            <div className="flex items-center text-sm">
              <span className="mr-3">📹</span>
              <span className="text-gray-300">
                {staticStats.portfolioRelevant} portfolio-relevant meetings available
              </span>
            </div>
            <div className="flex items-center text-sm">
              <span className="mr-3">🏗️</span>
              <span className="text-gray-300">
                {staticStats.analyzedProjects} projects have architecture analysis
              </span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <Link
                href="/admin/meetings"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                Manage meeting showcase selection →
              </Link>
              <span className="text-xs text-gray-500">
                📊 Static estimates - refresh in individual admin pages
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 