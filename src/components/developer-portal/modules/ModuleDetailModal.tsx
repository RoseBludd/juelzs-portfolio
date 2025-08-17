"use client";

import {
  IconX,
  IconCircleCheck,
  IconCircle,
  IconClock,
  IconTag,
  IconAlertTriangle,
  IconLink,
  IconNetwork,
  IconVideo,
  IconCode,
  IconCheck,
  IconPlus,
  IconSettings,
  IconShield,
  IconDatabase,
  IconBolt,
  IconGitBranch,
  IconEdit,
  IconTrash,
  IconExternalLink,
  IconHistory,
  IconFileText,
  IconEye,
  IconUsers,
  IconListDetails,
  IconUpload,
  IconCopy
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface TaskModule {
  id: string;
  name: string;
  description: string;
  file_path: string;
  estimated_hours: number;
  priority: string;
  status: string;
  completion_percentage: number;
  tags: string[];
  module_type: string;
  module_icon: string;
  module_color: string;
  dependency_count: number;
  submission_count: number;
  update_count: number;
  url?: string;
  loom_video_url?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: {
    implementationNotes?: string;
    codeSnippets?: { language: string; code: string; description?: string }[];
    loom_video_url?: string;
    loom_video_title?: string;
    loom_video_description?: string;
    pre_conditions?: BooleanCheck[];
    post_conditions?: BooleanCheck[];
  };
}

interface BooleanCheck {
  id?: string;
  name: string;
  description: string;
  check_type: 'validation' | 'authentication' | 'authorization' | 'data_integrity' | 'performance' | 'availability' | 'custom';
  condition_code: string;
  expected_result: boolean;
  is_critical: boolean;
}

interface RelatedModule {
  id: string;
  name: string;
  module_type: string;
  module_color: string;
  relationship_type: 'testing' | 'dependency' | 'related' | 'component_family' | 'video_demo' | 'required' | 'optional';
  relationship_reason: string;
  source?: 'auto' | 'manual';
  relationship_id?: string;
}

interface ModuleScribe {
  id: string;
  title: string;
  scribe_url: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface ModuleUpdate {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface ModuleDetailModalProps {
  module: TaskModule;
  taskId: string;
  allModules: TaskModule[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  moduleIcon: React.ComponentType<any>;
}

type TabType = 'overview' | 'conditions' | 'looms' | 'tags' | 'related' | 'updates' | 'scribes' | 'code';

const PROGRAMMING_LANGUAGES = [
  'typescript', 'javascript', 'tsx', 'jsx', 'html', 'css', 'scss', 'sql', 
  'python', 'bash', 'json', 'yaml', 'markdown', 'php', 'java', 'go'
];

export const ModuleDetailModal = ({
  module,
  taskId,
  allModules,
  isOpen,
  onClose,
  onUpdate,
  moduleIcon: ModuleIcon
}: ModuleDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [relatedModules, setRelatedModules] = useState<RelatedModule[]>([]);
  const [moduleScribes, setModuleScribes] = useState<ModuleScribe[]>([]);
  const [moduleUpdates, setModuleUpdates] = useState<ModuleUpdate[]>([]);
  const [preConditions, setPreConditions] = useState<BooleanCheck[]>(module.metadata?.pre_conditions || []);
  const [postConditions, setPostConditions] = useState<BooleanCheck[]>(module.metadata?.post_conditions || []);
  
  // Loading states
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [loadingScribes, setLoadingScribes] = useState(false);
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  // Form states
  const [newTag, setNewTag] = useState('');
  const [editingTags, setEditingTags] = useState(false);
  const [tempTags, setTempTags] = useState(module.tags.join(', '));

  // Pre/Post Conditions Form states
  const [showConditionForm, setShowConditionForm] = useState<'pre' | 'post' | null>(null);
  const [conditionName, setConditionName] = useState('');
  const [conditionDescription, setConditionDescription] = useState('');
  const [conditionCode, setConditionCode] = useState('');
  const [conditionType, setConditionType] = useState<'validation' | 'authentication' | 'authorization' | 'data_integrity' | 'performance' | 'availability' | 'custom'>('validation');
  const [isConditionCritical, setIsConditionCritical] = useState(false);
  const [expectedResult, setExpectedResult] = useState(true);

  // Loom Video Form states
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');

  // Scribe Form states
  const [showScribeForm, setShowScribeForm] = useState(false);
  const [scribeTitle, setScribeTitle] = useState('');
  const [scribeUrl, setScribeUrl] = useState('');
  const [scribeDescription, setScribeDescription] = useState('');

  // Update Form states
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateContent, setUpdateContent] = useState('');
  const [updateType, setUpdateType] = useState<'progress' | 'bug_fix' | 'feature' | 'documentation' | 'refactor' | 'test'>('progress');

  // Code Submission Form states
  const [showCodeSubmissionForm, setShowCodeSubmissionForm] = useState(false);
  const [submissionType, setSubmissionType] = useState<'file' | 'snippet'>('file');
  const [codeFile, setCodeFile] = useState<File | null>(null);
  const [codeDescription, setCodeDescription] = useState('');
  const [codeVersion, setCodeVersion] = useState('1.0.0');
  const [submittingCode, setSubmittingCode] = useState(false);
  const [codeSubmissions, setCodeSubmissions] = useState<any[]>([]);
  const [loadingCodeSubmissions, setLoadingCodeSubmissions] = useState(false);
  
  // Code snippet states
  const [codeSnippet, setCodeSnippet] = useState({
    language: 'typescript',
    code: '',
    description: ''
  });

  // Tab data with counts
  const tabData = [
    { id: 'overview', label: 'Overview', icon: IconListDetails, count: undefined },
    { id: 'conditions', label: 'Conditions', icon: IconCheck, count: preConditions.length + postConditions.length },
    { id: 'looms', label: 'Looms', icon: IconVideo, count: (() => {
        // Check for loom videos in url field or metadata
        const hasUrlLoom = module.url && module.url.includes('loom.com');
        const hasMetadataLoom = module.metadata && 
          (typeof module.metadata === 'string' ? 
            JSON.parse(module.metadata).loom_video_url : 
            module.metadata.loom_video_url);
        return (hasUrlLoom || hasMetadataLoom) ? 1 : 0;
      })() },
    { id: 'tags', label: 'Tags', icon: IconTag, count: module.tags.length },
    { id: 'related', label: 'Related', icon: IconNetwork, count: allModules.length - 1 }, // All modules minus current one
    { id: 'updates', label: 'Updates', icon: IconHistory, count: module.update_count || 0 },
    { id: 'scribes', label: 'Scribes', icon: IconFileText, count: moduleScribes.length },
    { id: 'code', label: 'Code', icon: IconCode, count: codeSubmissions.length }
  ];

  // Load data when tab changes
  useEffect(() => {
    if (!isOpen) return;

    switch (activeTab) {
      case 'related':
        loadRelatedModules();
        break;
      case 'scribes':
        loadModuleScribes();
        break;
      case 'updates':
        loadModuleUpdates();
        break;
      case 'code':
        loadCodeSubmissions();
        break;
    }
  }, [activeTab, isOpen, module.id]);

  const loadRelatedModules = async () => {
    try {
      setLoadingRelated(true);
      const response = await fetch(`/api/tasks/module-relationships?moduleId=${module.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Related modules API response:', data);
        console.log('Manual relationships:', data.manualRelationships?.length || 0);
        console.log('All modules:', data.allModules?.length || 0);
        
        // Use manualRelationships as the primary source, but format properly
        const manualRelated = (data.manualRelationships || []).map((rel: any) => ({
          id: rel.id,
          name: rel.name,
          module_type: rel.module_type,
          module_color: rel.module_color || '#4f46e5',
          relationship_type: rel.dependency_type || 'related',
          relationship_reason: rel.relationship_reason || 'Manual relationship',
          source: rel.source || 'manual',
          relationship_id: rel.relationship_id
        }));
        
        console.log('Formatted related modules:', manualRelated.length);
        setRelatedModules(manualRelated);
      } else {
        console.error('Related modules API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading related modules:', error);
    } finally {
      setLoadingRelated(false);
    }
  };

  const loadModuleScribes = async () => {
    try {
      setLoadingScribes(true);
      const response = await fetch(`/api/tasks/module-scribes?moduleId=${module.id}`);
      if (response.ok) {
        const data = await response.json();
        setModuleScribes(data.scribes || []);
      }
    } catch (error) {
      console.error('Error loading module scribes:', error);
    } finally {
      setLoadingScribes(false);
    }
  };

  const loadModuleUpdates = async () => {
    try {
      setLoadingUpdates(true);
      const response = await fetch(`/api/tasks/module-updates?moduleId=${module.id}`);
      if (response.ok) {
        const data = await response.json();
        setModuleUpdates(data.updates || []);
      }
    } catch (error) {
      console.error('Error loading module updates:', error);
    } finally {
      setLoadingUpdates(false);
    }
  };

  const loadCodeSubmissions = async () => {
    try {
      setLoadingCodeSubmissions(true);
      const response = await fetch(`/api/tasks/modules/${module.id}/submissions`);
      if (response.ok) {
        const data = await response.json();
        setCodeSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error loading code submissions:', error);
    } finally {
      setLoadingCodeSubmissions(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    try {
      const updatedTags = [...module.tags, newTag.trim()];
      const response = await fetch(`/api/tasks/modules/${module.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updatedTags })
      });

      if (response.ok) {
        toast.success('Tag added successfully');
        setNewTag('');
        onUpdate();
      } else {
        toast.error('Failed to add tag');
      }
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error('Failed to add tag');
    }
  };

  const handleSaveTags = async () => {
    try {
      const tagsArray = tempTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      const response = await fetch(`/api/tasks/modules/${module.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: tagsArray })
      });

      if (response.ok) {
        toast.success('Tags updated successfully');
        setEditingTags(false);
        onUpdate();
      } else {
        toast.error('Failed to update tags');
      }
    } catch (error) {
      console.error('Error updating tags:', error);
      toast.error('Failed to update tags');
    }
  };

  // Condition handlers
  const handleAddCondition = async () => {
    if (!conditionName.trim() || !conditionDescription.trim() || !conditionCode.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const conditionData = {
      name: conditionName,
      description: conditionDescription,
      check_type: conditionType,
      condition_code: conditionCode,
      expected_result: expectedResult,
      is_critical: isConditionCritical
    };

    try {
      const response = await fetch(`/api/tasks/module-conditions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: module.id,
          conditionType: showConditionForm,
          condition: conditionData
        })
      });

      if (response.ok) {
        toast.success(`${showConditionForm === 'pre' ? 'Pre' : 'Post'}-condition added successfully`);
        // Reset form
        setConditionName('');
        setConditionDescription('');
        setConditionCode('');
        setConditionType('validation');
        setIsConditionCritical(false);
        setExpectedResult(true);
        setShowConditionForm(null);
        
        // Reload conditions
        const updatedModule = await fetch(`/api/tasks/modules/${module.id}`).then(res => res.json());
        if (updatedModule.metadata) {
          setPreConditions(updatedModule.metadata.pre_conditions || []);
          setPostConditions(updatedModule.metadata.post_conditions || []);
        }
        onUpdate();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add condition');
      }
    } catch (error) {
      console.error('Error adding condition:', error);
      toast.error('Failed to add condition');
    }
  };

  // Loom video handlers
  const handleAddVideo = async () => {
    if (!videoUrl.trim() || !videoTitle.trim()) {
      toast.error('Please provide video URL and title');
      return;
    }

    if (!videoUrl.includes('loom.com')) {
      toast.error('Please provide a valid Loom video URL');
      return;
    }

    try {
      const response = await fetch(`/api/tasks/modules/${module.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            ...module.metadata,
            loom_video_url: videoUrl,
            loom_video_title: videoTitle,
            loom_video_description: videoDescription
          }
        })
      });

      if (response.ok) {
        toast.success('Loom video added successfully');
        setVideoUrl('');
        setVideoTitle('');
        setVideoDescription('');
        setShowVideoForm(false);
        onUpdate();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add video');
      }
    } catch (error) {
      console.error('Error adding video:', error);
      toast.error('Failed to add video');
    }
  };

  // Scribe handlers
  const handleAddScribe = async () => {
    if (!scribeTitle.trim() || !scribeUrl.trim()) {
      toast.error('Please provide scribe title and URL');
      return;
    }

    if (!scribeUrl.includes('scribehow.com')) {
      toast.error('Please provide a valid ScribeHow URL');
      return;
    }

    try {
      const response = await fetch('/api/tasks/module-scribes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: module.id,
          title: scribeTitle,
          scribeUrl: scribeUrl,
          description: scribeDescription || `Scribe documentation for ${scribeTitle}`
        })
      });

      if (response.ok) {
        toast.success('Scribe added successfully');
        setScribeTitle('');
        setScribeUrl('');
        setScribeDescription('');
        setShowScribeForm(false);
        loadModuleScribes(); // Reload scribes
        onUpdate();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add scribe');
      }
    } catch (error) {
      console.error('Error adding scribe:', error);
      toast.error('Failed to add scribe');
    }
  };

  // Update handlers
  const handleAddUpdate = async () => {
    if (!updateContent.trim()) {
      toast.error('Please provide update content');
      return;
    }

    try {
      const response = await fetch('/api/tasks/module-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: taskId,
          moduleId: module.id,
          content: updateContent,
          updateType: updateType
        })
      });

      if (response.ok) {
        toast.success('Update added successfully');
        setUpdateContent('');
        setUpdateType('progress');
        setShowUpdateForm(false);
        loadModuleUpdates(); // Reload updates
        onUpdate();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add update');
      }
    } catch (error) {
      console.error('Error adding update:', error);
      toast.error('Failed to add update');
    }
  };

  const handleCodeSubmission = async () => {
    if (submissionType === 'file') {
      if (!codeFile) {
        toast.error('Please select a code file');
        return;
      }
    } else {
      if (!codeSnippet.code.trim()) {
        toast.error('Please enter your code snippet');
        return;
      }
      if (!codeSnippet.description.trim()) {
        toast.error('Please provide a description for your code');
        return;
      }
    }

    if (!codeDescription.trim()) {
      toast.error('Please provide a description for your code submission');
      return;
    }

    try {
      setSubmittingCode(true);
      
      if (submissionType === 'file') {
        // File submission
        const formData = new FormData();
        formData.append('file', codeFile!);
        formData.append('moduleId', module.id);
        formData.append('description', codeDescription);
        formData.append('version', codeVersion);

        const response = await fetch('/api/developer/submit-code', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          toast.success('Code file submitted successfully!');
          setCodeFile(null);
          setCodeDescription('');
          setCodeVersion('1.0.0');
          setShowCodeSubmissionForm(false);
          loadCodeSubmissions();
          onUpdate();
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Failed to submit code');
        }
      } else {
        // Code snippet submission - create a temporary file
        const blob = new Blob([codeSnippet.code], { type: 'text/plain' });
        const file = new File([blob], `${module.name.replace(/\s+/g, '-').toLowerCase()}-snippet.${getFileExtension(codeSnippet.language)}`, { type: 'text/plain' });
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('moduleId', module.id);
        formData.append('description', `${codeDescription} (Language: ${codeSnippet.language}, Snippet: ${codeSnippet.description})`);
        formData.append('version', codeVersion);

        const response = await fetch('/api/developer/submit-code', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          toast.success('Code snippet submitted successfully!');
          setCodeSnippet({ language: 'typescript', code: '', description: '' });
          setCodeDescription('');
          setCodeVersion('1.0.0');
          setShowCodeSubmissionForm(false);
          loadCodeSubmissions();
          onUpdate();
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Failed to submit code snippet');
        }
      }
    } catch (error) {
      console.error('Error submitting code:', error);
      toast.error('Failed to submit code');
    } finally {
      setSubmittingCode(false);
    }
  };

  const getFileExtension = (language: string) => {
    const extensions: { [key: string]: string } = {
      'typescript': 'ts',
      'javascript': 'js',
      'tsx': 'tsx',
      'jsx': 'jsx',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sql': 'sql',
      'python': 'py',
      'bash': 'sh',
      'json': 'json',
      'yaml': 'yml',
      'markdown': 'md',
      'php': 'php',
      'java': 'java',
      'go': 'go'
    };
    return extensions[language] || 'txt';
  };

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'in_progress':
        return 'text-yellow-400';
      case 'blocked':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (module.status) {
      case 'completed':
        return <IconCircleCheck className="text-green-400" size={20} />;
      case 'in_progress':
        return <IconClock className="text-yellow-400" size={20} />;
      case 'blocked':
        return <IconAlertTriangle className="text-red-400" size={20} />;
      default:
        return <IconCircle className="text-gray-400" size={20} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: module.module_color + '20', border: `1px solid ${module.module_color}40` }}
            >
              <ModuleIcon size={24} style={{ color: module.module_color }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{module.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon()}
                <span className={`text-sm ${getStatusColor(module.status)}`}>
                  {module.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400 text-sm">{module.module_type}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <IconX size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-4 bg-gray-700/30 border-b border-gray-700">
          {tabData.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gray-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="bg-gray-500/50 text-xs px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Module Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400">Description</label>
                      <p className="text-gray-300 mt-1">{module.description || 'No description available'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400">File Path</label>
                        <p className="text-gray-300 mt-1 font-mono text-sm">{module.file_path || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Module Type</label>
                        <p className="text-gray-300 mt-1">{module.module_type}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400">Created</label>
                        <p className="text-gray-300 mt-1">{module.created_at ? formatTimeAgo(module.created_at) : 'Unknown'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Last Updated</label>
                        <p className="text-gray-300 mt-1">{module.updated_at ? formatTimeAgo(module.updated_at) : 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-400">{relatedModules.length}</div>
                      <div className="text-gray-400 text-sm">Related Modules</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-400">{module.completion_percentage}%</div>
                      <div className="text-gray-400 text-sm">Completion</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-400">{moduleScribes.length}</div>
                      <div className="text-gray-400 text-sm">Scribes</div>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-yellow-400">{module.update_count || 0}</div>
                      <div className="text-gray-400 text-sm">Updates</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conditions Tab */}
          {activeTab === 'conditions' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Pre-conditions</h3>
                  <button
                    onClick={() => setShowConditionForm('pre')}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <IconPlus size={16} />
                    Add Pre-condition
                  </button>
                </div>

                {/* Add Pre-condition Form */}
                {showConditionForm === 'pre' && (
                  <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Add New Pre-condition</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Condition Name</label>
                        <input
                          type="text"
                          value={conditionName}
                          onChange={(e) => setConditionName(e.target.value)}
                          placeholder="e.g., User Authentication Required"
                          className="w-full bg-gray-600/50 border border-gray-500/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Description</label>
                        <textarea
                          value={conditionDescription}
                          onChange={(e) => setConditionDescription(e.target.value)}
                          placeholder="Describe what this condition checks for..."
                          className="w-full bg-gray-600/50 border border-gray-500/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Condition Type</label>
                          <select
                            value={conditionType}
                            onChange={(e) => setConditionType(e.target.value as any)}
                            className="w-full bg-gray-600/50 border border-gray-500/50 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                          >
                            <option value="validation">Validation</option>
                            <option value="authentication">Authentication</option>
                            <option value="authorization">Authorization</option>
                            <option value="data_integrity">Data Integrity</option>
                            <option value="performance">Performance</option>
                            <option value="availability">Availability</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-sm text-gray-400">
                            <input
                              type="checkbox"
                              checked={isConditionCritical}
                              onChange={(e) => setIsConditionCritical(e.target.checked)}
                              className="rounded"
                            />
                            Critical Condition
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-400">
                            <input
                              type="checkbox"
                              checked={expectedResult}
                              onChange={(e) => setExpectedResult(e.target.checked)}
                              className="rounded"
                            />
                            Expected Result: True
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Condition Code</label>
                        <textarea
                          value={conditionCode}
                          onChange={(e) => setConditionCode(e.target.value)}
                          placeholder="e.g., user.isAuthenticated && user.hasPermission('read')"
                          className="w-full bg-gray-600/50 border border-gray-500/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 font-mono text-sm"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddCondition}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                        >
                          Add Pre-condition
                        </button>
                        <button
                          onClick={() => {
                            setShowConditionForm(null);
                            setConditionName('');
                            setConditionDescription('');
                            setConditionCode('');
                            setConditionType('validation');
                            setIsConditionCritical(false);
                            setExpectedResult(true);
                          }}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {preConditions.length > 0 ? (
                  <div className="space-y-3">
                    {preConditions.map((condition, index) => (
                      <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-white">{condition.name}</h4>
                            <p className="text-gray-400 text-sm mt-1">{condition.description}</p>
                            <code className="text-xs text-gray-300 bg-gray-800 rounded px-2 py-1 mt-2 block">
                              {condition.condition_code}
                            </code>
                          </div>
                          {condition.is_critical && (
                            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">Critical</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No pre-conditions defined</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Post-conditions</h3>
                  <button
                    onClick={() => setShowConditionForm('post')}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <IconPlus size={16} />
                    Add Post-condition
                  </button>
                </div>

                {/* Add Post-condition Form */}
                {showConditionForm === 'post' && (
                  <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Add New Post-condition</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Condition Name</label>
                        <input
                          type="text"
                          value={conditionName}
                          onChange={(e) => setConditionName(e.target.value)}
                          placeholder="e.g., Data Successfully Saved"
                          className="w-full bg-gray-600/50 border border-gray-500/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Description</label>
                        <textarea
                          value={conditionDescription}
                          onChange={(e) => setConditionDescription(e.target.value)}
                          placeholder="Describe what should be true after this module executes..."
                          className="w-full bg-gray-600/50 border border-gray-500/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Condition Type</label>
                          <select
                            value={conditionType}
                            onChange={(e) => setConditionType(e.target.value as any)}
                            className="w-full bg-gray-600/50 border border-gray-500/50 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                          >
                            <option value="validation">Validation</option>
                            <option value="authentication">Authentication</option>
                            <option value="authorization">Authorization</option>
                            <option value="data_integrity">Data Integrity</option>
                            <option value="performance">Performance</option>
                            <option value="availability">Availability</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-sm text-gray-400">
                            <input
                              type="checkbox"
                              checked={isConditionCritical}
                              onChange={(e) => setIsConditionCritical(e.target.checked)}
                              className="rounded"
                            />
                            Critical Condition
                          </label>
                          <label className="flex items-center gap-2 text-sm text-gray-400">
                            <input
                              type="checkbox"
                              checked={expectedResult}
                              onChange={(e) => setExpectedResult(e.target.checked)}
                              className="rounded"
                            />
                            Expected Result: True
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Condition Code</label>
                        <textarea
                          value={conditionCode}
                          onChange={(e) => setConditionCode(e.target.value)}
                          placeholder="e.g., response.status === 200 && data.saved === true"
                          className="w-full bg-gray-600/50 border border-gray-500/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 font-mono text-sm"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddCondition}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                        >
                          Add Post-condition
                        </button>
                        <button
                          onClick={() => {
                            setShowConditionForm(null);
                            setConditionName('');
                            setConditionDescription('');
                            setConditionCode('');
                            setConditionType('validation');
                            setIsConditionCritical(false);
                            setExpectedResult(true);
                          }}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {postConditions.length > 0 ? (
                  <div className="space-y-3">
                    {postConditions.map((condition, index) => (
                      <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-white">{condition.name}</h4>
                            <p className="text-gray-400 text-sm mt-1">{condition.description}</p>
                            <code className="text-xs text-gray-300 bg-gray-800 rounded px-2 py-1 mt-2 block">
                              {condition.condition_code}
                            </code>
                          </div>
                          {condition.is_critical && (
                            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">Critical</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No post-conditions defined</p>
                )}
              </div>
            </div>
          )}

          {/* Looms Tab */}
          {activeTab === 'looms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Connected Loom Videos</h3>
                <button
                  onClick={() => setShowVideoForm(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <IconPlus size={16} />
                  Add Video
                </button>
              </div>

              {/* Add Video Form */}
              {showVideoForm && (
                <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Add New Loom Video</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Video Title</label>
                      <input
                        type="text"
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        placeholder="e.g., Module Implementation Demo"
                        className="w-full bg-gray-600/50 border border-gray-500/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Loom Video URL</label>
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://www.loom.com/share/..."
                        className="w-full bg-gray-600/50 border border-gray-500/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Description (Optional)</label>
                      <textarea
                        value={videoDescription}
                        onChange={(e) => setVideoDescription(e.target.value)}
                        placeholder="Brief description of what this video demonstrates..."
                        className="w-full bg-gray-600/50 border border-gray-500/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddVideo}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                      >
                        Add Video
                      </button>
                      <button
                        onClick={() => {
                          setShowVideoForm(false);
                          setVideoUrl('');
                          setVideoTitle('');
                          setVideoDescription('');
                        }}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {(() => {
                // Check for loom videos in url field or metadata
                const hasUrlLoom = module.url && module.url.includes('loom.com');
                const hasMetadataLoom = module.metadata && 
                  (typeof module.metadata === 'string' ? 
                    JSON.parse(module.metadata).loom_video_url : 
                    module.metadata.loom_video_url);
                
                                 const loomUrl = hasUrlLoom ? module.url : 
                   (hasMetadataLoom && module.metadata ? 
                     (typeof module.metadata === 'string' ? 
                       JSON.parse(module.metadata).loom_video_url : 
                       module.metadata.loom_video_url) : 
                     null);

                const videoTitle = module.metadata && 
                  (typeof module.metadata === 'string' ? 
                    JSON.parse(module.metadata).loom_video_title : 
                    module.metadata.loom_video_title) || `${module.name} Demo`;

                const videoDescription = module.metadata && 
                  (typeof module.metadata === 'string' ? 
                    JSON.parse(module.metadata).loom_video_description : 
                    module.metadata.loom_video_description);
                
                return (hasUrlLoom || hasMetadataLoom) ? (
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <IconVideo size={20} className="text-red-400" />
                        <div>
                          <h4 className="font-medium text-white">{videoTitle}</h4>
                          <p className="text-gray-400 text-sm">{videoDescription || 'Loom video demonstration'}</p>
                        </div>
                      </div>
                      <a
                        href={loomUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <IconExternalLink size={16} />
                        Watch
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No loom videos connected</p>
                );
              })()}
            </div>
          )}

          {/* Tags Tab */}
          {activeTab === 'tags' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Module Tags</h3>
                <button
                  onClick={() => setEditingTags(!editingTags)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <IconEdit size={16} />
                  Edit Tags
                </button>
              </div>

              {editingTags ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Tags (comma-separated)</label>
                    <textarea
                      value={tempTags}
                      onChange={(e) => setTempTags(e.target.value)}
                      className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter tags separated by commas..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveTags}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setEditingTags(false);
                        setTempTags(module.tags.join(', '));
                      }}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {module.tags.length > 0 ? (
                    module.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-sm border border-gray-600"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-8 w-full">No tags assigned</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Related Modules Tab */}
          {activeTab === 'related' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Related Modules</h3>
              <p className="text-gray-400 text-sm">All modules in this task that relate to {module.name}</p>
              {loadingRelated ? (
                <p className="text-gray-400 text-center py-8">Loading related modules...</p>
              ) : allModules.length > 1 ? (
                <div className="space-y-3">
                  {allModules
                    .filter(m => m.id !== module.id) // Exclude current module
                    .map((related) => (
                    <div key={related.id} className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded flex items-center justify-center"
                            style={{ backgroundColor: (related.module_color || '#4f46e5') + '20' }}
                          >
                            <IconLink size={16} style={{ color: related.module_color || '#4f46e5' }} />
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{related.name}</h4>
                            <p className="text-gray-400 text-sm">{related.module_type || 'Module'}</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs">
                          Task Module
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No other modules in this task</p>
              )}
            </div>
          )}

          {/* Updates Tab */}
          {activeTab === 'updates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Update History</h3>
                <button
                  onClick={() => setShowUpdateForm(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  <IconPlus size={16} />
                  Add Update
                </button>
              </div>

              {/* Add Update Form */}
              {showUpdateForm && (
                <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Add New Module Update</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Update Type</label>
                      <select
                        value={updateType}
                        onChange={(e) => setUpdateType(e.target.value as any)}
                        className="w-full bg-gray-600/50 border border-gray-500/50 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500/50"
                      >
                        <option value="progress">Progress Update</option>
                        <option value="bug_fix">Bug Fix</option>
                        <option value="feature">New Feature</option>
                        <option value="documentation">Documentation</option>
                        <option value="refactor">Code Refactor</option>
                        <option value="test">Testing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Update Content</label>
                      <textarea
                        value={updateContent}
                        onChange={(e) => setUpdateContent(e.target.value)}
                        placeholder="Describe the changes, progress, or updates made to this module..."
                        className="w-full bg-gray-600/50 border border-gray-500/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500/50"
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddUpdate}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                      >
                        Add Update
                      </button>
                      <button
                        onClick={() => {
                          setShowUpdateForm(false);
                          setUpdateContent('');
                          setUpdateType('progress');
                        }}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loadingUpdates ? (
                <p className="text-gray-400 text-center py-8">Loading updates...</p>
              ) : moduleUpdates.length > 0 ? (
                <div className="space-y-3">
                  {moduleUpdates.map((update) => (
                    <div key={update.id} className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-gray-300">{update.content}</p>
                          <p className="text-gray-500 text-xs mt-2">
                            {formatTimeAgo(update.created_at)} {update.created_by && `by ${update.created_by}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No updates recorded</p>
              )}
            </div>
          )}

          {/* Scribes Tab */}
          {activeTab === 'scribes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Connected Scribes</h3>
                <button
                  onClick={() => setShowScribeForm(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <IconPlus size={16} />
                  Add Scribe
                </button>
              </div>

              {/* Add Scribe Form */}
              {showScribeForm && (
                <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Add New Scribe Documentation</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Scribe Title</label>
                      <input
                        type="text"
                        value={scribeTitle}
                        onChange={(e) => setScribeTitle(e.target.value)}
                        placeholder="e.g., How to implement authentication"
                        className="w-full bg-gray-600/50 border border-gray-500/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">ScribeHow URL</label>
                      <input
                        type="url"
                        value={scribeUrl}
                        onChange={(e) => setScribeUrl(e.target.value)}
                        placeholder="https://scribehow.com/shared/..."
                        className="w-full bg-gray-600/50 border border-gray-500/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Description (Optional)</label>
                      <textarea
                        value={scribeDescription}
                        onChange={(e) => setScribeDescription(e.target.value)}
                        placeholder="Brief description of what this scribe documents..."
                        className="w-full bg-gray-600/50 border border-gray-500/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddScribe}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                      >
                        Add Scribe
                      </button>
                      <button
                        onClick={() => {
                          setShowScribeForm(false);
                          setScribeTitle('');
                          setScribeUrl('');
                          setScribeDescription('');
                        }}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loadingScribes ? (
                <p className="text-gray-400 text-center py-8">Loading scribes...</p>
              ) : moduleScribes.length > 0 ? (
                <div className="space-y-3">
                  {moduleScribes.map((scribe) => (
                    <div key={scribe.id} className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <IconFileText size={20} className="text-purple-400" />
                          <div>
                            <h4 className="font-medium text-white">{scribe.title}</h4>
                            <p className="text-gray-400 text-sm">{scribe.description || 'No description available'}</p>
                            <p className="text-gray-500 text-xs mt-1">Created {formatTimeAgo(scribe.created_at)}</p>
                          </div>
                        </div>
                        <a
                          href={scribe.scribe_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        >
                          <IconExternalLink size={16} />
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No scribes connected</p>
              )}
            </div>
          )}

          {/* Code Submissions Tab */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Code Submissions</h3>
                <button
                  onClick={() => setShowCodeSubmissionForm(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <IconUpload size={16} />
                  Submit Code
                </button>
              </div>

              {/* Code Submission Form */}
              {showCodeSubmissionForm && (
                <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Submit Code for {module.name}</h4>
                  
                  {/* Submission Type Toggle */}
                  <div className="flex gap-1 mb-4 bg-gray-800 rounded-lg p-1">
                    <button
                      onClick={() => setSubmissionType('file')}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        submissionType === 'file'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      <IconUpload size={16} className="inline mr-2" />
                      Upload File
                    </button>
                    <button
                      onClick={() => setSubmissionType('snippet')}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        submissionType === 'snippet'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      <IconCode size={16} className="inline mr-2" />
                      Code Snippet
                    </button>
                  </div>

                  <div className="space-y-4">
                    {submissionType === 'file' ? (
                      /* File Upload Form */
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Code File
                        </label>
                        <input
                          type="file"
                          accept=".js,.jsx,.ts,.tsx,.py,.java,.php,.rb,.go,.rs,.cpp,.c,.cs,.swift,.kt,.dart,.html,.css,.scss,.sql,.json,.xml,.yaml,.yml,.md,.txt"
                          onChange={(e) => setCodeFile(e.target.files?.[0] || null)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      /* Code Snippet Form */
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Language
                            </label>
                            <select
                              value={codeSnippet.language}
                              onChange={(e) => setCodeSnippet({ ...codeSnippet, language: e.target.value })}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {PROGRAMMING_LANGUAGES.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Snippet Description
                            </label>
                            <input
                              type="text"
                              value={codeSnippet.description}
                              onChange={(e) => setCodeSnippet({ ...codeSnippet, description: e.target.value })}
                              placeholder="What does this code do?"
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-300">
                              Code
                            </label>
                            <button
                              type="button"
                              onClick={() => copyCodeToClipboard(codeSnippet.code)}
                              className="text-gray-400 hover:text-white p-1"
                              title="Copy code"
                            >
                              <IconCopy size={16} />
                            </button>
                          </div>
                          <textarea
                            value={codeSnippet.code}
                            onChange={(e) => setCodeSnippet({ ...codeSnippet, code: e.target.value })}
                            placeholder="Paste your code here..."
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-green-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={8}
                          />
                        </div>
                      </>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Submission Description
                      </label>
                      <textarea
                        value={codeDescription}
                        onChange={(e) => setCodeDescription(e.target.value)}
                        placeholder="Describe what this submission includes and any important notes..."
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Version
                      </label>
                      <input
                        type="text"
                        value={codeVersion}
                        onChange={(e) => setCodeVersion(e.target.value)}
                        placeholder="1.0.0"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCodeSubmission}
                        disabled={submittingCode}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                      >
                        {submittingCode ? 'Submitting...' : `Submit ${submissionType === 'file' ? 'File' : 'Snippet'}`}
                      </button>
                      <button
                        onClick={() => {
                          setShowCodeSubmissionForm(false);
                          setCodeFile(null);
                          setCodeDescription('');
                          setCodeVersion('1.0.0');
                          setCodeSnippet({ language: 'typescript', code: '', description: '' });
                        }}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loadingCodeSubmissions ? (
                <p className="text-gray-400 text-center py-8">Loading code submissions...</p>
              ) : codeSubmissions.length > 0 ? (
                <div className="space-y-3">
                  {codeSubmissions.map((submission) => (
                    <div key={submission.id} className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <IconCode size={20} className="text-blue-400" />
                          <div>
                            <h4 className="font-medium text-white">{submission.file_name}</h4>
                            <p className="text-gray-400 text-sm">Version {submission.version}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {submission.score && (
                            <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                              Score: {submission.score}
                            </span>
                          )}
                          {submission.s3_url && (
                            <a
                              href={submission.s3_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                            >
                              <IconExternalLink size={14} />
                              View
                            </a>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{submission.description}</p>
                      <p className="text-gray-500 text-xs">
                        Submitted {formatTimeAgo(submission.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No code submissions yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 