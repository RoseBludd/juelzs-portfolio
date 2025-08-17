"use client";

import { IconGitBranch, IconClock, IconUsers, IconMessageCircle, IconDownload, IconTag, IconAlertTriangle, IconCheck, IconChevronDown, IconChevronUp, IconCode } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { CodeViewer } from './CodeViewer';

interface ModuleVersion {
  id: string;
  version: string;
  description?: string;
  changelog?: string;
  file_hash?: string;
  is_breaking_change: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  developer_name: string;
  developer_email: string;
  is_current: boolean;
  stats?: {
    total_checkouts: number;
    unique_users: number;
    active_checkouts: number;
    comment_count: number;
  };
  code_content?: string;
  file_paths?: string[];
}

interface VersionSelectorProps {
  moduleId: string;
  currentVersion?: string;
  onVersionSelect?: (version: string) => void;
  onCheckout?: (version: string) => void;
  showStats?: boolean;
}

export function VersionSelector({ 
  moduleId, 
  currentVersion, 
  onVersionSelect, 
  onCheckout,
  showStats = true 
}: VersionSelectorProps) {
  const [versions, setVersions] = useState<ModuleVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<string>(currentVersion || '');
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadVersions();
  }, [moduleId]);

  useEffect(() => {
    if (currentVersion) {
      setSelectedVersion(currentVersion);
    }
  }, [currentVersion]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ 
        moduleId,
        includeStats: showStats.toString()
      });

      const response = await fetch(`/api/registry/versions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setVersions(data.versions || []);
        
        // Auto-select current version if none selected
        if (!selectedVersion && data.versions?.length > 0) {
          const current = data.versions.find((v: ModuleVersion) => v.is_current);
          if (current) {
            setSelectedVersion(current.version);
          } else {
            setSelectedVersion(data.versions[0].version);
          }
        }
      } else {
        console.error('Failed to load versions:', data.error);
        toast.error('Failed to load module versions');
      }
    } catch (error) {
      console.error('Error loading versions:', error);
      toast.error('Failed to load module versions');
    } finally {
      setLoading(false);
    }
  };

  const handleVersionSelect = (version: string) => {
    setSelectedVersion(version);
    onVersionSelect?.(version);
  };

  const handleCheckout = (version: string) => {
    onCheckout?.(version);
  };

  const toggleExpanded = (version: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(version)) {
      newExpanded.delete(version);
      // Clear section state when collapsing
      const newSections = { ...expandedSections };
      delete newSections[version];
      setExpandedSections(newSections);
    } else {
      newExpanded.add(version);
      // Default to changelog section
      setExpandedSections(prev => ({ ...prev, [version]: 'changelog' }));
    }
    setExpandedVersions(newExpanded);
  };

  const toggleSection = (version: string, section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [version]: prev[version] === section ? '' : section
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  const parseVersion = (version: string) => {
    const parts = version.split('.').map(Number);
    return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 };
  };

  const compareVersions = (a: string, b: string) => {
    const versionA = parseVersion(a);
    const versionB = parseVersion(b);
    
    if (versionA.major !== versionB.major) return versionB.major - versionA.major;
    if (versionA.minor !== versionB.minor) return versionB.minor - versionA.minor;
    return versionB.patch - versionA.patch;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-20 h-4 bg-gray-600 rounded"></div>
              <div className="w-16 h-6 bg-gray-600 rounded"></div>
            </div>
            <div className="w-full h-8 bg-gray-600 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const sortedVersions = [...versions].sort((a, b) => compareVersions(a.version, b.version));

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <IconGitBranch size={18} className="text-purple-400" />
        <h4 className="text-white font-medium">
          Available Versions ({versions.length})
        </h4>
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-8">
          <IconGitBranch size={48} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 mb-2">No versions available</p>
          <p className="text-sm text-gray-500">
            This module hasn't been versioned yet
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedVersions.map((version) => {
            const isSelected = selectedVersion === version.version;
            const isExpanded = expandedVersions.has(version.version);
            
            return (
              <div
                key={version.id}
                className={`border rounded-lg transition-all ${
                  isSelected 
                    ? 'border-purple-500 bg-purple-900/20' 
                    : 'border-gray-600 bg-gray-700/30'
                }`}
              >
                {/* Version Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => handleVersionSelect(version.version)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        {/* Version Number */}
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded text-sm font-mono ${
                            version.is_current 
                              ? 'bg-green-600 text-white' 
                              : isSelected
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-600 text-gray-200'
                          }`}>
                            v{version.version}
                          </div>
                          
                          {version.is_current && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-900/30 border border-green-700/50 rounded text-xs text-green-300">
                              <IconCheck size={12} />
                              Current
                            </div>
                          )}
                          
                          {version.is_breaking_change && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-red-900/30 border border-red-700/50 rounded text-xs text-red-300">
                              <IconAlertTriangle size={12} />
                              Breaking
                            </div>
                          )}
                        </div>

                        {/* Version Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-white">by {version.developer_name}</span>
                            <span className="text-gray-400">•</span>
                            <div className="flex items-center gap-1 text-gray-400">
                              <IconClock size={12} />
                              <span>{formatDate(version.created_at)}</span>
                            </div>
                          </div>
                          
                          {version.description && (
                            <p className="text-gray-300 text-sm mt-1 line-clamp-1">
                              {version.description}
                            </p>
                          )}
                        </div>
                      </button>

                      {/* Stats */}
                      {showStats && version.stats && (
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          {version.stats.total_checkouts > 0 && (
                            <div className="flex items-center gap-1">
                              <IconDownload size={12} />
                              <span>{version.stats.total_checkouts}</span>
                            </div>
                          )}
                          {version.stats.unique_users > 0 && (
                            <div className="flex items-center gap-1">
                              <IconUsers size={12} />
                              <span>{version.stats.unique_users}</span>
                            </div>
                          )}
                          {version.stats.comment_count > 0 && (
                            <div className="flex items-center gap-1">
                              <IconMessageCircle size={12} />
                              <span>{version.stats.comment_count}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {onCheckout && (
                        <button
                          onClick={() => handleCheckout(version.version)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs transition-colors flex items-center gap-1"
                        >
                          <IconDownload size={12} />
                          Checkout
                        </button>
                      )}
                      
                      {(version.changelog || version.tags.length > 0) && (
                        <button
                          onClick={() => toggleExpanded(version.version)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-600 p-4 space-y-3">
                    {/* Section Tabs */}
                    <div className="flex gap-2 border-b border-gray-700 pb-2">
                      {version.changelog && (
                        <button
                          onClick={() => toggleSection(version.version, 'changelog')}
                          className={`px-3 py-1 text-xs rounded transition-colors ${
                            expandedSections[version.version] === 'changelog'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          Changelog
                        </button>
                      )}
                      
                      {version.code_content && (
                        <button
                          onClick={() => toggleSection(version.version, 'code')}
                          className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                            expandedSections[version.version] === 'code'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          <IconCode size={12} />
                          View Code
                        </button>
                      )}
                      
                      {version.tags.length > 0 && (
                        <button
                          onClick={() => toggleSection(version.version, 'tags')}
                          className={`px-3 py-1 text-xs rounded transition-colors ${
                            expandedSections[version.version] === 'tags'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          Tags
                        </button>
                      )}
                      
                      {version.file_hash && (
                        <button
                          onClick={() => toggleSection(version.version, 'hash')}
                          className={`px-3 py-1 text-xs rounded transition-colors ${
                            expandedSections[version.version] === 'hash'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          File Hash
                        </button>
                      )}
                    </div>

                    {/* Section Content */}
                    {expandedSections[version.version] === 'changelog' && version.changelog && (
                      <div>
                        <h5 className="text-white font-medium text-sm mb-2">Changelog</h5>
                        <div className="bg-gray-600/30 rounded p-3">
                          <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans">
                            {version.changelog}
                          </pre>
                        </div>
                      </div>
                    )}

                    {expandedSections[version.version] === 'code' && version.code_content && (
                      <div>
                        <h5 className="text-white font-medium text-sm mb-2">Code Content</h5>
                        <CodeViewer 
                          version={{
                            id: version.id,
                            version: version.version,
                            description: version.description || '',
                            code_content: version.code_content,
                            file_paths: version.file_paths,
                            developer_name: version.developer_name,
                            created_at: version.created_at
                          }}
                        />
                      </div>
                    )}

                    {expandedSections[version.version] === 'tags' && version.tags.length > 0 && (
                      <div>
                        <h5 className="text-white font-medium text-sm mb-2">Tags</h5>
                        <div className="flex flex-wrap gap-1">
                          {version.tags.map((tag, index) => (
                            <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-600/50 rounded text-xs text-gray-300">
                              <IconTag size={10} />
                              <span>{tag}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {expandedSections[version.version] === 'hash' && version.file_hash && (
                      <div>
                        <h5 className="text-white font-medium text-sm mb-2">File Hash</h5>
                        <code className="text-xs bg-gray-600/30 px-2 py-1 rounded text-gray-300 font-mono">
                          {version.file_hash}
                        </code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 