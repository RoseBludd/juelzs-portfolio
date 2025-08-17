import {
  IconChevronDown,
  IconChevronUp,
  IconCircleCheck,
  IconCircle,
  IconPhoto,
  IconSend,
} from "@tabler/icons-react";
import { useState } from "react";

import { Milestone } from "@/hooks/useTaskDetails";
import { 
  getMilestoneHeaderBgColor, 
  getMilestoneProgressColor, 
  getStatusColor,
  formatDate 
} from "@/utils/taskHelpers";

import { MilestoneUpdateItem } from "./MilestoneUpdateItem";

interface MilestoneCardProps {
  milestone: Milestone;
  taskId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onStatusUpdate: (milestoneId: string, status: string) => void;
  onAddComment: (milestoneId: string, content: string) => Promise<boolean>;
  onDeleteUpdate: (milestoneId: string, updateId: string) => void;
  onOpenMediaUpload: (milestoneId: string) => void;
  onMediaPreview: (mediaFiles: any[], index?: number) => void;
  statusUpdateLoading: { [key: string]: boolean };
  isSubmitting: boolean;
  deletingUpdateId: string | null;
}

export const MilestoneCard = ({
  milestone,
  taskId,
  isExpanded,
  onToggle,
  onStatusUpdate,
  onAddComment,
  onDeleteUpdate,
  onOpenMediaUpload,
  onMediaPreview,
  statusUpdateLoading,
  isSubmitting,
  deletingUpdateId
}: MilestoneCardProps) => {
  const [commentText, setCommentText] = useState("");

  const handleAddComment = async () => {
    const success = await onAddComment(milestone.id, commentText);
    if (success) {
      setCommentText("");
    }
  };

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      {/* Milestone header */}
      <div
        className={`p-4 flex justify-between items-center cursor-pointer ${getMilestoneHeaderBgColor(milestone.status)}`}
        onClick={onToggle}
      >
        <div className="flex items-center min-w-0 flex-1">
          <div className="mr-3 flex-shrink-0">
            {milestone.status === 'completed' ? (
              <IconCircleCheck className="text-purple-400" size={24} />
            ) : milestone.status === 'in_progress' ? (
              <IconCircle className="text-yellow-400" size={24} />
            ) : (
              <IconCircle className="text-gray-400" size={24} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-white truncate">{milestone.title}</h3>
            <div className="flex items-center mt-1 gap-2">
              <div className="w-24 sm:w-32 bg-gray-700 rounded-full h-1.5 flex-shrink-0">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${getMilestoneProgressColor(milestone.status)}`}
                  style={{ width: `${milestone.completion_percentage}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{milestone.completion_percentage}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${getStatusColor(milestone.status)}`}>
            {milestone.status.replace('_', ' ')}
          </span>
          {isExpanded ? (
            <IconChevronUp size={20} className="text-gray-400" />
          ) : (
            <IconChevronDown size={20} className="text-gray-400" />
          )}
        </div>
      </div>

      {/* Milestone details */}
      {isExpanded && (
        <div className="p-4 bg-gray-800">
          {/* Description */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
            <p className="text-gray-300 leading-relaxed">{milestone.description || 'No description provided.'}</p>
          </div>

          {/* Due date */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Due Date</h4>
            <p className="text-gray-300">{formatDate(milestone.due_date)}</p>
          </div>

          {/* Status update section */}
          <div className="mb-4 border-t border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Update Status</h4>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <select
                className="bg-gray-700 text-white rounded-md px-3 py-2 text-sm flex-shrink-0"
                value={milestone.status}
                onChange={(e) => onStatusUpdate(milestone.id, e.target.value)}
                disabled={statusUpdateLoading[milestone.id]}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              {statusUpdateLoading[milestone.id] && (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 flex-shrink-0"></div>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Update the milestone status to reflect your progress.
            </p>
          </div>

          {/* Updates */}
          {milestone.updates && milestone.updates.length > 0 && (
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Updates</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {milestone.updates.map((update) => (
                  <MilestoneUpdateItem
                    key={update.id}
                    update={update}
                    deletingUpdateId={deletingUpdateId}
                    onDelete={(updateId) => onDeleteUpdate(milestone.id, updateId)}
                    onMediaPreview={onMediaPreview}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Add comment */}
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Add Comment</h4>
            <div className="space-y-3">
              <textarea
                className="w-full bg-gray-700 text-white rounded-md p-3 text-sm resize-none"
                rows={3}
                placeholder="Add a comment or update about this milestone..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              ></textarea>
              <div className="flex flex-col sm:flex-row justify-between gap-2">
                <button
                  onClick={() => onOpenMediaUpload(milestone.id)}
                  className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-md text-sm flex items-center justify-center transition-colors"
                >
                  <IconPhoto size={16} className="mr-1" />
                  Add Media
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={isSubmitting || !commentText.trim()}
                  className={`px-3 py-1.5 ${
                    isSubmitting || !commentText.trim()
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-blue-700 hover:bg-blue-600'
                  } text-white rounded-md text-sm flex items-center justify-center transition-colors`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <IconSend size={16} className="mr-1" />
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 