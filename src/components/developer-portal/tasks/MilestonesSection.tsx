import { useState } from "react";

import { AddMilestoneMedia } from '@/components/milestones/add-milestone-media';
import { MilestoneCard } from "@/components/milestones/MilestoneCard";
import { useMilestones } from "@/hooks/useMilestones";
import { Milestone } from "@/hooks/useTaskDetails";

interface MilestonesSectionProps {
  milestones: Milestone[];
  taskId: string;
  onRefetch: () => void;
  onMediaPreview: (mediaFiles: any[], index?: number) => void;
}

export const MilestonesSection = ({ 
  milestones, 
  taskId, 
  onRefetch,
  onMediaPreview 
}: MilestonesSectionProps) => {
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [selectedMilestoneForMedia, setSelectedMilestoneForMedia] = useState<string | null>(null);

  const {
    statusUpdateLoading,
    isSubmitting,
    deletingUpdateId,
    updateMilestoneStatus,
    addComment,
    deleteUpdate,
    handleMediaUploadSuccess
  } = useMilestones(taskId, onRefetch);

  // Toggle milestone expansion
  const toggleMilestone = (id: string) => {
    setExpandedMilestone(expandedMilestone === id ? null : id);
  };

  // Open media upload modal
  const openMediaUpload = (milestoneId: string) => {
    setSelectedMilestoneForMedia(milestoneId);
    setIsMediaModalOpen(true);
  };

  // Handle media upload success
  const onMediaUploadSuccess = () => {
    setIsMediaModalOpen(false);
    setSelectedMilestoneForMedia(null);
    handleMediaUploadSuccess();
  };

  if (!milestones || milestones.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Milestones</h2>
        <div className="bg-gray-700/30 p-4 rounded-lg">
          <p className="text-gray-400">No milestones found for this task</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4">Milestones</h2>

      <div className="space-y-4">
        {milestones.map((milestone) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            taskId={taskId}
            isExpanded={expandedMilestone === milestone.id}
            onToggle={() => toggleMilestone(milestone.id)}
            onStatusUpdate={updateMilestoneStatus}
            onAddComment={addComment}
            onDeleteUpdate={deleteUpdate}
            onOpenMediaUpload={openMediaUpload}
            onMediaPreview={onMediaPreview}
            statusUpdateLoading={statusUpdateLoading}
            isSubmitting={isSubmitting}
            deletingUpdateId={deletingUpdateId}
          />
        ))}
      </div>

      {/* Media upload modal */}
      {selectedMilestoneForMedia && (
        <AddMilestoneMedia
          isOpen={isMediaModalOpen}
          onClose={() => setIsMediaModalOpen(false)}
          milestoneId={selectedMilestoneForMedia}
          taskId={taskId}
          onSuccess={onMediaUploadSuccess}
        />
      )}
    </div>
  );
}; 