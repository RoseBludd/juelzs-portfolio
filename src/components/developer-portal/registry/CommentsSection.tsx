"use client";

import { IconMessage, IconUser, IconCalendar, IconTag, IconTrash, IconPlus, IconBulb, IconBug, IconTool, IconThumbUp } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Comment {
  id: string;
  comment: string;
  comment_type: 'feedback' | 'modification' | 'issue' | 'improvement' | 'general';
  version?: string;
  created_at: string;
  updated_at: string;
  developer_id: string;
  developer_name: string;
  developer_email: string;
  developer_avatar?: string;
  usage_purpose?: string;
  project_context?: string;
}

interface CommentsSectionProps {
  moduleId: string;
  version?: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
  } | null;
  onCommentAdded?: (count: number) => void;
}

const COMMENT_TYPES = {
  feedback: { 
    label: 'Feedback', 
    icon: IconThumbUp, 
    color: 'text-green-400', 
    bgColor: 'bg-green-900/20 border-green-700/50',
    description: 'General feedback about the module'
  },
  modification: { 
    label: 'Modification', 
    icon: IconTool, 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-900/20 border-blue-700/50',
    description: 'Changes or adaptations made'
  },
  issue: { 
    label: 'Issue', 
    icon: IconBug, 
    color: 'text-red-400', 
    bgColor: 'bg-red-900/20 border-red-700/50',
    description: 'Problems or bugs encountered'
  },
  improvement: { 
    label: 'Improvement', 
    icon: IconBulb, 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-900/20 border-yellow-700/50',
    description: 'Suggestions for enhancement'
  },
  general: { 
    label: 'General', 
    icon: IconMessage, 
    color: 'text-gray-400', 
    bgColor: 'bg-gray-700/30 border-gray-600',
    description: 'General comments'
  }
};

export function CommentsSection({ moduleId, version, currentUser, onCommentAdded }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddComment, setShowAddComment] = useState(false);
  const [newComment, setNewComment] = useState({
    comment: '',
    commentType: 'general' as keyof typeof COMMENT_TYPES
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [moduleId, version]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ moduleId });
      if (version) params.append('version', version);

      const response = await fetch(`/api/registry/comments?${params}`);
      const data = await response.json();

      if (response.ok) {
        setComments(data.comments || []);
      } else {
        console.error('Failed to load comments:', data.error);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!currentUser) {
      toast.error('Please log in to add comments');
      return;
    }

    if (!newComment.comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/registry/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          developerId: currentUser.id,
          comment: newComment.comment.trim(),
          commentType: newComment.commentType,
          version: version || null
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Comment added successfully');
        setNewComment({ comment: '', commentType: 'general' });
        setShowAddComment(false);
        loadComments();
        onCommentAdded?.(result.commentCount);
      } else {
        toast.error(result.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return;

    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/registry/comments?commentId=${commentId}&developerId=${currentUser.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Comment deleted successfully');
        loadComments();
      } else {
        toast.error(result.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
              <div className="w-24 h-4 bg-gray-600 rounded"></div>
            </div>
            <div className="w-full h-16 bg-gray-600 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-white font-medium flex items-center gap-2">
          <IconMessage size={18} />
          Community Feedback
          {comments.length > 0 && (
            <span className="text-sm text-gray-400">({comments.length})</span>
          )}
        </h4>
        {currentUser && (
          <button
            onClick={() => setShowAddComment(!showAddComment)}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
          >
            <IconPlus size={14} />
            Add Comment
          </button>
        )}
      </div>

      {/* Add Comment Form */}
      {showAddComment && currentUser && (
        <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-4">
          <div className="space-y-3">
            {/* Comment Type Selector */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Comment Type</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(COMMENT_TYPES).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => setNewComment(prev => ({ ...prev, commentType: type as keyof typeof COMMENT_TYPES }))}
                      className={`p-2 rounded text-xs border transition-colors ${
                        newComment.commentType === type
                          ? config.bgColor
                          : 'bg-gray-600/50 border-gray-500 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={newComment.commentType === type ? config.color : 'text-gray-400'} />
                        <span className="text-white">{config.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {COMMENT_TYPES[newComment.commentType].description}
              </p>
            </div>

            {/* Comment Text */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Your Comment</label>
              <textarea
                value={newComment.comment}
                onChange={(e) => setNewComment(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your experience, modifications, or feedback..."
                className="w-full px-3 py-2 bg-gray-600 text-white rounded text-sm border border-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={4}
                maxLength={1000}
              />
              <div className="text-xs text-gray-400 mt-1">
                {newComment.comment.length}/1000 characters
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddComment(false)}
                className="px-3 py-1 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComment}
                disabled={!newComment.comment.trim() || isSubmitting}
                className="px-4 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded text-sm transition-colors"
              >
                {isSubmitting ? 'Adding...' : 'Add Comment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <IconMessage size={48} className="mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400 mb-2">No comments yet</p>
            <p className="text-sm text-gray-500">
              Be the first to share your experience with this module
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const typeConfig = COMMENT_TYPES[comment.comment_type];
            const Icon = typeConfig.icon;
            
            return (
              <div key={comment.id} className={`border rounded-lg p-4 ${typeConfig.bgColor}`}>
                {/* Comment Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {comment.developer_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm">{comment.developer_name}</span>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${typeConfig.bgColor}`}>
                          <Icon size={12} className={typeConfig.color} />
                          <span className="text-white">{typeConfig.label}</span>
                        </div>
                        {comment.version && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-600/50 rounded text-xs">
                            <IconTag size={10} className="text-gray-400" />
                            <span className="text-gray-300">v{comment.version}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <IconCalendar size={12} />
                        <span>{formatDate(comment.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  {currentUser?.id === comment.developer_id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete comment"
                    >
                      <IconTrash size={14} />
                    </button>
                  )}
                </div>

                {/* Comment Content */}
                <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {comment.comment}
                </div>

                {/* Context Info */}
                {(comment.usage_purpose || comment.project_context) && (
                  <div className="mt-3 pt-3 border-t border-gray-600/50">
                    <div className="text-xs text-gray-400">
                      {comment.usage_purpose && (
                        <div><strong>Used for:</strong> {comment.usage_purpose}</div>
                      )}
                      {comment.project_context && (
                        <div><strong>Project:</strong> {comment.project_context}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 