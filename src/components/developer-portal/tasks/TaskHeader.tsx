import {
  IconChevronLeft,
  IconClock,
  IconCalendar,
  IconBuildingFactory2,
  IconCategory,
  IconTag,
  IconDatabase,
  IconEdit,
  IconCheck,
  IconX,
  IconCode
} from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";

import { TaskDetails } from "@/hooks/useTaskDetails";
import { getStatusColor, getPriorityColor, calculateOverallProgress, formatDate } from "@/utils/taskHelpers";

interface TaskHeaderProps {
  task: TaskDetails;
}

export const TaskHeader = ({ task }: TaskHeaderProps) => {
  const [isEditingDbUrl, setIsEditingDbUrl] = useState(false);
  const [dbUrl, setDbUrl] = useState((task as any)?.database_url || 'postgresql://neondb_owner:npg_Y0CM8vIVoilD@ep-young-sun-a52te82c-pooler.us-east-2.aws.neon.tech/neondb');
  const [tempDbUrl, setTempDbUrl] = useState('');

  const handleEditDbUrl = () => {
    setTempDbUrl(dbUrl);
    setIsEditingDbUrl(true);
  };

  const handleSaveDbUrl = async () => {
    // TODO: Add API call to save database URL
    setDbUrl(tempDbUrl);
    setIsEditingDbUrl(false);
  };

  const handleCancelDbUrl = () => {
    setTempDbUrl('');
    setIsEditingDbUrl(false);
  };

  const formatLastUpdated = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return formatDate(timestamp);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white break-words">
          {task.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ').toUpperCase()}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${getPriorityColor(task.priority)}`}>
            {task.priority.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center text-gray-300 min-w-0">
          <IconCalendar size={20} className="mr-2 text-gray-400 flex-shrink-0" />
          <span className="truncate">Due: {formatDate(task.due_date)}</span>
        </div>
        <div className="flex items-center text-gray-300 min-w-0">
          <IconClock size={20} className="mr-2 text-gray-400 flex-shrink-0" />
          <span className="truncate">Est. Time: {task.estimated_time || 'Not specified'} hours</span>
        </div>
        <div className="flex items-center text-gray-300 min-w-0">
          <IconBuildingFactory2 size={20} className="mr-2 text-gray-400 flex-shrink-0" />
          <span className="truncate">Department: {task.department_display_name || task.department}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div className="flex items-center text-gray-300 min-w-0">
          <IconCategory size={20} className="mr-2 text-gray-400 flex-shrink-0" />
          <span className="truncate">Category: {task.category.replace('_', ' ')}</span>
        </div>
        <div className="flex items-center text-gray-300 min-w-0">
          <IconTag size={20} className="mr-2 text-gray-400 flex-shrink-0" />
          <span className="truncate">Complexity: {task.complexity}</span>
        </div>
        <div className="flex items-center text-gray-300 min-w-0">
          <IconClock size={20} className="mr-2 text-gray-400 flex-shrink-0" />
          <span className="truncate">Updated: {formatLastUpdated(task.updated_at)}</span>
        </div>
      </div>

      {/* Database URL Section */}
      <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
        <h3 className="text-md font-medium text-white mb-2 flex items-center">
          <IconDatabase size={20} className="mr-2 text-gray-400" />
          Database Connection
        </h3>
        
        {isEditingDbUrl ? (
          <div className="space-y-3">
            <textarea
              value={tempDbUrl}
              onChange={(e) => setTempDbUrl(e.target.value)}
              placeholder="postgresql://username:password@host:port/database"
              className="w-full bg-gray-800 text-white rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 font-mono h-20 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveDbUrl}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm flex items-center gap-1 transition-colors"
              >
                <IconCheck size={16} />
                Save
              </button>
              <button
                onClick={handleCancelDbUrl}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm flex items-center gap-1 transition-colors"
              >
                <IconX size={16} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <code className="bg-gray-800 px-3 py-2 rounded text-green-400 font-mono text-sm break-all flex-1">
                {dbUrl}
              </code>
              <button
                onClick={handleEditDbUrl}
                className="text-gray-400 hover:text-gray-300 flex-shrink-0"
              >
                <IconEdit size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Components in this task connect to this database
            </p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-400">Overall Progress</span>
          <span className="text-sm text-gray-400">{calculateOverallProgress(
            task.milestones,
            task.requirements,
            task.acceptance_criteria,
            task.completed_requirements,
            task.completed_acceptance_criteria
          )}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${calculateOverallProgress(
              task.milestones,
              task.requirements,
              task.acceptance_criteria,
              task.completed_requirements,
              task.completed_acceptance_criteria
            )}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}; 