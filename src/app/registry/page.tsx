'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Image from 'next/image';

interface ModuleRegistryItem {
  id: string;
  name: string;
  type: 'ui_components' | 'api_endpoints' | 'functions' | 'database' | 'tests' | 'pages' | 'styles' | 'config' | 'tools' | 'documentation';
  description: string;
  category: string;
  moduleCount: number;
  technologies: string[];
  created_at: Date;
  updated_at: Date;
  metadata?: {
    preview?: string;
    examples?: string[];
    dependencies?: string[];
    usage?: string;
  };
}

interface RegistryStats {
  totalModules: number;
  modulesByType: Record<string, number>;
  recentModules: ModuleRegistryItem[];
  topCategories: Array<{ name: string; count: number }>;
}

const moduleTypeConfig = {
  ui_components: {
    label: 'UI Components',
    description: 'User Interface Components',
    icon: '🎨',
    color: 'bg-blue-500/20 text-blue-300',
  },
  api_endpoints: {
    label: 'API Endpoints',
    description: 'API Endpoints and Routes',
    icon: '🔗',
    color: 'bg-green-500/20 text-green-300',
  },
  functions: {
    label: 'Utility Functions',
    description: 'Utility Functions and Helpers',
    icon: '⚙️',
    color: 'bg-purple-500/20 text-purple-300',
  },
  database: {
    label: 'Database Models',
    description: 'Database Models and Migrations',
    icon: '🗄️',
    color: 'bg-yellow-500/20 text-yellow-300',
  },
  tests: {
    label: 'Test Suites',
    description: 'Unit and Integration Tests',
    icon: '🧪',
    color: 'bg-red-500/20 text-red-300',
  },
  pages: {
    label: 'Page Components',
    description: 'Page Components and Layouts',
    icon: '📄',
    color: 'bg-indigo-500/20 text-indigo-300',
  },
  styles: {
    label: 'Styles',
    description: 'CSS and Styling Components',
    icon: '🎭',
    color: 'bg-pink-500/20 text-pink-300',
  },
  config: {
    label: 'Configuration',
    description: 'Configuration Files',
    icon: '🔧',
    color: 'bg-gray-500/20 text-gray-300',
  },
  tools: {
    label: 'Development Tools',
    description: 'Development Tools and Scripts',
    icon: '🛠️',
    color: 'bg-orange-500/20 text-orange-300',
  },
  documentation: {
    label: 'Documentation',
    description: 'Documentation and Guides',
    icon: '📚',
    color: 'bg-cyan-500/20 text-cyan-300',
  }
};

export default function RegistryPage() {
  const [modules, setModules] = useState<ModuleRegistryItem[]>([]);
  const [stats, setStats] = useState<RegistryStats>({
    totalModules: 0,
    modulesByType: {},
    recentModules: [],
    topCategories: []
  });
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    poolSize: 1,
    environment: 'development'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/registry');
        const result = await response.json();
        
        if (result.success) {
          setModules(result.data.modules);
          setStats(result.data.stats);
          setConnectionStatus(result.data.connectionStatus);
        } else {
          // Use fallback data from API response
          setModules(result.data.modules);
          setStats(result.data.stats);
          setConnectionStatus(result.data.connectionStatus);
        }
      } catch (error) {
        console.error('Failed to load registry data:', error);
        // Set default fallback data
        setStats({
          totalModules: 270,
          modulesByType: {},
          recentModules: [],
          topCategories: [
            { name: 'Frontend', count: 67 },
            { name: 'Backend', count: 51 },
            { name: 'Core', count: 85 },
            { name: 'Data', count: 57 },
            { name: 'Testing', count: 10 }
          ]
        });
        setConnectionStatus({
          connected: false,
          poolSize: 1,
          environment: 'development'
        });
      }
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          {/* Profile Image */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-blue-500/30 shadow-2xl ring-4 ring-blue-500/20">
                <Image
                  src="/profile-logo.png"
                  alt="Juelzs - Module Registry Creator"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover object-center scale-125"
                />
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 blur-xl -z-10"></div>
            </div>
          </div>

          <div className="mb-6">
            <span className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
              Living Development Infrastructure
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Module <span className="gradient-text">Registry</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-4xl mx-auto mb-8">
            I ensure all my developers make everything <span className="text-blue-400 font-semibold">modular</span> and <span className="text-purple-400 font-semibold">reusable</span>. 
            This registry represents my commitment to keeping every component, function, and system as a 
            building block for future development. Everything is catalogued, documented, and ready for reuse.
          </p>

          {/* Philosophy Quote */}
          <blockquote className="text-lg italic text-gray-300 mb-12 max-w-3xl mx-auto border-l-4 border-blue-500 pl-6">
            &quot;If it&apos;s built once, it should work everywhere. If it&apos;s modular, it&apos;s an asset. 
            If it&apos;s in the registry, it&apos;s ready to scale.&quot;
          </blockquote>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {stats.totalModules}
            </div>
            <div className="text-sm text-gray-400">Total Modules</div>
            <div className="text-xs text-gray-500 mt-1">Catalogued & Ready</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {Object.keys(stats.modulesByType).length}
            </div>
            <div className="text-sm text-gray-400">Module Types</div>
            <div className="text-xs text-gray-500 mt-1">Organized Categories</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {stats.topCategories.length}
            </div>
            <div className="text-sm text-gray-400">Categories</div>
            <div className="text-xs text-gray-500 mt-1">Development Areas</div>
          </Card>
          <Card className="text-center">
            <div className={`text-3xl font-bold mb-2 ${connectionStatus.connected ? 'text-green-400' : 'text-orange-400'}`}>
              {connectionStatus.connected ? 'Live' : 'Active'}
            </div>
            <div className="text-sm text-gray-400">Registry Status</div>
            <div className="text-xs text-gray-500 mt-1">Always Available</div>
          </Card>
        </div>

        {/* Modularity Principles */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            <span className="gradient-text">Modularity</span> Principles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-400 text-2xl">🧩</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Build Once, Use Everywhere</h3>
              <p className="text-gray-400 text-sm">
                Every component is designed to be platform-agnostic and reusable across different projects and contexts.
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-400 text-2xl">📦</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Documented & Discoverable</h3>
              <p className="text-gray-400 text-sm">
                All modules include comprehensive documentation, usage examples, and dependency information.
              </p>
            </Card>

            <Card className="text-center p-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-green-400 text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Version-Controlled Assets</h3>
              <p className="text-gray-400 text-sm">
                Every module is tracked, versioned, and maintained to ensure reliability and backward compatibility.
              </p>
            </Card>
          </div>
        </div>

        {/* Module Types Distribution */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Registry <span className="gradient-text">Inventory</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {modules.map((module) => {
              const config = moduleTypeConfig[module.type];
              
              return (
                <Card key={module.id} className="relative hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{config.icon}</div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{module.name}</h3>
                        <p className="text-sm text-gray-400">{module.description}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                      {config.label}
                    </span>
                  </div>

                  {/* Module Count */}
                  <div className="mb-4 text-center">
                    <div className="text-4xl font-bold text-white mb-2">
                      {module.moduleCount}
                    </div>
                    <div className="text-sm text-gray-400">
                      {module.moduleCount === 1 ? 'module' : 'modules'} in {module.category}
                    </div>
                  </div>

                  {/* Technologies */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {module.technologies.slice(0, 4).map((tech, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs">
                          {tech}
                        </span>
                      ))}
                      {module.technologies.length > 4 && (
                        <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs">
                          +{module.technologies.length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reusability Status */}
                  <div className="text-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-2"></div>
                    <div className="text-xs text-green-400 font-medium">Ready for Reuse</div>
                  </div>

                  {/* Last Updated */}
                  <div className="absolute top-4 right-4 opacity-50">
                    <div className="text-xs text-gray-500">
                      {new Date(module.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Development Impact */}
        <div className="bg-gray-800/30 rounded-2xl p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">
              Development <span className="gradient-text">Impact</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              This modular approach has transformed how my team builds and delivers software
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">85%</div>
              <div className="text-sm text-gray-400 mb-1">Faster Development</div>
              <div className="text-xs text-gray-500">Through component reuse</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">60%</div>
              <div className="text-sm text-gray-400 mb-1">Fewer Bugs</div>
              <div className="text-xs text-gray-500">Battle-tested components</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">40%</div>
              <div className="text-sm text-gray-400 mb-1">Reduced Maintenance</div>
              <div className="text-xs text-gray-500">Centralized updates</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">
            Building <span className="gradient-text">Tomorrow&apos;s</span> Systems Today
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            This registry represents more than code—it&apos;s a philosophy of sustainable development 
            where every piece contributes to the whole.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/projects" size="lg">
              See Projects Built With This Approach
            </Button>
            <Button href="/philosophy" variant="outline" size="lg">
              Learn My Development Philosophy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 