"use client";

import {
  IconChevronDown,
  IconChevronUp,
  IconCircleCheck,
  IconCircle,
  IconClock,
  IconTag,
  IconEdit,
  IconTrash,
  IconPhoto,
  IconSend,
  IconAlertTriangle,
  IconLink,
  IconGitBranch,
  IconArrowRight,
  IconNetwork,
  IconVideo,
  IconCode,
  IconCheck,
  IconX,
  IconPlus,
  IconSettings,
  IconKey,
  IconShield,
  IconDatabase,
  IconBolt,
  IconWifi,
  IconGrid3x3,
  IconList
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { ModuleEditor } from './ModuleEditor';

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
  created_at?: string;
  updated_at?: string;
  pre_conditions?: BooleanCheck[];
  post_conditions?: BooleanCheck[];
  metadata?: {
    implementationNotes?: string;
    codeSnippets?: { language: string; code: string; description?: string }[];
    loom_video_url?: string;
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

interface BooleanCheckInput {
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

interface ModuleCardProps {
  module: TaskModule;
  taskId: string;
  allModules: TaskModule[];
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: () => void;
  onMediaPreview: (mediaFiles: any[], index?: number) => void;
  moduleIcon: React.ComponentType<any>;
}

export const ModuleCard = ({
  module,
  taskId,
  allModules,
  isExpanded,
  onToggle,
  onUpdate,
  onMediaPreview,
  moduleIcon: ModuleIcon
}: ModuleCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModuleEditor, setShowModuleEditor] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [relatedModules, setRelatedModules] = useState<RelatedModule[]>([]);
  const [manualRelationships, setManualRelationships] = useState<RelatedModule[]>([]);
  const [codeBlock, setCodeBlock] = useState((module as any)?.code_snippet || '');
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [tempCodeBlock, setTempCodeBlock] = useState({
    language: 'typescript',
    description: '',
    code: ''
  });
  const [moduleUpdates, setModuleUpdates] = useState<any[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  
  // Relationship editing state
  const [isEditingRelationships, setIsEditingRelationships] = useState(false);
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [loadingRelationships, setLoadingRelationships] = useState(false);
  const [ignoredRelationships, setIgnoredRelationships] = useState<string[]>([]);
  const [newRelationship, setNewRelationship] = useState({
    moduleId: '',
    relationshipType: 'related' as string,
    description: ''
  });
  
  // Boolean checks state
  const [isEditingConditions, setIsEditingConditions] = useState(false);
  const [preConditions, setPreConditions] = useState<BooleanCheck[]>(module.metadata?.pre_conditions || []);
  const [postConditions, setPostConditions] = useState<BooleanCheck[]>(module.metadata?.post_conditions || []);
  const [showAddCondition, setShowAddCondition] = useState(false);
  const [newConditionType, setNewConditionType] = useState<'pre_condition' | 'post_condition'>('pre_condition');
  const [showAddPreCondition, setShowAddPreCondition] = useState(false);
  const [showAddPostCondition, setShowAddPostCondition] = useState(false);
  const [newPreCondition, setNewPreCondition] = useState<BooleanCheckInput>({
    name: '',
    description: '',
    check_type: 'validation',
    condition_code: '',
    expected_result: true,
    is_critical: false
  });
  const [newPostCondition, setNewPostCondition] = useState<BooleanCheckInput>({
    name: '',
    description: '',
    check_type: 'validation',
    condition_code: '',
    expected_result: true,
    is_critical: false
  });
  
  // Form state for editing
  const [editForm, setEditForm] = useState({
    name: module.name,
    description: module.description,
    file_path: module.file_path,
    status: module.status,
    completion_percentage: module.completion_percentage,
    tags: module.tags.join(', '),
    url: module.url || ''
  });

  // Loom video state
  const [isEditingLoom, setIsEditingLoom] = useState(false);
  const [tempLoomUrl, setTempLoomUrl] = useState(module.metadata?.loom_video_url || module.url || '');
  const [tempLoomDescription, setTempLoomDescription] = useState('');
  
  const formatLastUpdated = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  // Fetch manual relationships from the database
  const fetchManualRelationships = async () => {
    try {
      setLoadingRelationships(true);
      const response = await fetch(`/api/tasks/module-relationships?moduleId=${module.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setManualRelationships(data.manualRelationships.map((rel: any) => ({
          id: rel.id,
          name: rel.name,
          module_type: rel.module_type,
          module_color: rel.module_color,
          relationship_type: rel.dependency_type,
          relationship_reason: rel.relationship_reason,
          source: 'manual',
          relationship_id: rel.relationship_id
        })));
      }
    } catch (error) {
      console.error('Error fetching manual relationships:', error);
    } finally {
      setLoadingRelationships(false);
    }
  };

  // Calculate automatic relationships based on various relationship patterns
  const calculateAutomaticRelationships = () => {
    const related: RelatedModule[] = [];
    const currentModuleNameLower = module.name.toLowerCase();
    
    allModules.forEach(otherModule => {
      if (otherModule.id === module.id) return;
      
      const otherNameLower = otherModule.name.toLowerCase();
      
      // 1. Testing relationships (tests for components/functions)
      if (module.module_type === 'ui_components' || module.module_type === 'functions' || module.module_type === 'api_endpoints') {
        if (otherModule.module_type === 'tests' && 
            (otherNameLower.includes(currentModuleNameLower.split(' ')[0]) || 
             otherNameLower.includes('test') && 
             module.tags.some(tag => otherModule.tags.includes(tag)))) {
          related.push({
            id: otherModule.id,
            name: otherModule.name,
            module_type: otherModule.module_type,
            module_color: otherModule.module_color,
            relationship_type: 'testing',
            relationship_reason: 'Tests this module',
            source: 'auto'
          });
        }
      }
      
      // 2. Component family relationships (similar components)
      if (module.module_type === 'ui_components' && otherModule.module_type === 'ui_components') {
        if (currentModuleNameLower.includes('chat') && otherNameLower.includes('chat') ||
            currentModuleNameLower.includes('message') && otherNameLower.includes('message') ||
            currentModuleNameLower.includes('user') && otherNameLower.includes('user')) {
          related.push({
            id: otherModule.id,
            name: otherModule.name,
            module_type: otherModule.module_type,
            module_color: otherModule.module_color,
            relationship_type: 'component_family',
            relationship_reason: 'Related UI component',
            source: 'auto'
          });
        }
      }
      
      // 3. Function dependencies (components using utilities)
      if (module.module_type === 'ui_components' && otherModule.module_type === 'functions') {
        if (module.tags.some(tag => otherModule.tags.includes(tag)) ||
            (currentModuleNameLower.includes('message') && otherNameLower.includes('message')) ||
            (currentModuleNameLower.includes('chat') && otherNameLower.includes('notification'))) {
          related.push({
            id: otherModule.id,
            name: otherModule.name,
            module_type: otherModule.module_type,
            module_color: otherModule.module_color,
            relationship_type: 'dependency',
            relationship_reason: 'Used by this component',
            source: 'auto'
          });
        }
      }
      
      // 4. API-Component relationships
      if (module.module_type === 'ui_components' && otherModule.module_type === 'api_endpoints') {
        if (module.tags.some(tag => otherModule.tags.includes(tag)) ||
            (currentModuleNameLower.includes('message') && otherNameLower.includes('message')) ||
            (currentModuleNameLower.includes('chat') && otherNameLower.includes('websocket'))) {
          related.push({
            id: otherModule.id,
            name: otherModule.name,
            module_type: otherModule.module_type,
            module_color: otherModule.module_color,
            relationship_type: 'dependency',
            relationship_reason: 'API endpoint used',
            source: 'auto'
          });
        }
      }
      
      // 5. Tag-based relationships (shared functionality)
      const sharedTags = module.tags.filter(tag => otherModule.tags.includes(tag));
      if (sharedTags.length >= 2 && !related.find(r => r.id === otherModule.id)) {
        related.push({
          id: otherModule.id,
          name: otherModule.name,
          module_type: otherModule.module_type,
          module_color: otherModule.module_color,
          relationship_type: 'related',
          relationship_reason: `Shared: ${sharedTags.slice(0, 2).join(', ')}`,
          source: 'auto'
        });
      }
      
      // 6. Video demonstration relationships (Loom videos, demos)
      if (otherNameLower.includes('video') || otherNameLower.includes('demo') || 
          otherNameLower.includes('loom') || otherNameLower.includes('recording') ||
          otherModule.tags.some(tag => ['video', 'demo', 'loom', 'recording', 'walkthrough'].includes(tag.toLowerCase()))) {
        // Check if this video is related to the current module
        if (currentModuleNameLower.split(' ').some(word => 
            word.length > 3 && otherNameLower.includes(word)) ||
            module.tags.some(tag => otherModule.tags.includes(tag))) {
          related.push({
            id: otherModule.id,
            name: otherModule.name,
            module_type: otherModule.module_type,
            module_color: otherModule.module_color,
            relationship_type: 'video_demo',
            relationship_reason: 'Video demonstration',
            source: 'auto'
          });
        }
      }
    });
    
    return related;
  };

  // Combine automatic and manual relationships
  useEffect(() => {
    if (allModules && allModules.length > 0) {
      const autoRelationships = calculateAutomaticRelationships();
      
      // Filter out auto relationships that are already manually defined or ignored
      const filteredAutoRelationships = autoRelationships.filter(autoRel => 
        !manualRelationships.some(manualRel => manualRel.id === autoRel.id) &&
        !ignoredRelationships.includes(autoRel.id)
      );
      
      setRelatedModules([...manualRelationships, ...filteredAutoRelationships]);
    }
  }, [module, allModules, manualRelationships, ignoredRelationships]);

  // Fetch manual relationships when expanded
  useEffect(() => {
    if (isExpanded) {
      fetchManualRelationships();
      loadIgnoredRelationships();
    }
  }, [isExpanded, module.id]);

  // Load ignored relationships from localStorage
  const loadIgnoredRelationships = () => {
    try {
      const ignored = localStorage.getItem(`ignored_relationships_${module.id}`);
      if (ignored) {
        setIgnoredRelationships(JSON.parse(ignored));
      }
    } catch (error) {
      console.error('Error loading ignored relationships:', error);
    }
  };

  // Save ignored relationships to localStorage
  const saveIgnoredRelationships = (ignored: string[]) => {
    try {
      localStorage.setItem(`ignored_relationships_${module.id}`, JSON.stringify(ignored));
      setIgnoredRelationships(ignored);
    } catch (error) {
      console.error('Error saving ignored relationships:', error);
    }
  };

  const handleIgnoreAutoRelationship = async (relationshipId: string) => {
    if (!confirm('Are you sure you want to hide this automatic relationship?')) return;

    try {
      const newIgnored = [...ignoredRelationships, relationshipId];
      saveIgnoredRelationships(newIgnored);
      toast.success('Relationship hidden successfully');
    } catch (error) {
      console.error('Error hiding relationship:', error);
      toast.error('Failed to hide relationship');
    }
  };

  // Relationship management functions
  const handleAddRelationship = async () => {
    if (!newRelationship.moduleId || !newRelationship.relationshipType) {
      toast.error('Please select a module and relationship type');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/tasks/module-relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: module.id,
          relatedModuleId: newRelationship.moduleId,
          relationshipType: newRelationship.relationshipType,
          description: newRelationship.description || 'Manual relationship'
        })
      });

      if (response.ok) {
        toast.success('Relationship added successfully');
        setNewRelationship({ moduleId: '', relationshipType: 'related', description: '' });
        setShowAddRelationship(false);
        fetchManualRelationships(); // Refresh
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add relationship');
      }
    } catch (error) {
      console.error('Error adding relationship:', error);
      toast.error('Failed to add relationship');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRelationship = async (relationshipId: string) => {
    if (!confirm('Are you sure you want to remove this relationship?')) return;

    try {
      const response = await fetch(`/api/tasks/module-relationships?relationshipId=${relationshipId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Relationship removed successfully');
        fetchManualRelationships(); // Refresh
      } else {
        toast.error('Failed to remove relationship');
      }
    } catch (error) {
      console.error('Error removing relationship:', error);
      toast.error('Failed to remove relationship');
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-600 text-white';
      case 'medium':
        return 'bg-blue-600 text-white';
      case 'low':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'testing':
        return <IconCircleCheck size={14} className="text-green-400" />;
      case 'dependency':
      case 'required':
        return <IconLink size={14} className="text-blue-400" />;
      case 'component_family':
        return <IconGitBranch size={14} className="text-purple-400" />;
      case 'video_demo':
        return <IconVideo size={14} className="text-pink-400" />;
      case 'related':
      case 'optional':
        return <IconNetwork size={14} className="text-yellow-400" />;
      default:
        return <IconLink size={14} className="text-gray-400" />;
    }
  };

  const handleSaveEdit = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/tasks/modules/${module.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          file_path: editForm.file_path,
          status: editForm.status,
          completion_percentage: editForm.completion_percentage,
          tags: editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          url: editForm.url
        })
      });

      if (response.ok) {
        toast.success('Module updated successfully');
        setIsEditing(false);
        onUpdate();
      } else {
        toast.error('Failed to update module');
      }
    } catch (error) {
      console.error('Error updating module:', error);
      toast.error('Failed to update module');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this module?')) return;

    try {
      const response = await fetch(`/api/modules/${module.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Module deleted successfully');
        onUpdate();
      } else {
        toast.error('Failed to delete module');
      }
    } catch (error) {
      console.error('Error deleting module:', error);
      toast.error('Failed to delete module');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/tasks/module-comments?taskId=${taskId}&moduleId=${module.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentText.trim(),
          updateType: 'note'
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Update added successfully');
        setCommentText("");
        onUpdate(); // Refresh the module data
        fetchModuleUpdates(); // Refresh the updates list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add update');
      }
    } catch (error) {
      console.error('Error adding module update:', error);
      toast.error('Failed to add update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCode = async () => {
    try {
      setIsSubmitting(true);
      // TODO: Add API call to save code snippet
      setCodeBlock(tempCodeBlock.code);
      setIsEditingCode(false);
      toast.success('Code snippet saved successfully');
    } catch (error) {
      console.error('Error saving code snippet:', error);
      toast.error('Failed to save code snippet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCode = () => {
    setTempCodeBlock({
      language: (typeof codeBlock === 'object' && codeBlock.language) || 'typescript',
      description: (typeof codeBlock === 'object' && codeBlock.description) || '',
      code: (typeof codeBlock === 'string') ? codeBlock : (codeBlock.code || '')
    });
    setIsEditingCode(true);
  };

  const handleCancelCode = () => {
    setTempCodeBlock({
      language: 'typescript',
      description: '',
      code: ''
    });
    setIsEditingCode(false);
  };

  // Loom video handlers
  const handleSaveLoom = async () => {
    try {
      setIsSubmitting(true);
      
      const updatedMetadata = {
        ...module.metadata,
        loom_video_url: tempLoomUrl.trim(),
        last_updated: new Date().toISOString()
      };
      
      const response = await fetch(`/api/modules/update/${module.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: updatedMetadata
        })
      });

      if (response.ok) {
        toast.success('Loom video URL saved successfully');
        setIsEditingLoom(false);
        onUpdate();
      } else {
        toast.error('Failed to save Loom video URL');
      }
    } catch (error) {
      console.error('Error saving Loom video URL:', error);
      toast.error('Failed to save Loom video URL');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelLoom = () => {
    setTempLoomUrl(module.metadata?.loom_video_url || module.url || '');
    setTempLoomDescription('');
    setIsEditingLoom(false);
  };

  // Fetch module updates
  const fetchModuleUpdates = async () => {
    if (!isExpanded) return;
    
    try {
      setLoadingUpdates(true);
      const response = await fetch(`/api/tasks/module-comments?taskId=${taskId}&moduleId=${module.id}`);
      
      if (response.ok) {
        const result = await response.json();
        setModuleUpdates(result.updates || []);
      } else {
        console.error('Failed to fetch module updates');
      }
    } catch (error) {
      console.error('Error fetching module updates:', error);
    } finally {
      setLoadingUpdates(false);
    }
  };

  // Fetch updates when expanded
  useEffect(() => {
    if (isExpanded) {
      fetchModuleUpdates();
    }
  }, [isExpanded, taskId, module.id]);

  // Available modules for relationship creation (excluding current module and already related)
  const availableModules = allModules.filter(m => 
    m.id !== module.id && 
    !relatedModules.some(rel => rel.id === m.id)
  );

  // Boolean checks management functions
  const handleAddPreCondition = async () => {
    if (!newPreCondition.name || !newPreCondition.condition_code) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const newCondition = {
        id: Date.now().toString(),
        ...newPreCondition,
        completed: false
      };

      const updatedPreConditions = [...preConditions, newCondition];
      setPreConditions(updatedPreConditions);

      const updatedMetadata = {
        ...module.metadata,
        pre_conditions: updatedPreConditions,
        last_updated: new Date().toISOString()
      };

      const response = await fetch(`/api/modules/update/${module.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: updatedMetadata
        })
      });

      if (response.ok) {
        setNewPreCondition({
          name: '',
          description: '',
          check_type: 'validation',
          condition_code: '',
          expected_result: true,
          is_critical: false
        });
        setShowAddPreCondition(false);
        toast.success('Pre-condition added successfully');
        onUpdate();
      } else {
        // Revert on failure
        setPreConditions(preConditions);
        toast.error('Failed to add pre-condition');
      }
    } catch (error) {
      console.error('Error adding pre-condition:', error);
      setPreConditions(preConditions);
      toast.error('Failed to add pre-condition');
    }
  };

  const handleAddPostCondition = async () => {
    if (!newPostCondition.name || !newPostCondition.condition_code) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const newCondition = {
        id: Date.now().toString(),
        ...newPostCondition,
        verified: false
      };

      const updatedPostConditions = [...postConditions, newCondition];
      setPostConditions(updatedPostConditions);

      const updatedMetadata = {
        ...module.metadata,
        post_conditions: updatedPostConditions,
        last_updated: new Date().toISOString()
      };

      const response = await fetch(`/api/modules/update/${module.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: updatedMetadata
        })
      });

      if (response.ok) {
        setNewPostCondition({
          name: '',
          description: '',
          check_type: 'validation',
          condition_code: '',
          expected_result: true,
          is_critical: false
        });
        setShowAddPostCondition(false);
        toast.success('Post-condition added successfully');
        onUpdate();
      } else {
        // Revert on failure
        setPostConditions(postConditions);
        toast.error('Failed to add post-condition');
      }
    } catch (error) {
      console.error('Error adding post-condition:', error);
      setPostConditions(postConditions);
      toast.error('Failed to add post-condition');
    }
  };

  const handleRemoveCondition = async (conditionId: string, type: 'pre' | 'post') => {
    if (!confirm('Are you sure you want to remove this condition?')) return;

    try {
      let updatedMetadata;
      
      if (type === 'pre') {
        const updatedPreConditions = preConditions.filter(c => c.id !== conditionId);
        setPreConditions(updatedPreConditions);
        updatedMetadata = {
          ...module.metadata,
          pre_conditions: updatedPreConditions,
          last_updated: new Date().toISOString()
        };
      } else {
        const updatedPostConditions = postConditions.filter(c => c.id !== conditionId);
        setPostConditions(updatedPostConditions);
        updatedMetadata = {
          ...module.metadata,
          post_conditions: updatedPostConditions,
          last_updated: new Date().toISOString()
        };
      }

      const response = await fetch(`/api/modules/update/${module.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: updatedMetadata
        })
      });

      if (response.ok) {
        toast.success('Condition removed successfully');
        onUpdate();
      } else {
        // Revert on failure
        if (type === 'pre') {
          setPreConditions(preConditions);
        } else {
          setPostConditions(postConditions);
        }
        toast.error('Failed to remove condition');
      }
    } catch (error) {
      console.error('Error removing condition:', error);
      // Revert on failure
      if (type === 'pre') {
        setPreConditions(preConditions);
      } else {
        setPostConditions(postConditions);
      }
      toast.error('Failed to remove condition');
    }
  };

  const handleEditCondition = (type: 'pre' | 'post', condition: BooleanCheck) => {
    // For now, just show the values - in a real implementation you'd open an edit modal
    const conditionName = condition.name || 'Unnamed Condition';
    const currentCode = condition.condition_code || '';
    const editPrompt = `Edit ${type}-condition "${conditionName}":\n\nCurrent code: ${currentCode}`;
    const newCode = prompt(editPrompt, currentCode);
    
    if (newCode && newCode !== currentCode) {
      handleUpdateCondition(condition.id!, { condition_code: newCode });
    }
  };

  const handleDeleteCondition = async (type: 'pre' | 'post', conditionId: string) => {
    await handleRemoveCondition(conditionId, type);
  };

  const handleUpdateCondition = async (conditionId: string, updates: Partial<BooleanCheck>) => {
    try {
      // Update local state
      const updatedPreConditions = preConditions.map(c => 
        c.id === conditionId ? { ...c, ...updates } : c
      );
      const updatedPostConditions = postConditions.map(c => 
        c.id === conditionId ? { ...c, ...updates } : c
      );

      setPreConditions(updatedPreConditions);
      setPostConditions(updatedPostConditions);

      const updatedMetadata = {
        ...module.metadata,
        pre_conditions: updatedPreConditions,
        post_conditions: updatedPostConditions,
        last_updated: new Date().toISOString()
      };

      const response = await fetch(`/api/modules/update/${module.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: updatedMetadata
        })
      });

      if (response.ok) {
        // Update local state
        setPreConditions(prev => 
          prev.map(c => c.id === conditionId ? { ...c, ...updates } : c)
        );
        setPostConditions(prev => 
          prev.map(c => c.id === conditionId ? { ...c, ...updates } : c)
        );
        toast.success('Condition updated successfully');
      } else {
        throw new Error('Failed to update condition');
      }
    } catch (error) {
      console.error('Error updating condition:', error);
      toast.error('Failed to update condition');
    }
  };

  const getConditionTypeIcon = (type: string) => {
    switch (type) {
      case 'validation':
        return <IconCircleCheck size={14} className="text-green-400" />;
      case 'authentication':
        return <IconKey size={14} className="text-blue-400" />;
      case 'authorization':
        return <IconShield size={14} className="text-purple-400" />;
      case 'data_integrity':
        return <IconDatabase size={14} className="text-cyan-400" />;
      case 'performance':
        return <IconBolt size={14} className="text-yellow-400" />;
      case 'availability':
        return <IconWifi size={14} className="text-orange-400" />;
      default:
        return <IconCode size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      {/* Module Header */}
      <div
        className="p-4 flex justify-between items-center cursor-pointer bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
        onClick={onToggle}
        style={{ borderLeft: `4px solid ${module.module_color}` }}
      >
        <div className="flex items-center min-w-0 flex-1 gap-3">
          {/* Module Icon */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <ModuleIcon size={20} style={{ color: module.module_color }} />
          </div>

          {/* Module Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-white truncate">{module.name}</h3>
              <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                {module.module_type}
              </span>
            </div>
            
            {/* Relationships Preview */}
            {relatedModules.length > 0 && (
              <div className="flex items-center mt-2 gap-2">
                <IconNetwork size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400">
                  {relatedModules.length} related module{relatedModules.length !== 1 ? 's' : ''}
                  {manualRelationships.length > 0 && (
                    <span className="text-blue-400 ml-1">({manualRelationships.length} manual)</span>
                  )}
                </span>
              </div>
            )}

            {/* Last Updated */}
            {module.updated_at && (
              <div className="flex items-center mt-1 gap-2">
                <IconClock size={12} className="text-gray-500" />
                <span className="text-xs text-gray-500">
                  Updated {formatLastUpdated(module.updated_at)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {/* Stats */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {module.dependency_count > 0 && (
              <span className="flex items-center gap-1">
                <IconLink size={12} />
                {module.dependency_count}
              </span>
            )}
            {module.submission_count > 0 && (
              <span className="flex items-center gap-1">
                <IconGitBranch size={12} />
                {module.submission_count}
              </span>
            )}
            {(preConditions.length + postConditions.length) > 0 && (
              <span className="flex items-center gap-1">
                <IconCheck size={12} />
                {preConditions.length + postConditions.length}
              </span>
            )}
          </div>

          {/* Expand Icon */}
          {isExpanded ? (
            <IconChevronUp size={20} className="text-gray-400" />
          ) : (
            <IconChevronDown size={20} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          {isEditing ? (
            /* Edit Mode */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full bg-gray-700 text-white rounded-md p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">File Path</label>
                  <input
                    type="text"
                    value={editForm.file_path}
                    onChange={(e) => setEditForm({...editForm, file_path: e.target.value})}
                    className="w-full bg-gray-700 text-white rounded-md p-2 text-sm"
                    placeholder="src/components/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">URL</label>
                  <input
                    type="url"
                    value={editForm.url}
                    onChange={(e) => setEditForm({...editForm, url: e.target.value})}
                    className="w-full bg-gray-700 text-white rounded-md p-2 text-sm"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full bg-gray-700 text-white rounded-md p-2 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Progress %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.completion_percentage}
                    onChange={(e) => setEditForm({...editForm, completion_percentage: parseInt(e.target.value) || 0})}
                    className="w-full bg-gray-700 text-white rounded-md p-2 text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-md p-2 text-sm h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                  placeholder="Add tags..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-md text-sm transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-4">
              {/* Module Details */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
                <p className="text-gray-300 leading-relaxed">
                  {module.description || 'No description provided.'}
                </p>
              </div>

              {/* File Path */}
              {module.file_path && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">File Path</h4>
                  <code className="text-sm text-green-400 bg-gray-900/50 px-2 py-1 rounded">
                    {module.file_path}
                  </code>
                </div>
              )}

              {/* URL */}
              {module.url && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Resource URL</h4>
                  <a
                    href={module.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 bg-gray-900/50 px-2 py-1 rounded inline-flex items-center gap-2 transition-colors"
                  >
                    <IconLink size={14} />
                    {module.url.includes('loom.com') ? 'Watch Loom Video' : 
                     module.url.includes('youtube.com') || module.url.includes('youtu.be') ? 'Watch YouTube Video' :
                     module.url.includes('github.com') ? 'View GitHub Repository' :
                     'Open Resource'}
                  </a>
                </div>
              )}

              {/* Loom Video Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <IconVideo size={16} />
                    Loom Video / Demo
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsEditingLoom(!isEditingLoom)}
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs flex items-center gap-1 transition-colors"
                  >
                    <IconEdit size={12} />
                    {isEditingLoom ? 'Done' : (module.metadata?.loom_video_url || module.url) ? 'Edit' : 'Add'}
                  </button>
                </div>

                {isEditingLoom ? (
                  <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Loom/Video URL</label>
                        <input
                          type="url"
                          value={tempLoomUrl}
                          onChange={(e) => setTempLoomUrl(e.target.value)}
                          className="w-full bg-gray-700 text-white rounded p-2 text-sm"
                          placeholder="https://www.loom.com/share/..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Description (optional)</label>
                        <input
                          type="text"
                          value={tempLoomDescription}
                          onChange={(e) => setTempLoomDescription(e.target.value)}
                          className="w-full bg-gray-700 text-white rounded p-2 text-sm"
                          placeholder="What does this video demonstrate?"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveLoom}
                          disabled={isSubmitting}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-md text-sm flex items-center gap-1 transition-colors"
                        >
                          <IconCheck size={16} />
                          {isSubmitting ? 'Saving...' : 'Save Video'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelLoom}
                          className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm flex items-center gap-1 transition-colors"
                        >
                          <IconX size={16} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (module.metadata?.loom_video_url || module.url) ? (
                  <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <IconVideo size={20} className="text-purple-400" />
                      <div>
                        <h5 className="text-white font-medium">Demo Video</h5>
                        <p className="text-sm text-gray-400">
                          {(module.metadata?.loom_video_url || module.url)?.includes('loom.com') ? 'Loom Recording' :
                           (module.metadata?.loom_video_url || module.url)?.includes('youtube.com') || (module.metadata?.loom_video_url || module.url)?.includes('youtu.be') ? 'YouTube Video' :
                           'Video Demo'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Video Preview (if Loom) */}
                    {(module.metadata?.loom_video_url || module.url)?.includes('loom.com') && (
                      <div className="mb-3">
                        <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-600">
                          <div className="text-center">
                            <IconVideo size={48} className="text-purple-400 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">Loom Video Preview</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <a
                        href={module.metadata?.loom_video_url || module.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <IconVideo size={16} />
                        Watch Video
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(module.metadata?.loom_video_url || module.url || '');
                          toast.success('Video URL copied to clipboard!');
                        }}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm flex items-center gap-2 transition-colors"
                        title="Copy video URL"
                      >
                        <IconLink size={16} />
                        Copy URL
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600 border-dashed">
                    <div className="text-center py-4">
                      <IconVideo size={24} className="text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm mb-3">No demo video added yet</p>
                      <button
                        type="button"
                        onClick={() => setIsEditingLoom(true)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm flex items-center gap-1 transition-colors mx-auto"
                      >
                        <IconVideo size={16} />
                        Add Loom Video
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {module.tags.length > 0 ? (
                    module.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs"
                      >
                        <IconTag size={12} className="inline mr-1" />
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No tags</span>
                  )}
                </div>
              </div>

              {/* Boolean Checks Section */}
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-xl p-6 border border-gray-600/50">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600/20 rounded-lg">
                      <IconCheck size={20} className="text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">Boolean Checks</h4>
                      <p className="text-sm text-gray-400">
                        {preConditions.length + postConditions.length} total checks
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditingConditions(!isEditingConditions)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm flex items-center gap-2 transition-all duration-200 hover:scale-105"
                  >
                    <IconSettings size={16} />
                    {isEditingConditions ? 'Done' : 'Manage'}
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Pre-Conditions */}
                  {preConditions.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                        <h5 className="text-base font-medium text-blue-400">
                          Pre-Conditions ({preConditions.length})
                        </h5>
                        <div className="flex-1 h-px bg-gradient-to-r from-blue-500/50 to-transparent"></div>
                      </div>
                      <div className="grid gap-3">
                        {preConditions.map((condition) => (
                          <div
                            key={condition.id}
                            className="group relative bg-gradient-to-r from-blue-900/30 to-blue-800/20 border border-blue-700/40 rounded-lg p-4 hover:border-blue-600/60 transition-all duration-200"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 mt-1">
                                <div className={`w-3 h-3 rounded-full ${
                                  condition.is_critical 
                                    ? 'bg-red-400 shadow-lg shadow-red-400/50' 
                                    : 'bg-blue-400 shadow-lg shadow-blue-400/50'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h6 className="text-base font-medium text-white group-hover:text-blue-100 transition-colors">
                                    {condition.name || 'Unnamed Condition'}
                                  </h6>
                                  <span className="px-2 py-1 bg-blue-600/30 text-blue-200 rounded-md text-xs font-medium border border-blue-500/30">
                                    {condition.check_type?.replace('_', ' ') || 'validation'}
                                  </span>
                                  {condition.is_critical && (
                                    <span className="px-2 py-1 bg-red-600/30 text-red-200 rounded-md text-xs font-medium border border-red-500/30 animate-pulse">
                                      Critical
                                    </span>
                                  )}
                                </div>
                                {condition.description && (
                                  <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                                    {condition.description}
                                  </p>
                                )}
                                <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700/50">
                                  <code className="text-sm text-green-300 font-mono leading-relaxed">
                                    {condition.condition_code || '// No code defined'}
                                  </code>
                                </div>
                              </div>
                              {isEditingConditions && (
                                <div className="flex-shrink-0">
                                  <button
                                    onClick={() => handleRemoveCondition(condition.id!, 'pre')}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                                    title="Delete condition"
                                  >
                                    <IconTrash size={18} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Post-Conditions */}
                  {postConditions.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                        <h5 className="text-base font-medium text-green-400">
                          Post-Conditions ({postConditions.length})
                        </h5>
                        <div className="flex-1 h-px bg-gradient-to-r from-green-500/50 to-transparent"></div>
                      </div>
                      <div className="grid gap-3">
                        {postConditions.map((condition) => (
                          <div
                            key={condition.id}
                            className="group relative bg-gradient-to-r from-green-900/30 to-green-800/20 border border-green-700/40 rounded-lg p-4 hover:border-green-600/60 transition-all duration-200"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 mt-1">
                                <div className={`w-3 h-3 rounded-full ${
                                  condition.is_critical 
                                    ? 'bg-red-400 shadow-lg shadow-red-400/50' 
                                    : 'bg-green-400 shadow-lg shadow-green-400/50'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h6 className="text-base font-medium text-white group-hover:text-green-100 transition-colors">
                                    {condition.name || 'Unnamed Condition'}
                                  </h6>
                                  <span className="px-2 py-1 bg-green-600/30 text-green-200 rounded-md text-xs font-medium border border-green-500/30">
                                    {condition.check_type?.replace('_', ' ') || 'validation'}
                                  </span>
                                  {condition.is_critical && (
                                    <span className="px-2 py-1 bg-red-600/30 text-red-200 rounded-md text-xs font-medium border border-red-500/30 animate-pulse">
                                      Critical
                                    </span>
                                  )}
                                </div>
                                {condition.description && (
                                  <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                                    {condition.description}
                                  </p>
                                )}
                                <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700/50">
                                  <code className="text-sm text-green-300 font-mono leading-relaxed">
                                    {condition.condition_code || '// No code defined'}
                                  </code>
                                </div>
                              </div>
                              {isEditingConditions && (
                                <div className="flex-shrink-0">
                                  <button
                                    onClick={() => handleRemoveCondition(condition.id!, 'post')}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                                    title="Delete condition"
                                  >
                                    <IconTrash size={18} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No checks message */}
                  {preConditions.length === 0 && postConditions.length === 0 && (
                    <div className="text-center py-12">
                      <div className="p-4 bg-gray-700/30 rounded-full w-fit mx-auto mb-4">
                        <IconCheck size={32} className="text-gray-500" />
                      </div>
                      <h5 className="text-lg font-medium text-gray-400 mb-2">No Boolean Checks</h5>
                      <p className="text-sm text-gray-500 mb-6">
                        Add pre and post conditions to validate your module's behavior
                      </p>
                      {!isEditingConditions && (
                        <button
                          onClick={() => setIsEditingConditions(true)}
                          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 mx-auto transition-all duration-200 hover:scale-105"
                        >
                          <IconPlus size={16} />
                          Add First Check
                        </button>
                      )}
                    </div>
                  )}

                  {/* Add New Condition Buttons */}
                  {isEditingConditions && (
                    <div className="flex gap-4 pt-6 border-t border-gray-600/50">
                      <button
                        onClick={() => {
                          setShowAddPreCondition(true);
                          setNewPreCondition({
                            name: '',
                            description: '',
                            check_type: 'validation',
                            condition_code: '',
                            expected_result: true,
                            is_critical: false
                          });
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-blue-500/25"
                      >
                        <IconPlus size={18} />
                        Add Pre-Condition
                      </button>
                      <button
                        onClick={() => {
                          setShowAddPostCondition(true);
                          setNewPostCondition({
                            name: '',
                            description: '',
                            check_type: 'validation',
                            condition_code: '',
                            expected_result: true,
                            is_critical: false
                          });
                        }}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-green-500/25"
                      >
                        <IconPlus size={18} />
                        Add Post-Condition
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Relationships Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <IconNetwork size={16} />
                    Related Modules ({relatedModules.length})
                  </h4>
                  <button
                    onClick={() => setIsEditingRelationships(!isEditingRelationships)}
                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs flex items-center gap-1 transition-colors"
                  >
                    <IconSettings size={12} />
                    {isEditingRelationships ? 'Done' : 'Manage'}
                  </button>
                </div>

                {loadingRelationships ? (
                  <div className="text-center py-4 text-gray-500">Loading relationships...</div>
                ) : relatedModules.length > 0 ? (
                  <div className="space-y-2">
                    {relatedModules.map((related) => (
                      <div
                        key={related.id}
                        className={`flex items-center justify-between p-3 rounded-md border ${
                          related.source === 'manual' ? 'bg-blue-900/20 border-blue-700/50' : 'bg-gray-700/50 border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {getRelationshipIcon(related.relationship_type)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-white truncate">{related.name}</div>
                              {related.source === 'manual' && (
                                <span className="text-xs bg-blue-600 text-blue-100 px-1.5 py-0.5 rounded">Manual</span>
                              )}
                              {related.source === 'auto' && (
                                <span className="text-xs bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded">Auto</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">{related.relationship_reason}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: related.module_color }}
                          />
                          {isEditingRelationships && (
                            <>
                              {related.source === 'manual' && related.relationship_id ? (
                                <button
                                  onClick={() => handleRemoveRelationship(related.relationship_id!)}
                                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                                  title="Remove manual relationship"
                                >
                                  <IconTrash size={14} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleIgnoreAutoRelationship(related.id)}
                                  className="p-1.5 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20 rounded transition-colors"
                                  title="Hide this automatic relationship"
                                >
                                  <IconX size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">No related modules found</div>
                )}

                {/* Add New Relationship */}
                {isEditingRelationships && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    {/* Show Hidden Relationships */}
                    {ignoredRelationships.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-xs font-medium text-gray-400 mb-2">
                          Hidden Automatic Relationships ({ignoredRelationships.length})
                        </h5>
                        <div className="space-y-1">
                          {ignoredRelationships.map((ignoredId) => {
                            const hiddenModule = allModules.find(m => m.id === ignoredId);
                            if (!hiddenModule) return null;
                            
                            return (
                              <div
                                key={ignoredId}
                                className="flex items-center justify-between p-2 bg-gray-800/50 rounded border border-gray-600"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className="text-sm text-gray-400 truncate">{hiddenModule.name}</div>
                                  <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">Hidden</span>
                                </div>
                                <button
                                  onClick={() => {
                                    const newIgnored = ignoredRelationships.filter(id => id !== ignoredId);
                                    saveIgnoredRelationships(newIgnored);
                                    toast.success('Relationship restored');
                                  }}
                                  className="p-1 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded transition-colors"
                                  title="Restore relationship"
                                >
                                  <IconCheck size={12} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {!showAddRelationship ? (
                      <button
                        onClick={() => setShowAddRelationship(true)}
                        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <IconPlus size={16} />
                        Add Relationship
                      </button>
                    ) : (
                      <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                        <h5 className="text-sm font-medium text-gray-300 mb-3">Add New Relationship</h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Module</label>
                            <select
                              value={newRelationship.moduleId}
                              onChange={(e) => setNewRelationship({...newRelationship, moduleId: e.target.value})}
                              className="w-full bg-gray-700 text-white rounded-md p-2 text-sm"
                            >
                              <option value="">Select a module...</option>
                              {availableModules.map((mod) => (
                                <option key={mod.id} value={mod.id}>
                                  {mod.name} ({mod.module_type})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Relationship Type</label>
                            <select
                              value={newRelationship.relationshipType}
                              onChange={(e) => setNewRelationship({...newRelationship, relationshipType: e.target.value})}
                              className="w-full bg-gray-700 text-white rounded-md p-2 text-sm"
                            >
                              <option value="related">Related</option>
                              <option value="dependency">Dependency</option>
                              <option value="required">Required</option>
                              <option value="optional">Optional</option>
                              <option value="testing">Testing</option>
                              <option value="component_family">Component Family</option>
                              <option value="video_demo">Video Demo</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Description (optional)</label>
                            <input
                              type="text"
                              value={newRelationship.description}
                              onChange={(e) => setNewRelationship({...newRelationship, description: e.target.value})}
                              placeholder="Custom relationship description..."
                              className="w-full bg-gray-700 text-white rounded-md p-2 text-sm"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleAddRelationship}
                              disabled={isSubmitting || !newRelationship.moduleId}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-md text-sm flex items-center gap-1 transition-colors"
                            >
                              <IconCheck size={14} />
                              {isSubmitting ? 'Adding...' : 'Add'}
                            </button>
                            <button
                              onClick={() => {
                                setShowAddRelationship(false);
                                setNewRelationship({ moduleId: '', relationshipType: 'related', description: '' });
                              }}
                              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm flex items-center gap-1 transition-colors"
                            >
                              <IconX size={14} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Module Updates History */}
              {moduleUpdates.length > 0 && (
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Update History ({moduleUpdates.length})</h4>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {loadingUpdates ? (
                      <div className="text-center py-2 text-gray-500">Loading updates...</div>
                    ) : (
                      moduleUpdates.map((update: any) => (
                        <div key={update.id} className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
                              {update.developer_profile_picture_url ? (
                                <img 
                                  src={update.developer_profile_picture_url} 
                                  alt={update.developer_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-500 flex items-center justify-center text-white text-xs">
                                  {update.developer_name?.charAt(0) || 'D'}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white">
                                  {update.developer_name}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(update.created_at).toLocaleDateString()} at {new Date(update.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                              <p className="text-sm text-gray-300 leading-relaxed">
                                {update.content}
                              </p>
                              
                              {/* Display admin response if available */}
                              {update.admin_response && (
                                <div className="mt-3 p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                      A
                                    </div>
                                    <span className="text-xs font-medium text-blue-300">
                                      Admin Response{update.admin_name ? ` from ${update.admin_name}` : ''}
                                    </span>
                                    {update.admin_response_at && (
                                      <span className="text-xs text-blue-400 ml-auto">
                                        {new Date(update.admin_response_at).toLocaleDateString()} at {new Date(update.admin_response_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">
                                    {update.admin_response}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowModuleEditor(true)}
                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-md text-sm flex items-center gap-1 transition-colors"
                  >
                    <IconEdit size={16} />
                    Edit Module
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-md text-sm flex items-center gap-1 transition-colors"
                  >
                    <IconTrash size={16} />
                    Delete
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {}}
                    className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-md text-sm flex items-center gap-1 transition-colors"
                  >
                    <IconPhoto size={16} />
                    Add Media
                  </button>
                </div>
              </div>

              {/* Add Update/Comment */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Add Update</h4>
                <div className="space-y-3">
                  <textarea
                    className="w-full bg-gray-700 text-white rounded-md p-3 text-sm resize-none"
                    rows={3}
                    placeholder="Add an update about this module..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  ></textarea>
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddComment}
                      disabled={isSubmitting || !commentText.trim()}
                      className={`px-3 py-1.5 ${
                        isSubmitting || !commentText.trim()
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-blue-700 hover:bg-blue-600'
                      } text-white rounded-md text-sm flex items-center gap-1 transition-colors`}
                    >
                      <IconSend size={16} />
                      {isSubmitting ? 'Sending...' : 'Send Update'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Module Editor Modal */}
      <ModuleEditor
        isOpen={showModuleEditor}
        onClose={() => setShowModuleEditor(false)}
        module={module}
        onSave={() => {
          setShowModuleEditor(false);
          onUpdate();
        }}
      />

      {/* Add Pre-Condition Modal */}
      {showAddPreCondition && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-600 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <IconCheck size={20} className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Add Pre-Condition</h3>
                </div>
                <button
                  onClick={() => setShowAddPreCondition(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <IconX size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Condition Name *
                  </label>
                  <input
                    type="text"
                    value={newPreCondition.name}
                    onChange={(e) => setNewPreCondition({ ...newPreCondition, name: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., User Authentication Check"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Check Type
                  </label>
                  <select
                    value={newPreCondition.check_type}
                    onChange={(e) => setNewPreCondition({ ...newPreCondition, check_type: e.target.value as any })}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newPreCondition.description}
                  onChange={(e) => setNewPreCondition({ ...newPreCondition, description: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe what this condition validates..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Condition Code *
                </label>
                <textarea
                  value={newPreCondition.condition_code}
                  onChange={(e) => setNewPreCondition({ ...newPreCondition, condition_code: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 text-green-300 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="// Example: Check if user is authenticated
if (!user || !user.isAuthenticated) {
  throw new Error('User must be authenticated');
}"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPreCondition.expected_result}
                    onChange={(e) => setNewPreCondition({ ...newPreCondition, expected_result: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Expected to pass</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPreCondition.is_critical}
                    onChange={(e) => setNewPreCondition({ ...newPreCondition, is_critical: e.target.checked })}
                    className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-300">Critical condition</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => setShowAddPreCondition(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPreCondition}
                disabled={!newPreCondition.name || !newPreCondition.condition_code}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Add Pre-Condition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Post-Condition Modal */}
      {showAddPostCondition && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-600 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600/20 rounded-lg">
                    <IconCheck size={20} className="text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Add Post-Condition</h3>
                </div>
                <button
                  onClick={() => setShowAddPostCondition(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <IconX size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Condition Name *
                  </label>
                  <input
                    type="text"
                    value={newPostCondition.name}
                    onChange={(e) => setNewPostCondition({ ...newPostCondition, name: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Data Validation Check"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Check Type
                  </label>
                  <select
                    value={newPostCondition.check_type}
                    onChange={(e) => setNewPostCondition({ ...newPostCondition, check_type: e.target.value as any })}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newPostCondition.description}
                  onChange={(e) => setNewPostCondition({ ...newPostCondition, description: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe what this condition validates..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Condition Code *
                </label>
                <textarea
                  value={newPostCondition.condition_code}
                  onChange={(e) => setNewPostCondition({ ...newPostCondition, condition_code: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-600 text-green-300 rounded-lg p-3 font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                  placeholder="// Example: Verify response data integrity
if (!response.data || !response.data.id) {
  throw new Error('Invalid response data');
}"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPostCondition.expected_result}
                    onChange={(e) => setNewPostCondition({ ...newPostCondition, expected_result: e.target.checked })}
                    className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-300">Expected to pass</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPostCondition.is_critical}
                    onChange={(e) => setNewPostCondition({ ...newPostCondition, is_critical: e.target.checked })}
                    className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-300">Critical condition</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => setShowAddPostCondition(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPostCondition}
                disabled={!newPostCondition.name || !newPostCondition.condition_code}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Add Post-Condition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Compact Grid Module Card Component
export const ModuleGridCard = ({
  module,
  taskId,
  allModules,
  onUpdate,
  onMediaPreview,
  moduleIcon: ModuleIcon,
  onClick
}: ModuleCardProps & { onClick: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusIcon = () => {
    switch (module.status) {
      case 'completed':
        return <IconCircleCheck className="text-green-400" size={16} />;
      case 'in_progress':
        return <IconClock className="text-yellow-400" size={16} />;
      case 'blocked':
        return <IconAlertTriangle className="text-red-400" size={16} />;
      default:
        return <IconCircle className="text-gray-400" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/30 border-green-700/50';
      case 'in_progress':
        return 'bg-yellow-900/30 border-yellow-700/50';
      case 'blocked':
        return 'bg-red-900/30 border-red-700/50';
      default:
        return 'bg-gray-800/50 border-gray-700';
    }
  };

  const formatLastUpdated = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${getStatusColor(module.status)} ${
        isHovered ? 'scale-105 shadow-xl' : ''
      }`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ borderLeft: `4px solid ${module.module_color}` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <ModuleIcon size={20} style={{ color: module.module_color }} />
          {getStatusIcon()}
        </div>
        <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
          {module.module_type.replace('_', ' ')}
        </span>
      </div>

      {/* Module Name */}
      <h3 className="font-medium text-white text-sm mb-2 line-clamp-2 leading-tight">
        {module.name}
      </h3>

      {/* Description Preview */}
      <p className="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">
        {module.description || 'No description'}
      </p>

      {/* Progress Bar */}
      {module.completion_percentage > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Progress</span>
            <span className="text-xs text-white font-medium">
              {module.completion_percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${module.completion_percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Tags */}
      {module.tags && module.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {module.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="px-1.5 py-0.5 bg-gray-700/50 text-gray-300 rounded text-xs"
            >
              {tag}
            </span>
          ))}
          {module.tags.length > 2 && (
            <span className="px-1.5 py-0.5 bg-gray-700/50 text-gray-400 rounded text-xs">
              +{module.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Footer Stats */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          {module.dependency_count > 0 && (
            <span className="flex items-center gap-1">
              <IconLink size={10} />
              {module.dependency_count}
            </span>
          )}
          {module.submission_count > 0 && (
            <span className="flex items-center gap-1">
              <IconGitBranch size={10} />
              {module.submission_count}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {formatLastUpdated(module.updated_at)}
        </span>
      </div>

      {/* Boolean Checks Indicator */}
      {((module.metadata?.pre_conditions && module.metadata.pre_conditions.length > 0) || 
        (module.metadata?.post_conditions && module.metadata.post_conditions.length > 0)) && (
        <div className="flex items-center gap-1 mt-2">
          <IconCheck size={12} className="text-green-400" />
          <span className="text-xs text-green-400">
            {(module.metadata?.pre_conditions?.length || 0) + (module.metadata?.post_conditions?.length || 0)} checks
          </span>
        </div>
      )}
    </div>
  );
}; 