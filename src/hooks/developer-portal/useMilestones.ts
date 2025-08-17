import { useState } from 'react';
import { toast } from 'react-hot-toast';

export const useMilestones = (taskId: string, onRefetch: () => void) => {
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingUpdateId, setDeletingUpdateId] = useState<string | null>(null);

  const updateMilestoneStatus = async (milestoneId: string, newStatus: string) => {
    setStatusUpdateLoading(prev => ({ ...prev, [milestoneId]: true }));

    try {
      const response = await fetch(`/api/tasks/milestone-status?taskId=${taskId}&milestoneId=${milestoneId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          message: `Status updated to ${newStatus}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update milestone status');
      }

      // Refresh task details to show updated milestone status
      onRefetch();
      toast.success(`Milestone status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating milestone status:', error);
      toast.error(error.message || 'Failed to update milestone status');
    } finally {
      setStatusUpdateLoading(prev => ({ ...prev, [milestoneId]: false }));
    }
  };

  const addComment = async (milestoneId: string, content: string) => {
    if (!content.trim()) {
      toast.error('Please enter a comment');
      return false;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/tasks/milestone-comments?taskId=${taskId}&milestoneId=${milestoneId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add comment');
      }

      // Refresh task details to show the new comment
      onRefetch();
      toast.success('Comment added successfully');
      return true;
    } catch (err: any) {
      console.error('Error adding comment:', err);
      toast.error(`Error adding comment: ${err.message}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteUpdate = async (milestoneId: string, updateId: string) => {
    setDeletingUpdateId(updateId);

    try {
      const response = await fetch(
        `/api/tasks/milestone-update?taskId=${taskId}&milestoneId=${milestoneId}&updateId=${updateId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete update');
      }

      // Refresh task details to reflect the deletion
      onRefetch();
      toast.success('Update deleted successfully');
    } catch (err: any) {
      console.error('Error deleting update:', err);
      toast.error(err.message || 'Failed to delete update');
    } finally {
      setDeletingUpdateId(null);
    }
  };

  const handleMediaUploadSuccess = () => {
    onRefetch();
    toast.success("Media uploaded successfully!");
  };

  return {
    statusUpdateLoading,
    isSubmitting,
    deletingUpdateId,
    updateMilestoneStatus,
    addComment,
    deleteUpdate,
    handleMediaUploadSuccess
  };
}; 