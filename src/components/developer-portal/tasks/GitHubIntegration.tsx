import { IconBrandGithub, IconCode, IconExternalLink, IconEdit, IconCheck, IconX } from "@tabler/icons-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { TaskDetails } from "@/hooks/useTaskDetails";

interface GitHubIntegrationProps {
  metadata?: TaskDetails['metadata'];
  taskId?: string;
  onMetadataUpdate?: (updatedMetadata: any) => void;
}

export const GitHubIntegration = ({ metadata, taskId, onMetadataUpdate }: GitHubIntegrationProps) => {
  const [isEditingRepo, setIsEditingRepo] = useState(false);
  const [repoUrl, setRepoUrl] = useState((metadata as any)?.repository_url || '');
  const [tempRepoUrl, setTempRepoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleEditRepo = () => {
    setTempRepoUrl(repoUrl);
    setIsEditingRepo(true);
  };

  const handleSaveRepo = async () => {
    if (!taskId) {
      toast.error('Task ID is required');
      return;
    }

    if (!tempRepoUrl.trim()) {
      toast.error('Repository URL is required');
      return;
    }

    // Validate URL format
    try {
      new URL(tempRepoUrl);
    } catch (error) {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/developer/tasks/${taskId}/metadata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repository_url: tempRepoUrl
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to update repository URL');
      }

      const result = await response.json();
      
      // Update local state
      setRepoUrl(tempRepoUrl);
      setIsEditingRepo(false);
      
      // Notify parent component of metadata update
      if (onMetadataUpdate && result.metadata) {
        onMetadataUpdate(result.metadata);
      }
      
      toast.success('Repository URL updated successfully');
    } catch (error) {
      console.error('Error updating repository URL:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update repository URL');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelRepo = () => {
    setTempRepoUrl('');
    setIsEditingRepo(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4">GitHub Repository</h2>

      <div className="space-y-4">
        {/* Repository URL Section */}
        <div className="bg-gray-900/50 rounded-lg p-4">
          <h3 className="text-md font-medium text-white mb-2 flex items-center">
            <IconBrandGithub size={20} className="mr-2 text-gray-400" />
            Project Repository
          </h3>
          
          {isEditingRepo ? (
            <div className="space-y-3">
              <input
                type="url"
                value={tempRepoUrl}
                onChange={(e) => setTempRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repository"
                className="w-full bg-gray-800 text-white rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveRepo}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm flex items-center gap-1 transition-colors"
                >
                  <IconCheck size={16} />
                  Save
                </button>
                <button
                  onClick={handleCancelRepo}
                  className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm flex items-center gap-1 transition-colors"
                >
                  <IconX size={16} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              {repoUrl ? (
                <>
                  <code className="bg-gray-800 px-3 py-1 rounded text-blue-400 font-mono text-sm break-all flex-1">
                    {repoUrl}
                  </code>
                  <div className="flex gap-2">
                    <a
                      href={repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 inline-flex items-center whitespace-nowrap"
                    >
                      <span>View Repository</span>
                      <IconExternalLink size={16} className="ml-1" />
                    </a>
                    <button
                      onClick={handleEditRepo}
                      className="text-gray-400 hover:text-gray-300 inline-flex items-center"
                    >
                      <IconEdit size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">No repository URL set</span>
                  <button
                    onClick={handleEditRepo}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center gap-1 transition-colors"
                  >
                    <IconEdit size={16} />
                    Add Repository
                  </button>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-2 text-gray-400 text-sm">
            <p>Link to the main GitHub repository for this project</p>
          </div>
        </div>

        {/* GitHub Integration Section (only if metadata exists) */}
        {metadata?.github && (
          <>
            {/* Branch info */}
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-md font-medium text-white mb-2 flex items-center">
                <IconBrandGithub size={20} className="mr-2 text-gray-400" />
                Branch
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <code className="bg-gray-800 px-3 py-1 rounded text-blue-400 font-mono text-sm break-all">
                  {metadata.github.branch}
                </code>
                <a
                  href={`https://github.com/RoseBudd/rm-development-portal/tree/${metadata.github.branch}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 inline-flex items-center whitespace-nowrap"
                >
                  <span>View on GitHub</span>
                  <IconExternalLink size={16} className="ml-1" />
                </a>
              </div>
              <div className="mt-2 text-gray-400 text-sm">
                <p>Clone the repository and checkout this branch to start working:</p>
                <div className="mt-1 bg-gray-800 p-3 rounded overflow-x-auto">
                  <code className="font-mono text-green-400 text-sm whitespace-pre">
                    git clone https://github.com/RoseBudd/rm-development-portal.git{'\n'}
                    cd rm-development-portal{'\n'}
                    git checkout {metadata.github.branch}
                  </code>
                </div>
              </div>
            </div>

            {/* Pull Request info */}
            {metadata.github.pr_number && (
              <div className="bg-gray-900/50 rounded-lg p-4">
                <h3 className="text-md font-medium text-white mb-2 flex items-center">
                  <IconCode size={20} className="mr-2 text-gray-400" />
                  Pull Request
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-gray-300">PR #{metadata.github.pr_number}</span>
                  <a
                    href={metadata.github.pr_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 inline-flex items-center whitespace-nowrap"
                  >
                    <span>View Pull Request</span>
                    <IconExternalLink size={16} className="ml-1" />
                  </a>
                </div>
                <div className="mt-2 text-gray-400 text-sm">
                  <p>
                    Push your changes to this branch and they will automatically appear in the pull request.
                    The admin team will review your changes there.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}; 