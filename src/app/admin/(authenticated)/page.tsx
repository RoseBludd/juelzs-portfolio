import Link from 'next/link';
import PortfolioService from '@/services/portfolio.service';
import AWSS3Service from '@/services/aws-s3.service';

export default async function AdminDashboard() {
  // Get overview data
  const portfolioService = PortfolioService.getInstance();
  const s3Service = AWSS3Service.getInstance();
  
  const [projects, videos, meetingGroups] = await Promise.all([
    portfolioService.getSystemProjects(),
    portfolioService.getLeadershipVideos(false),
    s3Service.getMeetingGroups(),
  ]);

  // Check architecture analysis status
  let analyzedProjectsCount = 0;
  try {
    for (const project of projects) {
      const hasAnalysis = await s3Service.hasArchitectureAnalysis(project.id);
      if (hasAnalysis) analyzedProjectsCount++;
    }
  } catch (error) {
    console.error('Error checking architecture analysis status:', error);
  }

  const stats = [
    {
      title: 'Total Projects',
      value: projects.length,
      icon: '💼',
      href: '/admin/projects',
    },
    {
      title: 'Leadership Videos', 
      value: videos.length,
      icon: '🎥',
      href: '/admin/meetings',
    },
    {
      title: 'Meeting Recordings',
      value: meetingGroups.length,
      icon: '📹',
      href: '/admin/meetings',
    },
    {
      title: 'Portfolio Relevant',
      value: meetingGroups.filter(m => m.isPortfolioRelevant).length,
      icon: '⭐',
      href: '/admin/meetings',
    },
    {
      title: 'Architecture Analysis',
      value: analyzedProjectsCount,
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
                {videos.filter(v => v.analysis).length} videos have leadership analysis
              </span>
            </div>
            <div className="flex items-center text-sm">
              <span className="mr-3">💼</span>
              <span className="text-gray-300">
                {projects.filter(p => p.source === 'github').length} projects from GitHub
              </span>
            </div>
            <div className="flex items-center text-sm">
              <span className="mr-3">📹</span>
              <span className="text-gray-300">
                {meetingGroups.filter(m => m.isPortfolioRelevant).length} portfolio-relevant meetings available
              </span>
            </div>
            <div className="flex items-center text-sm">
              <span className="mr-3">🏗️</span>
              <span className="text-gray-300">
                {analyzedProjectsCount} projects have architecture analysis
              </span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-700">
            <Link
              href="/admin/meetings"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              Manage meeting showcase selection →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 