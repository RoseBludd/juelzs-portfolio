'use client';

import { useState, ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  content: ReactNode;
  badge?: string | number;
}

interface ProjectTabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  className?: string;
}

export default function ProjectTabs({ tabs, defaultTab, className = '' }: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }
              `}
            >
              {tab.icon && <span className="text-lg">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`
                  inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${activeTab === tab.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                  }
                `}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTabContent}
      </div>
    </div>
  );
} 