"use client";

import {
  IconX,
  IconSearch,
  IconChevronDown,
  IconTarget,
  IconCalendar,
  IconFlag,
  IconArrowRight,
  IconAlertCircle
} from "@tabler/icons-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  task_status?: string;
  created_at?: string;
  updated_at?: string;
  assignment_status?: string;
  notes?: any[];
  start_date?: string;
  due_date?: string;
  completed_at?: string | null;
}

interface TaskSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSelected: (taskId: string) => void;
}

export const TaskSelectionModal = ({
  isOpen,
  onClose,
  onTaskSelected
}: TaskSelectionModalProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Load assigned tasks when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAssignedTasks();
    }
  }, [isOpen]);

  const loadAssignedTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tasks/assigned', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });

      if (response.ok) {
        const tasksData = await response.json();
        const normalizedTasks = tasksData.map((task: any) => ({
          ...task,
          status: task.task_status || task.status || "assigned"
        }));
        setTasks(normalizedTasks);
      } else {
        toast.error('Failed to load assigned tasks');
      }
    } catch (error) {
      console.error('Error loading assigned tasks:', error);
      toast.error('Failed to load assigned tasks');
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks based on search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    
    const query = searchQuery.toLowerCase();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Not available';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getPriorityColor = (priority: string | undefined) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'bg-red-500/20 text-red-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'low':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400';
      case 'assigned':
      case 'todo':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleNext = () => {
    if (selectedTaskId) {
      onTaskSelected(selectedTaskId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-white">Select Task for Module</h2>
            <p className="text-sm text-gray-400 mt-1">Choose which task this module belongs to</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <IconX size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-700 flex-shrink-0">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title or description..."
              className="w-full bg-gray-700 text-white rounded-md pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
            />
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-400">Loading your assigned tasks...</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              {tasks.length === 0 ? (
                <>
                  <IconAlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">No Assigned Tasks</h3>
                  <p className="text-gray-400 mb-4">You don't have any assigned tasks yet.</p>
                  <p className="text-sm text-gray-500">Contact your project manager to get assigned to tasks.</p>
                </>
              ) : (
                <>
                  <IconSearch className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">No Tasks Found</h3>
                  <p className="text-gray-400">No tasks match your search criteria.</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskSelect(task.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedTaskId === task.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700/30 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-medium mb-2">{task.title}</h3>
                      {task.description && (
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{task.description}</p>
                      )}
                      
                      <div className="flex items-center gap-3 text-xs">
                        {task.priority && (
                          <span className={`px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                            <IconFlag size={12} className="inline mr-1" />
                            {task.priority} priority
                          </span>
                        )}
                        
                        <span className={`px-2 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
                          <IconTarget size={12} className="inline mr-1" />
                          {task.status?.replace('_', ' ') || 'assigned'}
                        </span>
                        
                        {task.created_at && (
                          <span className="text-gray-500 flex items-center">
                            <IconCalendar size={12} className="mr-1" />
                            Created {formatDate(task.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                        selectedTaskId === task.id
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-500'
                      }`}>
                        {selectedTaskId === task.id && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleNext}
            disabled={!selectedTaskId}
            className={`px-6 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
              selectedTaskId
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Next: Create Module
            <IconArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}; 