import { Milestone } from '@/hooks/useTaskDetails';

// Get status color for badges
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-purple-900/70 text-purple-200 border border-purple-500/30';
    case 'in_progress': return 'bg-yellow-900/70 text-yellow-200 border border-yellow-500/30';
    case 'assigned': return 'bg-blue-900/70 text-blue-200 border border-blue-500/30';
    case 'available': return 'bg-green-900/70 text-green-200 border border-green-500/30';
    default: return 'bg-gray-900/70 text-gray-200 border border-gray-500/30';
  }
};

// Get priority color
export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-900/70 text-red-200 border border-red-500/30';
    case 'high': return 'bg-orange-900/70 text-orange-200 border border-orange-500/30';
    case 'medium': return 'bg-yellow-900/70 text-yellow-200 border border-yellow-500/30';
    case 'low': return 'bg-green-900/70 text-green-200 border border-green-500/30';
    default: return 'bg-gray-900/70 text-gray-200 border border-gray-500/30';
  }
};

// Calculate overall progress based on milestones, requirements, and acceptance criteria
export const calculateOverallProgress = (
  milestones: Milestone[] | undefined,
  requirements?: string[],
  acceptanceCriteria?: string[],
  completedRequirements?: boolean[],
  completedAcceptanceCriteria?: boolean[]
) => {
  // Calculate milestone progress
  let milestoneProgress = 0;
  if (milestones && milestones.length > 0) {
    const totalPercentage = milestones.reduce(
      (sum, milestone) => sum + (milestone.completion_percentage || 0),
      0
    );
    milestoneProgress = totalPercentage / milestones.length;
  }

  // Calculate requirements progress
  let requirementsProgress = 0;
  if (requirements && requirements.length > 0 && completedRequirements) {
    const completedCount = completedRequirements.filter(Boolean).length;
    requirementsProgress = (completedCount / requirements.length) * 100;
  }

  // Calculate acceptance criteria progress
  let criteriaProgress = 0;
  if (acceptanceCriteria && acceptanceCriteria.length > 0 && completedAcceptanceCriteria) {
    const completedCount = completedAcceptanceCriteria.filter(Boolean).length;
    criteriaProgress = (completedCount / acceptanceCriteria.length) * 100;
  }

  // Calculate weighted overall progress
  // Weight: 60% milestones, 20% requirements, 20% acceptance criteria
  let overallProgress = milestoneProgress * 0.6;
  
  if (requirements && requirements.length > 0) {
    overallProgress += requirementsProgress * 0.2;
  } else {
    overallProgress += milestoneProgress * 0.2; // Give milestone weight if no requirements
  }
  
  if (acceptanceCriteria && acceptanceCriteria.length > 0) {
    overallProgress += criteriaProgress * 0.2;
  } else {
    overallProgress += milestoneProgress * 0.2; // Give milestone weight if no criteria
  }

  return Math.round(overallProgress);
};

// Get milestone status background color for header
export const getMilestoneHeaderBgColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-purple-900/30 border-b border-purple-700/30';
    case 'in_progress': return 'bg-yellow-900/30 border-b border-yellow-700/30';
    default: return 'bg-gray-700/30 border-b border-gray-600/30';
  }
};

// Get milestone progress bar color
export const getMilestoneProgressColor = (status: string) => {
  return status === 'completed' ? 'bg-purple-500' : 'bg-blue-500';
};

// Format date for display
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

// Format date with time
export const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

// Format date in CST timezone (Central Standard Time)
export const formatDateCST = (dateString: string | Date) => {
  if (!dateString) return 'Unknown';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago', // Handles CST/CDT automatically
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    return formatter.format(date);
  } catch (error) {
    console.error('Error formatting date to CST:', error);
    return 'Unknown';
  }
};

// Format date and time in CST timezone with full timestamp
export const formatDateTimeCST = (dateString: string | Date) => {
  if (!dateString) return 'Unknown';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago', // Handles CST/CDT automatically
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true // Use 12-hour format with AM/PM
    });
    
    return formatter.format(date);
  } catch (error) {
    console.error('Error formatting datetime to CST:', error);
    return 'Unknown';
  }
};

// Format time only in CST timezone
export const formatTimeCST = (dateString: string | Date) => {
  if (!dateString) return 'Unknown';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true // Use 12-hour format with AM/PM
    });
    
    return formatter.format(date);
  } catch (error) {
    console.error('Error formatting time to CST:', error);
    return 'Unknown';
  }
};

// Format relative time with CST timestamp for comprehensive display
export const formatRelativeWithCST = (timestamp: string | Date) => {
  if (!timestamp) return { relative: 'Unknown', cst: 'Unknown' };
  
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    
    // Calculate relative time in milliseconds first
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(Math.abs(diffInMs) / 1000); // Use absolute value to avoid timezone issues
    
    let relative: string;
    
    // Always calculate relative time based on absolute difference
    if (diffInSeconds < 60) relative = 'Just now'; // Less than 1 minute
    else if (diffInSeconds < 3600) relative = `${Math.floor(diffInSeconds / 60)}m ago`; // Less than 1 hour
    else if (diffInSeconds < 86400) relative = `${Math.floor(diffInSeconds / 3600)}h ago`; // Less than 1 day
    else if (diffInSeconds < 604800) relative = `${Math.floor(diffInSeconds / 86400)}d ago`; // Less than 1 week
    else if (diffInSeconds < 2592000) relative = `${Math.floor(diffInSeconds / 604800)}w ago`; // Less than 1 month
    else relative = `${Math.floor(diffInSeconds / 2592000)}mo ago`; // Months
    
    // If the difference is actually in the future (very small threshold for clock skew)
    if (diffInMs < -300000) { // Only if more than 5 minutes in the future
      relative = 'Recently'; // Treat minor future times as recent
    }
    
    // Get CST timestamp
    const cst = formatDateTimeCST(date);
    
    return { relative, cst };
  } catch (error) {
    console.error('Error formatting relative time with CST:', error);
    return { relative: 'Unknown', cst: 'Unknown' };
  }
}; 