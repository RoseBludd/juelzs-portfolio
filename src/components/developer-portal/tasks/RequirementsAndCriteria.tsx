import { IconCheckbox, IconSquare, IconCircleCheck, IconCircle } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface RequirementsAndCriteriaProps {
  requirements?: string[];
  acceptanceCriteria?: string[];
  completedRequirements?: boolean[];
  completedAcceptanceCriteria?: boolean[];
  taskStatus: string;
  taskId: string;
  onProgressUpdate?: () => void;
}

export const RequirementsAndCriteria = ({ 
  requirements, 
  acceptanceCriteria, 
  completedRequirements: initialCompletedRequirements,
  completedAcceptanceCriteria: initialCompletedAcceptanceCriteria,
  taskStatus,
  taskId,
  onProgressUpdate
}: RequirementsAndCriteriaProps) => {
  const [completedRequirements, setCompletedRequirements] = useState<boolean[]>([]);
  const [completedCriteria, setCompletedCriteria] = useState<boolean[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (requirements) {
      // Use existing completion data or initialize with false
      const initialState = initialCompletedRequirements && initialCompletedRequirements.length === requirements.length
        ? initialCompletedRequirements
        : requirements.map(() => false);
      setCompletedRequirements(initialState);
    }

    if (acceptanceCriteria) {
      // Use existing completion data or initialize with false
      const initialState = initialCompletedAcceptanceCriteria && initialCompletedAcceptanceCriteria.length === acceptanceCriteria.length
        ? initialCompletedAcceptanceCriteria
        : acceptanceCriteria.map(() => false);
      setCompletedCriteria(initialState);
    }
  }, [requirements, acceptanceCriteria, initialCompletedRequirements, initialCompletedAcceptanceCriteria, taskStatus]);

  const updateCompletionStatus = async (updatedRequirements?: boolean[], updatedCriteria?: boolean[]) => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/developer/tasks/${taskId}/requirements-completion`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completedRequirements: updatedRequirements,
          completedCriteria: updatedCriteria,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update completion status');
      }

      const data = await response.json();
      console.log('Completion status updated:', data);
      
      // Call the progress update callback to refresh task data
      if (onProgressUpdate) {
        onProgressUpdate();
      }

      toast.success('Progress updated successfully');
    } catch (error) {
      console.error('Error updating completion status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update progress');
      
      // Revert the change on error
      if (updatedRequirements) {
        setCompletedRequirements(initialCompletedRequirements || requirements?.map(() => false) || []);
      }
      if (updatedCriteria) {
        setCompletedCriteria(initialCompletedAcceptanceCriteria || acceptanceCriteria?.map(() => false) || []);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRequirementToggle = async (index: number) => {
    const newCompletedRequirements = [...completedRequirements];
    newCompletedRequirements[index] = !newCompletedRequirements[index];
    setCompletedRequirements(newCompletedRequirements);
    
    await updateCompletionStatus(newCompletedRequirements, undefined);
  };

  const handleCriteriaToggle = async (index: number) => {
    const newCompletedCriteria = [...completedCriteria];
    newCompletedCriteria[index] = !newCompletedCriteria[index];
    setCompletedCriteria(newCompletedCriteria);
    
    await updateCompletionStatus(undefined, newCompletedCriteria);
  };

  if (!requirements?.length && !acceptanceCriteria?.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
      {/* Requirements */}
      {requirements && requirements.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Requirements</h2>
            <div className="text-sm text-gray-400">
              {completedRequirements.filter(Boolean).length} of {requirements.length} completed
            </div>
          </div>
          <ul className="space-y-3">
            {requirements.map((requirement, index) => (
              <li key={index} className="flex items-start gap-3">
                <button
                  onClick={() => handleRequirementToggle(index)}
                  disabled={isUpdating}
                  className="mt-0.5 flex-shrink-0 transition-colors disabled:opacity-50"
                >
                  {completedRequirements[index] ? (
                    <IconCheckbox className="text-blue-500 hover:text-blue-400" size={20} />
                  ) : (
                    <IconSquare className="text-gray-500 hover:text-gray-400" size={20} />
                  )}
                </button>
                <span className={`text-gray-300 leading-relaxed transition-all ${
                  completedRequirements[index] ? 'line-through text-gray-500' : ''
                }`}>
                  {requirement}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Acceptance Criteria */}
      {acceptanceCriteria && acceptanceCriteria.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Acceptance Criteria</h2>
            <div className="text-sm text-gray-400">
              {completedCriteria.filter(Boolean).length} of {acceptanceCriteria.length} completed
            </div>
          </div>
          <ul className="space-y-3">
            {acceptanceCriteria.map((criteria, index) => (
              <li key={index} className="flex items-start gap-3">
                <button
                  onClick={() => handleCriteriaToggle(index)}
                  disabled={isUpdating}
                  className="mt-0.5 flex-shrink-0 transition-colors disabled:opacity-50"
                >
                  {completedCriteria[index] ? (
                    <IconCircleCheck className="text-green-500 hover:text-green-400" size={20} />
                  ) : (
                    <IconCircle className="text-gray-500 hover:text-gray-400" size={20} />
                  )}
                </button>
                <span className={`text-gray-300 leading-relaxed transition-all ${
                  completedCriteria[index] ? 'line-through text-gray-500' : ''
                }`}>
                  {criteria}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fallback when no requirements or criteria */}
      {(!requirements || requirements.length === 0) && (!acceptanceCriteria || acceptanceCriteria.length === 0) && (
        <div className="col-span-full bg-gray-800 rounded-lg p-4 sm:p-6 shadow-lg">
          <p className="text-gray-400 italic">No specific requirements or acceptance criteria provided.</p>
        </div>
      )}
    </div>
  );
}; 