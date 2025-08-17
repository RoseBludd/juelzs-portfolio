'use client';

import { 
  IconProgress,
  IconCode,
  IconVideo,
  IconUpload,
  IconCheck,
  IconAlert,
  IconClock,
  IconFileText,
  IconList,
  IconUsers,
  IconTrendingUp,
  IconTarget,
  IconEdit,
  IconPlay,
  IconPause,
  IconSquare,
  IconClipboardCheck,
  IconBolt
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface TaskModule {
  id: string;
  name: string;
  description: string;
  status: string;
  completion_percentage: number;
  module_type: string;
  url?: string;
  metadata?: {
    loom_video_url?: string;
    implementationNotes?: string;
  };
  created_at: string;
  has_scribe: boolean;
  has_loom_video: boolean;
  has_code_submission: boolean;
}

interface ProgressUpdate {
  id: string;
  content: string;
  percentage_complete?: number;
  created_at: string;
}

interface TaskRequirement {
  id: string;
  requirement: string;
  completed: boolean;
}

interface AcceptanceCriteria {
  id: string;
  criteria: string;
  completed: boolean;
}

interface EnhancedTaskData {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  completion_percentage: number;
  estimated_hours: number;
  time_spent_hours: number;
  requirements: TaskRequirement[];
  acceptance_criteria: AcceptanceCriteria[];
  modules: TaskModule[];
  progress_updates: ProgressUpdate[];
  daily_priority: boolean;
  required_submissions: {
    cursor_chats: number;
    loom_videos: number;
    code_submissions: number;
    module_scribes: number;
  };
  completed_submissions: {
    cursor_chats: number;
    loom_videos: number;
    code_submissions: number;
    module_scribes: number;
  };
}

interface EnhancedTaskViewProps {
  taskId: string;
}

export const EnhancedTaskView = ({ taskId }: EnhancedTaskViewProps) => {
  const [task, setTask] = useState<EnhancedTaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [progressUpdate, setProgressUpdate] = useState('');
  const [percentageUpdate, setPercentageUpdate] = useState<number>(0);
  const [submittingProgress, setSubmittingProgress] = useState(false);
  const [workingOnTask, setWorkingOnTask] = useState(false);

  useEffect(() => {
    loadTaskData();
  }, [taskId]);

  const loadTaskData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/developer/tasks/${taskId}/enhanced`);
      if (response.ok) {
        const taskData = await response.json();
        setTask(taskData);
        setPercentageUpdate(taskData.completion_percentage || 0);
      } else {
        toast.error('Failed to load task data');
      }
    } catch (error) {
      console.error('Error loading task data:', error);
      toast.error('Failed to load task data');
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = async () => {
    if (!progressUpdate.trim()) {
      toast.error('Please provide a progress update');
      return;
    }

    if (percentageUpdate < 0 || percentageUpdate > 100) {
      toast.error('Percentage must be between 0 and 100');
      return;
    }

    try {
      setSubmittingProgress(true);
      const response = await fetch('/api/developer/progress-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: progressUpdate,
          task_id: taskId,
          percentage_complete: percentageUpdate
        })
      });

      if (response.ok) {
        toast.success('Progress update submitted!');
        setProgressUpdate('');
        loadTaskData();
      } else {
        toast.error('Failed to submit progress update');
      }
    } catch (error) {
      console.error('Error submitting progress:', error);
      toast.error('Failed to submit progress update');
    } finally {
      setSubmittingProgress(false);
    }
  };

  const handleStartWorking = async () => {
    try {
      // Set daily priority
      const priorityResponse = await fetch('/api/developer/daily-priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId })
      });

      // Start work session
      const workResponse = await fetch('/api/developer/work-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });

      if (priorityResponse.ok && workResponse.ok) {
        setWorkingOnTask(true);
        toast.success('Started working on task!');
        loadTaskData();
      } else {
        toast.error('Failed to start working');
      }
    } catch (error) {
      console.error('Error starting work:', error);
      toast.error('Failed to start working');
    }
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage === 100) return 'text-green-400 bg-green-500';
    if (percentage >= 75) return 'text-blue-400 bg-blue-500';
    if (percentage >= 50) return 'text-yellow-400 bg-yellow-500';
    if (percentage >= 25) return 'text-orange-400 bg-orange-500';
    return 'text-red-400 bg-red-500';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'low': return 'text-green-400 bg-green-900/20 border-green-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const isSubmissionComplete = (required: number, completed: number) => {
    return completed >= required;
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-2/3"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg text-center">
        <IconAlert className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Task Not Found</h3>
        <p className="text-gray-400">The requested task could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Task Header */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{task.title}</h1>
              {task.daily_priority && (
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                  Today's Priority
                </span>
              )}
            </div>
            <p className="text-gray-400 mb-4">{task.description}</p>
            
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm border ${getPriorityColor(task.priority)}`}>
                {task.priority} priority
              </span>
              <span className="text-gray-400 text-sm">
                Est. {task.estimated_hours}h • Spent {task.time_spent_hours.toFixed(1)}h
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleStartWorking}
              disabled={workingOnTask}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                workingOnTask 
                  ? 'bg-green-600 text-white cursor-default' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {workingOnTask ? (
                <>
                  <IconPlay className="w-4 h-4 inline mr-2" />
                  Working
                </>
              ) : (
                <>
                  <IconTarget className="w-4 h-4 inline mr-2" />
                  Start Working
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Overall Progress</span>
            <span className="text-sm font-medium text-white">{task.completion_percentage}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${getCompletionColor(task.completion_percentage)}`}
              style={{ width: `${task.completion_percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Daily Submission Requirements */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-3 rounded-lg border ${
            isSubmissionComplete(task.required_submissions.cursor_chats, task.completed_submissions.cursor_chats)
              ? 'bg-green-900/20 border-green-500/30' 
              : 'bg-red-900/20 border-red-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <IconUpload className="w-4 h-4" />
              <span className="text-sm font-medium">Cursor Chats</span>
            </div>
            <div className="text-lg font-bold">
              {task.completed_submissions.cursor_chats} / {task.required_submissions.cursor_chats}
            </div>
          </div>

          <div className={`p-3 rounded-lg border ${
            isSubmissionComplete(task.required_submissions.loom_videos, task.completed_submissions.loom_videos)
              ? 'bg-green-900/20 border-green-500/30' 
              : 'bg-red-900/20 border-red-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <IconVideo className="w-4 h-4" />
              <span className="text-sm font-medium">Loom Videos</span>
            </div>
            <div className="text-lg font-bold">
              {task.completed_submissions.loom_videos} / {task.required_submissions.loom_videos}
            </div>
          </div>

          <div className={`p-3 rounded-lg border ${
            isSubmissionComplete(task.required_submissions.code_submissions, task.completed_submissions.code_submissions)
              ? 'bg-green-900/20 border-green-500/30' 
              : 'bg-red-900/20 border-red-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <IconCode className="w-4 h-4" />
              <span className="text-sm font-medium">Code Submissions</span>
            </div>
            <div className="text-lg font-bold">
              {task.completed_submissions.code_submissions} / {task.required_submissions.code_submissions}
            </div>
          </div>

          <div className={`p-3 rounded-lg border ${
            isSubmissionComplete(task.required_submissions.module_scribes, task.completed_submissions.module_scribes)
              ? 'bg-green-900/20 border-green-500/30' 
              : 'bg-red-900/20 border-red-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <IconFileText className="w-4 h-4" />
              <span className="text-sm font-medium">Module Scribes</span>
            </div>
            <div className="text-lg font-bold">
              {task.completed_submissions.module_scribes} / {task.required_submissions.module_scribes}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-800 rounded-lg">
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: IconTarget },
              { id: 'modules', name: `Modules (${task.modules.length})`, icon: IconCode },
              { id: 'progress', name: 'Progress Updates', icon: IconTrendingUp },
              { id: 'requirements', name: 'Requirements', icon: IconList }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 inline mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Progress Update Form */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Submit Progress Update</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Progress Description
                    </label>
                    <textarea
                      value={progressUpdate}
                      onChange={(e) => setProgressUpdate(e.target.value)}
                      placeholder="Describe what you've accomplished, challenges faced, and next steps..."
                      className="w-full bg-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Completion %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={percentageUpdate}
                      onChange={(e) => setPercentageUpdate(parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="mt-2 text-xs text-gray-400">
                      Current: {task.completion_percentage}%
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleProgressUpdate}
                  disabled={submittingProgress || !progressUpdate.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {submittingProgress ? 'Submitting...' : 'Submit Update'}
                </button>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/developer/cursor-chats"
                  className="p-4 bg-purple-600/20 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-colors"
                >
                  <IconUpload className="w-6 h-6 text-purple-400 mb-2" />
                  <h4 className="font-semibold text-white">Upload Cursor Chat</h4>
                  <p className="text-sm text-purple-300">Share your coding conversations</p>
                </Link>

                <button
                  onClick={() => toast.info('Create a loom video for this task')}
                  className="p-4 bg-red-600/20 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-colors"
                >
                  <IconVideo className="w-6 h-6 text-red-400 mb-2" />
                  <h4 className="font-semibold text-white">Record Loom Video</h4>
                  <p className="text-sm text-red-300">Show your progress visually</p>
                </button>

                <Link
                  href="/developer/registry"
                  className="p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors"
                >
                  <IconCode className="w-6 h-6 text-blue-400 mb-2" />
                  <h4 className="font-semibold text-white">Create Module</h4>
                  <p className="text-sm text-blue-300">Build reusable components</p>
                </Link>
              </div>
            </div>
          )}

          {/* Modules Tab */}
          {activeTab === 'modules' && (
            <div className="space-y-4">
              {task.modules.length === 0 ? (
                <div className="text-center py-8">
                  <IconCode className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Modules Created</h3>
                  <p className="text-gray-400 mb-4">Start by creating your first module for this task</p>
                  <Link
                    href="/developer/registry"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Create Module
                  </Link>
                </div>
              ) : (
                task.modules.map((module) => (
                  <div key={module.id} className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-white">{module.name}</h4>
                        <p className="text-gray-400 text-sm">{module.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        module.completion_percentage === 100 
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {module.completion_percentage}% complete
                      </span>
                    </div>

                    {/* Module Requirements Checklist */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className={`flex items-center gap-2 ${
                        module.has_scribe ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {module.has_scribe ? <IconCheck className="w-4 h-4" /> : <IconAlert className="w-4 h-4" />}
                        <span className="text-sm">Scribe Documentation</span>
                      </div>
                      
                      <div className={`flex items-center gap-2 ${
                        module.has_loom_video ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {module.has_loom_video ? <IconCheck className="w-4 h-4" /> : <IconAlert className="w-4 h-4" />}
                        <span className="text-sm">Loom Video</span>
                      </div>
                      
                      <div className={`flex items-center gap-2 ${
                        module.has_code_submission ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {module.has_code_submission ? <IconCheck className="w-4 h-4" /> : <IconAlert className="w-4 h-4" />}
                        <span className="text-sm">Code Submission</span>
                      </div>
                    </div>

                    {/* Missing Requirements Alert */}
                    {(!module.has_scribe || !module.has_loom_video || !module.has_code_submission) && (
                      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3">
                        <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-1">
                          <IconAlert className="w-4 h-4" />
                          Missing Requirements
                        </div>
                        <ul className="text-yellow-300 text-sm space-y-1">
                          {!module.has_scribe && <li>• Add detailed scribe documentation explaining how this module works</li>}
                          {!module.has_loom_video && <li>• Record a loom video demonstrating the module functionality</li>}
                          {!module.has_code_submission && <li>• Submit the complete code implementation</li>}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      <span className="text-gray-400 text-sm">
                        Created {new Date(module.created_at).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/developer/registry?module=${module.id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Progress Updates Tab */}
          {activeTab === 'progress' && (
            <div className="space-y-4">
              {task.progress_updates.length === 0 ? (
                <div className="text-center py-8">
                  <IconTrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Progress Updates</h3>
                  <p className="text-gray-400">Submit your first progress update above</p>
                </div>
              ) : (
                task.progress_updates.map((update) => (
                  <div key={update.id} className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm text-gray-400">
                        {new Date(update.created_at).toLocaleString()}
                      </div>
                      {update.percentage_complete !== undefined && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                          {update.percentage_complete}% complete
                        </span>
                      )}
                    </div>
                    <div className="text-white leading-relaxed whitespace-pre-wrap">
                      {update.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Requirements Tab */}
          {activeTab === 'requirements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Requirements */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Requirements</h3>
                <div className="space-y-3">
                  {task.requirements.map((req) => (
                    <div key={req.id} className="flex items-start gap-3">
                      <div className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center ${
                        req.completed 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-500'
                      }`}>
                        {req.completed && <IconCheck className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm ${req.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                        {req.requirement}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acceptance Criteria */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Acceptance Criteria</h3>
                <div className="space-y-3">
                  {task.acceptance_criteria.map((criteria) => (
                    <div key={criteria.id} className="flex items-start gap-3">
                      <div className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center ${
                        criteria.completed 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-500'
                      }`}>
                        {criteria.completed && <IconCheck className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm ${criteria.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                        {criteria.criteria}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 