'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ServiceRecommendation from '@/components/ui/ServiceRecommendation';
import ContactService from '@/services/contact.service';

interface TabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ServiceTabs = ({ activeTab, setActiveTab }: TabsProps) => {
  const tabs = [
    { id: 'quick-start', label: 'Quick Start', icon: '⚡', description: '$150-450' },
    { id: 'professional', label: 'Professional', icon: '🎯', description: '$800-3,000' },
    { id: 'enterprise', label: 'Enterprise', icon: '🚀', description: '$2,000-15,000+' }
  ];

  return (
    <div className="flex flex-col sm:flex-row justify-center mb-12">
      <div className="inline-flex bg-gray-800/50 rounded-xl p-1 backdrop-blur-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <div className="text-left">
              <div className="text-sm font-semibold">{tab.label}</div>
              <div className="text-xs opacity-75">{tab.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState('quick-start');
  const contactService = ContactService.getInstance();
  const allServices = contactService.getConsultingServices();

  // Add the additional services based on skills
  const additionalServices = [
    {
      title: 'Code Review Session',
      description: 'Focused review of specific code sections with actionable feedback and best practices guidance.',
      duration: '1 hour',
      pricing: '$150-200',
      type: 'code-review' as const
    },
    {
      title: 'Performance Optimization',
      description: 'Quick assessment and optimization of application performance bottlenecks.',
      duration: '2-3 hours', 
      pricing: '$350-450',
      type: 'performance-optimization' as const
    },
    {
      title: 'Database Architecture Review',
      description: 'Specialized review of database design, queries, and optimization strategies.',
      duration: '1-2 days',
      pricing: '$800-1,200',
      type: 'database-review' as const
    },
    {
      title: 'CI/CD Pipeline Setup',
      description: 'Complete CI/CD pipeline design and implementation with automated testing and deployment.',
      duration: '3-5 days',
      pricing: '$1,500-2,500',
      type: 'cicd-setup' as const
    },
    {
      title: 'Legacy System Modernization',
      description: 'Strategic planning and execution for modernizing legacy systems with minimal business disruption.',
      duration: '2-4 weeks',
      pricing: '$5,000-8,000',
      type: 'legacy-modernization' as const
    },
    {
      title: 'Remote Team Management',
      description: 'Consulting on building and managing distributed technical teams across multiple time zones.',
      duration: '1-3 weeks',
      pricing: '$3,000-5,000',
      type: 'remote-team-management' as const
    }
  ];

  const allServicesWithAdditions = [...allServices, ...additionalServices];

  const serviceCategories = {
    'quick-start': allServicesWithAdditions.filter(s => 
      ['consultation', 'code-review', 'performance-optimization'].includes(s.type)
    ),
    'professional': allServicesWithAdditions.filter(s => 
      ['architecture-review', 'technical-audit', 'leadership-coaching', 'database-review', 'cicd-setup'].includes(s.type)
    ),
    'enterprise': allServicesWithAdditions.filter(s => 
      ['ai-implementation', 'system-design', 'team-coaching', 'legacy-modernization', 'remote-team-management', 'team-building', 'contracted-team'].includes(s.type)
    )
  };

  const tabContent = {
    'quick-start': {
      title: 'Quick Start Services',
      subtitle: 'Fast solutions for immediate needs',
      description: 'Perfect for quick assessments, rapid consultations, and focused problem-solving. Get expert guidance without a long-term commitment.',
      badge: 'QUICK START',
      badgeColor: 'bg-blue-500/20 text-blue-300'
    },
    'professional': {
      title: 'Professional Services',
      subtitle: 'Comprehensive technical solutions',
      description: 'In-depth analysis and strategic guidance for serious technical challenges. Includes detailed documentation and implementation guidance.',
      badge: 'PROFESSIONAL',
      badgeColor: 'bg-purple-500/20 text-purple-300'
    },
    'enterprise': {
      title: 'Enterprise Solutions',
      subtitle: 'Strategic transformation and long-term partnerships',
      description: 'Comprehensive solutions for large-scale challenges. Includes on-site engagement options and embedded team integration.',
      badge: 'ENTERPRISE',
      badgeColor: 'bg-green-500/20 text-green-300'
    }
  };

  const currentContent = tabContent[activeTab as keyof typeof tabContent];
  const currentServices = serviceCategories[activeTab as keyof typeof serviceCategories];

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Consulting <span className="gradient-text">Services</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-4xl mx-auto mb-8">
            Strategic consulting and guidance - never direct implementation. I provide the strategy, 
            architecture, and coaching. You choose how to implement: your team, build a permanent team (recommended), 
            or hire my premium team (expensive).
          </p>
        </div>

        {/* AI Service Recommendation */}
        <ServiceRecommendation />

        {/* Service Tabs */}
        <ServiceTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab Content */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentContent.badgeColor}`}>
                {currentContent.badge}
              </span>
            </div>
            <h2 className="text-3xl font-bold mb-4 text-white">{currentContent.title}</h2>
            <p className="text-lg text-gray-300 mb-2">{currentContent.subtitle}</p>
            <p className="text-gray-400 max-w-3xl mx-auto">{currentContent.description}</p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentServices.map((service, index) => (
              <Card key={index} className="h-full hover:shadow-xl transition-shadow duration-300">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentContent.badgeColor}`}>
                      {currentContent.badge}
                    </span>
                    <div className="text-2xl">
                      {activeTab === 'quick-start' ? '⚡' : activeTab === 'professional' ? '🎯' : '🚀'}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3 text-white">{service.title}</h3>
                  <p className="text-gray-400 mb-4 flex-grow text-sm leading-relaxed">{service.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-blue-400 text-sm font-medium">{service.duration}</span>
                        {service.pricing && (
                          <span className="text-green-400 text-sm font-bold">{service.pricing}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        href={`/services/${service.type}`}
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                      >
                        Learn More
                      </Button>
                      <Button 
                        href={`/contact?service=${service.type}`}
                        size="sm"
                        className="flex-1"
                      >
                        Get Started
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border-blue-500/20">
            <h2 className="text-2xl font-bold mb-4 text-white">Need Something Custom?</h2>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              If none of the standard services fit your unique situation, I can create a custom engagement 
              tailored specifically to your challenges and goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/contact" size="lg">
                Discuss Custom Solution
              </Button>
              <Button href="/leadership" variant="outline" size="lg">
                View Leadership Portfolio
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 